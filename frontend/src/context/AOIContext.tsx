import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AOIBounds } from '../types';

export const AOI_PRESETS: AOIBounds[] = [
  {
    name: 'Entire World',
    west: -180.0,
    south: -90.0,
    east: 180.0,
    north: 90.0
  },
  {
    name: 'Asia',
    west: 26.0,
    south: -11.0,
    east: 180.0,
    north: 77.0
  },
  {
    name: 'Africa',
    west: -17.5,
    south: -35.0,
    east: 51.5,
    north: 37.5
  },
  {
    name: 'Europe',
    west: -25.0,
    south: 35.0,
    east: 45.0,
    north: 71.0
  },
  {
    name: 'North America',
    west: -168.0,
    south: 7.0,
    east: -52.0,
    north: 83.0
  },
  {
    name: 'South America',
    west: -82.0,
    south: -56.0,
    east: -34.0,
    north: 13.0
  },
  {
    name: 'Oceania',
    west: 110.0,
    south: -50.0,
    east: 180.0,
    north: 0.0
  },
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
  // Default scope is Entire World
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
