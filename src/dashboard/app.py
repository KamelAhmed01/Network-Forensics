from flask import Flask, render_template, jsonify, request
import os
import json
import logging
from datetime import datetime
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)

# Configuration
ANOMALY_FILE = os.environ.get('ANOMALY_FILE', os.path.expanduser('~/network_data/anomalies.json'))
UPDATE_INTERVAL = int(os.environ.get('UPDATE_INTERVAL', 5000))  # milliseconds

@app.route('/')
def index():
    """Render main dashboard page"""
    return render_template('index.html', update_interval=UPDATE_INTERVAL)

@app.route('/api/anomalies')
def get_anomalies():
    """API endpoint to retrieve anomalies"""
    try:
        # Check if file exists
        if not os.path.exists(ANOMALY_FILE):
            return jsonify({"anomalies": [], "error": "No anomalies file found"})

        # Get last modified time
        last_modified = datetime.fromtimestamp(os.path.getmtime(ANOMALY_FILE))

        # Load anomalies from JSON file
        with open(ANOMALY_FILE, 'r') as f:
            anomalies = json.load(f)

        # Sort by score (most anomalous first)
        anomalies.sort(key=lambda x: x.get('score', 0))

        return jsonify({
            "anomalies": anomalies,
            "count": len(anomalies),
            "last_updated": last_modified.isoformat()
        })
    except Exception as e:
        logger.error(f"Error loading anomalies: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stats')
def get_stats():
    """API endpoint to retrieve summary statistics"""
    try:
        if not os.path.exists(ANOMALY_FILE):
            return jsonify({"error": "No anomalies file found"})

        with open(ANOMALY_FILE, 'r') as f:
            anomalies = json.load(f)

        if not anomalies:
            return jsonify({"stats": {}})

        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(anomalies)

        # Calculate statistics
        top_source_ips = df['src_ip'].value_counts().head(5).to_dict()
        top_dest_ips = df['dst_ip'].value_counts().head(5).to_dict()
        proto_counts = df['proto'].value_counts().to_dict()

        # Calculate average score
        avg_score = df['score'].mean() if 'score' in df.columns else 0

        return jsonify({
            "stats": {
                "total_anomalies": len(anomalies),
                "top_source_ips": top_source_ips,
                "top_dest_ips": top_dest_ips,
                "protocol_distribution": proto_counts,
                "average_anomaly_score": avg_score
            }
        })
    except Exception as e:
        logger.error(f"Error calculating stats: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/timeseries')
def get_timeseries():
    """API endpoint to retrieve time series data for charts"""
    try:
        if not os.path.exists(ANOMALY_FILE):
            return jsonify({"error": "No anomalies file found"})

        with open(ANOMALY_FILE, 'r') as f:
            anomalies = json.load(f)

        if not anomalies:
            return jsonify({"timeseries": []})

        # Convert to DataFrame
        df = pd.DataFrame(anomalies)

        # Ensure timestamp column exists and is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)

            # Resample to minute intervals and count
            timeseries = df.resample('1T').size().reset_index()
            timeseries.columns = ['timestamp', 'count']

            # Convert back to list for JSON
            result = timeseries.to_dict(orient='records')
            return jsonify({"timeseries": result})
        else:
            return jsonify({"timeseries": []})
    except Exception as e:
        logger.error(f"Error generating timeseries: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs(os.path.dirname(ANOMALY_FILE), exist_ok=True)

    # Start Flask server
    app.run(host='0.0.0.0', port=5000, debug=True)
