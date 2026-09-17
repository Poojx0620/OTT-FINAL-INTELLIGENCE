import { useState } from 'react';
import { Users, Clock, Timer, CheckCircle, ArrowLeftRight } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getPipeline } from '@/services/api';

const CLUSTER_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#ec4899'];

export function SegmentsPage() {
  const pipeline = getPipeline();
  const segments = pipeline.segments;
  const [compareMode, setCompareMode] = useState(false);
  const [segA, setSegA] = useState(0);
  const [segB, setSegB] = useState(1);

  const segmentA = segments.find((s) => s.id === segA);
  const segmentB = segments.find((s) => s.id === segB);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audience Segments"
        subtitle="Behavioral segments discovered by KMeans clustering on viewer data."
      >
        <div className="mt-4">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              compareMode
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            {compareMode ? 'Exit Comparison' : 'Compare Segments'}
          </button>
        </div>
      </PageHeader>

      {!compareMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {segments.map((seg) => (
            <GlassCard
              key={seg.id}
              className="p-6 group hover:scale-[1.01] transition-transform duration-300"
              glow
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: CLUSTER_COLORS[seg.id % CLUSTER_COLORS.length] }}
                  />
                  <h3 className="text-lg font-bold text-white">{seg.name}</h3>
                </div>
                <Badge color="gray">cluster_{String(seg.id).padStart(2, '0')}</Badge>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <Users className="w-3 h-3" />
                    Viewers
                  </div>
                  <p className="text-lg font-bold text-white">{seg.viewer_count}</p>
                  <p className="text-xs text-gray-500">{seg.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <Clock className="w-3 h-3" />
                    Watch
                  </div>
                  <p className="text-lg font-bold text-white">{seg.avg_watch_time.toFixed(0)}h</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <Timer className="w-3 h-3" />
                    Session
                  </div>
                  <p className="text-lg font-bold text-white">{seg.avg_session_duration.toFixed(0)}m</p>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </div>
                  <p className="text-lg font-bold text-white">{Math.round(seg.avg_completion_rate * 100)}%</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Dominant Genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {seg.dominant_genres.map((g) => (
                    <Badge key={g} color="gray">{g}</Badge>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">How this segment behaves</p>
                <p className="text-xs text-gray-300 leading-relaxed">{seg.description}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {seg.behavioral_traits.map((trait) => (
                  <span key={trait} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">
                    {trait}
                  </span>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Segment A</label>
                <select
                  value={segA}
                  onChange={(e) => setSegA(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none"
                >
                  {segments.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0a0a0f]">{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Segment B</label>
                <select
                  value={segB}
                  onChange={(e) => setSegB(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none"
                >
                  {segments.map((s) => (
                    <option key={s.id} value={s.id} className="bg-[#0a0a0f]">{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          {segmentA && segmentB && (
            <GlassCard className="p-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLUSTER_COLORS[segmentA.id % CLUSTER_COLORS.length] }} />
                    <span className="text-sm font-bold text-white">{segmentA.name}</span>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-500 uppercase tracking-wider self-center">
                  Comparison
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: CLUSTER_COLORS[segmentB.id % CLUSTER_COLORS.length] }} />
                    <span className="text-sm font-bold text-white">{segmentB.name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { label: 'Watch Time', a: `${segmentA.avg_watch_time.toFixed(0)}h`, b: `${segmentB.avg_watch_time.toFixed(0)}h` },
                  { label: 'Session Duration', a: `${segmentA.avg_session_duration.toFixed(0)}m`, b: `${segmentB.avg_session_duration.toFixed(0)}m` },
                  { label: 'Frequency', a: segmentA.avg_frequency > segmentB.avg_frequency ? 'High' : 'Low', b: segmentB.avg_frequency > segmentA.avg_frequency ? 'High' : 'Low' },
                  { label: 'Completion', a: `${Math.round(segmentA.avg_completion_rate * 100)}%`, b: `${Math.round(segmentB.avg_completion_rate * 100)}%` },
                  { label: 'Viewers', a: segmentA.viewer_count.toString(), b: segmentB.viewer_count.toString() },
                ].map((row) => (
                  <div key={row.label} className="grid grid-cols-3 items-center py-2 border-b border-white/5">
                    <div className="text-right text-lg font-bold text-white">{row.a}</div>
                    <div className="text-center text-xs text-gray-400 uppercase tracking-wider">{row.label}</div>
                    <div className="text-lg font-bold text-white">{row.b}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {segmentA.dominant_genres.map((g) => <Badge key={g} color="gray">{g}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5">Genres</p>
                  <div className="flex flex-wrap gap-1.5">
                    {segmentB.dominant_genres.map((g) => <Badge key={g} color="gray">{g}</Badge>)}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
