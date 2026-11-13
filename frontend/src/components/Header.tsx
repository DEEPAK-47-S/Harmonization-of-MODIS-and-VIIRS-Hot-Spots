import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Download, Sparkles, ChevronDown } from 'lucide-react';
import { useAOI } from '../context/AOIContext';
import { AOISelectorModal } from './AOISelectorModal';
import { FirePulseAPI } from '../services/api';
import { formatAOIBounds } from '../types';

interface Props {
  title: string;
  subtitle?: string;
}

export const Header: React.FC<Props> = ({ title, subtitle }) => {
  const { aoi, triggerRefresh } = useAOI();
  const [modalOpen, setModalOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [hasMapKey, setHasMapKey] = useState<boolean>(false);
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; limit: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const [hData, fStatus] = await Promise.all([
        FirePulseAPI.getHealth(),
        FirePulseAPI.getFirmsStatus().catch(() => null)
      ]);
      setApiOnline(hData.database_connected);
      setHasMapKey(hData.firms_map_key_configured);
      if (fStatus && fStatus.configured && fStatus.status === 'ACTIVE') {
        setQuotaInfo({
          current: fStatus.current_transactions ?? 0,
          limit: fStatus.transaction_limit ?? 5000
        });
      }
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
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h1>
            {subtitle && <p className="text-[11px] text-slate-400 font-medium line-clamp-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* AOI Selector Pill */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-xs font-semibold text-slate-200 transition shadow-sm hover:border-orange-500/50 group"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-400 group-hover:scale-125 transition-transform" />
            <span className="font-bold text-white tracking-tight">{aoi.name || 'Custom AOI'}</span>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-950/80 px-1.5 py-0.5 rounded border border-white/5">
              {formatAOIBounds(aoi)}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-500 group-hover:text-slate-300" />
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh current data & recalculate grid"
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-slate-400 hover:text-white transition hover:border-slate-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
          </button>

          {/* Quick Export CSV Button */}
          <a
            href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-xs font-semibold text-slate-300 hover:text-white transition hover:border-cyan-500/50"
            title="Download observations CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>CSV</span>
          </a>

          {/* NASA Live Status Pill */}
          <div
            title={
              apiOnline
                ? (hasMapKey
                  ? `NASA FIRMS Connected: ${quotaInfo ? `${quotaInfo.current} / ${quotaInfo.limit} transactions used in current 10m window. Global + US/Canada valid.` : 'Key configured & verified.'}`
                  : 'Backend online. NASA MAP_KEY not yet configured in backend/.env')
                : 'Backend API unreachable'
            }
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              apiOnline === null
                ? 'bg-slate-950/60 border-slate-800 text-slate-500'
                : apiOnline
                ? hasMapKey
                  ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                : 'bg-rose-950/50 border-rose-700/60 text-rose-300'
            }`}
          >
            {apiOnline === null ? (
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
            ) : apiOnline ? (
              hasMapKey ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="tracking-wide">NASA LIVE</span>
                  {quotaInfo && (
                    <span className="text-[10px] text-emerald-300 font-mono bg-emerald-900/60 px-1.5 py-0.5 rounded-md border border-emerald-700/50">
                      {quotaInfo.current}/{quotaInfo.limit}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>KEY NEEDED</span>
                </>
              )
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      <AOISelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
