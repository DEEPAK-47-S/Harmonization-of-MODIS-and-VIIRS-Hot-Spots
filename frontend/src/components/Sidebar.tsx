import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Flame, 
  LayoutDashboard, 
  Globe2,
  Map as MapIcon, 
  Calendar, 
  Clock,
  GitCompare, 
  TrendingUp, 
  AlertTriangle, 
  Settings,
  BookOpen,
  Layers,
  BarChart3,
  X
} from 'lucide-react';
import { useNav } from '../context/NavContext';

interface NavGroup {
  label: string;
  items: {
    to: string;
    label: string;
    icon: React.ElementType;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Monitor',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/fire-map', label: 'Live Fire Map', icon: MapIcon },
      { to: '/calendar', label: 'Burning Calendar', icon: Calendar },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/comparison', label: 'Sensor Comparison', icon: GitCompare },
      { to: '/trends', label: 'Historical Trends', icon: TrendingUp },
      { to: '/insights', label: 'Unusual Activity', icon: AlertTriangle },
    ]
  },
  {
    label: 'Global',
    items: [
      { to: '/global-explorer', label: 'Global Explorer', icon: Globe2 },
      { to: '/time-machine', label: 'Global Time Machine', icon: Clock },
      { to: '/country-comparison', label: 'Country Benchmark', icon: BarChart3 },
    ]
  },
  {
    label: 'Platform',
    items: [
      { to: '/coverage', label: 'Coverage Matrix', icon: Layers },
      { to: '/about', label: 'Methodology', icon: BookOpen },
      { to: '/settings', label: 'Settings & Ingestion', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { isMobileOpen, closeMobile } = useNav();

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-sm shrink-0">
              <Flame className="w-5 h-5 fill-white/20" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900">FirePulse</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">2026</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal truncate">NASA Active-Fire Intelligence</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h4 className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                {group.label}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        `flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-orange-50 text-orange-600 font-semibold border border-orange-200/80 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Team Attribution */}
      <div className="p-3.5 border-t border-slate-200/80 bg-slate-50 shrink-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-slate-800">Team Virtual Warriors</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          NASA Space Apps Challenge 2026<br />
          Harmonization of MODIS &amp; VIIRS Hot Spots
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-[230px] bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={closeMobile}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-left border-r border-slate-200/80">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
