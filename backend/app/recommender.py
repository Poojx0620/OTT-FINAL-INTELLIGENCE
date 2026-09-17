"""Rule-based recommendation engine using segment and genre matching."""

from schemas import RecommendationItem

CONTENT_CATALOG = [
    {"title": "Galactic Odyssey", "genre": "Sci-Fi", "description": "A deep-space crew uncovers a signal from a vanished civilization."},
    {"title": "Shadow Protocol", "genre": "Action", "description": "An elite agent races to stop a global cyber conspiracy."},
    {"title": "Midnight Verdict", "genre": "Thriller", "description": "A detective hunts a killer through the neon streets of Tokyo."},
    {"title": "Last Frontier", "genre": "Adventure", "description": "Pioneers brave an uncharted wilderness to build a new home."},
    {"title": "Hearts in Harmony", "genre": "Romance", "description": "Two musicians fall in love across a European tour."},
    {"title": "The Comedy Club", "genre": "Comedy", "description": "A struggling stand-up finds his voice in the city comedy scene."},
    {"title": "Quiet Devotion", "genre": "Drama", "description": "A family grapples with loss and reconciliation over three decades."},
    {"title": "Quantum Paradox", "genre": "Sci-Fi", "description": "A physicist breaks reality to save her past self."},
    {"title": "Iron Resolve", "genre": "Action", "description": "A retired fighter returns to the ring for one last bout."},
    {"title": "Silent Witness", "genre": "Thriller", "description": "A mute child holds the key to a town buried secret."},
    {"title": "Distant Shores", "genre": "Adventure", "description": "A solo sailor crosses the Pacific in search of meaning."},
    {"title": "Love in Lisbon", "genre": "Romance", "description": "A travel writer finds more than she expected in Portugal."},
    {"title": "Laugh Track", "genre": "Comedy", "description": "A sitcom cast reunites for one chaotic final season."},
    {"title": "The Long Goodbye", "genre": "Drama", "description": "A hospice nurse changes the lives of her patients."},
    {"title": "Stellar Drift", "genre": "Sci-Fi", "description": "Astronauts on a generation ship question their mission."},
    {"title": "Code of Vengeance", "genre": "Action", "description": "A hacker turns vigilante after a devastating betrayal."},
    {"title": "Edge of Fear", "genre": "Thriller", "description": "A psychologist hunts a patient who vanished without a trace."},
    {"title": "Wild Hearts", "genre": "Adventure", "description": "A wildlife photographer tracks endangered species across Africa."},
    {"title": "Summer Letters", "genre": "Romance", "description": "Pen pals meet for the first time after ten years of letters."},
    {"title": "Office Hours", "genre": "Comedy", "description": "A chaotic startup tries to survive its first investor meeting."},
]

SEGMENT_REASONS = {
    "Highly Engaged Viewers": [
        "Matches preferred genre",
        "Suitable for highly engaged behavioral segment",
        "Aligns with deep viewing patterns",
    ],
    "Casual Viewers": [
        "Matches preferred genre",
        "Suitable for casual viewing patterns",
        "Easy to pick up and enjoy",
    ],
    "Genre Explorers": [
        "Introduces new genres for exploration",
        "Matches diverse viewing behavior",
        "Encourages genre discovery",
    ],
    "Occasional Viewers": [
        "Easy to start with short commitment",
        "Matches light viewing patterns",
        "Suitable for occasional watchers",
    ],
}


def generate_recommendations(
    segment_name: str,
    top_genres: list[str],
    watch_time_hours: float,
    completion_rate: float,
) -> list[RecommendationItem]:
    reasons = SEGMENT_REASONS.get(segment_name, SEGMENT_REASONS["Casual Viewers"])

    scored = []
    for content in CONTENT_CATALOG:
        score = 0.0
        if content["genre"] in top_genres:
            score += 0.5
        if completion_rate > 0.8:
            score += 0.1
        if watch_time_hours > 40:
            score += 0.1
        scored.append((content, min(score, 1.0)))

    matched = [s for s in scored if s[0]["genre"] in top_genres]
    others = [s for s in scored if s[0]["genre"] not in top_genres]
    ordered = matched + others

    recs = []
    for content, score in ordered[:6]:
        recs.append(
            RecommendationItem(
                title=content["title"],
                genre=content["genre"],
                description=content["description"],
                reasons=reasons,
                match_score=score,
            )
        )
    return recs
