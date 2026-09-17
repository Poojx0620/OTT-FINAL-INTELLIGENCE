import { useState, useMemo, useEffect } from 'react';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { OverviewPage } from '@/pages/OverviewPage';
import { AudienceDNAPage } from '@/pages/AudienceDNAPage';
import { AudienceMapPage } from '@/pages/AudienceMapPage';
import { AnalyzeUserPage } from '@/pages/AnalyzeUserPage';
import { SegmentsPage } from '@/pages/SegmentsPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';
import { WhatIfPage } from '@/pages/WhatIfPage';
import { APIPlaygroundPage } from '@/pages/APIPlaygroundPage';
import { EvaluationPage } from '@/pages/EvaluationPage';
import { SystemHealthPage } from '@/pages/SystemHealthPage';
import { DataModelPage } from '@/pages/DataModelPage';
import { getPipeline } from '@/services/api';
import type { SystemStats } from '@/types';

function App() {
  const [page, setPage] = useState<PageId>('overview');
  const [transitioning, setTransitioning] = useState(false);

  const stats: SystemStats = useMemo(() => {
    const p = getPipeline();
    const avgWatch = p.rawFeatures.reduce((s, r) => s + r[0], 0) / p.rawFeatures.length;
    const avgSession = p.rawFeatures.reduce((s, r) => s + r[1], 0) / p.rawFeatures.length;
    return {
      total_viewers: p.data.length,
      n_segments: p.segments.length,
      avg_watch_time: Math.round(avgWatch),
      avg_session: Math.round(avgSession),
      silhouette_score: p.silhouette,
      model_status: 'Loaded',
    };
  }, []);

  const handleNavigate = (target: PageId) => {
    if (target === page) return;
    setTransitioning(true);
    setTimeout(() => {
      setPage(target);
      setTransitioning(false);
    }, 200);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="min-h-screen bg-[#08080c] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/[0.02] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.02] rounded-full blur-[100px]" />
      </div>

      <Sidebar
        currentPage={page}
        onNavigate={handleNavigate}
        modelStatus="Loaded"
        apiStatus="Healthy"
      />

      {/* Main content */}
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen relative">
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
          <div className={`transition-all duration-200 ${transitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
            {page === 'overview' && <OverviewPage stats={stats} onNavigate={handleNavigate} />}
            {page === 'dna' && <AudienceDNAPage />}
            {page === 'map' && <AudienceMapPage />}
            {page === 'analyze' && <AnalyzeUserPage />}
            {page === 'segments' && <SegmentsPage />}
            {page === 'recommendations' && <RecommendationsPage />}
            {page === 'whatif' && <WhatIfPage />}
            {page === 'api' && <APIPlaygroundPage />}
            {page === 'evaluation' && <EvaluationPage />}
            {page === 'health' && <SystemHealthPage />}
            {page === 'data' && <DataModelPage />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
