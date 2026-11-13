import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AOIBounds } from '../types';

export const AOI_PRESETS: AOIBounds[] = [
  {
    name: 'Tamil Nadu, India',
    west: 76.2,
    south: 8.0,
    east: 80.4,
    north: 13.6
  },
  {
    name: 'California, USA',
    west: -124.4,
    south: 32.5,
    east: -114.1,
    north: 42.0
  }
];

interface AOIContextType {
  aoi: AOIBounds;
  setAOI: (aoi: AOIBounds) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AOIContext = createContext<AOIContextType | undefined>(undefined);

export const AOIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aoi, setAOI] = useState<AOIBounds>(AOI_PRESETS[0]);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return (
    <AOIContext.Provider value={{ aoi, setAOI, refreshKey, triggerRefresh }}>
      {children}
    </AOIContext.Provider>
  );
};

export const useAOI = () => {
  const context = useContext(AOIContext);
  if (!context) {
    throw new Error('useAOI must be used within an AOIProvider');
  }
  return context;
};

