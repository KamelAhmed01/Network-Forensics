# Network Traffic Forensics

AI-assisted network traffic analysis system for real-time anomaly detection using Suricata and Isolation Forest.

## Features

- Real-time processing of Suricata's Eve JSON output
- Unsupervised anomaly detection using Isolation Forest
- Interactive web dashboard for monitoring anomalies
- Detection of various cyber threats including DDoS attacks, malware communications, and unauthorized access

## Quick Start

### Prerequisites

- Suricata installed and configured
- Python 3.8+ with pip

### Installation

1. Clone the repository:
   ```bash
   git clone "Project Repo"
   cd network-forensics
   
2. Install dependencies:
    
    ```bash
    pip install -r requirements.txt
    
    ```
    
3. Install and configure Suricata:
    
    ```bash
    sudo ./scripts/install_suricata.sh
    
    ```
    

### Configuration

1. Configure Suricata to write to eve.json:
    
    ```bash
    sudo nano /etc/suricata/suricata.yaml
    
    ```
    
    Make sure the following is set:
    
    ```yaml
    outputs:
      - eve-log:
          enabled: yes
          filetype: regular
          filename: /var/log/suricata/eve.json
          types:
            - alert
            - flow
    
    ```
    
2. Create model directory:
    
    ```bash
    mkdir -p ~/network_data
    
    ```
    

### Training the Model

1. Collect normal traffic data:
    
    ```bash
    sudo ./scripts/collect_training_data.sh eth0
    
    ```
    
2. Train the Isolation Forest model:
    
    ```bash
    python -m src.ai.training
    
    ```
    

### Running the System

Start all components:

```bash
python src/main.py

```

Or run components separately:

```bash
# Run only the detector
python src/main.py --detector-only

# Run only the dashboard
python src/main.py --dashboard-only

```

Access the dashboard at [http://localhost:5000]