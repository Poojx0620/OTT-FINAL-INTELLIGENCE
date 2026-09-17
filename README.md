# OTT Audience Intelligence

A containerized audience segmentation and personalization service for OTT (Over-The-Top) streaming platforms. The system takes viewer behavior data, cleans and transforms it, discovers meaningful audience segments using unsupervised machine learning (KMeans clustering), and provides personalized content recommendations through a REST API.

## Problem Statement

Streaming platforms collect vast amounts of viewer behavior data but struggle to translate it into actionable audience segments and personalized experiences. This project demonstrates a complete pipeline from raw data to personalized recommendations, using unsupervised ML to discover segments automatically — without manually assigned labels.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Trainer    │────▶│     API      │◀────│  Evaluator   │
│  (Python)    │     │  (FastAPI)   │     │  (Python)    │
└─────────────┘     └─────────────┘     └──────────────┘
      │                    │                    │
      ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  data/      │     │ model-volume │     │ metrics.json │
│  users.csv  │     │ (shared)     │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
```

### Services

| Service | Description |
|---------|-------------|
| **Trainer** | Loads CSV, cleans data, engineers features, trains StandardScaler + KMeans, selects best K, persists model |
| **API** | FastAPI backend — loads persisted model, serves `/health` and `/recommend` endpoints |
| **Evaluator** | Waits for API health, runs comprehensive tests, generates `metrics.json` |
| **Frontend** | React + Vite + Tailwind dashboard with 11 pages |

## Installation

### Docker (Recommended)

```bash
docker compose up --build
```

This will:
1. Build and run the **trainer** (trains model, saves to shared volume)
2. Start the **API** (loads model, serves on port 8000)
3. Run the **evaluator** (tests API, generates metrics.json)
4. Start the **frontend** (serves on port 5173)

### Local Development

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Trainer (run first to generate model):**
```bash
cd trainer
pip install -r requirements.txt
DATA_PATH=../data/users.csv MODEL_DIR=../models python train.py
```

**Frontend:**
```bash
npm install
npm run dev
```

## API Usage

### Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

### Recommendation

```bash
curl -X POST http://localhost:8000/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "U102",
    "watch_time_hours": 42,
    "avg_session_mins": 38,
    "session_frequency": 12,
    "completion_rate": 0.84,
    "top_genres": ["Action", "Sci-Fi"]
  }'
```

**Response:**
```json
{
  "user_id": "U102",
  "segment_id": 0,
  "segment_name": "Highly Engaged Viewers",
  "recommendations": [
    {
      "title": "Galactic Odyssey",
      "genre": "Sci-Fi",
      "description": "A deep-space crew uncovers a signal...",
      "reasons": ["Matches preferred genre", "Suitable for highly engaged behavioral segment", "Aligns with deep viewing patterns"],
      "match_score": 0.6
    }
  ],
  "distance_to_centroid": 1.24
}
```

## ML Pipeline

1. **Raw Data** — CSV with viewer behavior (watch time, session duration, frequency, completion rate, genres)
2. **Data Cleaning** — Remove duplicates, handle missing/invalid values, detect unknown categories
3. **Feature Engineering** — Extract 5 behavioral features: watch_time_hours, avg_session_mins, session_frequency, completion_rate, genre_diversity
4. **StandardScaler** — Standardize features to zero mean, unit variance
5. **K Selection** — Compare K=2..6 using silhouette score and inertia (elbow method)
6. **KMeans Training** — Train with deterministic seed (42), KMeans++ initialization
7. **Segment Naming** — Derive human-readable names from cluster statistics
8. **Model Persistence** — Save scaler + KMeans + segment metadata as joblib bundle

### Feature Engineering

| Feature | Description | Rationale |
|---------|-------------|----------|
| watch_time_hours | Total viewing hours | Measures overall engagement volume |
| avg_session_mins | Average session length | Indicates depth of individual viewing sessions |
| session_frequency | Sessions per week | Measures viewing regularity |
| completion_rate | Fraction of content completed | Indicates content satisfaction |
| genre_diversity | Unique genres / 7 | Captures exploration vs. focused behavior |

### Model Selection

K is selected by comparing silhouette scores across K=2..6. The K with the highest silhouette score is chosen, indicating the best-defined cluster separation. Inertia (elbow method) is also reported for manual inspection.

## Evaluation

The evaluator service independently tests:
- API health endpoint
- Valid recommendation request
- Empty genres handling
- Zero watch time handling
- Invalid (negative) value rejection
- Missing field rejection
- Wrong data type rejection
- Unknown genre handling
- Model availability

Results are saved to `metrics.json` with:
- API correctness (passed/failed)
- Input robustness (passed/failed)
- Clustering quality (silhouette score, inertia)
- Cluster balance (std dev, coefficient of variation)
- Reproducibility (deterministic seed verification)

## Edge Cases

| Case | Handling |
|------|----------|
| Empty genres | Accepted, recommendations use behavioral segment |
| Zero watch time | Accepted, valid edge case |
| Negative values | Rejected with 422 validation error |
| Missing fields | Rejected with 422 validation error |
| Wrong data types | Rejected with 422 validation error |
| Unknown genres | Accepted, handled gracefully |
| Huge numeric values | Accepted, scaled by StandardScaler |

## Reproducibility

- Random seed: 42 (used for KMeans initialization)
- StandardScaler: deterministic (no randomness)
- KMeans: uses KMeans++ with fixed seed
- All results are reproducible across runs

## Limitations

- Sample dataset (100 viewers) for demonstration; production would use larger datasets
- KMeans assumes spherical clusters; other algorithms (DBSCAN, GMM) may capture different patterns
- Recommendations are rule-based; a collaborative filtering layer could improve relevance
- No real-time model updates; retraining requires running the trainer service

## Future Improvements

- Larger dataset integration
- Additional clustering algorithms (DBSCAN, Gaussian Mixture Models)
- Collaborative filtering for recommendations
- Real-time model retraining pipeline
- A/B testing framework for recommendation quality
- User feedback loop for recommendation improvement
