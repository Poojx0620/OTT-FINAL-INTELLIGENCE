import { useMemo, useState } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Search, Dna } from 'lucide-react';
import { GlassCard, PageHeader, Badge } from '@/components/ui';
import { getPipeline, getViewerData } from '@/services/api';
import type { ViewerProfile } from '@/types';

export function AudienceDNAPage() {
  const data = getViewerData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<ViewerProfile | null>(null);

  const pipeline = getPipeline();
  const segments = pipeline.segments;

  const searchResults = useMemo(() => {
    if (!searchQuery) return data.slice(0, 8);
    return data.filter((v) => v.user_id.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8);
  }, [searchQuery, data]);

  const dnaData = useMemo(() => {
    if (!selectedUser) return [];
    return [
      { metric: 'Watch Time', value: Math.min((selectedUser.watch_time_hours / 60) * 100, 100) },
      { metric: 'Session Activity', value: Math.min((selectedUser.avg_session_mins / 50) * 100, 100) },
      { metric: 'Frequency', value: Math.min((selectedUser.session_frequency / 20) * 100, 100) },
      { metric: 'Completion', value: selectedUser.completion_rate * 100 },
      { metric: 'Diversity', value: selectedUser.genre_diversity * 100 },
      { metric: 'Engagement', value: Math.min(((selectedUser.watch_time_hours * selectedUser.session_frequency) / 800) * 100, 100) },
    ];
  }, [selectedUser]);

  const segmentResult = useMemo(() => {
    if (!selectedUser) return null;
    return pipeline.predictSegment(selectedUser);
  }, [selectedUser, pipeline]);

  const clusterAvg = useMemo(() => {
    if (!segmentResult) return null;
    return pipeline.clusterProfiles[segmentResult.segmentId];
  }, [segmentResult, pipeline]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audience DNA"
        subtitle="Visualize the behavioral profile of any viewer as a unique fingerprint."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search panel */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Search Viewer</h3>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter user ID..."
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 outline-none focus:border-amber-500/50 transition-colors"
          />
          <div className="mt-3 space-y-1 max-h-72 overflow-y-auto">
            {searchResults.map((v) => (
              <button
                key={v.user_id}
                onClick={() => setSelectedUser(v)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedUser?.user_id === v.user_id
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{v.user_id}</span>
                <span className="text-xs text-gray-500">{v.watch_time_hours}h</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* DNA Visualization */}
        <div className="lg:col-span-2">
          {!selectedUser ? (
            <GlassCard className="p-12 flex flex-col items-center justify-center h-full">
              <Dna className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-gray-500 text-sm">Select a viewer to see their Audience DNA</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedUser.user_id}</h3>
                    <p className="text-xs text-gray-400">Behavioral DNA Profile</p>
                  </div>
                  {segmentResult && (
                    <Badge color="amber">
                      {segmentResult.segmentName}
                    </Badge>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={dnaData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      domain={[0, 100]}
                      tick={{ fill: '#4b5563', fontSize: 9 }}
                      axisLine={false}
                    />
                    <Radar
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      animationDuration={800}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </GlassCard>

              {/* DNA bars */}
              <GlassCard className="p-6">
                <h4 className="text-sm font-semibold text-white mb-4">DNA Breakdown</h4>
                <div className="space-y-3">
                  {dnaData.map((d) => (
                    <div key={d.metric}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">{d.metric}</span>
                        <span className="text-white font-medium">{Math.round(d.value)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                          style={{ width: `${d.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Why this segment */}
      {selectedUser && segmentResult && clusterAvg && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-2">Why am I in this segment?</h3>
          <p className="text-sm text-gray-400 mb-6">
            You are grouped into{' '}
            <span className="text-amber-400 font-medium">{segmentResult.segmentName}</span>{' '}
            because your{' '}
            {selectedUser.watch_time_hours > clusterAvg.avg[0] ? 'watch time and session frequency are higher' : 'watch time and session frequency are lower'}{' '}
            than the average viewer in this cluster.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Watch Time', user: selectedUser.watch_time_hours, cluster: clusterAvg.avg[0], unit: 'h' },
              { label: 'Session Duration', user: selectedUser.avg_session_mins, cluster: clusterAvg.avg[1], unit: 'm' },
              { label: 'Frequency', user: selectedUser.session_frequency, cluster: clusterAvg.avg[2], unit: '' },
              { label: 'Completion', user: selectedUser.completion_rate * 100, cluster: clusterAvg.avg[3] * 100, unit: '%' },
            ].map((row) => (
              <div key={row.label} className="rounded-xl bg-white/5 p-4 border border-white/5">
                <p className="text-xs text-gray-400 mb-2">{row.label}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">You</span>
                    <span className="text-white font-medium">
                      {row.user.toFixed(row.unit === '%' ? 0 : 1)}{row.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cluster Avg</span>
                    <span className="text-amber-400 font-medium">
                      {row.cluster.toFixed(row.unit === '%' ? 0 : 1)}{row.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-gray-400">Distance to centroid:</span>
            <Badge color="blue">{segmentResult.distance.toFixed(3)}</Badge>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
