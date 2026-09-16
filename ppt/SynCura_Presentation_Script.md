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

Our base paper is titled **Explainable Deep-Learning Models to Predict Diaphragmatic Dysfunction and Cognitive Stress in ICU Patients Under Mechanical Ventilation**.

The authors are Wang, Bai, and Jin. It was published in 2026 in *Frontiers in Physiology*, volume 17, article 1765898.

The study uses data from 25,751 mechanically ventilated ICU patients and compares LSTM, GRU, and RNN models using continuous physiological and ventilator time-series.

The main findings are that LSTM performs consistently well, with reported AUC values approximately between 0.79 and 0.87 across outcomes. The paper also emphasizes explainability for clinical trust.

An important limitation is that time-series signals are not equally strong for every clinical outcome. SynCura adapts the LSTM idea to PhysioNet 2012, adds temporal attention, and implements real-time inference and dashboard visualization.

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

## Slide 9: Technology / Tools Required

Python is used for the machine-learning pipeline and backend services. JavaScript is used for the frontend.

The main frameworks and tools are PyTorch, FastAPI, React, Vite, Tailwind CSS, SQLite, scikit-learn, and SHAP.

The main dataset is the PhysioNet 2012 Challenge dataset. REST APIs support ingestion and inference. An ESP32 with a MAX30105 sensor is an optional hardware extension for future live-vital capture.

## Slide 10: SDG Relevance

SynCura is related to SDG 3, Good Health and Well-Being. Earlier identification of ICU deterioration may support timely clinical review and better patient monitoring.

It is also related to SDG 9, Industry, Innovation and Infrastructure. The project applies explainable deep learning to a modern clinical monitoring workflow that combines machine learning, APIs, visualization, and sensor-ready architecture.

## Slide 11: References

This slide lists the base paper and the main supporting studies used in our work.

The references cover explainable LSTM models, attention-based ICU prediction, vital-sign modeling, multimodal learning, missing-data recovery, graph attention, wearable monitoring, and the PhysioNet dataset.

The complete literature survey is available in the accompanying literature review document. Before formal submission, we should verify the final DOI and bibliographic details against the publisher records.

## Slide 12: Thank You

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
