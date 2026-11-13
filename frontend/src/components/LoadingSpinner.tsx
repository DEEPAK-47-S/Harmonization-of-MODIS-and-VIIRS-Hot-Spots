import React from 'react';
import { Flame } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<Props> = ({ size = 'md', text }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-16 text-slate-500">
      <Flame className={`${sizes[size]} text-orange-500 animate-pulse`} />
      <p className="text-sm">{text || 'Loading…'}</p>
    </div>
  );
};

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-800/60 ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <SkeletonBlock key={i} className="h-24" />
      ))}
    </div>
    <SkeletonBlock className="h-64" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {[1, 2, 3].map(i => (
        <SkeletonBlock key={i} className="h-40" />
      ))}
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-2 p-4">
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonBlock key={i} className="h-10" />
    ))}
  </div>
);

