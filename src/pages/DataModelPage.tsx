import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getPipeline } from '@/services/api';
import { Database, Cpu, Gauge, GitBranch, Filter, ArrowDown } from 'lucide-react';

export function DataModelPage() {
  const pipeline = getPipeline();
  const modelInfo = pipeline.getModelInfo();
  const dataQuality = pipeline.dataQuality;
  const segments = pipeline.segments;

  const pipelineSteps = [
    { label: 'Raw Dataset', icon: Database, detail: `${dataQuality.total_rows} rows` },
    { label: 'Validation', icon: Filter, detail: `${dataQuality.missing_values} missing, ${dataQuality.invalid_numeric} invalid` },
    { label: 'Cleaning', icon: Filter, detail: `${dataQuality.rows_removed} removed` },
    { label: 'Feature Engineering', icon: Cpu, detail: '5 behavioral features' },
    { label: 'ML Ready Dataset', icon: Gauge, detail: `${dataQuality.clean_rows} rows` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data & Model"
        subtitle="Inspect the dataset quality, ML pipeline, and model configuration."
      />

      {/* Model Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" glow>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Model Information</h3>
          </div>
          <div className="space-y-3">
            <ModelRow label="Algorithm" value={modelInfo.algorithm} />
            <ModelRow label="Preprocessing" value={modelInfo.preprocessing} />
            <ModelRow label="Random Seed" value={modelInfo.random_seed.toString()} />
            <ModelRow label="Number of Clusters" value={modelInfo.n_clusters.toString()} />
            <ModelRow label="Inertia" value={modelInfo.inertia.toFixed(2)} />
            <ModelRow label="Silhouette Score" value={modelInfo.silhouette_score.toFixed(4)} />
            <ModelRow
              label="Model Status"
              value={modelInfo.model_loaded ? 'Loaded' : 'Not Loaded'}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-400 mb-2">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {modelInfo.features.map((f) => (
                <Badge key={f} color="gray">{f}</Badge>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Why this K */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Why this K?</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">
            K was selected by comparing silhouette scores across K=2..6. The K with
            the highest silhouette score was chosen, indicating the best-defined
            cluster separation.
          </p>
          <div className="space-y-2">
            {modelInfo.k_selection.map((k) => (
              <div
                key={k.k}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                  k.k === modelInfo.n_clusters
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : 'bg-white/5 border-white/5'
                }`}
              >
                <span className="text-sm text-white font-medium">K = {k.k}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400">Inertia: {k.inertia.toFixed(1)}</span>
                  <span className={k.k === modelInfo.n_clusters ? 'text-amber-400 font-bold' : 'text-gray-300'}>
                    Silhouette: {k.silhouette.toFixed(4)}
                  </span>
                  {k.k === modelInfo.n_clusters && <Badge color="amber">Selected</Badge>}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Data Quality */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Data Quality</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <DataQualityCard label="Total Rows" value={dataQuality.total_rows} />
          <DataQualityCard label="Duplicates" value={dataQuality.duplicate_rows} />
          <DataQualityCard label="Missing Values" value={dataQuality.missing_values} />
          <DataQualityCard label="Invalid Numeric" value={dataQuality.invalid_numeric} />
          <DataQualityCard label="Unknown Categories" value={dataQuality.unknown_categories} />
          <DataQualityCard label="Clean Rows" value={dataQuality.clean_rows} />
          <DataQualityCard label="Rows Removed" value={dataQuality.rows_removed} />
        </div>
      </GlassCard>

      {/* Pipeline visualization */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-white mb-6">ML Pipeline</h3>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0">
          {pipelineSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center gap-2 md:flex-1 md:flex-col">
                <div className="flex-1 flex flex-col items-center text-center md:px-2">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-xs font-semibold text-white">{step.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{step.detail}</p>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-amber-400/50 md:rotate-[-90deg] md:mb-12" />
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* AI Insight */}
      <GlassCard className="p-6" glow>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-amber-400 text-lg">AI</span>
          <h3 className="text-sm font-semibold text-white">Audience Insight</h3>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {pipeline.generateInsight()}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Generated deterministically from actual cluster statistics. No LLM used.
        </p>
      </GlassCard>

      {/* Cluster profiles */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Cluster Profiles</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-white/5">
                <th className="text-left py-2 px-2">Segment</th>
                <th className="text-right py-2 px-2">Viewers</th>
                <th className="text-right py-2 px-2">Watch Time</th>
                <th className="text-right py-2 px-2">Session</th>
                <th className="text-right py-2 px-2">Frequency</th>
                <th className="text-right py-2 px-2">Completion</th>
                <th className="text-left py-2 px-2">Genres</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 px-2 text-white font-medium">{s.name}</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">{s.viewer_count}</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">{s.avg_watch_time.toFixed(1)}h</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">{s.avg_session_duration.toFixed(1)}m</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">{s.avg_frequency.toFixed(1)}</td>
                  <td className="py-2.5 px-2 text-right text-gray-300">{Math.round(s.avg_completion_rate * 100)}%</td>
                  <td className="py-2.5 px-2">
                    <div className="flex gap-1">
                      {s.dominant_genres.map((g) => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400">{g}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

function ModelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium">{value}</span>
    </div>
  );
}

function DataQualityCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/5 p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
