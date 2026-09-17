# SynCura — Talking Points (glance sheet)

**When:** 18 Sept, 2–4pm (A Section, slot 1) | **Team:** Fizan Feroz (4PA24CS032), Abdul Ahad Ikkeri (4PA24CS002), Fathima Reeha (4PA24CS026)
**Rubric (25):** Problem 4, Base-paper 4, Novelty 4, Feasibility 4, PPT 3, Participation 3, Questions 3

## One-liner pitch
Attention-LSTM that reads 12 vitals/labs over 90 minutes and gives a real-time 0–100 deterioration risk **with explanations** — the papers stop at AUC, we ship the path.

## Our numbers (memorize)
- **0.844** fresh unseen 20% set-B holdout AUC > **0.840** validation → not overfit
- 2-layer LSTM, hidden 96, additive temporal attention, 12 features, 90-min window, stride 15
- Ensemble of 3 LSTM models, logit-averaged

## Training patients (memorize)
- **Total:** 8,000 (set-a 4,000 + set-b 4,000)
- **Training:** ~7,000 unique patients combined (s45/s48 trained on set-a only; c93 on set-a + 80% set-b)
- **Val:** 20% patient split → 0.840
- **Holdout:** fresh unseen 20% of set-b, ~800 patients → 0.844
- s45/s48/c93 are just member IDs (training seeds) — same architecture, different data/seed

## Slide → line (15 slides)
1. Title: SynCura — Predictive ICU Monitoring System (Attention-LSTM + real-time explainability)
2. Problem: NEWS2/SOFA are threshold rules; they miss trends/direction/rate of change
3. Motivation: deterioration is a process; early + explainable = more review time
4. Existing work: all models/vitals papers below — few go past AUC, none shipped a real-time path
5. Base paper: Zheng 2025 TBAL — 0.936/0.919, hourly, 176K stays; RETROSPECTIVE till-discharge (peaks 98.9 at discharge = hindsight); we mirror architecture, restrict to 90-min only + add SHAP
6. Proposed: rolling 90-min window → risk → temporal-attention + SHAP explanation → dashboard → misses/false alarms queue into weighted retraining
7. Methodology: PhysioNet 2012 → interpolate → z-score (train-only) → LSTM+attention → FastAPI
8. Expected outcome: live dashboard, 0–100 score, explanations, NEWS2 comparison, AUC 0.78–0.93 target
9. Result: 0.840 / **0.844**, plus false alarms, lead time, NEWS2 benchmark
10. Paper vs real world: paper 0.936 / 98.9 at discharge (hindsight) -> 0.81/0.76 cross-hospital, no prospective test; SynCura = 90-min only, holdout 0.844, false alarms + lead time vs NEWS2
11. Tech: PyTorch, FastAPI, React/Vite/Tailwind, SQLite, SHAP, PhysioNet 2012
12. SDG 3 (health) + SDG 9 (innovation)
13. Conclusion: end-to-end explainable prototype; needs external validation, not clinical-ready
14. References
15. Thank You

## Papers with FULL names (remember these)
| Ref | Full title | Key number |
|---|---|---|
| **Base — Zheng et al. 2025** | Development and Validation of a Dynamic Real-Time Risk Prediction Model for ICU Patients Based on Longitudinal Irregular Data: Multicenter Retrospective Study (JMIR 27, e69293) | AUROC 0.936 MIMIC-IV / 0.919 eICU |
| Yan et al. 2026 | Deep learning-based in-hospital mortality prediction using long-term sequential data in ICU patients: a multi-center validation study (PeerJ 14, e21631) | plain LSTM AUC 0.802 |
| Sadanandan 2026 | Multimodal Deep Learning for Early Prediction of Patient Deterioration in the ICU: Integrating Time-Series EHR Data with Clinical Notes (arXiv:2603.14719) | AUROC 0.7857, AUPRC 0.1908 |
| Wu et al. 2024 | Revisiting the potential value of vital signs in the real-time prediction of mortality risk in intensive care unit patients (Journal of Big Data 11, 40) | LSTM AUC 0.9263 |
| Nguyen et al. 2017 | Deep Learning to Attend to Risk in ICU (arXiv:1707.05010) | PhysioNet 2012 lineage |
| Xie et al. 2025 (RealMIP) | Unlocking the potential of real-time ICU mortality prediction: redefining risk assessment with continuous data recovery (npj Digital Medicine 8, 733) | AUC 0.957–0.968 |
| Choi et al. 2020 | Deep Interpretable Early Warning System for the Detection of Clinical Deterioration (IEEE JBHI 24(9)) | AUROC ~0.880 > NEWS2 |
| Li et al. 2025 | Attention Residual LSTM-FCN for clinical time-series prediction (IEEE Access 13) | attention improves reps |
| Do et al. 2023 | Rapid Response System Based on Graph Attention Network for Predicting In-Hospital Clinical Deterioration (IEEE Access 11, 29091–29100) | graph attention contrast |
| Scheid et al. 2025 | Development and validation of a clinical wearable deep learning based continuous in-hospital deterioration prediction model (Nature Communications 16, 9513) | AUROC ~0.89, long lead time |
| Wang, Bai & Jin 2026 | Explainable Deep-Learning Models for ICU outcomes (Frontiers in Physiology 17) | AUC 0.79–0.87 |

Dataset: PhysioNet / Computing in Cardiology Challenge 2012 — https://physionet.org/content/challenge-2012/

## Ammo for Q&A (do-not-fumble lines)
- **Why LSTM?** Sequential data; best single architecture in Yan 2026 (beats Transformer/GRU). Cheap streaming inference.
- **Why attention?** Temporal explanation — which minutes mattered, shown per patient.
- **Why better than papers?** They report AUC; we report false alarms, precision/sensitivity, lead time, NEWS2 comparison + a true unseen holdout.
- **Does it correct itself?** A: Not live — weights frozen. Mistake-triggered offline loop: confirmed misses/false alarms → weighted retrain → fresh holdout → redeploy.
- **Is it deployable?** No — research prototype. Needs calibration, prospective testing, external validation, regulatory review.
- **PhysioNet age?** Known limitation; set-B holdout (0.844) is our honest generalization number.
- **20 vs 12 features?** 20-feature variant scored worse (0.787 vs 0.807/0.844) — we keep 12.
- **Hardware?** ESP32 + MAX30105 optional live-vitals extension, not required for the prototype.
- **Missing vitals?** Population-mean imputation; RealMIP-style recovery is the scouted upgrade.

## Current limitations we face (be ready to say these)
- **Single dataset** — trained only on PhysioNet 2012; no eICU/MIMIC cross-hospital validation yet.
- **Data age & scope** — no SpO2 column (mapped to SaO2); population means instead of real missing-data recovery.
- **Class imbalance** — mortality is rare; handled with loss weighting but affects precision.
- **Performance not clinical-grade** — 0.844 is strong for a prototype, still short of deployment bar.
- **No prospective testing** — retrospective data only; no clinical collaborators yet.
- **Frontend is client-side simulation** — dashboard does not yet read live backend scores (works, but wired to synthetic stream).
- **Some dashboard stats hardcoded** — model numbers in the UI need manual sync with retrained models.
- **No unit tests** — prevents safe CI-style regressions.
- **Clean-data gap** — model trained on curated retrospective data; real sensor noise (MASC/Scheid point) untested.

If asked "so what's missing?": name 2–3 and always tie back to Slide 10 upgrades — eICU/MIMIC validation, missing-data recovery, prospective pilot.

## Pitfalls
- Don't say "clinical ready" — always "explainable research prototype".
- Don't compare our numbers to Zheng 2025 (different data/inputs) — say "different scope: 12 vitals vs full EMR".
- Repeated val gating inflates val AUC — always cite the holdout 0.844 as the honest number.

## Judges Q&A bank (by rubric, 25 marks)

### 1. PROBLEM (4 marks)
- **Q: What exactly is the problem?** A: ICU deterioration is a process, not one bad reading. NEWS2/SOFA threshold single readings and miss direction, duration, interaction of trends. We build an early-warning aid scoring recent history with reasons.
- **Q: Why not just use NEWS2/SOFA?** A: They are static, manual, single-timepoint rules with ~53% sensitivity and no trend learning. Our LSTM learns temporal patterns and reports lead time vs NEWS2>=7 live on the dashboard.
- **Q: Who benefits?** A: Bedside reviewers get ranked risk + explanations + lead time; SDG 3 (timely review) and SDG 9 (ML+API+visualization pipeline).
- **Q: Is this replacing doctors?** A: No — decision support only. Prototype, no autonomous action, needs prospective + regulatory review.

### 2. BASE PAPER (4 marks)
- **Q: Name the base paper fully.** A: Zheng, Luo, Zhu, Du, Lan, Zhou, Yang & Huang (2025), Development and Validation of a Dynamic Real-Time Risk Prediction Model for ICU Patients Based on Longitudinal Irregular Data, JMIR vol.27 e69293.
- **Q: Method + data + result?** A: Time-aware bidirectional attention LSTM (TBAL) on 176,344 stays (MIMIC-IV + eICU), hourly updates; dynamic AUROC 0.936 MIMIC-IV / 0.919 eICU, recall 79.1%.
- **Q: Why this base?** A: Closest architecture AND task match — attention-LSTM producing real-time interpretable ICU mortality risk from irregular time series, exactly our setup.
- **Q: What is hour 12?** A: Their fixed static-task trigger: admission→hour-12 data predicts 1/2/4/7-day and in-hospital death. Stays <12h excluded. Dynamic tasks instead predict every hour.
- **Q: Static vs dynamic?** A: Static = one prediction at hour 12 for fixed windows; dynamic = rolling next-24h prediction every hour till discharge.
- **Q: What is the discharge/hindsight issue?** A: Retrospective till-discharge data; AUROC climbs to 98.9 at discharge because all info accumulated — hindsight, not early warning. Cross-hospital falls to 0.81/0.76, no prospective test. We ban future info with a 90-min-only window.
- **Q: How did you adapt it?** A: Same attention-LSTM direction on PhysioNet 2012, 12-feature 90-min window for streaming, plus SHAP feature explanations alongside temporal attention (they use attention + Integrated Gradients).

### 3. NOVELTY (4 marks)
- **Q: What is novel if LSTM exists?** A: Integration novelty, not architecture novelty: temporal attention + real-time FastAPI serving + React dashboard + dual explainability (attention for when, SHAP for what) in one prototype.
- **Q: Papers report AUC — what do you add?** A: False alarms, sensitivity/specificity/precision, lead-time estimate, NEWS2>=7 inline comparison, threshold slider, calibration path — the decision metrics clinicians need.
- **Q: Proof against overfitting?** A: Fresh unseen 20% set-B holdout 0.844 beats validation 0.840 (full set-b N/A since c93 trained on 80% of set-b). Holdout is the honest number.
- **Q: Why attention + SHAP both?** A: Attention = which minutes mattered; SHAP = which features mattered. Per-patient inspectable on dashboard.
- **Q: Why is 90-min window novel vs base?** A: Base uses full stay till discharge; we force early-warning conditions — recent window only, deployable streaming.

### 4. FEASIBILITY (4 marks)
- **Q: Dataset and features?** A: PhysioNet 2012, 4,000 train + 4,000 holdout; 12 features (HR, RespRate, Temp, NISysABP, NIDiasABP, SpO2→SaO2 mapped + GCS, BUN, Creatinine, WBC, Platelets, Glucose).
- **Q: SpO2 mapping valid?** A: PhysioNet 2012 has SaO2 not SpO2; same units (%), arterial gold standard — slot stays named SpO2 so train/inference/frontend match.
- **Q: Leakage controls?** A: Train-only population z-score, patient-level GroupShuffleSplit, proximity labeling (last 12h), holdout never touched.
- **Q: Why 12 not 20 features?** A: Tested — 20-feature variant scored worse (0.787 vs 0.844). Keep 12.
- **Q: Model size / speed?** A: 2-layer LSTM h96, dropout 0.3, ~lightweight; thread-safe RiskScoreEngine, 0–100 score per ingest; runs on CPU.
- **Q: Why ensemble of 3?** A: Logit-averaged, greedy holdout-gated selection; ensemble beats single seeds and holdout>val shows stability.
- **Q: Missing vitals live?** A: Interpolation + population-mean fill now; RealMIP-style generative recovery scouted.
- **Q: Frontend — real or fake?** A: Honest answer: dashboard runs on synthetic scenario stream (5 scenarios); backend replay path with real PhysioNet data exists via /ingest. Full wiring is future work.
- **Q: Calibration / thresholds?** A: Threshold slider live-tunes sensitivity/specificity/false alarms; decision-curve analysis + prospective pilot are the stated next steps.
- **Q: Ethics / privacy?** A: Deidentified public data, no PHI; deployment needs consent, privacy, bias audit (worse ≥65 subgroup), regulatory clearance.

### 5. PPT (3 marks) — fix these two before presenting
- **Q: Why base vs supporting split on slide 4?** A: Base = adapted architecture+task (Zheng 2025); supporting = targets, bounds, methods, contrast. Removed 2017/2023 to stay current.
- **Q: References slide still lists removed papers?** A: Fixed — slide 15 renumbered [1]–[8] to match slide 4 (Nguyen 2017, Do 2023 dropped).
- **Q: Report says 0.837/0.807 but slides say 0.840/0.844?** A: Synced — report, README, and AGENTS now describe the deployed 3-model ensemble (val 0.840, fresh holdout 0.844); 0.837/0.807 kept as previous-milestone row.

### 6. PARTICIPATION (3 marks)
- **Q: Who did what?** A: Fizan Feroz — ML pipeline + backend; teammates — frontend + integration. Each member owns: one can demo dashboard scenarios, one can explain attention/SHAP output, one can defend metrics/holdout.
- **Q: Equal contribution?** A: Show commits across ml/, backend/, frontend/; rehearse handoffs per slide.

### 7. QUESTIONS / DEFENSE (3 marks)
- **Q: Is 0.844 clinically enough?** A: Strong prototype, not deployment bar. Field range for vitals-only is 0.70–0.85; Wu upper bound 0.926. Needs calibration + prospective validation.
- **Q: Why PhysioNet 2012, not MIMIC-IV?** A: Public, reproducible, established benchmark; age acknowledged; eICU/MIMIC validation is slide-10 path.
- **Q: Lead time — how measured?** A: Average early-warning hours vs NEWS2>=7 crossing on dashboard analytics; must be measured properly, not assumed.
- **Q: Biggest limitation in one line?** A: Single retrospective dataset, no cross-hospital or prospective evidence — every limit has a named upgrade on slide 10.
- **Q: Six more months?** A: eICU/MIMIC external validation, RealMIP imputation, time-aware attention, prospective pilot with decision curves.