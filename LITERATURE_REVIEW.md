# SynCura — Literature Review

This review positions SynCura relative to one adapted base paper and eight supporting works spanning model architecture, realistic performance targets, hardware/systems design, and handling of real-world data issues (missingness, multimodality, external validation).

---

## 1. Base Paper

**Wang, Y., Bai, Y., & Jin, G. (2026).** Explainable Deep-Learning Models to Predict Diaphragmatic Dysfunction and Cognitive Stress in ICU Patients Under Mechanical Ventilation. *Frontiers in Physiology*, 17, 1765898. https://doi.org/10.3389/fphys.2026.1765898

Wang et al. train LSTM, GRU, and RNN models on continuous clinical time-series (vital signs and ventilator parameters) from 25,751 mechanically ventilated ICU patients across multiple centers, comparing performance on three outcomes. Their LSTM consistently outperforms the baseline RNN and is the paper's headline architecture:

| Outcome | AUC | AUPRC / Sensitivity |
|---|---|---|
| Diaphragmatic dysfunction | 0.845 | AUPRC 0.594 |
| Composite adverse outcome | 0.868 | Sensitivity 81.5% |
| High cognitive stress / delirium | 0.792 (vs. 0.715 RNN) | — |

**Why this is SynCura's base paper:** it is the closest architectural match in this review — an explainable LSTM trained on continuous, longitudinal physiologic time-series, evaluated with AUC/AUPRC, exactly the setup SynCura's `AttentionLSTM` targets. Its 0.79–0.87 AUC range is a realistic, in-reach adaptation target rather than an unreachable ceiling, since their inputs (vitals + ventilator parameters) are only modestly richer than SynCura's six vitals. The paper also explicitly names a limitation directly relevant to SynCura's own scope: **time-series signals alone did not adequately capture the weakest outcome (cognitive stress)**, motivating future multimodal fusion rather than presenting it as solved — an honest limitation SynCura should carry over rather than overclaim past.

**Adaptation plan:** mirror their LSTM-centric, explainability-first design, but substitute PhysioNet 2012 for their ventilator-cohort data and add temporal attention (their comparison is limited to RNN/GRU/LSTM, with no attention variant).

---

## 2. Supporting Papers

### 2.1 Model architecture & realistic performance targets

**[S1] Yan, Z., Wang, X., Xu, X., Guo, Y., Chang, W., & He, J. (2026).** Deep learning-based in-hospital mortality prediction using long-term sequential data in ICU patients: a multi-center validation study. *PeerJ*, 14, e21631. https://doi.org/10.7717/peerj.21631

Compares five architectures (LSTM, GRU, RNN, Transformer, Informer) plus a stacked ensemble on ICD-sequence and temporal clinical data, with multi-center external validation — a methodological bar SynCura currently lacks (PhysioNet-only, single dataset). Their **plain LSTM is the best single architecture, AUC 0.802 (95% CI 0.774–0.828)**, beating Transformer, GRU, RNN, and Informer. This is a concrete, realistic performance target for SynCura once its current pipeline issues (class imbalance, dataset-scale) are resolved.

**[S2] Sadanandan, B. (2026).** Multimodal Deep Learning for Early Prediction of Patient Deterioration in the ICU: Integrating Time-Series EHR Data with Clinical Notes. arXiv:2603.14719.

Combines a bidirectional LSTM (physiologic time-series) with ClinicalBERT (clinical notes) via cross-modal attention on 74,822 MIMIC-IV ICU stays (5.7M hourly samples), achieving **AUROC 0.7857, AUPRC 0.1908**. Also contributes a systematic review of 31 ICU deterioration studies (2015–2024), finding that **structured-data-only models typically achieve AUC 0.70–0.85** — this range is the field's realistic expectation for a vitals-only system like SynCura, and a useful citation to justify SynCura's performance targets without overclaiming.

**[S3] Wu, Y. et al. (2024).** Revisiting the potential value of vital signs in the real-time prediction of mortality risk in intensive care unit patients. *Journal of Big Data*, 11, 40. https://doi.org/10.1186/s40537-024-00896-8

The closest input-scope match to SynCura: systolic/diastolic BP, heart rate, respiratory rate, and body temperature — the same core vitals SynCura tracks — used for real-time, short-window mortality prediction on 33,798 MIMIC-III patients, externally validated on 889 independent-hospital patients. Their **plain LSTM baseline achieves AUC 0.9263**, well above their random forest (0.744) and badly miscalibrated Cox regression (0.245) baselines. This is SynCura's clearest upper-bound reference for a vitals-only real-time system, though not itself a 2026 paper.

**[S4] Nguyen, et al.** Deep Learning to Attend to Risk in ICU. arXiv:1707.05010.

The architectural ancestor of SynCura's approach: an LSTM with signal-level and temporal-level attention, evaluated on PhysioNet 2012 for ICU mortality prediction — the same dataset and task SynCura uses. Included for lineage and to justify the attention-LSTM design choice at its root.

### 2.2 Handling real-world data issues (missingness, multimodality, external validation)

**[S5] Xie, P. et al. (2025).** Unlocking the potential of real-time ICU mortality prediction: redefining risk assessment with continuous data recovery ("RealMIP"). *npj Digital Medicine*, 8, 733. https://doi.org/10.1038/s41746-025-02114-y

An end-to-end framework using generative modeling to impute missing vitals/labs in real time, trained on 188 eICU centers and externally validated on MIMIC-IV and SICdb, achieving **AUC 0.957–0.968** across databases. Cited here as (a) a strong reference for principled missing-data handling — more sophisticated than SynCura's current decay-based imputation — and (b) an honest example of what is *not* achievable with a single-dataset, vitals-only system: its ceiling comes from richer, multi-database training that SynCura does not currently have.

### 2.3 Hardware & systems design justification

**[S6] Mila, S. A., & Ray, S. (2025).** IoT for Continuous Physiological Parameters Monitoring in Healthcare: A Review. *IEEE Sensors Journal*, 25(18), 34311–34326. https://doi.org/10.1109/JSEN.2025.3597861

A systems-level review covering wearable sensor taxonomy, communication protocols (BLE/ZigBee/Wi-Fi/6LoWPAN), and edge-vs-cloud computing trade-offs for continuous health monitoring. Justifies SynCura's architecture choice: local sensing (ESP32 + MAX30105) paired with centralized inference (FastAPI backend), consistent with the review's finding that DL models are better suited to centralized rather than edge deployment.

**[S7] Mila, S. A., Yedla Ravi, B. B., Kabir, M. R., & Ray, S. (2025).** MASC: Wearable Design for Infectious Disease Detection Through Machine Learning. *IEEE Access*, 13, 24108–24123.

A working wearable-to-ML prototype (body temperature, heart rate, respiratory rate, SpO2) with explicit noise-injection robustness testing and handling of non-uniform sampling intervals — directly parallel to SynCura's ESP32/MAX30105 firmware and the irregular-sampling problem in real sensor data, as opposed to the clean retrospective PhysioNet data SynCura's model is currently trained on.

### 2.4 Alternative architectural approach (contrast)

**[S8] Do, T.-C., Yang, H.-J., Lee, G.-S., Kim, S.-H., & Kho, B.-G. (2023).** Rapid Response System Based on Graph Attention Network for Predicting In-Hospital Clinical Deterioration. *IEEE Access*, 11, 29091–29100. https://doi.org/10.1109/ACCESS.2023.3257406

Uses graph attention networks rather than temporal attention to model inter-variable relationships for deterioration prediction. Included as a deliberate architectural contrast: SynCura adopts temporal (sequence) attention over graph-based (inter-variable) attention, prioritizing streaming/real-time simplicity over explicit variable-relationship modeling. Discussed as a candidate future extension rather than the chosen approach.

---

## 3. Summary Table

| # | Paper | Year | Role in SynCura's review | Key number |
|---|---|---|---|---|
| Base | Wang, Bai & Jin | 2026 | Architecture to adapt | AUC 0.79–0.87 |
| S1 | Yan et al. | 2026 | Realistic LSTM target | AUC 0.802 |
| S2 | Sadanandan | 2026 | Field benchmark + multimodal (notes) | AUC 0.786; field range 0.70–0.85 |
| S3 | Wu et al. | 2024 | Vitals-only upper bound | AUC 0.926 |
| S4 | Nguyen et al. | 2017 | Architectural lineage | PhysioNet 2012, attention-LSTM |
| S5 | Xie et al. (RealMIP) | 2025 | Missing-data handling, honest ceiling | AUC 0.93–0.97 (multi-DB) |
| S6 | Mila & Ray | 2025 | Systems/hardware justification | — |
| S7 | Mila et al. (MASC) | 2025 | Wearable prototype parallel | — |
| S8 | Do et al. | 2023 | Alternative architecture (graph attention) | — |

---

## 4. How SynCura Positions Itself

SynCura targets **real-time, streaming deterioration risk scoring from six continuously monitored vitals**, a deliberately narrower and lower-latency scope than most papers reviewed here, which rely on richer EHR/ICD/lab/imaging inputs (S1, S2, S5) or retrospective multi-day windows. Within this narrower scope, the realistic, defensible performance target — based on S1, S2, and S3 — is an **AUC in the 0.78–0.93 range**, not the 0.93–0.97 range achieved by multi-database, richer-input systems like RealMIP (S5). SynCura's current model (AUC 0.601) falls well short of even the low end of this range, indicating a pipeline issue (class imbalance, insufficient training data) to resolve before further architectural work, rather than a fundamental scope limitation.
