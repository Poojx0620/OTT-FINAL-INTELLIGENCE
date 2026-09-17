"""Configuration for OTT Audience Intelligence API."""

import os

MODEL_DIR = os.environ.get("MODEL_DIR", "/models")
MODEL_PATH = os.path.join(MODEL_DIR, "model.joblib")
DATA_PATH = os.environ.get("DATA_PATH", "/data/users.csv")
RANDOM_SEED = 42
FEATURES = [
    "watch_time_hours",
    "avg_session_mins",
    "session_frequency",
    "completion_rate",
    "genre_diversity",
]
VALID_GENRES = [
    "Action", "Sci-Fi", "Thriller", "Comedy", "Drama", "Romance", "Adventure",
]
