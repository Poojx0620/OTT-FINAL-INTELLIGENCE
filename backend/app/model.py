"""Model loading and prediction logic."""

import os
import joblib
import numpy as np
from typing import Any

from config import MODEL_PATH, FEATURES


class ModelManager:
    """Loads the persisted preprocessing + KMeans model and handles predictions."""

    def __init__(self):
        self.model_bundle: dict[str, Any] | None = None
        self.scaler = None
        self.kmeans = None
        self.segments: dict[int, dict] = {}
        self.loaded = False

    def load(self) -> bool:
        if not os.path.exists(MODEL_PATH):
            return False
        try:
            self.model_bundle = joblib.load(MODEL_PATH)
            self.scaler = self.model_bundle["scaler"]
            self.kmeans = self.model_bundle["kmeans"]
            self.segments = self.model_bundle.get("segments", {})
            self.loaded = True
            return True
        except Exception:
            return False

    def predict(self, features: list[float]) -> tuple[int, float, list[float]]:
        """Predict cluster, distance to centroid, and distances to all centroids."""
        arr = np.array(features, dtype=float).reshape(1, -1)
        scaled = self.scaler.transform(arr)
        cluster = int(self.kmeans.predict(scaled)[0])
        distance = float(
            np.linalg.norm(scaled[0] - self.kmeans.cluster_centers_[cluster])
        )
        all_distances = [
            float(np.linalg.norm(scaled[0] - c))
            for c in self.kmeans.cluster_centers_
        ]
        return cluster, distance, all_distances

    def get_segment_name(self, cluster_id: int) -> str:
        seg = self.segments.get(cluster_id, {})
        return seg.get("name", f"Segment {cluster_id}")

    def get_segment_info(self, cluster_id: int) -> dict:
        return self.segments.get(cluster_id, {})


model_manager = ModelManager()
