import React, { createContext, useContext, useState } from 'react';

interface NavContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export const NavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const toggleMobile = () => setIsMobileOpen(prev => !prev);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <NavContext.Provider value={{ isMobileOpen, setIsMobileOpen, toggleMobile, closeMobile }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = (): NavContextType => {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return ctx;
};
