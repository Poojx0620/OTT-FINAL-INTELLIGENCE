import {
  LayoutDashboard,
  Dna,
  Map,
  UserSearch,
  Users,
  Sparkles,
  SlidersHorizontal,
  Code2,
  ClipboardCheck,
  Activity,
  Database,
  Film,
} from 'lucide-react';

export type PageId =
  | 'overview'
  | 'dna'
  | 'map'
  | 'analyze'
  | 'segments'
  | 'recommendations'
  | 'whatif'
  | 'api'
  | 'evaluation'
  | 'health'
  | 'data';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  modelStatus: string;
  apiStatus: string;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof Film }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dna', label: 'Audience DNA', icon: Dna },
  { id: 'map', label: 'Audience Map', icon: Map },
  { id: 'analyze', label: 'Analyze User', icon: UserSearch },
  { id: 'segments', label: 'Segments', icon: Users },
  { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
  { id: 'whatif', label: 'What-If Simulator', icon: SlidersHorizontal },
  { id: 'api', label: 'API Playground', icon: Code2 },
  { id: 'evaluation', label: 'Evaluation', icon: ClipboardCheck },
  { id: 'health', label: 'System Health', icon: Activity },
  { id: 'data', label: 'Data & Model', icon: Database },
];

export function Sidebar({ currentPage, onNavigate, modelStatus, apiStatus }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-[#0a0a0f] border-r border-white/5 z-50">
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Film className="w-5 h-5 text-black" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
                OTT Audience
              </h1>
              <p className="text-xs text-amber-400/80 font-medium tracking-wider">
                INTELLIGENCE
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
                )}
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Model</span>
            <span className="flex items-center gap-1.5 text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {modelStatus}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">API</span>
            <span className="flex items-center gap-1.5 text-green-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {apiStatus}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-lg border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm font-bold text-white">OTT Intelligence</span>
          </div>
          <select
            value={currentPage}
            onChange={(e) => onNavigate(e.target.value as PageId)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
          >
            {NAV_ITEMS.map((item) => (
              <option key={item.id} value={item.id} className="bg-[#0a0a0f]">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </header>
    </>
  );
}
