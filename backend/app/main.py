"""FastAPI application for OTT Audience Intelligence."""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import RecommendRequest, RecommendResponse, HealthResponse
from model import model_manager
from recommender import generate_recommendations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OTT Audience Intelligence API",
    description="Audience segmentation and personalized recommendation service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Client-Info", "Apikey"],
)


@app.on_event("startup")
async def startup():
    loaded = model_manager.load()
    if loaded:
        logger.info("Model loaded successfully")
    else:
        logger.warning("Model not found. Trainer must run first.")


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok" if model_manager.loaded else "degraded",
        model_loaded=model_manager.loaded,
    )


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if not model_manager.loaded:
        raise HTTPException(
            status_code=503,
            detail="Model is currently unavailable. Please start the trainer service.",
        )

    genre_diversity = min(len(req.top_genres) / 7.0, 1.0) if req.top_genres else 0.0
    features = [
        req.watch_time_hours,
        req.avg_session_mins,
        req.session_frequency,
        req.completion_rate,
        genre_diversity,
    ]

    try:
        cluster_id, distance, _ = model_manager.predict(features)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Prediction failed. Please check input values.",
        )

    segment_name = model_manager.get_segment_name(cluster_id)
    recommendations = generate_recommendations(
        segment_name,
        req.top_genres,
        req.watch_time_hours,
        req.completion_rate,
    )

    return RecommendResponse(
        user_id=req.user_id,
        segment_id=cluster_id,
        segment_name=segment_name,
        recommendations=recommendations,
        distance_to_centroid=distance,
    )
