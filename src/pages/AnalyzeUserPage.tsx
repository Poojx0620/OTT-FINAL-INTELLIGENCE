import { useState } from 'react';
import { UserSearch, Loader2, CheckCircle2 } from 'lucide-react';
import { GlassCard, PageHeader, Badge, PosterPlaceholder } from '@/components/ui';
import { recommendSync } from '@/services/api';
import type { RecommendResponse } from '@/types';

const ALL_GENRES = ['Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Romance', 'Adventure'];

const LOADING_STEPS = [
  'Analyzing viewer behavior...',
  'Extracting features...',
  'Matching audience segment...',
  'Generating recommendations...',
];

export function AnalyzeUserPage() {
  const [form, setForm] = useState({
    user_id: 'U1024',
    watch_time_hours: 42,
    avg_session_mins: 38,
    session_frequency: 12,
    completion_rate: 0.84,
    top_genres: ['Action', 'Sci-Fi'],
  });
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [error, setError] = useState('');

  const handleGenreToggle = (genre: string) => {
    setForm((f) => ({
      ...f,
      top_genres: f.top_genres.includes(genre)
        ? f.top_genres.filter((g) => g !== genre)
        : [...f.top_genres, genre],
    }));
  };

  const handleAnalyze = async () => {
    setError('');
    if (!form.user_id) {
      setError('User ID is required.');
      return;
    }
    if (form.watch_time_hours < 0) {
      setError('Watch time cannot be negative.');
      return;
    }
    if (form.completion_rate < 0 || form.completion_rate > 1) {
      setError('Completion rate must be between 0 and 1.');
      return;
    }

    setLoading(true);
    setResult(null);
    setLoadingStep(0);

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = recommendSync(form);
      setResult(res);
    } catch {
      setError('Unable to analyze viewer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyze User"
        subtitle="Enter viewer behavioral data to predict their audience segment and get personalized recommendations."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserSearch className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Viewer Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">User ID</label>
              <input
                type="text"
                value={form.user_id}
                onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Watch Time (hours)</label>
                <input
                  type="number"
                  value={form.watch_time_hours}
                  onChange={(e) => setForm({ ...form, watch_time_hours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Avg Session (min)</label>
                <input
                  type="number"
                  value={form.avg_session_mins}
                  onChange={(e) => setForm({ ...form, avg_session_mins: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Session Frequency</label>
                <input
                  type="number"
                  value={form.session_frequency}
                  onChange={(e) => setForm({ ...form, session_frequency: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Completion Rate</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.completion_rate}
                  onChange={(e) => setForm({ ...form, completion_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Top Genres</label>
              <div className="flex flex-wrap gap-2">
                {ALL_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenreToggle(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      form.top_genres.includes(g)
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold text-sm hover:scale-[1.02] transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {loading ? 'ANALYZING...' : 'ANALYZE VIEWER'}
            </button>
          </div>
        </GlassCard>

        {/* Result */}
        <div>
          {loading ? (
            <GlassCard className="p-12 h-full flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full border-3 border-white/5" />
                <div className="absolute inset-0 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {LOADING_STEPS.map((step, i) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                      i <= loadingStep ? 'text-white opacity-100' : 'text-gray-600 opacity-40'
                    }`}
                  >
                    {i < loadingStep ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : i === loadingStep ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-700" />
                    )}
                    {step}
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : result ? (
            <div className="space-y-4">
              <GlassCard className="p-6" glow>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Audience Segment</p>
                    <h3 className="text-xl font-bold text-white">{result.segment_name}</h3>
                  </div>
                  <div className="text-right">
                    <Badge color="amber">cluster_{String(result.segment_id).padStart(2, '0')}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-400">Distance to centroid:</span>
                  <Badge color="blue">{result.distance_to_centroid.toFixed(3)}</Badge>
                </div>
              </GlassCard>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">Your Personalized Recommendations</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {result.recommendations.slice(0, 6).map((rec) => (
                    <GlassCard key={rec.title} className="p-3 group hover:scale-[1.03] transition-transform duration-200">
                      <PosterPlaceholder genre={rec.genre} />
                      <div className="mt-2">
                        <p className="text-sm font-semibold text-white">{rec.title}</p>
                        <p className="text-xs text-gray-500">{rec.genre}</p>
                      </div>
                      <div className="mt-2 space-y-1">
                        {rec.reasons.map((r) => (
                          <div key={r} className="flex items-start gap-1 text-[10px] text-gray-400">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                            {r}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <GlassCard className="p-12 h-full flex flex-col items-center justify-center text-center">
              <UserSearch className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">
                Fill in the viewer profile and click Analyze to see results.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
