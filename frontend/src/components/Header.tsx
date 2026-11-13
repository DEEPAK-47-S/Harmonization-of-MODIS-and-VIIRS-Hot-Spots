import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Download } from 'lucide-react';
import { useAOI } from '../context/AOIContext';
import { AOISelectorModal } from './AOISelectorModal';
import { FirePulseAPI } from '../services/api';

interface Props {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  const { aoi, triggerRefresh } = useAOI();
  const [modalOpen, setModalOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [hasMapKey, setHasMapKey] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await FirePulseAPI.getHealth();
      setApiOnline(data.database_connected);
      setHasMapKey(data.firms_map_key_configured);
    } catch {
      setApiOnline(false);
      setHasMapKey(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    checkHealth();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-3">
          {/* AOI Selector Pill */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition group"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-white">{aoi.name || 'Custom AOI'}</span>
            <span className="text-slate-400 font-mono text-[11px]">
              [{aoi.west.toFixed(1)}&deg;W, {aoi.south.toFixed(1)}&deg;S &rarr; {aoi.east.toFixed(1)}&deg;E, {aoi.north.toFixed(1)}&deg;N]
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh current data"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {/* Quick Export CSV */}
          <a
            href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition"
            title="Download filtered observations CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </a>

          {/* API Health & Key Indicator */}
          <div
            title={
              apiOnline
                ? (hasMapKey ? 'NASA FIRMS API Key configured & Database connected' : 'Backend online. NASA MAP_KEY not yet configured in backend/.env')
                : 'Backend API unreachable — is the Flask server running?'
            }
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              apiOnline === null
                ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                : apiOnline
                ? hasMapKey
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
            }`}
          >
            {apiOnline === null ? (
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
            ) : apiOnline ? (
              hasMapKey ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>FIRMS Connected</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Key Needed</span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>API Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      <AOISelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
