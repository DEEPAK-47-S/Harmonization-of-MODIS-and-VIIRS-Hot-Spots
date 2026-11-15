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
  X,
  Radio
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
    label: 'Monitoring',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/fire-map', label: 'Active Fire Map', icon: MapIcon },
      { to: '/calendar', label: 'Burning Calendar', icon: Calendar },
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/comparison', label: 'Sensor Comparison', icon: GitCompare },
      { to: '/trends', label: 'Historical Trends', icon: TrendingUp },
      { to: '/insights', label: 'Anomaly Detection', icon: AlertTriangle },
    ]
  },
  {
    label: 'Global Intelligence',
    items: [
      { to: '/global-explorer', label: 'Global Explorer', icon: Globe2 },
      { to: '/time-machine', label: 'Time Machine', icon: Clock },
      { to: '/country-comparison', label: 'Country Benchmark', icon: BarChart3 },
    ]
  },
  {
    label: 'Platform',
    items: [
      { to: '/coverage', label: 'Sensor Coverage', icon: Layers },
      { to: '/data-sources', label: 'FIRMS Sources', icon: Radio },
      { to: '/about', label: 'Documentation', icon: BookOpen },
      { to: '/settings', label: 'Data Ingestion', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC = () => {
  const { isMobileOpen, closeMobile } = useNav();

  const renderNavContent = () => (
    <div className="flex flex-col h-full justify-between bg-white text-slate-800">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-orange-600 flex items-center justify-center text-white shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex items-baseline space-x-2">
              <span className="font-bold text-sm tracking-tight text-slate-900">FirePulse</span>
              <span className="text-[10px] font-mono text-slate-500 font-medium">1km Grid</span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={closeMobile}
            className="md:hidden p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="p-2 space-y-4 overflow-y-auto flex-1">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 select-none">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        `flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-200/90 bg-slate-50/70 shrink-0">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-medium text-slate-700">NASA LANCE</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">EPSG:6933</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-[210px] bg-white border-r border-slate-200/90 flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            onClick={closeMobile}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />
          <div className="relative w-[260px] max-w-[80vw] bg-white h-full shadow-xl flex flex-col z-10 border-r border-slate-200">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
