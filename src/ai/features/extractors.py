import json
import numpy as np
import pandas as pd
from collections import defaultdict

# Protocol mapping
PROTO_MAP = {"TCP": 6, "UDP": 17, "ICMP": 1, "HTTP": 80, "HTTPS": 443}

def extract_flow_features(flow_event):
    """Extract relevant features from a Suricata flow event

    Args:
        flow_event (dict): Suricata flow event from Eve JSON

    Returns:
        dict: Dictionary of extracted features
    """
    flow = flow_event.get("flow", {})

    # Calculate packets and bytes totals
    total_packets = flow.get("pkts_toserver", 0) + flow.get("pkts_toclient", 0)
    total_bytes = flow.get("bytes_toserver", 0) + flow.get("bytes_toclient", 0)

    # Calculate duration in seconds
    start_time = flow.get("start", 0)
    end_time = flow.get("end", 0)
    duration = (end_time - start_time) / 1e6 if end_time and start_time else 0

    # Get protocol as integer (for ML)
    proto_str = flow.get("proto", "")
    proto_int = PROTO_MAP.get(proto_str, 0)

    # Calculate bytes per second (bandwidth usage)
    bytes_per_sec = total_bytes / duration if duration > 0 else 0

    # Calculate packets per second
    pkts_per_sec = total_packets / duration if duration > 0 else 0

    # Calculate bytes per packet
    bytes_per_packet = total_bytes / total_packets if total_packets > 0 else 0

    # Calculate ratio of client to server traffic
    client_server_ratio = (
        flow.get("bytes_toserver", 0) / flow.get("bytes_toclient", 1)
        if flow.get("bytes_toclient", 0) > 0
        else float('inf')
    )

    return {
        "total_packets": total_packets,
        "total_bytes": total_bytes,
        "duration": duration,
        "proto": proto_int,
        "bytes_per_sec": bytes_per_sec,
        "pkts_per_sec": pkts_per_sec,
        "bytes_per_packet": bytes_per_packet,
        "client_server_ratio": client_server_ratio
    }

def batch_extract_features(json_file, max_events=10000):
    """Extract features from multiple events in a JSON file

    Args:
        json_file (str): Path to Eve JSON file
        max_events (int): Maximum number of events to process

    Returns:
        pandas.DataFrame: DataFrame of extracted features
    """
    features_list = []
    count = 0

    with open(json_file, 'r') as f:
        for line in f:
            try:
                event = json.loads(line)
                if event.get("event_type") == "flow":
                    features = extract_flow_features(event)
                    features["timestamp"] = event.get("timestamp")
                    features["src_ip"] = event.get("src_ip", "")
                    features["dst_ip"] = event.get("dst_ip", "")
                    features["flow_id"] = event.get("flow", {}).get("id", "")

                    features_list.append(features)
                    count += 1

                    if count >= max_events:
                        break
            except json.JSONDecodeError:
                continue

    return pd.DataFrame(features_list)
