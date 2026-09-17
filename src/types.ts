export interface ViewerProfile {
  user_id: string;
  watch_time_hours: number;
  avg_session_mins: number;
  session_frequency: number;
  completion_rate: number;
  top_genres: string[];
  genre_diversity: number;
  activity_level: string;
}

export interface SegmentInfo {
  id: number;
  name: string;
  description: string;
  viewer_count: number;
  percentage: number;
  avg_watch_time: number;
  avg_session_duration: number;
  avg_completion_rate: number;
  avg_frequency: number;
  dominant_genres: string[];
  behavioral_traits: string[];
}

export interface RecommendationItem {
  title: string;
  genre: string;
  description: string;
  poster: string;
  reasons: string[];
  match_score: number;
}

export interface RecommendResponse {
  user_id: string;
  segment_id: number;
  segment_name: string;
  recommendations: RecommendationItem[];
  distance_to_centroid: number;
}

export interface ModelInfo {
  algorithm: string;
  preprocessing: string;
  random_seed: number;
  n_clusters: number;
  features: string[];
  model_loaded: boolean;
  inertia: number;
  silhouette_score: number;
  k_selection: KSelectionResult[];
}

export interface KSelectionResult {
  k: number;
  inertia: number;
  silhouette: number;
}

export interface ClusterPoint {
  user_id: string;
  x: number;
  y: number;
  cluster: number;
  watch_time_hours: number;
  avg_session_mins: number;
  session_frequency: number;
  completion_rate: number;
  top_genres: string[];
}

export interface EvaluationMetrics {
  api_correctness: { passed: number; failed: number; tests: TestCase[] };
  input_robustness: { passed: number; failed: number; tests: TestCase[] };
  clustering_quality: {
    silhouette_score: number;
    inertia: number;
  n_clusters: number;
  cluster_sizes: number[];
  };
  cluster_balance: {
    std_dev: number;
    cv: number;
    is_balanced: boolean;
  };
  reproducibility: {
    deterministic: boolean;
    seed: number;
    runs: number;
    silhouette_scores: number[];
  };
}

export interface TestCase {
  name: string;
  status: 'pass' | 'fail';
  detail: string;
}

export interface DataQuality {
  total_rows: number;
  duplicate_rows: number;
  missing_values: number;
  invalid_numeric: number;
  unknown_categories: number;
  clean_rows: number;
  rows_removed: number;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  trainer: string;
  api: string;
  evaluator: string;
}

export interface SystemStats {
  total_viewers: number;
  n_segments: number;
  avg_watch_time: number;
  avg_session: number;
  silhouette_score: number;
  model_status: string;
}

export interface WhatIfResult {
  current_segment: number;
  current_segment_name: string;
  simulated_segment: number;
  simulated_segment_name: string;
  changed: boolean;
  explanation: string;
  cluster_distances: { cluster: number; distance: number; name: string }[];
}
