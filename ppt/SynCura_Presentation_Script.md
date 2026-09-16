# SynCura Presentation Script

## Suggested Duration

Approximately 8 to 10 minutes. Spend the most time on the methodology and experimental results.

## Slide 1: Title

Good morning/afternoon everyone.

We are presenting our project, **SynCura: Predictive ICU Monitoring System Using Attention-Based LSTM with Real-Time Explainability**.

SynCura is a software prototype designed to identify the risk of patient deterioration in an intensive care unit. The project combines machine learning, a backend inference service, a web dashboard, and explainability methods.

The team members are Abdul Ahad Ikkeri, Fathima Reeha, and Fizan Feroz. In this presentation, we will explain the problem, the proposed approach, the system architecture, our results, and the future scope.

## Slide 2: Abstract

The main objective of SynCura is to provide an early warning of ICU deterioration by analyzing recent patient measurements rather than looking at only one reading.

Our system uses an attention-based LSTM model. It processes 12 clinical features from the PhysioNet 2012 Challenge using 90-minute sliding windows.

The machine learning model is implemented using PyTorch. A FastAPI backend provides real-time inference, and a React dashboard displays patient risk and explanations. SHAP is used for feature-level importance, while temporal attention shows which recent time steps influenced the prediction.

In the current experiment, the model achieved an AUC of 0.807 on validation data and 0.765 on an unseen set-B holdout. These results demonstrate the feasibility of the prototype, but they do not represent clinical deployment readiness.

## Slide 3: Introduction

ICU patients can deteriorate quickly, so detecting risk early is important for timely clinical intervention.

Existing scores such as NEWS2 and SOFA are useful clinical tools, but they are mainly rule-based and threshold-driven. They summarize the patient's condition at an assessment point and do not directly learn the full temporal pattern of changing observations.

SynCura addresses this limitation by using a temporal deep-learning model. Instead of considering only the latest value, it analyzes a recent sequence of measurements.

It is important to clarify that SynCura is an explainable monitoring prototype. It is not intended to replace clinicians or make autonomous clinical decisions.

## Slide 4: Literature Survey

We reviewed research covering explainable LSTM models, attention mechanisms, ICU mortality prediction, wearable monitoring, and graph-based approaches.

The base paper by Wang, Bai, and Jin uses explainable LSTM models on continuous ICU time-series data and reports AUC values from 0.79 to 0.87 across multiple outcomes.

Yan and colleagues show that a plain LSTM can perform competitively on long-term ICU sequential data. Wu and colleagues provide a strong reference for vital-sign-based mortality prediction using an LSTM.

Nguyen and colleagues are particularly relevant because their work establishes the connection between attention mechanisms and ICU risk prediction on PhysioNet data.

Other studies explore multimodal learning, data recovery, wearable monitoring, graph attention, and interpretable early-warning systems.

The gap identified from this review is the need for a practical system that combines temporal modeling, explanations, real-time inference, and a usable dashboard in one prototype.

## Slide 5: Problem Statement

The problem is that ICU deterioration is difficult to identify early from isolated measurements and manual calculations.

A single value may not be dangerous by itself, but its direction, duration, and relationship with other measurements may indicate deterioration. Rule-based scores do not always capture these patterns.

Clinicians therefore need an early-warning aid that can process recent patient history and explain the reasons behind its risk estimate.

Our specific problem is to build and evaluate a real-time, explainable prototype using clinical time-series data, while clearly recognizing that further clinical validation is required before real-world use.

## Slide 6: Proposed Methodology

The dataset used is the PhysioNet 2012 Challenge dataset. We use 12 features: heart rate, respiratory rate, temperature, systolic blood pressure, diastolic blood pressure, oxygen saturation, GCS, BUN, creatinine, WBC, platelets, and glucose.

The data is interpolated to create a regular time sequence. We use train-only population statistics for Z-score normalization so that information from the validation set does not leak into training.

The model reads 90-minute windows with a 15-minute stride. It contains a two-layer LSTM with hidden size 96. An additive temporal attention layer assigns importance to different time steps. Dropout and batch normalization improve regularization and training stability.

The model output is converted into a risk score from 0 to 100. The FastAPI backend performs inference, while the React dashboard displays risk, trends, and explanations. SHAP provides feature-level importance, and attention provides time-step-level importance.

## Slide 7: Experimental Result

On the validation set, the model achieved an AUC-ROC of 0.8072, accuracy of 0.7450, precision of 0.3535, and recall of 0.7413.

We also evaluated the model on an unseen set-B holdout. It achieved an AUC-ROC of 0.7651, accuracy of 0.7463, and recall of 0.6692.

The holdout result is lower than the validation result, which is expected when testing on unseen data. It still indicates some generalization, but it also shows that the model is not ready for clinical deployment.

The next evaluation steps should include calibration, threshold analysis, measurement of warning lead time, comparison with NEWS2, subgroup analysis, and prospective validation.

## Slide 8: Conclusion

To conclude, SynCura demonstrates an end-to-end workflow for ICU deterioration-risk monitoring.

The system connects clinical time-series data, an attention-based LSTM, a FastAPI inference backend, a React dashboard, and explainability methods.

Temporal attention helps identify which recent time steps contributed to the prediction, while SHAP helps identify which features influenced the risk score.

The current experiment achieved 0.807 validation AUC and 0.765 set-B holdout AUC. These results support the prototype concept, but more validation is necessary before the system can be considered for actual clinical use.

## Slide 9: Future Scope

The first area of future work is evaluation. We need calibration studies, decision-curve analysis, prospective testing, and comparison with established clinical scores.

The second area is robustness. The system should be tested across hospitals, patient subgroups, different missing-data patterns, and changing sensor quality.

The third area is model improvement. Transformer-based and graph-based temporal models can be compared with the current attention-LSTM approach.

The system can also be extended to multimodal data, including clinical notes, and eventually explore privacy-preserving or edge-assisted deployment. These extensions should only be pursued alongside appropriate clinical and safety validation.

## Slide 10: Technology and SDG Relevance

The machine-learning and backend components use Python, PyTorch, FastAPI, SQLite, scikit-learn, and SHAP.

The frontend is built with React, Vite, and Tailwind CSS. PhysioNet 2012 is used as the research dataset.

The project relates to SDG 3, Good Health and Well-Being, because earlier identification of deterioration may support better patient monitoring.

It also relates to SDG 9, Industry, Innovation and Infrastructure, because it applies explainable artificial intelligence to a modern clinical monitoring workflow.

## Slide 11: References

This slide lists the main papers and dataset reference used in our work.

The Wang, Bai, and Jin paper is the main architectural reference for the explainable LSTM direction. The other papers support our choices related to attention, ICU risk prediction, missing-data handling, wearable monitoring, graph models, and clinical early-warning systems.

The PhysioNet 2012 Challenge is the source of the clinical time-series data used for training and evaluation.

## Slide 12: Thank You

Thank you for listening to our presentation.

SynCura is intended as an explainable research prototype for early ICU risk monitoring. We welcome your questions and suggestions.

## Common Questions and Answers

### Why did you choose an LSTM?

An LSTM is designed for sequential data and can learn relationships across time. ICU measurements are time-series data, so an LSTM is a suitable baseline. We added attention to identify the time steps that influenced the prediction.

### Why is explainability important here?

Healthcare users need more than a risk number. Attention weights can show important time steps, and SHAP can show important features. These explanations can support analysis and user trust, although they should not be treated as proof of causation.

### Why is the holdout AUC lower than the validation AUC?

The validation data is used during model development, while set-B is unseen holdout data. A lower holdout score can reveal distribution differences and possible overfitting. This is why external validation is important.

### Is this system clinically deployable now?

No. It is a research prototype. It requires calibration, clinical review, prospective testing, safety analysis, privacy controls, and external validation before any clinical deployment.

### Why use PhysioNet 2012?

It is a public and established ICU time-series dataset with mortality outcomes. It allows reproducible experimentation, although it is older and does not represent every modern hospital or patient population.

### What is the main limitation?

The main limitations are the use of a single public dataset, irregular and missing measurements, limited external validation, and the absence of prospective clinical testing.
