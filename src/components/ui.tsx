import type { ReactNode } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

export function GlassCard({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl transition-all duration-300 hover:border-white/20 ${
        glow ? 'shadow-lg shadow-amber-500/5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  icon: Icon,
  accent = 'amber',
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'amber' | 'blue' | 'green' | 'purple' | 'rose';
}) {
  const accentColors: Record<string, string> = {
    amber: 'from-amber-400/20 to-orange-500/5 text-amber-400',
    blue: 'from-blue-400/20 to-cyan-500/5 text-blue-400',
    green: 'from-green-400/20 to-emerald-500/5 text-green-400',
    purple: 'from-purple-400/20 to-indigo-500/5 text-purple-400',
    rose: 'from-rose-400/20 to-pink-500/5 text-rose-400',
  };

  return (
    <GlassCard className="p-5 group hover:scale-[1.02] transition-transform duration-300" glow>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${accentColors[accent]} flex items-center justify-center`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        <AnimatedCounter
          value={value}
          decimals={decimals}
          suffix={suffix}
          prefix={prefix}
        />
      </div>
    </GlassCard>
  );
}

export function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded-full border-2 border-orange-500/30 border-b-transparent animate-spin-slow" />
      </div>
      <p className="text-sm text-gray-400 animate-pulse">{label}</p>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-sm text-gray-400">{subtitle}</p>}
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = 'amber',
}: {
  children: ReactNode;
  color?: 'amber' | 'green' | 'red' | 'blue' | 'gray';
}) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gray: 'bg-white/5 text-gray-400 border-white/10',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

export function PosterPlaceholder({ genre }: { genre: string }) {
  const genreColors: Record<string, string> = {
    'Sci-Fi': 'from-indigo-600 to-purple-800',
    Action: 'from-red-600 to-orange-800',
    Thriller: 'from-gray-700 to-slate-900',
    Adventure: 'from-emerald-600 to-teal-800',
    Romance: 'from-pink-600 to-rose-800',
    Comedy: 'from-yellow-500 to-amber-700',
    Drama: 'from-blue-700 to-indigo-900',
  };
  const gradient = genreColors[genre] || 'from-gray-600 to-gray-800';
  return (
    <div
      className={`w-full aspect-[2/3] rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 left-2 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute bottom-2 right-2 w-16 h-16 rounded-full bg-white/10 blur-lg" />
      </div>
      <span className="text-white font-bold text-lg tracking-tight relative z-10">
        {genre}
      </span>
    </div>
  );
}
