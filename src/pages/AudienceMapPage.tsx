import { useMemo, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getPipeline } from '@/services/api';

const CLUSTER_COLORS = [
  '#f59e0b',
  '#3b82f6',
  '#10b981',
  '#a855f7',
  '#ef4444',
  '#ec4899',
];

export function AudienceMapPage() {
  const pipeline = getPipeline();
  const points = pipeline.clusterPoints;
  const segments = pipeline.segments;

  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const bounds = useMemo(() => {
    if (!points.length) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [points]);

  const W = 800;
  const H = 500;
  const padding = 40;

  const scaleX = (x: number) =>
    padding + ((x - bounds.minX) / (bounds.maxX - bounds.minX || 1)) * (W - 2 * padding);
  const scaleY = (y: number) =>
    padding + (1 - (y - bounds.minY) / (bounds.maxY - bounds.minY || 1)) * (H - 2 * padding);

  const selectedSegment = selectedCluster !== null
    ? segments.find((s) => s.id === selectedCluster)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audience Map"
        subtitle="Each point is a viewer. Similar behavioral patterns cluster together."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map */}
        <div className="lg:col-span-3">
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                {segments.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedCluster(selectedCluster === s.id ? null : s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedCluster === s.id
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: CLUSTER_COLORS[s.id % CLUSTER_COLORS.length] }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setZoom((z) => Math.min(z * 1.3, 5))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z / 1.3, 0.5))}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setZoom(1); setSelectedCluster(null); }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl bg-black/20" style={{ height: H }}>
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-full"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.3s' }}
              >
                {/* Grid */}
                {[0.2, 0.4, 0.6, 0.8].map((v) => (
                  <g key={v}>
                    <line x1={padding} y1={padding + v * (H - 2 * padding)} x2={W - padding} y2={padding + v * (H - 2 * padding)} stroke="rgba(255,255,255,0.03)" />
                    <line x1={padding + v * (W - 2 * padding)} y1={padding} x2={padding + v * (W - 2 * padding)} y2={H - padding} stroke="rgba(255,255,255,0.03)" />
                  </g>
                ))}

                {/* Points */}
                {points.map((p) => {
                  const cx = scaleX(p.x);
                  const cy = scaleY(p.y);
                  const color = CLUSTER_COLORS[p.cluster % CLUSTER_COLORS.length];
                  const dim = selectedCluster !== null && p.cluster !== selectedCluster;
                  const isHovered = hoveredUser === p.user_id;
                  return (
                    <g key={p.user_id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 7 : 4}
                    fill={color}
                    opacity={dim ? 0.15 : 0.7}
                    stroke={isHovered ? '#fff' : 'transparent'}
                    strokeWidth={isHovered ? 2 : 0}
                    style={{ transition: 'r 0.15s, opacity 0.2s', cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredUser(p.user_id)}
                    onMouseLeave={() => setHoveredUser(null)}
                    onClick={() => setSelectedCluster(p.cluster)}
                  />
                  {isHovered && (
                    <text x={cx + 10} y={cy - 10} fill="#fff" fontSize={11} className="pointer-events-none">
                      {p.user_id}
                    </text>
                  )}
                    </g>
                  );
                })}
              </svg>

              {hoveredUser && (
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-white border border-white/10">
                  {(() => {
                    const p = points.find((pt) => pt.user_id === hoveredUser);
                    if (!p) return null;
                    return (
                      <div className="space-y-0.5">
                        <div className="font-bold">{p.user_id}</div>
                        <div className="text-gray-400">Watch: {p.watch_time_hours}h</div>
                        <div className="text-gray-400">Session: {p.avg_session_mins}m</div>
                        <div className="text-gray-400">Completion: {Math.round(p.completion_rate * 100)}%</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Cluster details */}
        <div>
          {!selectedSegment ? (
            <GlassCard className="p-6 h-full flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500">
                Click a cluster label or a point to see segment details.
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="p-5 space-y-4" glow>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: CLUSTER_COLORS[selectedSegment.id % CLUSTER_COLORS.length] }}
                />
                <h3 className="text-sm font-bold text-white">{selectedSegment.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Viewers</p>
                  <p className="text-lg font-bold text-white">{selectedSegment.viewer_count}</p>
                </div>
                <div>
                  <p className="text-gray-400">Percentage</p>
                  <p className="text-lg font-bold text-white">{selectedSegment.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Avg Watch</p>
                  <p className="text-lg font-bold text-white">{selectedSegment.avg_watch_time.toFixed(0)}h</p>
                </div>
                <div>
                  <p className="text-gray-400">Avg Session</p>
                  <p className="text-lg font-bold text-white">{selectedSegment.avg_session_duration.toFixed(0)}m</p>
                </div>
                <div>
                  <p className="text-gray-400">Completion</p>
                  <p className="text-lg font-bold text-white">{Math.round(selectedSegment.avg_completion_rate * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Frequency</p>
                  <p className="text-lg font-bold text-white">{selectedSegment.avg_frequency.toFixed(0)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Dominant Genres</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSegment.dominant_genres.map((g) => (
                    <Badge key={g} color="gray">{g}</Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{selectedSegment.description}</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
