"""
OTT Audience Intelligence - Trainer Service

Loads CSV data, cleans and validates, engineers features,
trains StandardScaler + KMeans, selects best K via silhouette score,
creates segment descriptions, and persists the model bundle.
"""

import os
import sys
import json
import logging
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

RANDOM_SEED = 42
DATA_PATH = os.environ.get("DATA_PATH", "/data/users.csv")
MODEL_DIR = os.environ.get("MODEL_DIR", "/models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
METRICS_PATH = os.environ.get("METRICS_PATH", os.path.join(MODEL_DIR, "training_metrics.json"))

FEATURES = [
    "watch_time_hours",
    "avg_session_mins",
    "session_frequency",
    "completion_rate",
    "genre_diversity",
]

VALID_GENRES = {"Action", "Sci-Fi", "Thriller", "Comedy", "Drama", "Romance", "Adventure"}


def load_and_clean(path: str) -> tuple[pd.DataFrame, dict]:
    """Load CSV, validate, clean, and return cleaned data + quality report."""
    df = pd.read_csv(path)
    quality = {
        "total_rows": len(df),
        "duplicate_rows": 0,
        "missing_values": 0,
        "invalid_numeric": 0,
        "unknown_categories": 0,
        "clean_rows": 0,
        "rows_removed": 0,
    }

    # Check duplicates
    dup_count = df.duplicated(subset=["user_id"]).sum()
    df = df.drop_duplicates(subset=["user_id"], keep="first")
    quality["duplicate_rows"] = int(dup_count)
    quality["rows_removed"] += int(dup_count)

    # Check missing values in key columns
    for col in ["watch_time_hours", "avg_session_mins", "session_frequency", "completion_rate"]:
        missing = df[col].isna().sum()
        quality["missing_values"] += int(missing)
        df = df[df[col].notna()]

    # Check invalid numeric values
    invalid_mask = (
        (df["watch_time_hours"] < 0)
        | (df["avg_session_mins"] < 0)
        | (df["session_frequency"] < 0)
        | (df["completion_rate"] < 0)
        | (df["completion_rate"] > 1)
    )
    quality["invalid_numeric"] = int(invalid_mask.sum())
    df = df[~invalid_mask]

    # Check unknown genres
    if "top_genres" in df.columns:
        all_genres = set()
        for g_str in df["top_genres"].dropna():
            for g in str(g_str).split("|"):
                all_genres.add(g.strip())
        unknown = all_genres - VALID_GENRES
        quality["unknown_categories"] = len(unknown)

    # Parse top_genres
    if "top_genres" in df.columns:
        df["top_genres"] = df["top_genres"].apply(
            lambda x: [g.strip() for g in str(x).split("|") if g.strip()]
        )

    # Ensure genre_diversity exists
    if "genre_diversity" not in df.columns:
        df["genre_diversity"] = df["top_genres"].apply(lambda x: min(len(x) / 7.0, 1.0))

    quality["clean_rows"] = len(df)
    quality["rows_removed"] = quality["total_rows"] - quality["clean_rows"]

    logger.info(f"Data quality: {json.dumps(quality)}")
    return df, quality


def engineer_features(df: pd.DataFrame) -> np.ndarray:
    """Extract and return feature matrix."""
    feature_matrix = df[FEATURES].values.astype(float)
    return feature_matrix


def select_k(scaled_data: np.ndarray) -> tuple[int, list[dict]]:
    """Compare K values 2-6 using silhouette score and inertia."""
    results = []
    for k in range(2, 7):
        km = KMeans(n_clusters=k, random_state=RANDOM_SEED, n_init=10, max_iter=300)
        labels = km.fit_predict(scaled_data)
        sil = silhouette_score(scaled_data, labels) if k > 1 else 0
        results.append({
            "k": k,
            "inertia": float(km.inertia_),
            "silhouette": float(sil),
        })
        logger.info(f"K={k}: inertia={km.inertia_:.2f}, silhouette={sil:.4f}")

    best = max(results, key=lambda x: x["silhouette"])
    return best["k"], results


def derive_segment_name(cluster_avg: np.ndarray, global_avg: np.ndarray) -> str:
    """Derive a human-readable segment name from cluster statistics."""
    watch_time = cluster_avg[0]
    frequency = cluster_avg[2]
    completion = cluster_avg[3]
    diversity = cluster_avg[4]

    g_watch = global_avg[0]
    g_freq = global_avg[2]
    g_div = global_avg[4]

    if watch_time > g_watch * 1.3 and frequency > g_freq * 1.3:
        return "Highly Engaged Viewers"
    if watch_time < g_watch * 0.6 and frequency < g_freq * 0.6:
        return "Occasional Viewers"
    if diversity > g_div * 1.2 and completion < 0.75:
        return "Genre Explorers"
    return "Casual Viewers"


def derive_segment_description(name: str, avg: np.ndarray) -> str:
    watch_time = avg[0]
    frequency = avg[2]
    completion = avg[3]
    diversity = avg[4]

    descriptions = {
        "Highly Engaged Viewers": f"These viewers show strong engagement with {watch_time:.0f}h average watch time and {frequency:.0f} sessions per week. They complete {completion*100:.0f}% of what they start and tend to stick with preferred genres.",
        "Casual Viewers": f"Moderate engagement with {watch_time:.0f}h watch time across {frequency:.0f} sessions. They watch regularly but with shorter sessions and moderate completion rates.",
        "Genre Explorers": f"These viewers explore broadly with a genre diversity of {diversity:.2f}. They sample varied content but have lower completion rates at {completion*100:.0f}%.",
        "Occasional Viewers": f"Light engagement with only {watch_time:.0f}h watch time and {frequency:.0f} sessions. They watch infrequently with shorter sessions and lower completion.",
    }
    return descriptions.get(name, f"Segment with {watch_time:.0f}h average watch time.")


def build_segments(
    df: pd.DataFrame,
    labels: np.ndarray,
    n_clusters: int,
    raw_features: np.ndarray,
    global_avg: np.ndarray,
) -> dict[int, dict]:
    """Build segment metadata dictionary."""
    segments = {}
    for c in range(n_clusters):
        mask = labels == c
        cluster_data = df[mask]
        cluster_features = raw_features[mask]
        avg = cluster_features.mean(axis=0) if len(cluster_features) > 0 else global_avg

        name = derive_segment_name(avg, global_avg)
        description = derive_segment_description(name, avg)

        genre_count = {}
        for genres in cluster_data["top_genres"]:
            for g in genres:
                genre_count[g] = genre_count.get(g, 0) + 1
        dominant = sorted(genre_count.items(), key=lambda x: -x[1])[:3]
        dominant_genres = [g for g, _ in dominant]

        segments[c] = {
            "name": name,
            "description": description,
            "viewer_count": int(mask.sum()),
            "percentage": float(mask.sum() / len(df) * 100),
            "avg_watch_time": float(avg[0]),
            "avg_session_duration": float(avg[1]),
            "avg_completion_rate": float(avg[3]),
            "avg_frequency": float(avg[2]),
            "dominant_genres": dominant_genres,
        }
    return segments


def main():
    logger.info("Starting OTT Audience Intelligence Trainer...")

    # Load and clean data
    df, quality = load_and_clean(DATA_PATH)
    logger.info(f"Loaded {len(df)} clean rows from {DATA_PATH}")

    # Engineer features
    raw_features = engineer_features(df)
    global_avg = raw_features.mean(axis=0)

    # Scale features
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(raw_features)
    logger.info(f"Scaled {scaled_data.shape[0]} samples with {scaled_data.shape[1]} features")

    # Select K
    best_k, k_results = select_k(scaled_data)
    logger.info(f"Selected K={best_k}")

    # Train final model
    kmeans = KMeans(n_clusters=best_k, random_state=RANDOM_SEED, n_init=10, max_iter=300)
    labels = kmeans.fit_predict(scaled_data)
    logger.info(f"Trained KMeans with inertia={kmeans.inertia_:.2f}")

    # Build segments
    segments = build_segments(df, labels, best_k, raw_features, global_avg)
    for c, seg in segments.items():
        logger.info(f"  Cluster {c}: {seg['name']} ({seg['viewer_count']} viewers)")

    # Save model bundle
    os.makedirs(MODEL_DIR, exist_ok=True)
    model_bundle = {
        "scaler": scaler,
        "kmeans": kmeans,
        "segments": segments,
        "features": FEATURES,
        "random_seed": RANDOM_SEED,
        "n_clusters": best_k,
        "k_selection": k_results,
        "data_quality": quality,
        "inertia": float(kmeans.inertia_),
        "silhouette_score": float(
            max(r["silhouette"] for r in k_results if r["k"] == best_k)
        ),
    }
    joblib.dump(model_bundle, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")

    # Save training metrics
    with open(METRICS_PATH, "w") as f:
        json.dump({
            "selected_k": best_k,
            "k_selection": k_results,
            "data_quality": quality,
            "n_clusters": best_k,
            "inertia": float(kmeans.inertia_),
            "silhouette_score": model_bundle["silhouette_score"],
            "cluster_sizes": [int((labels == c).sum()) for c in range(best_k)],
            "segment_names": {str(c): s["name"] for c, s in segments.items()},
        }, f, indent=2)
    logger.info(f"Training metrics saved to {METRICS_PATH}")
    logger.info("Trainer completed successfully.")


if __name__ == "__main__":
    main()
