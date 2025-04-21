import numpy as np
from sklearn.ensemble import IsolationForest
import pickle
import logging

logger = logging.getLogger(__name__)

class NetworkIsolationForest:
    """Isolation Forest model for network anomaly detection"""

    def __init__(self, n_estimators=100, contamination=0.01, random_state=42):
        """Initialize the Isolation Forest model

        Args:
            n_estimators (int): Number of estimators
            contamination (float): Expected proportion of anomalies
            random_state (int): Random seed for reproducibility
        """
        self.model = IsolationForest(
            n_estimators=n_estimators,
            max_samples='auto',
            contamination=contamination,
            random_state=random_state,
            n_jobs=-1  # Use all available cores
        )
        self.feature_columns = None

    def fit(self, features, feature_columns=None):
        """Train the Isolation Forest model

        Args:
            features (np.ndarray): Feature matrix
            feature_columns (list): Names of feature columns

        Returns:
            self: Trained model
        """
        logger.info(f"Training Isolation Forest with {features.shape[0]} samples")
        self.model.fit(features)
        self.feature_columns = feature_columns
        return self

    def predict_anomaly_score(self, features):
        """Calculate anomaly scores (-1 to 1, lower is more anomalous)

        Args:
            features (np.ndarray): Features to evaluate

        Returns:
            float: Anomaly score
        """
        return self.model.decision_function(features)

    def save(self, model_path, feature_path=None):
        """Save model and feature columns to disk

        Args:
            model_path (str): Path to save model
            feature_path (str): Path to save feature columns
        """
        with open(model_path, 'wb') as f:
            pickle.dump(self.model, f)

        if feature_path and self.feature_columns:
            with open(feature_path, 'wb') as f:
                pickle.dump(self.feature_columns, f)

        logger.info(f"Model saved to {model_path}")

    @classmethod
    def load(cls, model_path, feature_path=None):
        """Load model from disk

        Args:
            model_path (str): Path to load model
            feature_path (str): Path to load feature columns

        Returns:
            NetworkIsolationForest: Loaded model
        """
        instance = cls()
        with open(model_path, 'rb') as f:
            instance.model = pickle.load(f)

        if feature_path:
            with open(feature_path, 'rb') as f:
                instance.feature_columns = pickle.load(f)

        logger.info(f"Model loaded from {model_path}")
        return instance
