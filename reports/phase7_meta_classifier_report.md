# Phase 7: Multi-Model Ensemble Training (The Meta-Classifier)

## Executive Summary
Phase 7 implements the **Meta-Classifier** that serves as the ultimate adjudicator in the UK Company Entity Resolution pipeline. By combining deep learning semantic scores from the fine-tuned Cross-Encoder with deterministic character-level distance metrics and explicit missing-value indicators, this tree-based ensemble makes missing-value-aware decisions and captures edge cases with high precision.

---

## Architecture & Sparsity-Aware Split Finding

```
                        ┌──────────────────────────────────────────────┐
                        │              FAISS Candidate Pair            │
                        └──────────────────────┬───────────────────────┘
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
     ┌───────────────────────────────────┐           ┌───────────────────────────────────┐
     │  Fine-Tuned Cross-Encoder Model   │           │   Deterministic Feature Engine    │
     │      (Deep Semantic Scorer)       │           │  (Jaro-Winkler, Levenshtein, etc) │
     └─────────────────┬─────────────────┘           └─────────────────┬─────────────────┘
                       │ Cross-Encoder Score: [0, 1]                   │ Character Metrics & Null Flags
                       └───────────────────────┬───────────────────────┘
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │      Missing-Value Sparsity Formatter        │
                        │    (address/town/zip NaN on empty fields)    │
                        └──────────────────────┬───────────────────────┘
                                               │
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │      LightGBM / XGBoost Meta-Classifier      │
                        │     (Sparsity-Aware Split Finding Trees)     │
                        └──────────────────────┬───────────────────────┘
                                               ▼
                                   Calibrated Probability
                             [Verified Match (>= 0.490) / No Match]
```

### Sparsity-Aware Split Finding
When companies in the registry lack street addresses, towns, or postcodes, forcing similarity metrics to `0.0` penalizes the match as if conflicting text were present. 
The Meta-Classifier treats unobserved fields as `NaN` (sparsity) and explicitly incorporates boolean missing indicators (`is_address_missing_a`, `is_address_missing_b`, etc.). Decision trees natively learn the optimal branch direction when data is absent.

---

## Quantitative Evaluation on Held-Out Test Set (1,469 pairs)

| Metric | Value | Interpretation |
| :--- | :---: | :--- |
| **Accuracy** | **99.25%** | High overall fidelity across balanced test pairs |
| **Precision** | **99.45%** | Minimal false positives (critical for legal/credit entity matching) |
| **Recall** | **99.05%** | Captures 99%+ of true entity variations and typos |
| **F1-Score** | **0.9925** | Harmonized precision-recall balance |
| **ROC-AUC** | **0.9997** | High discriminative power across all thresholds |
| **PR-AUC** | **0.9997** | High area under the precision-recall curve |
| **Brier Score** | **0.0061** | Low probability calibration error |
| **Optimal Threshold** | **0.490** | Empirically derived decision threshold |

### Test Set Confusion Matrix
- **True Negatives (TN)**: 731
- **False Positives (FP)**: 4
- **False Negatives (FN)**: 7
- **True Positives (TP)**: 727

---

## Feature Importance Ranking (Information Gain Contribution)

| Rank | Feature | Gain Share (%) | Signal Type |
| :---: | :--- | :---: | :--- |
| **#1** | `cross_encoder_score` | **73.31%** | Deep Learning Semantic Score |
| **#2** | `name_jaro_winkler` | **17.10%** | Mathematical Prefix-Weighted Similarity |
| **#3** | `address_jaro_sparsity` | **4.32%** | Sparsity-Aware Street Address Alignment |
| **#4** | `name_levenshtein_norm` | **1.75%** | Normalized Edit Distance (Typo Recovery) |
| **#5** | `address_jaro` | **1.22%** | Address Similarity |
| **#6** | `postcode_jaro_sparsity`| **0.97%** | Sparsity-Aware PostCode Alignment |
| **#7** | `postcode_jaro` | **0.70%** | PostCode Fuzzy Alignment |
| **#8** | `is_address_missing_b` | **0.30%** | Missing Registry Field Flag |

---

## Verification of Meta-Decision Scenarios

### 1. Missing Address Boost (Core Requirement)
- **Condition**: `cross_encoder_score = 0.75` (slightly depressed due to absent address), `name_jaro_winkler = 0.98`, `is_address_missing_a = 1`, `address_jaro = NaN`.
- **Result**: **Match Probability = 97.11%** (Boosted). The meta-classifier recognizes that the lower Cross-Encoder score is attributable to missing data rather than conflicting data, preventing false rejections.

### 2. Single-Character Typo Recovery
- **Condition**: 1-character typo in company name (e.g. `Barclays` vs `Barckays`), `name_jaro_winkler = 0.96`, `name_levenshtein_norm = 0.88`, `postcode_exact = 1`.
- **Result**: **Match Probability = 99.06%** (Recovered).

### 3. Hard Negative Rejection
- **Condition**: High token overlap in common terms, but distinct registered companies; `cross_encoder_score = 0.08`, `name_jaro_winkler = 0.58`.
- **Result**: **Match Probability = 0.01%** (Safely Rejected).
