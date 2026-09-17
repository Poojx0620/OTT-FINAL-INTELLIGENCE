import { Users, Layers, Clock, Timer, Gauge, CircleCheck } from 'lucide-react';
import { GlassCard, StatCard } from '@/components/ui';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import type { SystemStats } from '@/types';
import type { PageId } from '@/components/Sidebar';

export function OverviewPage({
  stats,
  onNavigate,
}: {
  stats: SystemStats;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c0c14] via-[#11111c] to-[#0a0a0f] border border-white/10 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-Powered Audience Intelligence
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Understand Your Audience.
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Personalize Every Stream.
            </span>
          </h1>
          <p className="mt-4 text-base text-gray-400 max-w-xl leading-relaxed">
            Turn viewer behavior into meaningful audience segments and personalized
            content recommendations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('analyze')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold text-sm hover:scale-105 transition-transform duration-200 shadow-lg shadow-amber-500/20"
            >
              Analyze Viewer
            </button>
            <button
              onClick={() => onNavigate('segments')}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition-colors duration-200"
            >
              Explore Segments
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Viewers Analyzed"
          value={stats.total_viewers}
          icon={Users}
          accent="amber"
        />
        <StatCard
          label="Audience Segments"
          value={stats.n_segments}
          icon={Layers}
          accent="blue"
        />
        <StatCard
          label="Avg Watch Time"
          value={stats.avg_watch_time}
          suffix="h"
          icon={Clock}
          accent="green"
        />
        <StatCard
          label="Avg Session"
          value={stats.avg_session}
          suffix=" min"
          icon={Timer}
          accent="purple"
        />
        <StatCard
          label="Silhouette Score"
          value={stats.silhouette_score}
          decimals={2}
          icon={Gauge}
          accent="rose"
        />
        <StatCard
          label="Model Status"
          value={0}
          icon={CircleCheck}
          accent="green"
        />
      </div>

      {/* Override last card with text status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 -mt-4">
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-2">The Pipeline</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-gray-400">
            {['Raw Data', 'Cleaning', 'Features', 'Scaling', 'KMeans', 'Segments', 'Recommendations'].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">{step}</span>
                {i < arr.length - 1 && <span className="text-amber-400/50">→</span>}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="text-sm font-semibold text-white mb-2">Model Status</h3>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-gray-300">{stats.model_status}</span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            KMeans clustering with StandardScaler preprocessing. Deterministic seed for reproducibility.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
