# src/main.py (modified)
from src.ai.models.isolation_forest import NetworkIsolationForest
from src.detection.anomaly_detector import AnomalyDetector
from src.detection.watcher import FileWatcher
from src.utils.config import load_config
import logging
import json
import flask
from flask import Flask, jsonify, request
from flask_cors import CORS

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load configuration
config = load_config()

# Create Flask app instead of using the Flask dashboard module
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize anomaly detector
detector = AnomalyDetector(
    model_path=config['model_path'],
    feature_columns_path=config['feature_columns_path'],
    output_path=config['anomalies_path']
)

# API endpoint to get anomalies
@app.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    # Optional filtering parameters
    limit = int(request.args.get('limit', 50))
    
    # Return anomalies (which the detector already stores)
    return jsonify({
        'anomalies': detector.anomalies[-limit:],
        'total': len(detector.anomalies)
    })

# Start file watcher
def process_line(line):
    try:
        event = json.loads(line)
        detector.process_event(event)
    except json.JSONDecodeError:
        pass

if __name__ == "__main__":
    # Start the file watcher in a background thread
    eve_json_path = config['suricata']['eve_json_path']
    watcher = FileWatcher(eve_json_path, process_line)
    watcher.start()
    
    # Run Flask app
    app.run(host='0.0.0.0', port=3001)