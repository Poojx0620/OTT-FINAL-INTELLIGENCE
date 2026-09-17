import { useState } from 'react';
import { Sparkles, TrendingUp, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { GlassCard, PageHeader, Badge, PosterPlaceholder } from '@/components/ui';
import { getPipeline, recommendSync } from '@/services/api';
import type { RecommendationItem } from '@/types';

const GENERIC_RECOMMENDATIONS: RecommendationItem[] = [
  { title: 'Trending: Summer Letters', genre: 'Romance', description: 'Popular this week across all viewers.', poster: 'romance', reasons: ['Trending now', 'Popular with all audiences'], match_score: 0.3 },
  { title: 'Top Rated: Quantum Paradox', genre: 'Sci-Fi', description: 'Highest rated content on the platform.', poster: 'sci-fi', reasons: ['Top rated', 'Universally popular'], match_score: 0.35 },
  { title: 'Popular: Iron Resolve', genre: 'Action', description: 'Most watched this month.', poster: 'action', reasons: ['Most watched', 'Broadly popular'], match_score: 0.32 },
];

const ALL_GENRES = ['Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Romance', 'Adventure'];

export function RecommendationsPage() {
  const pipeline = getPipeline();
  const segments = pipeline.segments;

  const [selectedSegment, setSelectedSegment] = useState(segments[0]?.id || 0);
  const [genres, setGenres] = useState<string[]>(['Action', 'Sci-Fi']);
  const [watchTime, setWatchTime] = useState(42);
  const [completionRate, setCompletionRate] = useState(0.84);

  const segment = segments.find((s) => s.id === selectedSegment);

  const personalized = recommendSync({
    user_id: 'demo',
    watch_time_hours: watchTime,
    avg_session_mins: 38,
    session_frequency: 12,
    completion_rate: completionRate,
    top_genres: genres,
  });

  const handleGenreToggle = (g: string) => {
    setGenres((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommendations"
        subtitle="Compare generic vs personalized recommendations powered by audience segmentation."
      />

      {/* Controls */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Target Segment</label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(parseInt(e.target.value))}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none"
            >
              {segments.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#0a0a0f]">{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Watch Time: {watchTime}h</label>
            <input
              type="range"
              min="0"
              max="60"
              value={watchTime}
              onChange={(e) => setWatchTime(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">Completion: {Math.round(completionRate * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={completionRate}
              onChange={(e) => setCompletionRate(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-gray-400 mb-2 block">Preferred Genres</label>
          <div className="flex flex-wrap gap-2">
            {ALL_GENRES.map((g) => (
              <button
                key={g}
                onClick={() => handleGenreToggle(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  genres.includes(g)
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Before vs After */}
      <div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <h3 className="text-lg font-bold text-white">Before vs After Personalization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generic */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <h4 className="text-sm font-semibold text-gray-300">Generic Recommendations</h4>
            </div>
            <div className="space-y-3">
              {GENERIC_RECOMMENDATIONS.map((rec) => (
                <GlassCard key={rec.title} className="p-4 opacity-70">
                  <div className="flex gap-3">
                    <div className="w-16 flex-shrink-0">
                      <PosterPlaceholder genre={rec.genre} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <p className="text-xs text-gray-500 mb-1">{rec.genre}</p>
                      <div className="space-y-0.5">
                        {rec.reasons.map((r) => (
                          <div key={r} className="flex items-center gap-1 text-[10px] text-gray-500">
                            <span className="w-1 h-1 rounded-full bg-gray-500" />
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Personalized */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-amber-400">Personalized Recommendations</h4>
              {segment && <Badge color="amber">{segment.name}</Badge>}
            </div>
            <div className="space-y-3">
              {personalized.recommendations.slice(0, 3).map((rec) => (
                <GlassCard key={rec.title} className="p-4 group hover:scale-[1.02] transition-transform duration-200" glow>
                  <div className="flex gap-3">
                    <div className="w-16 flex-shrink-0">
                      <PosterPlaceholder genre={rec.genre} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <p className="text-xs text-gray-500 mb-1">{rec.genre}</p>
                      <div className="space-y-0.5">
                        {rec.reasons.map((r) => (
                          <div key={r} className="flex items-center gap-1 text-[10px] text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transition arrow on mobile */}
      <div className="flex md:hidden items-center justify-center">
        <ArrowRight className="w-5 h-5 text-amber-400 rotate-90" />
      </div>
    </div>
  );
}
