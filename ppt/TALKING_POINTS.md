# SynCura — Talking Points (glance sheet)

**When:** 18 Sept, 2–4pm (A Section, slot 1) | **Team:** Fizan Feroz (4PA24CS032), Abdul Ahad Ikkeri (4PA24CS002), Fathima Reeha (4PA24CS026)
**Rubric (25):** Problem 4, Base-paper 4, Novelty 4, Feasibility 4, PPT 3, Participation 3, Questions 3

## One-liner pitch
Attention-LSTM that reads 12 vitals/labs over 90 minutes and gives a real-time 0–100 deterioration risk **with explanations** — the papers stop at AUC, we ship the path.

## Our numbers (memorize)
- **0.844** unseen set-B holdout AUC (4,000 patients) > **0.840** validation → not overfit
- 2-layer LSTM, hidden 96, additive temporal attention, 12 features, 90-min window, stride 15
- Ensemble of 3 LSTM models, logit-averaged

## Slide → line (15 slides)
1. Title: SynCura — Predictive ICU Monitoring System (Attention-LSTM + real-time explainability)
2. Problem: NEWS2/SOFA are threshold rules; they miss trends/direction/rate of change
3. Motivation: deterioration is a process; early + explainable = more review time
4. Existing work: all models/vitals papers below — few go past AUC, none shipped a real-time path
5. Base paper: Zheng 2025 TBAL — 0.936/0.919, hourly, 176K stays; RETROSPECTIVE till-discharge (peaks 98.9 at discharge = hindsight); we mirror architecture, restrict to 90-min only + add SHAP
6. Proposed: rolling 90-min window → risk → temporal-attention + SHAP explanation → dashboard
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