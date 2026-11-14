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
        <div className="p-4 sm:p-5 border-b border-[#E1DED5] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#E65C35] flex items-center justify-center text-white shadow-sm shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-semibold text-lg tracking-tight text-[#252923]">FirePulse</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#EBE8DF] text-[#777970] border border-[#E1DED5]">2026</span>
              </div>
              <p className="text-[11px] text-[#777970] font-sans truncate">NASA Active-Fire Intelligence</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button 
            onClick={closeMobile}
            className="md:hidden p-1.5 rounded-md text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3] transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="p-3 space-y-4 overflow-y-auto flex-1">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <h4 className="px-2.5 text-[10px] font-mono uppercase tracking-wider text-[#777970] font-semibold">
                {group.label}
              </h4>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobile}
                      className={({ isActive }) =>
                        `flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#FCECE7] text-[#E65C35] font-semibold shadow-xs'
                            : 'text-[#252923] hover:bg-[#F4F1E9] hover:text-[#252923]'
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
      <div className="p-3.5 border-t border-[#E1DED5] bg-[#FAF8F3] shrink-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#54785E]"></span>
          <span className="text-xs font-medium text-[#252923]">Team Virtual Warriors</span>
        </div>
        <p className="text-[10px] text-[#777970] leading-tight">
          NASA Space Apps Challenge 2026<br />
          Harmonization of MODIS &amp; VIIRS Hot Spots
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex w-[230px] bg-white border-r border-[#E1DED5] flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (Slide-over with Backdrop) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={closeMobile}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-left border-r border-[#E1DED5]">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
