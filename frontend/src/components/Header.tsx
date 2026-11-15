import React, { useState, useEffect } from 'react';
import { RefreshCw, MapPin, ChevronDown, Menu, Database, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAOI } from '../context/AOIContext';
import { useNav } from '../context/NavContext';
import { FirePulseAPI } from '../services/api';
import { formatAOIBounds } from '../types';
import { AOISelectorModal } from './AOISelectorModal';

interface Props {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  const { aoi, triggerRefresh } = useAOI();
  const { toggleMobile } = useNav();
  const [modalOpen, setModalOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const hData = await FirePulseAPI.getHealth();
      setDbConnected(hData?.database_connected ?? false);
    } catch {
      setDbConnected(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    checkHealth();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <>
      <header className="h-14 border-b border-slate-200/90 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={toggleMobile}
            className="md:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-normal truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* AOI Selector Button */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 transition-colors shadow-2xs hover:border-slate-400"
            title="Change active Area of Interest"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">
              {aoi.name || 'Custom Bounds'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              {formatAOIBounds(aoi)}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Quick Refresh */}
          <button
            onClick={handleRefresh}
            title="Refresh dataset"
            disabled={isRefreshing}
            className="p-1.5 rounded-md bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
          </button>

          {/* Health indicator */}
          <div 
            title={dbConnected ? "Database connected" : "Connecting..."}
            className="hidden sm:flex items-center space-x-1 px-2 py-1 rounded bg-slate-100 text-[10px] font-mono text-slate-600 border border-slate-200"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>{dbConnected ? 'READY' : 'SYNC'}</span>
          </div>
        </div>
      </header>

      {/* AOI Selector Modal */}
      {modalOpen && <AOISelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />}
    </>
  );
};
