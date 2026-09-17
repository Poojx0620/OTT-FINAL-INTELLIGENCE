import type {
  RecommendResponse,
  HealthStatus,
  ViewerProfile,
} from '@/types';
import { MLPipeline, generateRecommendations } from '@/services/ml';
import { loadViewerData } from '@/services/data';

const API_URL = 'http://localhost:8000';

let pipeline: MLPipeline | null = null;
let pipelineData: ViewerProfile[] = [];

export function getPipeline(): MLPipeline {
  if (!pipeline) {
    pipelineData = loadViewerData();
    pipeline = new MLPipeline(pipelineData);
    pipeline.run();
  }
  return pipeline;
}

export function getViewerData(): ViewerProfile[] {
  if (!pipelineData.length) {
    pipelineData = loadViewerData();
  }
  return pipelineData;
}

let backendAvailable: boolean | null = null;

async function checkBackend(): Promise<boolean> {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    clearTimeout(timeout);
    backendAvailable = res.ok;
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

export async function getHealth(): Promise<HealthStatus> {
  const isBackend = await checkBackend();
  if (isBackend) {
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      return {
        status: data.status || 'ok',
        model_loaded: data.model_loaded ?? true,
        trainer: 'completed',
        api: 'healthy',
        evaluator: 'completed',
      };
    } catch {
      // fall through
    }
  }
  return {
    status: 'ok',
    model_loaded: true,
    trainer: 'completed (client-side)',
    api: 'healthy (client-side)',
    evaluator: 'completed (client-side)',
  };
}

export interface RecommendRequest {
  user_id: string;
  watch_time_hours: number;
  avg_session_mins: number;
  session_frequency: number;
  completion_rate: number;
  top_genres: string[];
}

export async function recommend(req: RecommendRequest): Promise<{
  response: RecommendResponse;
  status: number;
  responseTime: number;
}> {
  const start = performance.now();
  const isBackend = await checkBackend();

  if (isBackend) {
    try {
      const res = await fetch(`${API_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      const responseTime = performance.now() - start;
      return { response: data, status: res.status, responseTime };
    } catch {
      // fall through to client-side
    }
  }

  // Client-side prediction
  const p = getPipeline();
  const result = p.predictSegment(req);
  const recommendations = generateRecommendations(
    result.segmentId,
    req.top_genres,
    result.segmentName,
    { watch_time_hours: req.watch_time_hours, completion_rate: req.completion_rate }
  );

  const response: RecommendResponse = {
    user_id: req.user_id,
    segment_id: result.segmentId,
    segment_name: result.segmentName,
    recommendations,
    distance_to_centroid: result.distance,
  };

  const responseTime = performance.now() - start;
  return { response, status: 200, responseTime };
}

export function recommendSync(req: RecommendRequest): RecommendResponse {
  const p = getPipeline();
  const result = p.predictSegment(req);
  const recommendations = generateRecommendations(
    result.segmentId,
    req.top_genres,
    result.segmentName,
    { watch_time_hours: req.watch_time_hours, completion_rate: req.completion_rate }
  );

  return {
    user_id: req.user_id,
    segment_id: result.segmentId,
    segment_name: result.segmentName,
    recommendations,
    distance_to_centroid: result.distance,
  };
}

export function validateRequest(req: Partial<RecommendRequest>): string[] {
  const errors: string[] = [];
  if (!req.user_id) errors.push('user_id is required');
  if (req.watch_time_hours == null) errors.push('watch_time_hours is required');
  else if (req.watch_time_hours < 0) errors.push('watch_time_hours cannot be negative');
  if (req.avg_session_mins == null) errors.push('avg_session_mins is required');
  else if (req.avg_session_mins < 0) errors.push('avg_session_mins cannot be negative');
  if (req.session_frequency == null) errors.push('session_frequency is required');
  else if (req.session_frequency < 0) errors.push('session_frequency cannot be negative');
  if (req.completion_rate == null) errors.push('completion_rate is required');
  else if (req.completion_rate < 0 || req.completion_rate > 1)
    errors.push('completion_rate must be between 0 and 1');
  if (req.top_genres == null) errors.push('top_genres is required');
  return errors;
}
