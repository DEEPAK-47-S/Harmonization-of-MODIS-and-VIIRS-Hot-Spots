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
  BookOpen,
  Globe
} from 'lucide-react';

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
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    label: 'Monitor',
    items: [
      { to: '/fire-map', label: 'Fire Map', icon: MapIcon },
      { to: '/calendar', label: 'Burning Calendar', icon: Calendar },
      { to: '/comparison', label: 'Sensor Comparison', icon: GitCompare },
    ]
  },
  {
    label: 'Analyze',
    items: [
      { to: '/trends', label: 'Historical Trends', icon: TrendingUp },
      { to: '/insights', label: 'Unusual Activity', icon: AlertTriangle },
    ]
  },
  {
    label: 'Resources',
    items: [
      { to: '/data-sources', label: 'Data Sources', icon: Database },
      { to: '/about', label: 'Methodology', icon: BookOpen },
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[230px] bg-white border-r border-[#E1DED5] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="p-5 border-b border-[#E1DED5] flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-[#E65C35] flex items-center justify-center text-white shadow-sm shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-semibold text-lg tracking-tight text-[#252923]">FirePulse</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#EBE8DF] text-[#777970] border border-[#E1DED5]">2026</span>
            </div>
            <p className="text-[11px] text-[#777970] font-sans truncate">Earth Observation Intel</p>
          </div>
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
                      className={({ isActive }) =>
                        `flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#FCECE7] text-[#E65C35] font-semibold'
                            : 'text-[#252923] hover:bg-[#F4F1E9] hover:text-[#252923]'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0 opacity-70" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Attribution & Context Footer */}
      <div className="p-4 border-t border-[#E1DED5] bg-[#FAF8F3] shrink-0 text-left">
        <div className="flex items-center space-x-1.5 mb-1 text-[11px] font-medium text-[#252923]">
          <Globe className="w-3.5 h-3.5 text-[#54785E]" />
          <span>Team Virtual Warriors</span>
        </div>
        <p className="text-[10px] text-[#777970] leading-relaxed">
          NASA FIRMS MODIS &amp; VIIRS harmonization research prototype.
        </p>
      </div>
    </aside>
  );
};
