import { useEffect, useState } from 'react';
import { Activity, Server, Box, ClipboardCheck, RefreshCw } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getHealth } from '@/services/api';
import type { HealthStatus } from '@/types';

export function SystemHealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const h = await getHealth();
      setHealth(h);
    } catch {
      setHealth({
        status: 'error',
        model_loaded: false,
        trainer: 'unknown',
        api: 'unreachable',
        evaluator: 'unknown',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const services = [
    { name: 'Trainer', status: health?.trainer || 'checking', icon: Box },
    { name: 'API', status: health?.api || 'checking', icon: Server },
    { name: 'Model', status: health?.model_loaded ? 'Loaded' : 'Not Loaded', icon: Activity },
    { name: 'Evaluator', status: health?.evaluator || 'checking', icon: ClipboardCheck },
  ];

  const getStatusColor = (status: string): 'green' | 'red' | 'gray' => {
    if (status.includes('ok') || status.includes('healthy') || status.includes('completed') || status.includes('Loaded')) return 'green';
    if (status.includes('error') || status.includes('unreachable') || status.includes('Not')) return 'red';
    return 'gray';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        subtitle="Monitor the status of all services in the OTT Audience Intelligence platform."
      >
        <div className="mt-4">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map((svc) => {
          const Icon = svc.icon;
          const color = getStatusColor(svc.status);
          return (
            <GlassCard key={svc.name} className="p-5" glow>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-amber-400" />
                </div>
                {color === 'green' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                {color === 'red' && <span className="w-2 h-2 rounded-full bg-red-400" />}
              </div>
              <p className="text-xs text-gray-400 mb-1">{svc.name}</p>
              <Badge color={color}>{svc.status}</Badge>
            </GlassCard>
          );
        })}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-bold">GET</span>
          <span className="text-sm text-gray-400 font-mono">/health</span>
        </div>
        <pre className="px-4 py-3 rounded-lg bg-black/30 border border-white/10 text-sm text-blue-400 font-mono overflow-auto">
{JSON.stringify(
  {
    status: health?.status || 'ok',
    model_loaded: health?.model_loaded ?? true,
  },
  null,
  2
)}
        </pre>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Docker Compose Architecture</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono">trainer</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-400 text-xs">Loads CSV, cleans data, trains KMeans, saves model to /models volume</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-mono">api</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-400 text-xs">Loads persisted model, serves /health and /recommend endpoints</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-mono">evaluator</span>
            <span className="text-gray-500">→</span>
            <span className="text-gray-400 text-xs">Waits for API health, runs tests, generates metrics.json</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
