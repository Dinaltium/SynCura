# SynCura Presentation Script

## Suggested Duration

Approximately 8 to 10 minutes. Keep the problem and proposed solution clear, and spend extra time on the base paper and methodology.

## Slide 1: Title and Team Details

Good morning/afternoon everyone.

We are presenting our project, **SynCura: Predictive ICU Monitoring System Using Attention-Based LSTM with Real-Time Explainability**.

SynCura is a software-based predictive ICU monitoring prototype. It uses an attention-based LSTM to estimate deterioration risk from recent clinical measurements, provides explanations for the prediction, and displays the result through a dashboard.

Our team members are Abdul Ahad Ikkeri, Fathima Reeha, and Fizan Feroz. Their USNs are shown on the slide.

## Slide 2: Problem Statement

ICU patients can deteriorate rapidly, and early identification is important for timely clinical review.

Current scores such as NEWS2 and SOFA use thresholds and structured assessments. These tools are useful and clinically familiar, but they do not directly learn the complete temporal pattern of changing patient observations.

A single reading may not show whether a patient is improving, remaining stable, or gradually deteriorating. Our problem is to build an early-warning aid that analyzes recent patient history and produces an understandable risk estimate.

SynCura is a research prototype. It is not intended to replace clinicians or make autonomous medical decisions.

## Slide 3: Motivation / Need for the Project

We selected this problem because deterioration is often a process rather than a single event. Continuous ICU data contains trends and interactions that may be difficult to summarize manually.

Earlier warning can provide more time for clinicians to review the patient and decide on an intervention.

Explainability is also important. A risk score alone is not sufficient; users should be able to inspect which recent time steps and which features influenced the prediction.

Therefore, SynCura combines temporal modeling, real-time inference, a dashboard, and explanations in one workflow.

## Slide 4: Existing System / Related Work

In current practice, NEWS2 and SOFA provide structured, interpretable scoring based on clinical thresholds. Their main advantage is simplicity, but they do not learn temporal patterns in the same way as a sequence model.

Recent research explores LSTM, attention, transformer, multimodal, wearable, and graph-based approaches for ICU prediction.

The reported performance varies considerably because studies use different datasets, labels, sampling strategies, missing-data methods, and evaluation splits.

From this review, we identify a practical gap: many studies focus on model performance, while SynCura focuses on connecting temporal prediction, real-time serving, dashboard visualization, and explanation.

## Slide 5: Base Paper / Reference Paper

Our base paper is titled **Development and Validation of a Dynamic Real-Time Risk Prediction Model for ICU Patients Based on Longitudinal Irregular Data: Multicenter Retrospective Study**.

The authors are Zheng, Luo, Zhu, Du, Lan, Zhou, Yang, and Huang. It was published in 2025 in the *Journal of Medical Internet Research*, volume 27, article e69293.

The study uses 176,344 ICU stays from MIMIC-IV and eICU-CRD. It models irregular longitudinal electronic medical record data, including vital signs, laboratory values, and medications, with hourly risk updates.

The proposed time-aware bidirectional attention LSTM, or TBAL, achieves a dynamic AUROC of 0.936 on MIMIC-IV and 0.919 on the external eICU data, with reported recall of 79.1%.

SynCura adapts this attention-LSTM direction to PhysioNet 2012 using a focused 12-feature, 90-minute window. We also add SHAP feature-level explanations alongside temporal attention weights.

One caveat we state openly: the base paper is retrospective till discharge. Its AUROC rises to 98.9 at discharge because all information has accumulated — that is hindsight, not early warning — and cross-hospital transfer falls to 0.81 and 0.76 with no prospective test. SynCura therefore uses only the last 90 minutes with no future or discharge information.

## Slide 6: Proposed Solution

Our proposed solution is SynCura, an attention-based LSTM that reads a rolling 90-minute window of 12 clinical features.

The features include heart rate, respiratory rate, temperature, systolic and diastolic blood pressure, oxygen saturation, GCS, BUN, creatinine, WBC, platelets, and glucose.

The system returns a risk score from 0 to 100. It also provides two types of explanations: temporal attention identifies influential time steps, and SHAP identifies influential features.

Compared with the base paper, our main difference is the combination of temporal attention, real-time FastAPI serving, React visualization, and an explainability-focused dashboard.

## Slide 7: Methodology / Proposed Approach

First, we use the PhysioNet 2012 Challenge dataset and select 12 clinical features.

Next, measurements are interpolated and prepared as regular sequences. We use a 90-minute window with a 15-minute stride. Population normalization statistics are calculated from the training data only to avoid data leakage.

The model is a two-layer LSTM with hidden size 96, dropout, batch normalization, and additive temporal attention. The model produces a risk probability, which is displayed as a score from 0 to 100.

The FastAPI backend accepts data and performs inference. The React dashboard displays risk and trends. SHAP and attention weights provide feature-level and time-step-level explanations.

## Slide 8: Expected Outcome

The expected outcome is a working real-time ICU dashboard that displays patient deterioration risk from recent clinical measurements.

The system should provide a 0-to-100 risk score, explanations for the score, and a workflow for viewing patient trends.

For evaluation, we target an AUC-ROC in a realistic range for a single-dataset vitals-plus-labs system. We also aim to investigate earlier warning compared with a NEWS2 baseline, but this must be measured properly rather than assumed.

The final objective is to demonstrate a feasible and explainable research prototype, not to claim clinical deployment readiness.

## Slide 9: Why SynCura Goes Beyond the Literature

Comparing SynCura with the reviewed studies, we can summarize where the system is stronger today.

First, most papers stop at a discrimination metric. They report an AUC value but do not evaluate false alarms, calibration, or early-warning lead time. SynCura already provides sensitivity, specificity, precision, a false-alarm counter, and an average lead-time estimate, alongside an inline comparison against the NEWS2 baseline.

Second, SynCura reports performance on a completely unseen set-B holdout of 4,000 never-touched patients. The holdout AUC of 0.844 exceeds the validation AUC of 0.840, which suggests the result is not an artifact of overfitting to the validation split.

Third, we offer dual explainability. The base paper uses attention with Integrated Gradients. SynCura provides temporal attention to show which time steps mattered and SHAP to show which features mattered, both inspectable per patient on the dashboard.

Fourth, SynCura is a deployed path, not a notebook model. Threshold tuning, real-time alerts, Discord and Telegram notifications, HTTP and MQTT ingestion, and thread-safe streaming inference are implemented end to end.

## Slide 10: How It Could Be Better with Enough Time

This slide is our paper-versus-real-world argument, and it is also how SynCura becomes a better paper.

First, paper numbers versus reality. The base paper reports 0.936 overall and 98.9 at discharge, but that peak uses all information till discharge — hindsight. On cross-hospital transfer it falls to 0.81 and 0.76, with no prospective bedside test.

Second, the real world is messier: US-only retrospective data, missing and asynchronous vitals, age bias with worse performance above 65, and single-center MIMIC data.

Third, SynCura is deliberately stricter: a 90-minute window only, no future or discharge info, and an unseen 4,000-patient set-B holdout where 0.844 beats the 0.840 validation — our honest number.

Fourth, we report what papers skip: false alarms, precision and sensitivity, lead time versus NEWS2, and calibration — the metrics a clinician actually needs.

Finally, the better-paper path is already scouted: external eICU and MIMIC validation, RealMIP-style missing-data recovery, time-aware attention for irregular intervals, and a prospective pilot with decision-curve analysis — the gap no reviewed paper closes.

## Slide 11: Technology / Tools Required

Python is used for the machine-learning pipeline and backend services. JavaScript is used for the frontend.

The main frameworks and tools are PyTorch, FastAPI, React, Vite, Tailwind CSS, SQLite, scikit-learn, and SHAP.

The main dataset is the PhysioNet 2012 Challenge dataset. REST APIs support ingestion and inference. An ESP32 with a MAX30105 sensor is an optional hardware extension for future live-vital capture.

## Slide 12: SDG Relevance

SynCura is related to SDG 3, Good Health and Well-Being. Earlier identification of ICU deterioration may support timely clinical review and better patient monitoring.

It is also related to SDG 9, Industry, Innovation and Infrastructure. The project applies explainable deep learning to a modern clinical monitoring workflow that combines machine learning, APIs, visualization, and sensor-ready architecture.

## Slide 13: References

This slide lists the base paper and the main supporting studies used in our work.

The references cover explainable LSTM models, attention-based ICU prediction, vital-sign modeling, multimodal learning, missing-data recovery, graph attention, wearable monitoring, and the PhysioNet dataset.

The complete literature survey is available in the accompanying literature review document. Before formal submission, we should verify the final DOI and bibliographic details against the publisher records.

## Slide 14: Thank You

Thank you for listening to our presentation.

SynCura is an explainable research prototype for early ICU deterioration-risk monitoring. We welcome your questions and suggestions.

## Common Questions and Answers

### Why did you choose an LSTM?

An LSTM is designed for sequential data and can learn relationships across time. ICU measurements are time-series data, so an LSTM is an appropriate and understandable baseline.

### Why did you add attention?

Attention helps the model assign importance to different time steps. This provides a temporal explanation of which parts of the recent patient trajectory influenced the risk estimate.

### Is this system clinically deployable?

No. It is a research prototype. It would require calibration, clinical review, prospective testing, external validation, privacy controls, safety analysis, and regulatory consideration before deployment.

### Why use PhysioNet 2012?

It is a public and established ICU time-series dataset that supports reproducible experimentation. Its age and limited representation of modern hospitals are acknowledged limitations.

### What is the novelty of SynCura?

The novelty is the integration of temporal attention, real-time API serving, dashboard visualization, and dual explainability in one practical prototype. It is an engineering and integration contribution, not a claim that the LSTM architecture itself is new.

### What is the main limitation?

The main limitations are the single public dataset, missing and irregular measurements, limited external validation, and the absence of prospective clinical testing.

### How does SynCura compare with the reviewed papers?

It is stronger on the deployment side. Papers optimize a metric, while SynCura optimizes the path from data to decision: we report false alarms, sensitivity, specificity, precision, and lead time, compare against the NEWS2 baseline, and evaluate on an unseen set-B holdout whose AUC of 0.844 exceeds the validation AUC.

### What would make SynCura better with more time?

External multi-center validation, generative missing-data recovery, irregular-time awareness, multimodal clinical notes, graph attention, and prospective testing. Each is documented in the literature review as a concrete, already-scouted next step.
