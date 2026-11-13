import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Flame, 
  LayoutDashboard, 
  Map as MapIcon, 
  Calendar, 
  GitCompare, 
  TrendingUp, 
  AlertTriangle, 
  Database, 
  Settings,
  Satellite,
  BookOpen
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/fire-map', label: 'Interactive Map', icon: MapIcon },
  { to: '/calendar', label: 'Burning Calendar', icon: Calendar },
  { to: '/comparison', label: 'Sensor Comparison', icon: GitCompare },
  { to: '/trends', label: 'Historical Trends', icon: TrendingUp },
  { to: '/insights', label: 'Unusual Activity', icon: AlertTriangle },
  { to: '/data-sources', label: 'NASA Data Sources', icon: Database },
  { to: '/about', label: 'Methodology', icon: BookOpen },
  { to: '/settings', label: 'Settings & Ingestion', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none">
      <div className="flex flex-col min-h-0">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">FirePulse</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">2026</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">MODIS + VIIRS Harmonization</p>
          </div>
        </div>

        {/* Navigation — scrollable */}
        <nav className="p-3 space-y-0.5 overflow-y-auto flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600/20 to-amber-600/10 text-orange-400 border border-orange-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Attribution */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
        <div className="flex items-center space-x-2 mb-2 text-slate-400 text-xs">
          <Satellite className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-300">Team: Virtual Warriors</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Independent student project using NASA FIRMS active-fire data. Not an official NASA emergency warning system.
        </p>
        <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
          <span>NASA Space Apps Challenge 2026</span>
        </div>
      </div>
    </aside>
  );
};
