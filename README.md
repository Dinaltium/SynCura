# ionerdstechfusion

IONERDS ASSEMBLE!!!!!!!!!!!!!!

## INFORMATION

- FAILURE NOT ACCEPTED

Project: Predictive ICU Monitoring System (software-only)
-------------------------------------------------------

This repository contains a real-time ICU patient deterioration monitoring system with attention-based deep learning. It includes:

- **AttentionLSTM Model**: LSTM with temporal attention, dropout, batch normalization, and early stopping
- **FastAPI Backend**: Real-time inference, SHAP explainability, and REST API
- **React Frontend**: ICU dashboard with scenario simulation, alerts, and training UI
- **PhysioNet 2012**: Trained on ICU mortality prediction dataset with 12 features (6 vitals: HR, RespRate, Temp, SysBP, DiasBP, SpO2 + 6 labs: GCS, BUN, Creatinine, WBC, Platelets, Glucose)

Status
------

**Datasets:** PhysioNet 2012 Challenge downloaded at `C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\`

ML Training
-----------

Install dependencies and train the AttentionLSTM with early stopping:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ml\requirements.txt
python -m ml.train `
  --physionet "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0\set-a" `
  --outcomes "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0\Outcomes-a.txt" `
  --epochs 25 `
  --patience 7 `
  --stride 15 `
  --batch-size 128 `
  --lr 0.0003
```

This uses the full set-a (4,000 patients), 90-minute windows with 30-minute training stride (15-minute eval stride), proximity labeling (last 12h of each stay), population normalization, and early stopping. Metrics go to the latest `ml/training_runs/exp_*/<config>/metrics.json` (copied to `ml/metrics.json`), model to `ml/models/lstm_baseline.pt`, scaler stats to `ml/scaler.json`.

**Deployed model (val AUC 0.840, fresh holdout AUC 0.844):** a 3-member logit-averaged ensemble (`s48 + c93 + s45`, all 12-feature f12-h96-w90) served from `ml/models/ensemble/*.pt` via multi-checkpoint support in `backend/inference.py`. (`c93` trained on set-a + 80% set-b, so the honest external number is the fresh unseen 20% set-b holdout.)

For a quick smoke test only (not reportable): add `--max-patients 100 --epochs 2`.

This loads ~100 patients, creates 90-minute sliding windows of 12 features (6 vitals + 6 labs), normalizes, trains an AttentionLSTM with early stopping, and saves metrics to `ml/metrics.json`.

Running the Full Data Pipeline
-------------------------------

**Step 1: Start the backend API**

```powershell
pip install -r backend\requirements.txt
uvicorn backend.app:app --reload --port 8000
```

The backend will:
- Initialize SQLite database at `backend/data/vitals.db`
- Load the trained 3-model AttentionLSTM ensemble from `ml/models/ensemble/*.pt` (falls back to `ml/models/lstm_baseline.pt` if no ensemble dir)
- Start listening on `http://localhost:8000`

Available endpoints:
- `GET /health` — API status
- `POST /ingest` — Accept vital JSON: `{"patient_id":"P001", "timestamp":1000, "HR":75, "RespRate":18, ...}`
- `GET /patients` — Return top 6 patients by risk score
- `GET /patient/{patient_id}` — Get patient details and recent vitals
- `GET /scores` — Get all live risk scores

**Step 2: Run the data replay (in a new terminal)**

```powershell
pip install pandas requests paho-mqtt

python backend\replay.py `
  --mode http `
  --url http://localhost:8000/ingest `
  --physionet "C:\Users\fizan\Downloads\Techfusion\predicting-mortality-of-icu-patients-the-physionetcomputing-in-cardiology-challenge-2012-1.0.0\predicting-mortality-of-icu-patients-the-physionet-computing-in-cardiology-challenge-2012-1.0.0\set-a" `
  --speed 10 `
  --max-patients 5
```

This will stream 5 patients' vitals at 10x speed into the backend. Watch the backend logs to see each vital and computed risk score.

**Step 3: Query the API (in another terminal)**

```powershell
# Get top 6 patients
curl http://localhost:8000/patients

# Get patient details
curl http://localhost:8000/patient/132539

# Get all scores
curl http://localhost:8000/scores
```

**Expected Output:**
```json
{
  "patients": [
    {"patient_id": "132539", "risk": 65, "timestamp": 3600},
    {"patient_id": "132540", "risk": 42, "timestamp": 3600}
  ]
}
```

Frontend Live Simulation
------------------------

Run the dashboard locally:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

Run Frontend + Backend Together (Windows)
-----------------------------------------

From the repository root, start both services with one command:

```powershell
.\start-dev.ps1
```

This opens two new PowerShell windows:
- Backend API on `http://127.0.0.1:8000`
- Frontend Vite app on `http://127.0.0.1:5173`

Dashboard simulation controls (on the main page):
- Scenario buttons: `Baseline Mix`, `Respiratory Decline`, `Septic Shock`, `Cardiac Stress`, `Recovery Trend`
- `Pause Simulation` / `Resume Simulation`
- `Reset to Baseline`

The simulation updates vitals and risk scores in real time and refreshes the "Updated" timestamp automatically.

Troubleshooting Frontend Startup
--------------------------------

If the page does not load or CPU usage spikes:

1. Stop existing dev servers and restart from `frontend`:
   ```powershell
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
2. Check that port 5173 is free before starting:
   ```powershell
   Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
   ```
3. If dependencies are stale:
   ```powershell
   npm install
   npm run build
   ```
4. Keep only one Vite dev server running at a time.

Feature Log (Implemented)
-------------------------

This section tracks the currently implemented product capabilities end-to-end.

### 1) Real-time ICU dashboard simulation
- Live patient risk board with ranked deterioration probability
- Synthetic real-time vitals updates for each patient (HR, SpO2, RR, Temp)
- Trend sparkline for each patient card
- Risk dial and status buckets (`Stable`, `Watch`, `High`, `Critical`)
- Last update timestamp shown in UI

### 2) Scenario simulation controls
- Scenario presets:
  - `Baseline Mix`
  - `Respiratory Decline`
  - `Septic Shock`
  - `Cardiac Stress`
  - `Recovery Trend`
- Start/Pause simulation control
- Reset simulation to baseline state
- Dedicated `Simulated Data` tab for live sensor feed inspection

### 3) Real-time clinical alerts
- Live alert stream panel on dashboard
- Rule-based threshold alerts for:
  - Critical risk escalation
  - Low oxygen saturation (SpO2)
  - Elevated respiratory rate
  - High fever/infection trend
- Active alert counter in panel header

### 3.1) Simulated data stream tab
- Route: `/simulated-data`
- Sidebar navigation entry: `Simulated Data`
- Shared simulation state with dashboard (same scenario, run/pause state, and updates)
- Live table with per-patient:
  - patient ID, bed, status, risk, trend
  - HR, SpO2, respiratory rate, temperature
  - lead signal and recent risk window values

### 4) Explainability and score impact
- Per-patient "Inspect impact" action from risk list
- Risk impact breakdown by vital sign:
  - Heart Rate
  - SpO2 Saturation
  - Respiratory Rate
  - Temperature
- Signed contribution display as risk points (`+/-`)
- Waveform explainability overlay with color-coded contributors

### 5) Clinical threshold tuning and evaluation
- Interactive alert threshold slider (risk threshold tuning)
- Real-time performance readouts:
  - Sensitivity
  - Specificity
  - Precision
  - False alarms
- NEWS2 baseline comparison section (`NEWS2 >= 7`) vs AI model
- Average early warning lead-time estimate shown in analytics

### 6) Backend and ML capabilities in repository
- FastAPI ingestion and patient APIs:
  - `POST /ingest`
  - `GET /patients`
  - `GET /patient/{patient_id}`
  - `GET /scores`
- Training job lifecycle endpoints:
  - `POST /training/start`
  - `GET /training/jobs`
  - `GET /training/{job_id}`
  - `GET /training/{job_id}/progress`
- LSTM training pipeline for PhysioNet data with run artifacts and metrics output
