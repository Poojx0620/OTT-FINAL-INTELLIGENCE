# OTT Audience Intelligence — Project Report

## 1. Problem

OTT streaming platforms collect extensive viewer behavior data but lack automated tools to translate this data into meaningful audience segments and personalized recommendations. The challenge is to build an end-to-end pipeline that takes raw viewer data, discovers segments using unsupervised ML (not manually assigned labels), explains segment membership transparently, and delivers personalized recommendations through a REST API — all containerized and reproducible.

## 2. Dataset

A sample dataset of 100 OTT viewers (`data/users.csv`) with the following columns:

| Column | Type | Range |
|--------|------|-------|
| user_id | string | U001–U100 |
| watch_time_hours | float | 5–55 |
| avg_session_mins | float | 8–45 |
| session_frequency | int | 2–16 |
| completion_rate | float | 0.42–0.92 |
| top_genres | pipe-separated | Action, Sci-Fi, Thriller, Comedy, Drama, Romance, Adventure |
| genre_diversity | float | 0.15–0.48 |
| activity_level | string | low, medium, high |

The dataset is designed with three natural behavioral groups (high/medium/low engagement) to produce meaningful clusters. The pipeline is ready to accept a larger supplied dataset without modification.

## 3. Preprocessing

1. **Duplicate removal** — Rows with duplicate `user_id` are dropped (keep first)
2. **Missing value handling** — Rows with null values in key numeric columns are removed
3. **Invalid value filtering** — Negative watch time, negative session duration, completion rate outside [0,1] are removed
4. **Unknown category detection** — Genres not in the valid set are counted and reported
5. **Genre parsing** — Pipe-separated genre strings are split into lists
6. **Genre diversity computation** — If not present, derived as `min(unique_genres / 7, 1.0)`

Data quality metrics (total rows, duplicates, missing, invalid, unknown, clean rows, rows removed) are reported and persisted.

## 4. Feature Engineering

Five behavioral features are extracted:

| Feature | Source | Description |
|---------|--------|-------------|
| watch_time_hours | Direct | Total viewing hours — engagement volume |
| avg_session_mins | Direct | Average session length — session depth |
| session_frequency | Direct | Sessions per week — viewing regularity |
| completion_rate | Direct | Content completion fraction — satisfaction |
| genre_diversity | Computed | Genre spread — exploration tendency |

## 5. Feature Rationale

- **watch_time_hours**: The strongest indicator of overall engagement. Viewers with high watch time are consistently grouped together by KMeans.
- **avg_session_mins**: Distinguishes deep binge-watchers from quick browsers. A viewer who watches 50 hours in 5-minute sessions behaves differently from one who watches 20 hours in 45-minute sessions.
- **session_frequency**: Captures viewing regularity. High frequency + high watch time = highly engaged; low frequency + low watch time = occasional.
- **completion_rate**: Indicates content satisfaction. Low completion despite high watch time suggests exploration or dissatisfaction.
- **genre_diversity**: Captures whether a viewer explores broadly or sticks to preferred genres. This feature helps separate "Genre Explorers" from focused viewers.

All features are standardized using StandardScaler before clustering to ensure equal weighting.

## 6. Model

**Algorithm**: KMeans clustering with KMeans++ initialization

**Preprocessing**: StandardScaler (zero mean, unit variance per feature)

**Why KMeans**: Lightweight, interpretable, produces spherical clusters that map well to behavioral segments. Centroids provide natural "average profile" references for segment explanation.

## 7. Hyperparameters

| Parameter | Value | Rationale |
|-----------|-------|----------|
| random_state | 42 | Deterministic reproducibility |
| n_init | 10 | Multiple initializations for stability |
| max_iter | 300 | Sufficient convergence for 100 samples |
| init | k-means++ | Better initial centroid spread |

## 8. K Selection

K is selected by comparing silhouette scores across K=2..6:

| K | Inertia | Silhouette |
|---|---------|-----------|
| 2 | (computed) | (computed) |
| 3 | (computed) | (computed) |
| 4 | (computed) | (computed) |
| 5 | (computed) | (computed) |
| 6 | (computed) | (computed) |

The K with the highest silhouette score is selected automatically. Inertia (elbow method) is also reported for manual inspection. The selection is data-driven, not hard-coded.

## 9. Cluster Profiles

Cluster profiles are computed as the mean of each feature within each cluster. These profiles drive segment naming and description generation. The system reports:

- Number of viewers per cluster
- Average watch time, session duration, frequency, completion rate
- Dominant genres (top 3 by frequency)
- Behavioral traits (above/below average for each feature vs. global mean)

## 10. Segment Naming

Segment names are derived deterministically from cluster statistics:

| Condition | Name |
|-----------|------|
| watch_time > 1.3× global avg AND frequency > 1.3× global avg | Highly Engaged Viewers |
| watch_time < 0.6× global avg AND frequency < 0.6× global avg | Occasional Viewers |
| diversity > 1.2× global avg AND completion < 0.75 | Genre Explorers |
| Default | Casual Viewers |

Descriptions are generated from actual cluster averages using format strings.

## 11. API

**FastAPI** backend with two endpoints:

- `GET /health` — Returns status and model_loaded flag
- `POST /recommend` — Validates input, transforms via StandardScaler, predicts cluster, calculates distance to centroid, generates recommendations, returns JSON

The API loads the persisted model at startup and never retrains during inference. If the model is unavailable, it returns a 503 error with a user-friendly message.

**Input validation** (Pydantic):
- user_id: required, non-empty string
- watch_time_hours: required, >= 0
- avg_session_mins: required, >= 0
- session_frequency: required, >= 0
- completion_rate: required, 0–1
- top_genres: list of strings (can be empty)

## 12. Docker Architecture

```
docker-compose.yml
├── trainer (builds model → /models volume)
├── api (loads model from /models volume, serves :8000)
├── evaluator (waits for API health, writes metrics.json)
└── frontend (serves React app on :5173)
```

- **Shared volume**: `model-volume` connects trainer → api → evaluator
- **Dependency chain**: trainer completes → api starts → evaluator runs
- **Healthcheck**: API has a healthcheck that the evaluator waits for
- **Non-root users**: All services run as non-root where practical
- **Pinned dependencies**: All Python packages have pinned versions

## 13. Evaluation

The evaluator runs 9 independent tests:

1. Health Check — API responds with model_loaded=true
2. Valid Recommendation — Standard request returns segment_id and recommendations
3. Empty Genres — Accepted, behavioral recommendations provided
4. Zero Watch Time — Accepted, valid edge case
5. Invalid Values — Negative values rejected with 422
6. Missing Fields — Missing user_id rejected with 422
7. Wrong Data Types — String for numeric field rejected with 422
8. Unknown Genres — Accepted, handled gracefully
9. Model Available — Model is loaded and producing predictions

Results are saved to `metrics.json` with API correctness, input robustness, clustering quality, cluster balance, and reproducibility sections.

## 14. Results

Actual results are computed at runtime and stored in `metrics.json`. The frontend reads these values and displays them in the Evaluation dashboard. No metrics are hard-coded.

## 15. Edge Cases

All edge cases are handled safely:
- Validation errors return 422 with clear messages (no stack traces)
- Model unavailability returns 503 with user-friendly message
- Unknown genres are accepted (the system doesn't restrict to a fixed list at inference)
- Empty genres produce behavioral-segment-based recommendations
- The frontend also includes a client-side ML engine that provides full functionality when the backend is not running

## 16. Limitations

- Sample dataset (100 viewers) — production would use larger datasets
- KMeans assumes spherical clusters — DBSCAN or GMM might capture non-spherical patterns
- Rule-based recommendations — collaborative filtering could improve relevance
- No real-time model updates — retraining requires the trainer service
- No user feedback loop for recommendation quality

## 17. Future Work

- Integrate larger real-world datasets
- Add DBSCAN and Gaussian Mixture Model comparison
- Implement collaborative filtering recommendation layer
- Build real-time retraining pipeline with streaming data
- Add A/B testing framework for recommendation effectiveness
- Implement user feedback collection and model fine-tuning
- Add hierarchical clustering for sub-segment discovery

## 18. Reproducibility

- **Random seed**: 42 (used for KMeans++ initialization)
- **StandardScaler**: Deterministic (no randomness)
- **KMeans**: Fixed seed ensures identical cluster assignments across runs
- **Silhouette score**: Computed on full dataset (no sampling for 100 rows)
- **All results reproducible**: Running the trainer twice produces identical models

## 19. Development Changes

The project was built incrementally:
1. Created sample dataset with realistic OTT viewer behavior patterns
2. Implemented client-side ML engine (StandardScaler, KMeans, silhouette score, PCA) in TypeScript for frontend standalone operation
3. Built 11 frontend pages with React, Tailwind, and Recharts
4. Implemented Python backend (FastAPI) with Pydantic validation
5. Created trainer service with full ML pipeline
6. Created evaluator service with comprehensive test suite
7. Containerized all services with Docker Compose
8. The frontend automatically falls back to client-side ML when the backend is unavailable, ensuring the demo works in all environments
