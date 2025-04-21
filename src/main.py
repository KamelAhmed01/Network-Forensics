#!/usr/bin/env python3
"""
Network Traffic Forensics - Main Application
"""
import os
import sys
import json
import argparse
import logging
import threading
from time import sleep

# Configure paths for imports
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from src.detection.anomaly_detector import AnomalyDetector
from src.detection.watcher import FileWatcher
from src.utils.config import load_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(BASE_DIR, 'data', 'logs', 'app.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def run_dashboard(config):
    """Run the web dashboard in a separate process"""
    from src.dashboard.app import app

    # Set environment variables for dashboard
    os.environ['ANOMALY_FILE'] = config.get('output_path', '~/network_data/anomalies.json')
    os.environ['UPDATE_INTERVAL'] = str(config.get('update_interval', 5000))

    # Start dashboard
    app.run(
        host=config.get('host', '0.0.0.0'),
        port=config.get('port', 5000),
        debug=config.get('debug', False)
    )

def run_detector(config):
    """Run the anomaly detector"""
    # Initialize detector
    detector = AnomalyDetector(
        model_path=os.path.expanduser(config.get('model_path', '~/network_data/iforest_model.pkl')),
        feature_columns_path=os.path.expanduser(config.get('feature_columns_path', '~/network_data/feature_columns.pkl')),
        output_path=os.path.expanduser(config.get('output_path', '~/network_data/anomalies.json'))
    )

    # Initialize file watcher
    eve_path = os.path.expanduser(config.get('eve_json_path', '/var/log/suricata/eve.json'))

    # Line processor function
    def process_line(line):
        try:
            event = json.loads(line)
            detector.process_event(event)
        except json.JSONDecodeError:
            pass

    # Start watcher
    watcher = FileWatcher(
        filepath=eve_path,
        processor=process_line,
        polling_interval=config.get('polling_interval', 1.0)
    )

    watcher.start()
    return watcher

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Network Traffic Forensics')
    parser.add_argument('--config', default='config/config.yml', help='Path to config file')
    parser.add_argument('--dashboard-only', action='store_true', help='Run only the dashboard')
    parser.add_argument('--detector-only', action='store_true', help='Run only the detector')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    args = parser.parse_args()

    # Set debug if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    # Load configuration
    config = load_config(os.path.join(BASE_DIR, args.config))

    try:
        # Run components based on arguments
        if args.dashboard_only:
            logger.info("Running dashboard only")
            run_dashboard(config)
        elif args.detector_only:
            logger.info("Running detector only")
            watcher = run_detector(config)
            try:
                while True:
                    sleep(1)
            except KeyboardInterrupt:
                watcher.stop()
        else:
            # Run both in separate threads
            logger.info("Running both detector and dashboard")
            watcher = run_detector(config)

            # Run dashboard in main thread
            dashboard_thread = threading.Thread(target=run_dashboard, args=(config,))
            dashboard_thread.daemon = True
            dashboard_thread.start()

            try:
                while True:
                    sleep(1)
            except KeyboardInterrupt:
                watcher.stop()

    except Exception as e:
        logger.error(f"Error in main application: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
