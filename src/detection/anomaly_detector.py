import json
import logging
import os
import time
import numpy as np
import pickle
from datetime import datetime

logger = logging.getLogger(__name__)

# Protocol mapping (for features)
PROTO_MAP = {"TCP": 6, "UDP": 17, "ICMP": 1}

class AnomalyDetector:
    """Real-time anomaly detection using Isolation Forest"""

    def __init__(self, model_path, feature_columns_path=None, output_path=None):
        """Initialize anomaly detector

        Args:
            model_path (str): Path to trained model file
            feature_columns_path (str): Path to feature columns file
            output_path (str): Path to output anomalies file
        """
        self.model_path = model_path
        self.feature_columns_path = feature_columns_path
        self.output_path = output_path or os.path.expanduser('~/network_data/anomalies.json')

        # Load model and feature columns
        self._load_model()

        # Initialize anomalies storage
        self.anomalies = []
        self.last_write_time = 0
        self.write_interval = 5  # seconds

        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

    def _load_model(self):
        """Load Isolation Forest model and feature columns"""
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)

            if self.feature_columns_path and os.path.exists(self.feature_columns_path):
                with open(self.feature_columns_path, 'rb') as f:
                    self.feature_columns = pickle.load(f)
            else:
                # Default feature columns if not provided
                self.feature_columns = [
                    "total_packets", "total_bytes", "duration", "proto"
                ]

            logger.info(f"Model loaded successfully from {self.model_path}")
            logger.info(f"Using features: {self.feature_columns}")

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

    def extract_features(self, flow_event):
        """Extract features from flow event

        Args:
            flow_event (dict): Suricata flow event

        Returns:
            list: Feature values in correct order
        """
        flow = flow_event["flow"]

        # Extract basic flow features
        total_packets = flow.get("pkts_toserver", 0) + flow.get("pkts_toclient", 0)
        total_bytes = flow.get("bytes_toserver", 0) + flow.get("bytes_toclient", 0)

        # Calculate duration in seconds
        start_time = flow.get("start", 0)
        end_time = flow.get("end", 0)
        duration = (end_time - start_time) / 1e6 if end_time and start_time else 0

        # Get protocol as integer
        proto_str = flow.get("proto", "")
        proto_int = PROTO_MAP.get(proto_str, 0)

        # Default feature set
        feature_dict = {
            "total_packets": total_packets,
            "total_bytes": total_bytes,
            "duration": duration,
            "proto": proto_int
        }

        # Return features in the order expected by the model
        return [feature_dict.get(col, 0) for col in self.feature_columns]

    def process_event(self, event):
        """Process a Suricata event

        Args:
            event (dict): Suricata event from Eve JSON

        Returns:
            dict or None: Anomaly dict if detected, None otherwise
        """
        try:
            # Only process flow events
            if event.get("event_type") != "flow":
                return None

            # Extract features
            features = self.extract_features(event)

            # Calculate anomaly score (-1 to 1, lower is more anomalous)
            score = self.model.decision_function([features])[0]

            # If score is negative, it's an anomaly
            if score < 0:
                flow = event["flow"]
                anomaly = {
                    "timestamp": event.get("timestamp", datetime.now().isoformat()),
                    "flow_id": flow.get("id", ""),
                    "src_ip": flow.get("src_ip", ""),
                    "dst_ip": flow.get("dst_ip", ""),
                    "proto": flow.get("proto", ""),
                    "packets": features[0],  # Assuming first feature is packets
                    "bytes": features[1],    # Assuming second feature is bytes
                    "duration": features[2], # Assuming third feature is duration
                    "score": float(score)    # Convert numpy float to Python float
                }

                # Store anomaly
                self.anomalies.append(anomaly)

                # Limit size of anomalies list
                if len(self.anomalies) > 1000:
                    self.anomalies = self.anomalies[-1000:]

                # Write to file if interval has passed
                self._write_anomalies_if_needed()

                return anomaly
        except Exception as e:
            logger.error(f"Error processing event: {e}")

        return None

    def _write_anomalies_if_needed(self):
        """Write anomalies to file if enough time has passed"""
        current_time = time.time()
        if current_time - self.last_write_time > self.write_interval:
            self._write_anomalies_to_file()
            self.last_write_time = current_time

    def _write_anomalies_to_file(self):
        """Write anomalies to JSON file"""
        try:
            with open(self.output_path, 'w') as f:
                json.dump(self.anomalies, f)
            logger.debug(f"Wrote {len(self.anomalies)} anomalies to {self.output_path}")
        except Exception as e:
            logger.error(f"Error writing anomalies to file: {e}")

    def process_file(self, file_path):
        """Process an entire Eve JSON file

        Args:
            file_path (str): Path to Eve JSON file
        """
        try:
            with open(file_path, 'r') as f:
                for line in f:
                    try:
                        event = json.loads(line)
                        self.process_event(event)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
