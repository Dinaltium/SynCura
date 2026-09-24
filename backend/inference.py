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

MANIFEST_PATH = os.path.join('ml', 'deployed_manifest.json')


def _load_json_scaler(path):
    import json
    with open(path) as f:
        scaler = json.load(f)
    mean = np.array(scaler['mean'], dtype=np.float32)
    std = np.array(scaler['std'], dtype=np.float32) + 1e-6
    return mean, std


class RiskScoreEngine:
    def __init__(self, model_path=DEFAULT_MODEL_PATH, window_size=90):
        """Load model and initialize risk score buffer."""
        self.model_path = model_path
        self.window_size = window_size
        self.model = None
        self.models = []  # ensemble members (logit-averaged); empty => use self.model
        self.member_scalers = []  # (mean, std) per member; falls back to shared stats
        self.vital_buffer = {}  # per patient: deque of recent vitals
        self.risk_scores = {}   # per patient: latest risk score
        self.lock = threading.Lock()
        self.load_error = None  # set when model/scaler loading fails (surfaced via /health)
        self.degraded = False  # True when serving fallback scores instead of model scores

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
        """Load the trained AttentionLSTM model (or ensemble directory)."""
        # Preferred: versioned manifest (ml/deployed_manifest.json) with per-member
        # checkpoints, scalers, and architecture. Falls back to ensemble-dir scan.
        manifest_members = self._manifest_members()
        if manifest_members:
            try:
                from ml.train_lstm import AttentionLSTMModel
                arch = self._manifest_arch()
                for member in manifest_members:
                    m = AttentionLSTMModel(
                        input_size=int(arch.get('input_size', len(FEATURES))),
                        hidden_size=arch.get('hidden_size', 96),
                        num_layers=arch.get('num_layers', 2),
                        dropout=arch.get('dropout', 0.3),
                        bidirectional=arch.get('bidirectional', False),
                    )
                    try:
                        state = torch.load(member['checkpoint'], map_location='cpu', weights_only=True)
                    except TypeError:
                        state = torch.load(member['checkpoint'], map_location='cpu')
                    m.load_state_dict(state)
                    m.eval()
                    self.models.append(m)
                    try:
                        self.member_scalers.append(_load_json_scaler(member['scaler']))
                    except Exception as e:
                        print(f"[Inference] Warning: scaler load failed for {member['id']}: {e}")
                        self.member_scalers.append((None, None))
                self.model = self.models[0]  # primary (attention weights source)
                print(f'[Inference] Loaded manifest ensemble of {len(self.models)} models')
                return
            except Exception as e:
                self.load_error = f'manifest ensemble load failed: {e}'
                print(f'[Inference] Warning: {self.load_error}; falling back to single model')
                self.models = []
                self.member_scalers = []
        # Ensemble: if ml/models/ensemble/*.pt exists, load all members and
        # average logits at inference. Single-file fallback otherwise.
        ens_dir = os.path.join(os.path.dirname(self.model_path), 'ensemble')
        ens_paths = sorted(glob.glob(os.path.join(ens_dir, '*.pt'))) if os.path.isdir(ens_dir) else []
        if ens_paths:
            try:
                from ml.train_lstm import AttentionLSTMModel
                for p in ens_paths:
                    m = AttentionLSTMModel(input_size=len(FEATURES), hidden_size=96)
                    try:
                        state = torch.load(p, map_location='cpu', weights_only=True)
                    except TypeError:
                        state = torch.load(p, map_location='cpu')
                    m.load_state_dict(state)
                    m.eval()
                    self.models.append(m)
                    self.member_scalers.append((None, None))
                self.model = self.models[0]  # primary (attention weights source)
                print(f'[Inference] Loaded ensemble of {len(self.models)} models from {ens_dir}')
                return
            except Exception as e:
                self.load_error = f'ensemble load failed: {e}'
                print(f'[Inference] Warning: {self.load_error}; falling back to single model')
                self.models = []
                self.member_scalers = []

    @staticmethod
    def _manifest():
        import json
        if os.path.exists(MANIFEST_PATH):
            try:
                with open(MANIFEST_PATH) as f:
                    return json.load(f)
            except Exception as e:
                print(f'[Inference] Warning: failed to read manifest: {e}')
        return None

    def _manifest_members(self):
        manifest = self._manifest()
        if manifest and isinstance(manifest.get('members'), list) and manifest['members']:
            arch = manifest.get('arch', {})
            need = int(arch.get('input_size', len(FEATURES)))
            if need != len(FEATURES):
                # Fail fast with a clear message (e.g. a 24-dim gap model
                # cannot be served by the 12-feature engine yet; see
                # ml/RESULTS_PLAN.md "Serving work required").
                print(f'[Inference] Warning: manifest needs input_size={need} but engine '
                      f'builds {len(FEATURES)}-dim vectors; using directory scan')
                return None
            members = [m for m in manifest['members']
                       if os.path.exists(m.get('checkpoint', ''))]
            if len(members) == len(manifest['members']):
                self.window_size = int(manifest.get('window_minutes', self.window_size))
                return members
            print('[Inference] Warning: manifest checkpoints missing; using directory scan')
        return None

    def _manifest_arch(self):
        manifest = self._manifest()
        if manifest and isinstance(manifest.get('arch'), dict):
            return manifest['arch']
        return {}
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
        """Add a vital measurement and compute risk score.

        Returns an int 0-100, or None when no model is loaded / inference
        fails (callers must surface this instead of inventing a score).
        """
        # Extract relevant vitals
        vital_vec = []
        for f in FEATURES:
            if f in vital_dict and vital_dict[f] is not None:
                vital_vec.append(float(vital_dict[f]))
            else:
                vital_vec.append(np.nan)

        with self.lock:
            if patient_id not in self.vital_buffer:
                self.vital_buffer[patient_id] = deque(maxlen=self.window_size)
            if any(not np.isnan(v) for v in vital_vec):
                self.vital_buffer[patient_id].append(vital_vec)
            snapshot = list(self.vital_buffer[patient_id])

        # Model inference runs OUTSIDE the lock so one slow patient cannot
        # block ingestion for every other patient.
        risk_score = self._score_snapshot(snapshot)
        if risk_score is not None:
            with self.lock:
                self.risk_scores[patient_id] = risk_score
        return risk_score

    @staticmethod
    def _clean_window(buffer_list):
        """Interpolate NaNs and pad a buffer snapshot to a full window."""
        X = np.array(buffer_list, dtype=np.float32)
        for i in range(X.shape[1]):
            mask = ~np.isnan(X[:, i])
            if mask.sum() > 0:
                col_mean = X[mask, i].mean()
                X[~mask, i] = col_mean
            else:
                X[:, i] = 0.0
        return X

    def _normalize(self, X, mean, std):
        if mean is not None and std is not None:
            return (X - mean) / std
        if self._train_mean is not None and self._train_std is not None:
            return (X - self._train_mean) / self._train_std
        std = X.std(axis=0) + 1e-6
        return (X - X.mean(axis=0)) / std

    def _pad(self, X):
        if len(X) < self.window_size:
            pad = np.zeros((self.window_size - len(X), X.shape[1]), dtype=np.float32)
            X = np.vstack([pad, X])
        return X

    def _score_snapshot(self, buffer_list):
        """Score a buffer snapshot. Returns int 0-100, or None on failure."""
        if not buffer_list:
            return 0
        if self.model is None and not self.models:
            self.degraded = True
            return None
        try:
            X = self._clean_window(buffer_list)
            X = self._pad(X)
            with torch.no_grad():
                if self.models:
                    logits = []
                    for m, (mean, std) in zip(self.models, self.member_scalers or [(None, None)] * len(self.models)):
                        Xn = self._normalize(X, mean, std)
                        x_tensor = torch.from_numpy(Xn.reshape(1, -1, Xn.shape[1]))
                        logits.append(m(x_tensor).item())
                    logit = float(sum(logits) / len(logits))
                else:
                    Xn = self._normalize(X, None, None)
                    x_tensor = torch.from_numpy(Xn.reshape(1, -1, Xn.shape[1]))
                    logit = self.model(x_tensor).item()
                prob = torch.sigmoid(torch.tensor(logit)).item()
            return max(0, min(100, round(prob * 100)))
        except Exception as e:
            print(f'[Inference] Error computing score: {e}')
            return None

    def _compute_risk_score(self, patient_id):
        """Legacy entry point kept for compatibility; prefer _score_snapshot."""
        with self.lock:
            snapshot = list(self.vital_buffer.get(patient_id, []))
        result = self._score_snapshot(snapshot)
        return result if result is not None else 0

    def get_attention_weights(self, patient_id):
        """Get attention weights for a patient's current vital buffer (for explainability)."""
        with self.lock:
            if patient_id not in self.vital_buffer or self.model is None:
                return None
            snapshot = list(self.vital_buffer[patient_id])
        try:
            X = self._clean_window(snapshot)
            mean, std = (self.member_scalers[0] if self.member_scalers else (None, None))
            X = self._normalize(X, mean, std)
            X = self._pad(X)
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
