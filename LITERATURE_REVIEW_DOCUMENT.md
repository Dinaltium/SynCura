# SynCura - Literature Review Document
### Predictive ICU Monitoring System Using Attention-Based LSTM with Real-Time Explainability
**P.A. College of Engineering | Department of Computer Science & Engineering**
**Team: Abdul Ahad Ikkeri (4PA24CS002), Fathima Reeha (4PA24CS026), Fizan Feroz (4PA24CS032)**
**Date: 2026-09-18 | Version: 1.1 | Sources: 8 papers + PhysioNet 2012 dataset (matches `ppt/SynCura_Deck_V3_FINAL.pptx` Slide 15)**

## 1. Objective of this Review

This document reviews the base paper and supporting works used in the SynCura project. For each study it records:

1. **Key findings** - what the study demonstrated,
2. **Limitations** - what restricts its direct use in real-time clinical deployment,
3. **What SynCura used** - the specific idea, method, metric, or design decision adopted from that work.

The comparative summary is given as Table 1 in Section 2. Detailed per-study notes follow in Section 3 (each entry cross-references its Table 1 row by number).

**Selection method.** Papers were selected to cover (a) the closest architecture-task match for the base design, (b) realistic LSTM performance targets, (c) vital-sign-only and multimodal contrasts, (d) missing-data and external-validation practice, and (e) interpretable early-warning and streaming/wearable deployment. Preference was given to works cited in the final presentation so the document, deck, and report stay consistent.

**How to read the numbers.** AUROC/AUC values come from different cohorts, label definitions, windows, and splits; they are reference points, not head-to-head comparisons with SynCura. SynCura's own numbers are validation AUC 0.840 and fresh unseen 20% set-B holdout AUC 0.844 (95% CI 0.836-0.852), per `ppt/figs/metrics.json`.

## 2. Comparative Summary Table

| No. | Study | Key Findings | Limitations | What SynCura Used / Adopted |
|---|---|---|---|---|
| [1] Base | Zheng et al. (2025), JMIR 27:e69293. Time-aware bidirectional attention LSTM (TBAL) on 176,344 ICU stays, MIMIC-IV + eICU. | Dynamic real-time AUROC 0.936 on MIMIC-IV, 0.919 on external eICU with 79.1% recall; hourly risk updates; time-aware attention weights highlight relevant time points; static AUROC 0.959. | Retrospective data used till discharge, so AUROC rises to 0.989 at discharge (hindsight bias); cross-hospital AUROC falls to ~0.81/0.76; no prospective bedside trial; richer EMR inputs (labs, medications, irregular-time features) not available in a lightweight streaming setup. | **Main architecture and task template.** Adapted TBAL idea as 2-layer LSTM-96 + additive temporal attention; real-time rolling-window risk formulation; stricter 90-min past-only windows with no future information; attention weights for temporal explanation. |
| [2] | Wang, Bai & Jin (2026), Front. Physiol. 17. Explainable deep-learning models for ICU outcomes. | Explainable LSTM models for ICU outcome prediction with reported AUC range ~0.79-0.87; feature-level explanations used to support clinical interpretation. | Single-dataset evaluation; explanation quality is descriptive, not causal; limited reporting of false alarms, lead time, and calibration for bedside use. | **Explainability justification.** Used to support combining temporal attention with SHAP feature importance; SynCura reports both attention weights and SHAP values instead of AUC alone. |
| [3] | Yan et al. (2026), PeerJ 14:e21631. LSTM vs GRU/RNN/Transformer/Informer + stacking, multi-centre ICU sequential data. | Plain single LSTM was best single model with AUC 0.802 (95% CI 0.774-0.828), beating newer Transformer/Informer variants; external performance lower than internal performance. | Absolute performance is modest; ensemble adds complexity; still retrospective and multi-centre only, without live deployment, calibration, or alert-fatigue analysis. | **Realistic benchmark and evaluation discipline.** Set LSTM as the appropriate baseline against newer architectures; adopted separate unseen-patient/hospital evaluation principle, reflected in SynCura's fresh unseen 20% set-B holdout. |
| [4] | Sadanandan (2026), arXiv:2603.14719. Multimodal LSTM + ClinicalBERT with cross-modal attention, 74,822 MIMIC-IV stays. | AUROC 0.7857, AUPRC 0.1908; systematic review of 31 ICU studies finds structured-data-only models typically score AUC 0.70-0.85; notes add complementary signal. | Multimodal pipeline adds data, privacy, compute, and latency cost; AUPRC remains low under class imbalance; no real-time bedside deployment. | **Scope control + future work.** Used the 0.70-0.85 field range to justify SynCura's realistic target for a vitals-plus-labs system; deliberately deferred clinical-note fusion to future work to keep real-time latency low. |
| [5] | Wu et al. (2024), J. Big Data 11:40. Vital-sign LSTM vs RF and Cox models, 33,798 MIMIC-III + 889 external patients. | Vital-sign-only LSTM AUC 0.9263, clearly above random forest (~0.744) and miscalibrated Cox baseline; shows small vital-sign set can carry strong short-window mortality signal. | Datasets, preprocessing, population, and label protocol differ from SynCura, so not directly comparable; limited explainability and deployment analysis. | **Upper-bound reference for vitals modelling.** Used as evidence that HR, RR, Temp, BP, and oxygenation support real-time risk scoring; SynCura keeps the same core vitals and adds labs, attention, SHAP, and a deployable serving path. |
| [6] | Xie et al. (2025), npj Digit. Med. 8:733. RealMIP generative continuous-data recovery + mortality prediction, 188 eICU centres, validated on MIMIC-IV/SICdb. | AUC ~0.957-0.968 across databases; principled real-time imputation of missing/async vitals and labs improves robustness and transfer. | Ceiling comes from richer multi-database training unavailable to a single-dataset prototype; generative imputation adds model and deployment complexity. | **Missing-data roadmap.** Did not copy the generative model; used it to define SynCura's next step beyond current interpolation/forward-fill plus train-only z-score: robust RealMIP-style recovery and cross-hospital validation. |
| [7] | Choi et al. (2020), IEEE J-BHI 24(9). Deep Interpretable Early Warning System (BiLSTM + attention). | AUROC ~0.880 with interpretable attention; outperformed NEWS2-style baseline in the studied setting; supports sequential early warning over static thresholds. | Retrospective hospital data; attention is associative, not causal; limited analysis of calibration, false alarms, and workflow integration. | **Early-warning + baseline comparison pattern.** Adopted attention-based early-warning design and the requirement to benchmark against NEWS2 with sensitivity, specificity, precision, false alarms, and lead time. |
| [8] | Scheid et al. (2025), Nat. Commun. 16:9513. Wearable deep-learning continuous in-hospital deterioration prediction. | Continuous wearable monitoring achieves AUROC ~0.89 with long advance warning in its clinical setting; shows value of streaming vital signs. | Sensor noise, missing/async sampling, device integration, and workflow compatibility limit transfer; retrospective-style evaluation does not equal bedside readiness. | **Streaming/edge justification and caution.** Used to support SynCura's SENSE -> INGEST -> SCORE -> ACT path (ESP32 + MAX30105, FastAPI/SQLite, AttentionLSTM 0-100, dashboard + alerts) while explicitly noting sensor and deployment limits. |
| [9] | PhysioNet / CinC Challenge 2012 dataset. 4,000 ICU patients, ~37 time-series variables over 48 h, mortality labels. | Standard public benchmark for ICU mortality; supports reproducible sliding-window, patient-level-split, and holdout evaluation. | US-only, retrospective, 2012-era care patterns; missing/async measurements; age and single-system biases; no prospective or multi-hospital guarantee. | **Training and evaluation dataset.** Used for all SynCura modelling: 12 vitals + labs, 90-min rolling windows (stride 15), train-only normalisation, patient-level split, validation plus fresh unseen 20% set-B holdout (val AUC 0.840, holdout AUC 0.844). |

## 3. Detailed Review (companion to Table 1)

### 3.1 [1] Zheng et al. (2025) - Base paper

**Approach.** Time-aware bidirectional attention LSTM (TBAL) over irregular longitudinal EMR (vitals, labs, medications) with hourly risk updates, trained on 176,344 MIMIC-IV stays and cross-validated on eICU.

**Findings.** Time-aware bidirectional attention LSTM produces hourly ICU mortality risk from irregular longitudinal EMR data. Dynamic AUROC 0.936 internally and 0.919 externally, with high recall. Attention plus gradient-based attribution provides time-level interpretability.

**Limitations.** Retrospective design; performance inflates near discharge when future information accumulates; cross-hospital drop; no bedside trial; input richness exceeds what a low-latency vital-sign service can assume.

**What SynCura used.** Architecture-task match (attention-LSTM for real-time ICU risk); hourly/rolling risk idea implemented as 90-minute past-only windows; temporal attention retained for per-timestep explanation; SHAP added for feature-level explanation; evaluation made stricter with an unseen holdout.

### 3.2 [2] Wang, Bai & Jin (2026) - Explainable ICU models

**Approach.** Explainable deep-learning (LSTM-family) models for ICU outcome prediction with built-in feature-attribution explanations.

**Findings.** Explainable LSTM variants achieve competitive ICU outcome discrimination while exposing feature contributions for clinical review.

**Limitations.** Explanations describe model behaviour rather than proving physiological causation; deployment metrics beyond AUC are thin.

**What SynCura used.** Dual-explanation design: temporal attention answers *when* the trajectory worsened, SHAP answers *which* features moved the score; both are served through the dashboard and `/patient/{id}/explain`.

### 3.3 [3] Yan et al. (2026) - Sequential architecture comparison

**Approach.** Head-to-head comparison of LSTM, GRU, RNN, Transformer, Informer, and a stacked ensemble on long-term sequential ICU data with multi-centre external validation.

**Findings.** Across LSTM, GRU, RNN, Transformer, Informer, and stacking, a plain LSTM remains the strongest single sequential model, but external-centre scores fall below internal scores.

**Limitations.** Modest absolute AUC; stacking improves numbers at the cost of complexity and latency.

**What SynCura used.** Kept a simple 2-layer LSTM-96 rather than moving prematurely to Transformers/graph models; reports validation alongside an unseen holdout instead of validation alone.

### 3.4 [4] Sadanandan (2026) - Multimodal time-series + notes

**Approach.** Bidirectional LSTM on physiological time-series fused with ClinicalBERT on clinical notes via cross-modal attention (74,822 MIMIC-IV stays, 5.7M hourly samples), plus a systematic review of 31 ICU deterioration studies (2015-2024).

**Findings.** Adding ClinicalBERT notes to an LSTM improves context but only reaches AUROC ~0.786 in the reported setup; literature survey places vitals-only systems at AUC ~0.70-0.85.

**Limitations.** Multimodal data increases preprocessing, privacy, compute, and deployment burden; low AUPRC reflects severe class imbalance.

**What SynCura used.** Used the survey range to avoid overclaiming; fixed scope to structured time-series now and listed note fusion as future work after calibration, fairness, and prospective validation.

### 3.5 [5] Wu et al. (2024) - Vital-sign mortality prediction

**Approach.** Real-time short-window mortality prediction from systolic/diastolic BP, HR, RR, and temperature on 33,798 MIMIC-III patients with 889 independent-hospital external cases; LSTM vs random forest and Cox baselines.

**Findings.** A small vital-sign set supports strong real-time mortality discrimination with an LSTM, substantially beating classical baselines.

**Limitations.** Different cohort and pipeline from SynCura, so the number is a reference ceiling rather than a head-to-head target.

**What SynCura used.** Core vital-sign input design; extended from vitals-only to 12 vitals + labs; added deployment, explainability, and NEWS2 comparison absent from the reference.

### 3.6 [6] Xie et al. (2025) - RealMIP data recovery

**Approach.** End-to-end generative framework (RealMIP) that imputes missing vitals/labs in real time while predicting mortality; trained on 188 eICU centres, validated on MIMIC-IV and SICdb.

**Findings.** Generative continuous recovery of missing clinical data plus mortality prediction transfers well across eICU, MIMIC-IV, and SICdb.

**Limitations.** Requires multi-database training and a heavier model than a student prototype can currently deploy and validate.

**What SynCura used.** Roadmap item: replace/augment interpolation with robust missing-data recovery; pair it with eICU/MIMIC external validation before any clinical claim.

### 3.7 [7] Choi et al. (2020) - Interpretable early warning

**Approach.** Deep Interpretable Early Warning System (DEWS): bidirectional LSTM with attention for hospital deterioration monitoring, benchmarked against NEWS2.

**Findings.** BiLSTM with attention provides an interpretable early-warning signal that can exceed a NEWS2-style baseline.

**Limitations.** Retrospective evaluation; limited false-alarm, calibration, and workflow analysis.

**What SynCura used.** Early-warning framing; explicit NEWS2 baseline with sensitivity, specificity, precision, false-alarm count, and lead-time estimate rather than AUC alone.

### 3.8 [8] Scheid et al. (2025) - Wearable continuous prediction

**Approach.** Clinical wearable deep-learning model for continuous in-hospital deterioration prediction from streaming vital signs across multiple hospitals.

**Findings.** Continuous wearable vital signs support early deterioration prediction with clinically useful lead time.

**Limitations.** Real sensors introduce noise, dropouts, irregular sampling, and integration problems that retrospective ICU tables hide.

**What SynCura used.** System architecture (sensor -> FastAPI/SQLite ingestion -> AttentionLSTM scoring -> dashboard/alerts, with HTTP and MQTT paths); retained an explicit prototype-only disclaimer because of these deployment gaps.

### 3.9 [9] PhysioNet Challenge 2012 - Dataset

**Approach.** Public challenge dataset: 4,000 ICU patients (age 16+), ~37 time-series variables over the first 48 ICU hours, binary in-hospital mortality labels.

**Findings.** Public, labelled, multivariate ICU time-series benchmark enabling reproducible mortality modelling.

**Limitations.** Old, US-only, retrospective, sparse, and biased relative to live Indian bedside data and modern devices.

**What SynCura used.** All model training and reporting: 12 selected features, interpolation, train-only z-score, patient-level split, past-only 90-minute windows, ensemble `s48+c93+s45` (validation AUC 0.840, fresh unseen 20% set-B holdout AUC 0.844).

## 4. Common Findings Across the Literature

1. Deterioration is temporal: direction, duration, and interaction of measurements matter more than isolated thresholds.
2. LSTMs remain strong clinical time-series baselines, including against newer sequence models.
3. Attention improves inspectability by highlighting influential time steps or features.
4. Reported performance depends heavily on dataset, labels, windows, imbalance handling, and splits.
5. External/unseen-patient validation and missing-data handling separate prototypes from deployable systems.
6. Discrimination without calibration, lead-time, false-alarm, and decision analysis is insufficient for bedside use.

## 5. Limitations Repeatedly Observed

- Retrospective, single-system data with missing, asynchronous, and biased measurements.
- Internal AUCs that fall on external hospitals, devices, or time periods.
- Hindsight bias when predictions near discharge use accumulated future context.
- AUC-only reporting without sensitivity, specificity, precision, false alarms, calibration, or lead time.
- Explanations treated as causal proof rather than model-behaviour summaries.
- No prospective trial, workflow integration, fairness/subgroup analysis, or privacy-preserving multi-hospital evaluation.

## 6. Research Gap Addressed by SynCura

Many studies optimise model AUC but do not demonstrate the full path from streaming-style input to a displayed risk score with temporal and feature explanations, served through an API and dashboard, with honest unseen-holdout evaluation.

SynCura addresses this narrower integration gap with:

1. Attention-based LSTM over rolling 90-minute windows of 12 clinical features.
2. 0-100 risk score with temporal attention and SHAP explanations.
3. FastAPI serving with HTTP/MQTT ingestion, SQLite storage, alerts, and dashboard.
4. NEWS2 comparison using sensitivity, specificity, precision, false alarms, and lead time.
5. Patient-level splits, train-only statistics, past-only windows, and a fresh unseen holdout.
6. Explicit prototype-only framing pending calibration, fairness, external, and prospective validation.

## 7. References

[1] Z. Zheng et al., Development and Validation of a Dynamic Real-Time Risk Prediction Model for ICU Patients Based on Longitudinal Irregular Data: Multicenter Retrospective Study, JMIR 27:e69293, 2025. https://doi.org/10.2196/69293

[2] Y. Wang, Y. Bai, and G. Jin, Explainable Deep-Learning Models for Predicting ICU Patient Outcome, Frontiers in Physiology 17, 2026.

[3] Z. Yan et al., Deep Learning-Based In-Hospital Mortality Prediction Using Long-Term Sequential Data in ICU Patients: Multi-Center Validation Study, PeerJ 14:e21631, 2026. https://doi.org/10.7717/peerj.21631

[4] B. Sadanandan, Multimodal Deep Learning for Early Prediction of Patient Deterioration in the ICU: Integrating Time-Series EHR Data with Clinical Notes, arXiv:2603.14719, 2026. https://arxiv.org/abs/2603.14719

[5] Y. Wu et al., Revisiting the Potential Value of Vital Signs in the Real-Time Prediction of Mortality Risk in ICU Patients, J. Big Data 11:40, 2024. https://doi.org/10.1186/s40537-024-00896-8

[6] P. Xie et al., Unlocking the Potential of Real-Time ICU Mortality Prediction: Redefining Risk Assessment with Continuous Data Recovery, npj Digital Medicine 8:733, 2025. https://doi.org/10.1038/s41746-025-02114-y

[7] E. Choi et al., Deep Interpretable Early Warning System for the Detection of Clinical Deterioration, IEEE J-BHI 24(9), 2020.

[8] M. R. Scheid et al., Development and Validation of a Clinical Wearable Deep Learning Based Continuous In-Hospital Deterioration Prediction Model, Nature Communications 16:9513, 2025.

[9] PhysioNet, Computing in Cardiology Challenge 2012, https://physionet.org/content/challenge-2012/

*Consistency check (2026-09-18): reference list matches `ppt/SynCura_Deck_V3_FINAL.pptx` Slide 15; SynCura results match `ppt/figs/metrics.json` (val AUC 0.840, holdout AUC 0.844, 95% CI 0.836-0.852); table covers all 9 deck sources with findings, limitations, and adoption notes.*
