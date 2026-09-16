# AGENTS.md — SynCura Project Guide for AI Agents

## Project Overview

SynCura is a **Predictive ICU Monitoring System** that uses deep learning (LSTM with attention) to predict patient deterioration risk in real-time. It combines a FastAPI backend, React/Vite frontend, and PyTorch ML pipeline trained on PhysioNet 2012 ICU data.

## Quick Commands

```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Train the ML model (with attention + early stopping + SpO2)
python ml/train.py `
  --physionet "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0\set-a" `
  --outcomes "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0\Outcomes-a.txt" `
  --epochs 20 --max-patients 100 --patience 5

# Data directories
$BASE = "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0"
#   $BASE\set-a              = 1519 patients (fast, legacy subset)
#   $BASE\set-a_full\set-a  = 4000 patients (FULL set-a, use for training)
#   $BASE\set-b_full\set-b  = 4000 patients (set-b, use as holdout)
#   $BASE\Outcomes-a.txt    = labels (4000 rows), Outcomes-b.txt = set-b labels (4000 rows)

# Latest full-training sweep (best: val AUC 0.833, holdout AUC 0.806)
python -m ml.sweep_xval

# Run backend API
pip install -r backend\requirements.txt
uvicorn backend.app:app --reload --port 8000

# Run frontend
cd frontend
npm install
npm run dev

# Start both (Windows)
.\start-dev.ps1
```

## Directory Structure

```
PROJ/
├── ml/                          # Machine learning pipeline
│   ├── train.py                 # Main training script (early stopping, SpO2, attention)
│   ├── train_lstm.py            # LSTMModel + AttentionLSTMModel definitions
│   ├── dataset.py               # PhysioNet data loader, creates sliding windows
│   ├── preprocess.py            # Z-score normalization, NaN interpolation
│   ├── explain.py               # SHAP-based feature importance (KernelSHAP)
│   ├── eval_shap.py             # (Legacy) SHAP evaluation stub
│   ├── bench_batch.py           # Batch benchmarking
│   ├── run_experiments.py       # Automated multi-config sweeps
│   ├── sweep_*.py               # One-off experiment sweeps:
│   │   ├── sweep_tight.py       #   LR scheduling / warm-start (round 8)
│   │   ├── sweep_finetune.py    #   warm-start fine-tune (round 9)
│   │   ├── sweep_last.py        #   step-decay cadence (round 10)
│   │   ├── sweep_seed.py        #   multi-seed winner (round 11)
│   │   ├── sweep_full.py        #   full set-a stride-30 scan (round 12)
│   │   ├── sweep_ws2.py         #   low-LR warm-start full-data (round 14)
│   │   ├── sweep_feats.py       #   feature-count A/B f12/f16/f20 (round 13)
│   │   ├── sweep_xval.py        #   FULL set-a vs original val split (round 15, BEST)
│   │   └── sweep_seeds2.py      #   multi-seed full-data + ensemble (round 16)
│   ├── ensemble_swa.py          # SWA / logit-avg ensemble experiments
│   ├── requirements.txt         # numpy, pandas, scikit-learn, torch, shap, matplotlib
│   ├── models/                  # Saved model weights (lstm_baseline.pt, GITIGNORED)
│   └── training_runs/           # Timestamped training run outputs (metrics.json only)
│
├── backend/                     # FastAPI REST API
│   ├── app.py                   # Main API: /health, /ingest, /patients, /scores, /metrics, /explain
│   ├── inference.py             # RiskScoreEngine: loads AttentionLSTM, real-time scoring
│   ├── training.py              # TrainingManager: background training jobs
│   ├── db.py                    # SQLite database (vitals storage)
│   ├── replay.py                # PhysioNet data replay (HTTP/MQTT ingest)
│   ├── mqtt_subscriber.py       # MQTT subscriber for vital signs
│   └── requirements.txt         # fastapi, uvicorn, torch, sqlalchemy, etc.
│
├── frontend/                    # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── App.jsx              # Main shell, routing, dashboard layout
│   │   ├── simulationContext.jsx # Client-side simulation engine (12 patients)
│   │   ├── components/
│   │   │   ├── WelcomePage.jsx       # Landing page with hero
│   │   │   ├── SensorWaveform.jsx    # SVG waveform charts
│   │   │   ├── TrainingConfig.jsx    # Training configuration form
│   │   │   ├── TrainingMonitor.jsx   # Real-time training progress
│   │   │   ├── TrainingJobsList.jsx  # List of training jobs
│   │   │   ├── SimulatedDataFeed.jsx # Tabular simulated data view
│   │   │   └── ArchitecturePage.jsx  # System architecture docs
│   │   └── welcome.css
│   ├── package.json             # react, react-router-dom, axios, chart.js
│   └── index.html
│
├── discordbot/                  # Discord alert bot
├── chatbot-tele/                # Telegram chatbot
├── firmware/                    # IoT firmware (if applicable)
├── scripts/                     # Utility scripts
├── .env                         # Environment variables (secrets)
├── .env.example                 # Environment template
├── start-dev.ps1                # Start backend + frontend together
├── setup.ps1                    # Initial project setup
└── README.md                    # Project documentation
```

## Architecture

```
Patient Vitals --> [Backend /ingest] --> [SQLite DB]
                     |
                     v
            [AttentionLSTM Model]
                     |
                     v
              Risk Score (0-100)
                     |
          +----------+----------+
          |                     |
     [Frontend Dashboard]   [Discord/Telegram Alerts]
```

## ML Model Architecture

**AttentionLSTMModel** (defined in `ml/train_lstm.py`):

- Input: 12 features x 90 timesteps (window = 90 min, stride 30 at training)
- 2-layer LSTM (hidden_size=96, dropout=0.3), additively attends over time steps
- Batch normalization + dropout
- Sigmoid output for binary mortality prediction (trained with BCEWithLogitsLoss, pos_weight = neg/pos)
- Adam optimizer, weight_decay=1e-4, lr=1e-4 halved every 6 epochs (step decay)
- Trains on population-normalized inputs using `ml/scaler.json` stats (train-split only)

**Current best (deployed, commit f40755c):**
- Config: `full-xval-lr1e4` — 12 features, w=90, h=96, lr 1e-4 step-6, full set-a training (3200 patients excl. val)
- **Val AUC 0.833** (original stride-15 80/20 split), **set-b holdout AUC 0.806** (4000 unseen patients)
- Previous milestone: 0.807 val / 0.765 holdout (single-seed 1519-patient training)

## Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API status |
| POST | `/ingest` | Ingest vital JSON, returns risk score |
| GET | `/patients` | Top 6 patients by risk score |
| GET | `/patient/{id}` | Patient details + recent vitals |
| GET | `/scores` | All live risk scores |
| GET | `/metrics` | Latest training metrics (AUC, accuracy, recall) |
| GET | `/patient/{id}/explain` | SHAP feature importance + attention weights |
| POST | `/training/start` | Start a new training job |
| GET | `/training/jobs` | List all training jobs |
| GET | `/training/{id}/progress` | Stream training progress (NDJSON) |

## Feature Set

The model uses **12 features** (must match between training and inference — see `ml/scaler.json` and `backend/inference.py`):

| Feature | PhysioNet Name | Normal Range |
|---------|---------------|--------------|
| Heart Rate | HR | 60-100 bpm |
| Respiratory Rate | RespRate | 12-20 /min |
| Temperature | Temp | 36.1-37.2 C |
| Systolic BP | NISysABP | 90-140 mmHg |
| Diastolic BP | NIDiasABP | 60-90 mmHg |
| SpO2 | SpO2 | 95-100% |
| GCS | GCS | 3-15 |
| BUN | BUN | 6-24 mg/dL |
| Creatinine | Creatinine | 0.6-1.2 mg/dL |
| WBC | WBC | 4.5-11 x10^3/uL |
| Platelets | Platelets | 150-450 x10^3/uL |
| Glucose | Glucose | 70-140 mg/dL |

Notes:
- PhysioNet 2012 has **no SpO2 column** — `ml/dataset.py` `PARAMETER_ALIASES` maps SpO2 -> SaO2.
- NaN handling: NaNs are filled with the population mean (from `ml/scaler.json`) before normalization.
- A 20-feature variant (adds K, Na, HCO3, Mg, HCT, pH, PaO2, PaCO2) was tested but scored **worse** (0.787 vs 0.807) — stick with 12 features.

## Code Conventions

- **Python**: Follow existing style, no comments unless complex logic
- **JavaScript/JSX**: React functional components with hooks, Tailwind CSS classes
- **No new dependencies** without checking existing ones first
- **Model compatibility**: Always update both `train.py` AND `inference.py` when changing features/architecture
- **Thread safety**: RiskScoreEngine uses `threading.Lock()` for concurrent access

## Testing

```powershell
# Smoke test the model (random data)
python ml/train_lstm.py

# Test backend starts
uvicorn backend.app:app --port 8000
curl http://localhost:8000/health

# Test ingestion
curl -X POST http://localhost:8000/ingest -H "Content-Type: application/json" -d '{"patient_id":"test","timestamp":1,"HR":85,"SpO2":98,"RespRate":16,"Temp":37,"NISysABP":120,"NIDiasABP":80}'
```

## Known Issues

- Frontend simulation is client-side only (does not read back from backend)
- Model stats in frontend WelcomePage may still be hardcoded (check before modifying)
- `chart.js` and `socket.io-client` are in package.json but unused
- No unit tests exist yet
- `ml/models/lstm_baseline.pt` is gitignored — commit model updates with `git add -f`
- Full set-a (4000 patients) training is ~5-7 min/epoch at stride 15; use stride 30 (~2-3 min/epoch) for sweeps — deployment uses window 90 regardless of training stride
- When comparing runs: the deployed 0.807/0.833 numbers use the ORIGINAL 1519-subset 80/20 stride-15 val split (seed 42); full-set-a sweeps that use a different split are NOT directly comparable
