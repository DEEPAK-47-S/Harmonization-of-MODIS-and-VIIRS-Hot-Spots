import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Calendar, 
  Globe2, 
  Menu 
} from 'lucide-react';
import { useNav } from '../context/NavContext';

export const MobileBottomNav: React.FC = () => {
  const { toggleMobile } = useNav();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/fire-map', label: 'Map', icon: MapIcon },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/global-explorer', label: 'Global', icon: Globe2 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-[#E1DED5] flex items-center justify-around z-30 px-2 shadow-lg safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive 
                  ? 'text-[#E65C35] font-semibold' 
                  : 'text-[#777970] hover:text-[#252923]'
              }`
            }
          >
            <Icon className="w-4 h-4 mb-0.5" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}

      {/* Menu Drawer Toggle Button */}
      <button
        onClick={toggleMobile}
        className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-[#777970] hover:text-[#252923] transition-colors"
        title="Open full menu"
      >
        <Menu className="w-4 h-4 mb-0.5 text-[#252923]" />
        <span>More</span>
      </button>
    </nav>
  );
};
