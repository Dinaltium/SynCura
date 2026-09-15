"""
Real-time inference module: loads trained AttentionLSTM and generates risk scores.
"""
import os
import glob
import torch
import numpy as np
from collections import deque
import threading


# Determine model path: allow override via MODEL_PATH env var, check common paths,
# or pick the latest saved model from ml/training_runs/*/model.pt
DEFAULT_MODEL_PATH = os.getenv('MODEL_PATH', 'ml/models/lstm_baseline.pt')
if not os.path.exists(DEFAULT_MODEL_PATH):
    alt = 'ml/lstm_baseline.pt'
    if os.path.exists(alt):
        DEFAULT_MODEL_PATH = alt
    else:
        runs = sorted(glob.glob('ml/training_runs/*/model.pt'), key=os.path.getmtime, reverse=True)
        if runs:
            DEFAULT_MODEL_PATH = runs[0]

# Feature names used by the model (must match training)
FEATURES = ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2',
            'GCS', 'BUN', 'Creatinine', 'WBC', 'Platelets', 'Glucose']


class RiskScoreEngine:
    def __init__(self, model_path=DEFAULT_MODEL_PATH, window_size=90):
        """Load model and initialize risk score buffer."""
        self.model_path = model_path
        self.window_size = window_size
        self.model = None
        self.vital_buffer = {}  # per patient: deque of recent vitals
        self.risk_scores = {}   # per patient: latest risk score
        self.lock = threading.Lock()

        # Training-set statistics for normalization (set after training or loaded)
        self._train_mean = None
        self._train_std = None

        self._load_model()
        self._load_scaler()

    def _load_scaler(self, scaler_path='ml/scaler.json'):
        """Load population normalization stats saved during training."""
        import json
        if os.path.exists(scaler_path):
            try:
                with open(scaler_path) as f:
                    scaler = json.load(f)
                self.set_normalization_stats(scaler['mean'], scaler['std'])
                print(f'[Inference] Loaded scaler stats from {scaler_path}')
            except Exception as e:
                print(f'[Inference] Warning: failed to load scaler: {e}')

    def _load_model(self):
        """Load the trained AttentionLSTM model."""
        if os.path.exists(self.model_path):
            try:
                from ml.train_lstm import AttentionLSTMModel
                self.model = AttentionLSTMModel(input_size=len(FEATURES), hidden_size=96)
                try:
                    state = torch.load(self.model_path, map_location='cpu', weights_only=True)
                except TypeError:
                    state = torch.load(self.model_path, map_location='cpu')

                self.model.load_state_dict(state)
                self.model.eval()
                print(f'[Inference] Loaded AttentionLSTM from {self.model_path} ({len(FEATURES)} features)')
            except Exception as e:
                print(f'[Inference] Warning: failed to load model: {e}')
                self.model = None
        else:
            print(f'[Inference] Model not found at {self.model_path}; using mock scores')
            self.model = None

    def set_normalization_stats(self, mean, std):
        """Set training-set normalization statistics."""
        self._train_mean = np.array(mean, dtype=np.float32)
        self._train_std = np.array(std, dtype=np.float32) + 1e-6

    def add_vital(self, patient_id, vital_dict):
        """Add a vital measurement and compute risk score."""
        with self.lock:
            if patient_id not in self.vital_buffer:
                self.vital_buffer[patient_id] = deque(maxlen=self.window_size)

            # Extract relevant vitals
            vital_vec = []
            for f in FEATURES:
                if f in vital_dict and vital_dict[f] is not None:
                    vital_vec.append(float(vital_dict[f]))
                else:
                    vital_vec.append(np.nan)

            if any(not np.isnan(v) for v in vital_vec):
                self.vital_buffer[patient_id].append(vital_vec)

            # Compute risk score if we have enough data
            risk_score = self._compute_risk_score(patient_id)
            self.risk_scores[patient_id] = risk_score

            return risk_score

    def _compute_risk_score(self, patient_id):
        """Generate a risk score (0-100) for a patient based on recent vitals."""
        if patient_id not in self.vital_buffer or len(self.vital_buffer[patient_id]) == 0:
            return 0

        buffer = self.vital_buffer[patient_id]

        if self.model is None:
            # Mock scoring: based on vital abnormalities
            recent_vitals = list(buffer)[-1]
            score = 30  # baseline
            if not np.isnan(recent_vitals[0]) and (recent_vitals[0] > 110 or recent_vitals[0] < 50):
                score += 15
            if not np.isnan(recent_vitals[1]) and (recent_vitals[1] > 30 or recent_vitals[1] < 12):
                score += 15
            if not np.isnan(recent_vitals[2]) and (recent_vitals[2] > 39 or recent_vitals[2] < 35):
                score += 10
            return min(100, score)

        # Use model for inference
        try:
            X = np.array(list(buffer), dtype=np.float32)
            # Interpolate NaNs per column
            for i in range(X.shape[1]):
                mask = ~np.isnan(X[:, i])
                if mask.sum() > 0:
                    col_mean = X[mask, i].mean()
                    X[~mask, i] = col_mean
                else:
                    X[:, i] = 0.0

            # Normalize using training-set stats if available, else fall back to window stats
            if self._train_mean is not None and self._train_std is not None:
                X = (X - self._train_mean) / self._train_std
            else:
                std = X.std(axis=0) + 1e-6
                X = (X - X.mean(axis=0)) / std

            # Pad to window size
            if len(X) < self.window_size:
                pad = np.zeros((self.window_size - len(X), X.shape[1]), dtype=np.float32)
                X = np.vstack([pad, X])

            with torch.no_grad():
                x_tensor = torch.from_numpy(X.reshape(1, -1, X.shape[1]))
                prob = torch.sigmoid(self.model(x_tensor)).item()

            return max(0, min(100, round(prob * 100)))
        except Exception as e:
            print(f'[Inference] Error computing score for {patient_id}: {e}')
            return 30

    def get_attention_weights(self, patient_id):
        """Get attention weights for a patient's current vital buffer (for explainability)."""
        with self.lock:
            if patient_id not in self.vital_buffer or self.model is None:
                return None
            buffer = self.vital_buffer[patient_id]
            try:
                X = np.array(list(buffer), dtype=np.float32)
                for i in range(X.shape[1]):
                    mask = ~np.isnan(X[:, i])
                    if mask.sum() > 0:
                        X[~mask, i] = X[mask, i].mean()
                    else:
                        X[:, i] = 0.0
                if self._train_mean is not None and self._train_std is not None:
                    X = (X - self._train_mean) / self._train_std
                else:
                    std = X.std(axis=0) + 1e-6
                    X = (X - X.mean(axis=0)) / std
                if len(X) < self.window_size:
                    pad = np.zeros((self.window_size - len(X), X.shape[1]), dtype=np.float32)
                    X = np.vstack([pad, X])
                x_tensor = torch.from_numpy(X.reshape(1, -1, X.shape[1]))
                with torch.no_grad():
                    weights = self.model.get_attention_weights(x_tensor)
                return weights.squeeze(0).numpy().tolist()
            except Exception as e:
                print(f'[Inference] Error getting attention weights for {patient_id}: {e}')
                return None

    def get_risk_score(self, patient_id):
        """Retrieve latest risk score for a patient."""
        with self.lock:
            return self.risk_scores.get(patient_id, 0)

    def get_all_scores(self):
        """Get all patient risk scores sorted by risk (descending)."""
        with self.lock:
            sorted_scores = sorted(
                self.risk_scores.items(),
                key=lambda x: x[1],
                reverse=True
            )
            return sorted_scores[:6]  # top 6 patients


# Global engine instance (thread-safe lazy init)
_engine = None
_engine_lock = threading.Lock()


def get_engine():
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                _engine = RiskScoreEngine()
    return _engine
