import { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowRight, ArrowDown } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getPipeline } from '@/services/api';
import type { WhatIfResult } from '@/types';

const ALL_GENRES = ['Action', 'Sci-Fi', 'Thriller', 'Comedy', 'Drama', 'Romance', 'Adventure'];

const CLUSTER_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#ec4899'];

export function WhatIfPage() {
  const pipeline = getPipeline();
  const segments = pipeline.segments;

  const [current, setCurrent] = useState({
    watch_time_hours: 42,
    avg_session_mins: 38,
    session_frequency: 12,
    completion_rate: 0.84,
    top_genres: ['Action', 'Sci-Fi'],
  });

  const [modified, setModified] = useState({ ...current });

  const currentResult = useMemo(() => {
    return pipeline.predictSegment(current);
  }, [pipeline, current]);

  const whatIfResult: WhatIfResult = useMemo(() => {
    return pipeline.whatIf(
      { segmentId: currentResult.segmentId, segmentName: currentResult.segmentName },
      modified
    );
  }, [pipeline, currentResult, modified]);

  const handleModifiedGenreToggle = (g: string) => {
    setModified((m) => ({
      ...m,
      top_genres: m.top_genres.includes(g) ? m.top_genres.filter((x) => x !== g) : [...m.top_genres, g],
    }));
  };

  const handleReset = () => setModified({ ...current });

  const maxDistance = Math.max(...whatIfResult.cluster_distances.map((d) => d.distance));

  return (
    <div className="space-y-6">
      <PageHeader
        title="What-If Simulator"
        subtitle="Modify viewer behavior and see how the predicted segment changes in real time."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Profile */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Current Profile</h3>
          <div className="space-y-3">
            <ProfileField label="Watch Time" value={`${current.watch_time_hours}h`} />
            <ProfileField label="Session Duration" value={`${current.avg_session_mins}m`} />
            <ProfileField label="Frequency" value={current.session_frequency.toString()} />
            <ProfileField label="Completion" value={`${Math.round(current.completion_rate * 100)}%`} />
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {current.top_genres.map((g) => <Badge key={g} color="gray">{g}</Badge>)}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-400">Current Segment</p>
            <p className="text-lg font-bold text-white">{currentResult.segmentName}</p>
          </div>
        </GlassCard>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div className="hidden lg:block">
            <ArrowRight className="w-8 h-8 text-amber-400/50" />
          </div>
          <div className="lg:hidden">
            <ArrowDown className="w-8 h-8 text-amber-400/50" />
          </div>
        </div>

        {/* Modified Profile */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Modified Profile</h3>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Reset
            </button>
          </div>
          <div className="space-y-3">
            <SliderField
              label="Watch Time"
              value={modified.watch_time_hours}
              min={0}
              max={60}
              suffix="h"
              onChange={(v) => setModified({ ...modified, watch_time_hours: v })}
            />
            <SliderField
              label="Session Duration"
              value={modified.avg_session_mins}
              min={0}
              max={60}
              suffix="m"
              onChange={(v) => setModified({ ...modified, avg_session_mins: v })}
            />
            <SliderField
              label="Frequency"
              value={modified.session_frequency}
              min={0}
              max={20}
              suffix=""
              onChange={(v) => setModified({ ...modified, session_frequency: v })}
            />
            <SliderField
              label="Completion"
              value={modified.completion_rate}
              min={0}
              max={1}
              step={0.01}
              suffix=""
              display={`${Math.round(modified.completion_rate * 100)}%`}
              onChange={(v) => setModified({ ...modified, completion_rate: v })}
            />
            <div>
              <p className="text-xs text-gray-400 mb-1.5">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => handleModifiedGenreToggle(g)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      modified.top_genres.includes(g)
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Predicted segment */}
        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-semibold text-white mb-4">Predicted Segment</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">From</p>
              <Badge color="gray">{whatIfResult.current_segment_name}</Badge>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-400 hidden lg:block" />
            <ArrowDown className="w-5 h-5 text-amber-400 lg:hidden" />
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">To</p>
              <Badge color={whatIfResult.changed ? 'amber' : 'green'}>
                {whatIfResult.simulated_segment_name}
              </Badge>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">What changed?</p>
            <p className="text-sm text-white">{whatIfResult.explanation}</p>
          </div>
        </GlassCard>

        {/* Cluster distances */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Cluster Distances</h3>
          <div className="space-y-3">
            {whatIfResult.cluster_distances.map((d) => (
              <div key={d.cluster}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length] }}
                    />
                    <span className="text-gray-400">{d.name}</span>
                  </span>
                  <span className={d.cluster === whatIfResult.simulated_segment ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                    {d.distance.toFixed(2)}
                    {d.cluster === whatIfResult.simulated_segment && ' ← Selected'}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(1 - d.distance / maxDistance) * 100}%`,
                      background: CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  display?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{display || `${value}${suffix}`}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-amber-500"
      />
    </div>
  );
}
