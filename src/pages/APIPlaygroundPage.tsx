import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { recommend, validateRequest } from '@/services/api';
import type { RecommendResponse } from '@/types';

const DEFAULT_REQUEST = {
  user_id: 'U102',
  watch_time_hours: 42,
  avg_session_mins: 38,
  session_frequency: 12,
  completion_rate: 0.84,
  top_genres: ['Action', 'Sci-Fi'],
};

const EDGE_CASES = [
  {
    name: 'Empty Genres',
    request: { ...DEFAULT_REQUEST, top_genres: [] },
  },
  {
    name: 'Zero Watch Time',
    request: { ...DEFAULT_REQUEST, watch_time_hours: 0 },
  },
  {
    name: 'Negative Value',
    request: { ...DEFAULT_REQUEST, watch_time_hours: -5 },
  },
  {
    name: 'Missing Field',
    request: { user_id: 'U103', watch_time_hours: 30, avg_session_mins: 25, session_frequency: 8, completion_rate: 0.7 } as Record<string, unknown>,
  },
  {
    name: 'Wrong Numeric Type',
    request: { ...DEFAULT_REQUEST, watch_time_hours: 'forty' } as Record<string, unknown>,
  },
  {
    name: 'Unknown Genre',
    request: { ...DEFAULT_REQUEST, top_genres: ['Horror', 'Documentary'] },
  },
  {
    name: 'Huge Numeric Value',
    request: { ...DEFAULT_REQUEST, watch_time_hours: 99999 },
  },
];

export function APIPlaygroundPage() {
  const [requestText, setRequestText] = useState(JSON.stringify(DEFAULT_REQUEST, null, 2));
  const [response, setResponse] = useState<RecommendResponse | null>(null);
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [edgeResults, setEdgeResults] = useState<Record<string, { ok: boolean; detail: string }>>({});

  const handleSend = async () => {
    setLoading(true);
    setError('');
    setResponseText('');
    setStatus(null);
    setResponseTime(null);

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(requestText);
    } catch {
      setError('Invalid JSON syntax.');
      setLoading(false);
      return;
    }

    const req = {
      user_id: String(parsed.user_id ?? ''),
      watch_time_hours: Number(parsed.watch_time_hours),
      avg_session_mins: Number(parsed.avg_session_mins),
      session_frequency: Number(parsed.session_frequency),
      completion_rate: Number(parsed.completion_rate),
      top_genres: Array.isArray(parsed.top_genres) ? parsed.top_genres : [],
    };

    const errors = validateRequest(req);
    if (errors.length > 0) {
      setStatus(422);
      setResponseText(JSON.stringify({ detail: errors }, null, 2));
      setLoading(false);
      return;
    }

    try {
      const result = await recommend(req);
      setResponse(result.response);
      setResponseText(JSON.stringify(result.response, null, 2));
      setStatus(result.status);
      setResponseTime(result.responseTime);
    } catch {
      setError('Unable to connect to recommendation service.');
      setStatus(503);
    } finally {
      setLoading(false);
    }
  };

  const handleEdgeCase = async (name: string, req: Record<string, unknown>) => {
    let parsedReq: Record<string, unknown>;
    try {
      parsedReq = req;
    } catch {
      setEdgeResults((prev) => ({ ...prev, [name]: { ok: false, detail: 'Invalid request' } }));
      return;
    }

    const normalized = {
      user_id: String(parsedReq.user_id ?? ''),
      watch_time_hours: Number(parsedReq.watch_time_hours),
      avg_session_mins: Number(parsedReq.avg_session_mins),
      session_frequency: Number(parsedReq.session_frequency),
      completion_rate: Number(parsedReq.completion_rate),
      top_genres: Array.isArray(parsedReq.top_genres) ? parsedReq.top_genres : [],
    };

    const errors = validateRequest(normalized);
    if (errors.length > 0) {
      setEdgeResults((prev) => ({
        ...prev,
        [name]: { ok: true, detail: `Validation caught: ${errors[0]}` },
      }));
      return;
    }

    try {
      const result = await recommend(normalized);
      setEdgeResults((prev) => ({
        ...prev,
        [name]: { ok: result.status === 200, detail: `Status ${result.status}` },
      }));
    } catch {
      setEdgeResults((prev) => ({
        ...prev,
        [name]: { ok: false, detail: 'Connection failed' },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Playground"
        subtitle="Test the recommendation API with custom requests and edge cases."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-mono font-bold">POST</span>
              <span className="text-sm text-gray-400 font-mono">/recommend</span>
            </div>
            <button
              onClick={handleSend}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-black text-sm font-semibold hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              SEND REQUEST
            </button>
          </div>
          <textarea
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            className="w-full h-80 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-sm text-green-400 font-mono outline-none focus:border-amber-500/50 transition-colors resize-none"
            spellCheck={false}
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </GlassCard>

        {/* Response */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400 font-mono">Response</span>
            <div className="flex items-center gap-2">
              {status !== null && (
                <Badge color={status === 200 ? 'green' : 'red'}>
                  {status === 200 ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {status}
                </Badge>
              )}
              {responseTime !== null && (
                <Badge color="gray">
                  <Clock className="w-3 h-3" />
                  {responseTime.toFixed(0)}ms
                </Badge>
              )}
            </div>
          </div>
          <pre className="w-full h-80 px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-sm text-blue-400 font-mono overflow-auto resize-none">
            {responseText || '// Response will appear here'}
          </pre>
        </GlassCard>
      </div>

      {/* Edge cases */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Edge Case Playground</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EDGE_CASES.map((ec) => {
            const result = edgeResults[ec.name];
            return (
              <button
                key={ec.name}
                onClick={() => handleEdgeCase(ec.name, ec.request)}
                className={`p-3 rounded-lg border text-xs font-medium transition-all text-left ${
                  result
                    ? result.ok
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {result?.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : result ? <XCircle className="w-3.5 h-3.5" /> : null}
                  {ec.name}
                </div>
                {result && <p className="text-[10px] opacity-70">{result.detail}</p>}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Health endpoint */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">GET</span>
          <span className="text-sm text-gray-400 font-mono">/health</span>
        </div>
        <pre className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-sm text-blue-400 font-mono overflow-auto">
{`{
  "status": "ok",
  "model_loaded": true
}`}
        </pre>
      </GlassCard>
    </div>
  );
}


