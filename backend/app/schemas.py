"""Pydantic schemas for the OTT Audience Intelligence API."""

from pydantic import BaseModel, Field, field_validator


class RecommendRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Unique viewer identifier")
    watch_time_hours: float = Field(..., ge=0, description="Total watch time in hours")
    avg_session_mins: float = Field(..., ge=0, description="Average session duration in minutes")
    session_frequency: int = Field(..., ge=0, description="Sessions per week")
    completion_rate: float = Field(..., ge=0, le=1, description="Fraction of content completed")
    top_genres: list[str] = Field(default_factory=list, description="Preferred genres")

    @field_validator("top_genres")
    @classmethod
    def validate_genres(cls, v: list[str]) -> list[str]:
        return [g.strip() for g in v if g.strip()]


class RecommendationItem(BaseModel):
    title: str
    genre: str
    description: str
    reasons: list[str]
    match_score: float


class RecommendResponse(BaseModel):
    user_id: str
    segment_id: int
    segment_name: str
    recommendations: list[RecommendationItem]
    distance_to_centroid: float


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
