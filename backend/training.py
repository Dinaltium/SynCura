"""ML Training Service for backend"""
import json
import os
import threading
import queue
from datetime import datetime
from typing import Dict, List, Optional
import numpy as np
import torch
from sklearn.model_selection import GroupShuffleSplit
from ml.dataset import load_and_create_sequences
from ml.train_lstm import train as quick_train
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score


class TrainingJob:
    """Represents a single training job"""
    def __init__(self, job_id: str, config: Dict):
        self.job_id = job_id
        self.config = config
        self.status = "pending"  # pending, running, completed, failed
        self.start_time = None
        self.end_time = None
        self.current_epoch = 0
        self.total_epochs = config.get('epochs', 5)
        self.metrics = {
            "train_loss": [],
            "val_accuracy": [],
            "auc": None,
            "accuracy": None,
            "precision": None,
            "recall": None
        }
        self.error_message = None
        self.progress_queue = queue.Queue()
        
    def to_dict(self):
        return {
            "job_id": self.job_id,
            "status": self.status,
            "config": self.config,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "current_epoch": self.current_epoch,
            "total_epochs": self.total_epochs,
            "progress": int((self.current_epoch / self.total_epochs) * 100) if self.total_epochs > 0 else 0,
            "metrics": self.metrics,
            "error_message": self.error_message,
            "created_at": datetime.now().isoformat()
        }


class TrainingManager:
    """Manages ML training jobs"""
    
    def __init__(self):
        self.jobs: Dict[str, TrainingJob] = {}
        self.active_job: Optional[str] = None
        self.history: List[Dict] = []
        self._lock = threading.Lock()
        
    def create_job(self, config: Dict) -> TrainingJob:
        """Create a new training job"""
        job_id = f"job_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        job = TrainingJob(job_id, config)
        self.jobs[job_id] = job
        return job
    
    def get_job(self, job_id: str) -> Optional[TrainingJob]:
        """Get a training job by ID"""
        return self.jobs.get(job_id)
    
    def get_all_jobs(self) -> List[Dict]:
        """Get all jobs"""
        return [job.to_dict() for job in self.jobs.values()]
    
    def start_training(self, job_id: str):
        """Start training for a job (runs in background thread)"""
        job = self.get_job(job_id)
        if not job:
            return False

        with self._lock:
            if self.active_job:
                return False  # Only one job at a time
            self.active_job = job_id

        thread = threading.Thread(target=self._train_worker, args=(job,), daemon=True)
        thread.start()
        return True
    
    def _train_worker(self, job: TrainingJob):
        """Background worker for training"""
        job.status = "running"
        job.start_time = datetime.now().isoformat()
        
        try:
            config = job.config
            
            # Load data
            job.progress_queue.put({"type": "status", "message": "Loading dataset..."})
            X, y, patient_ids = load_and_create_sequences(
                physionet_dir=config['physionet_path'],
                outcomes_file=config['outcomes_path'],
                vital_features=config.get('vital_features', ['HR', 'RespRate', 'Temp', 'NISysABP', 'NIDiasABP', 'SpO2']),
                window_minutes=config.get('window', 60),
                max_patients=config.get('max_patients', 100),
                stride=config.get('stride', 15),
                label_mode=config.get('label_mode', 'proximity'),
                horizon_hours=config.get('horizon_hours', 12),
            )
            
            job.progress_queue.put({
                "type": "data_loaded",
                "shape_x": str(X.shape),
                "shape_y": str(y.shape),
                "class_distribution": str(np.bincount(y.astype(int)).tolist())
            })
            
            # Patient-level train/val split to prevent data leakage
            gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
            train_idx, val_idx = next(gss.split(X, y, groups=patient_ids))
            X_train, y_train = X[train_idx], y[train_idx]
            X_val, y_val = X[val_idx], y[val_idx]
            job.progress_queue.put({
                "type": "status",
                "message": f"Split data: train={X_train.shape[0]} val={X_val.shape[0]}"
            })

            # Population normalization from TRAIN ONLY (preserves absolute severity)
            flat = X_train.reshape(-1, X_train.shape[-1]).astype(np.float64)
            train_mean = np.nanmean(flat, axis=0)
            train_std = np.nanstd(flat, axis=0) + 1e-6
            X_train = (np.where(np.isnan(X_train), train_mean, X_train) - train_mean) / train_std
            X_val = (np.where(np.isnan(X_val), train_mean, X_val) - train_mean) / train_std
            X_train = X_train.astype(np.float32)
            X_val = X_val.astype(np.float32)
            
            # Compute pos_weight for class imbalance
            n_neg = int((y_train == 0).sum())
            n_pos = int((y_train == 1).sum())
            pos_weight = n_neg / max(1, n_pos)
            
            # Train model
            job.progress_queue.put({"type": "status", "message": "Starting training..."})
            
            model, _ = quick_train(
                X_train, y_train,
                epochs=job.total_epochs,
                batch_size=config.get('batch_size', 32),
                learning_rate=config.get('learning_rate', 0.001),
                progress_callback=self._training_progress_callback(job),
                pos_weight=pos_weight,
                dropout=config.get('dropout', None),
                weight_decay=config.get('weight_decay', 0.0),
            )
            
            # Evaluate on validation set
            job.progress_queue.put({"type": "status", "message": "Evaluating on validation set..."})
            metrics = self._evaluate_model(model, X_val, y_val)
            job.metrics.update(metrics)
            
            # Save model
            model_path = config.get('model_output', 'ml/models/lstm_baseline.pt')
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            torch.save(model.state_dict(), model_path)

            # Save scaler stats for inference
            with open('ml/scaler.json', 'w') as f:
                json.dump({'mean': [float(v) for v in train_mean],
                           'std': [float(v) for v in train_std]}, f, indent=2)
            
            job.status = "completed"
            job.end_time = datetime.now().isoformat()
            job.progress_queue.put({
                "type": "completed",
                "model_path": model_path,
                "metrics": metrics
            })
            
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.end_time = datetime.now().isoformat()
            job.progress_queue.put({
                "type": "error",
                "message": str(e)
            })
        
        finally:
            self.active_job = None
            # Save to history
            self.history.append(job.to_dict())
    
    def _training_progress_callback(self, job: TrainingJob):
        """Create a progress callback for training"""
        def callback(epoch: int, metrics: Dict):
            job.current_epoch = epoch
            if 'train_loss' in metrics:
                job.metrics['train_loss'].append(float(metrics['train_loss']))
            if 'val_accuracy' in metrics:
                job.metrics['val_accuracy'].append(float(metrics['val_accuracy']))
            job.progress_queue.put({
                "type": "progress",
                "epoch": epoch,
                "metrics": metrics
            })
        return callback
    
    @staticmethod
    def _evaluate_model(model, X, y, batch_size=4096):
        """Evaluate trained model in batches to avoid OOM."""
        device = next(model.parameters()).device
        model.eval()
        probs_batches = []
        with torch.no_grad():
            for start in range(0, len(X), batch_size):
                xb = torch.tensor(X[start:start + batch_size], dtype=torch.float32).to(device)
                logits = model(xb)
                probs_batches.append(torch.sigmoid(logits).detach().cpu().numpy())
        probs = np.concatenate(probs_batches)

        auc = roc_auc_score(y, probs) if len(np.unique(y)) > 1 else float('nan')
        preds = (probs > 0.5).astype(int)
        acc = accuracy_score(y, preds)
        prec = precision_score(y, preds, zero_division=0)
        rec = recall_score(y, preds, zero_division=0)

        return {
            'auc': float(auc),
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec)
        }
    
    def get_job_progress(self, job_id: str) -> Optional[Dict]:
        """Get latest progress for a job"""
        job = self.get_job(job_id)
        if not job:
            return None
        
        try:
            # Get latest message without blocking
            return job.progress_queue.get_nowait()
        except queue.Empty:
            return None


# Global training manager instance
training_manager = TrainingManager()
