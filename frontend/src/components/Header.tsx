import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, MapPin, ChevronDown, Menu } from 'lucide-react';
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
      if (hData) {
        setApiOnline(hData.database_connected);
        setHasMapKey(hData.firms_map_key_configured);
      }
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
      <header className="h-14 sm:h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shrink-0"
            title="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-normal truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          {/* AOI Selector Pill */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition-all shadow-2xs hover:border-orange-300"
          >
            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-none">
              {aoi.name || 'Custom AOI'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono hidden lg:inline">
              {formatAOIBounds(aoi)}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh active dataset"
            className="p-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>

          {/* Quick Export CSV Button */}
          <a
            href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
            download
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            title="Download observations CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Export CSV</span>
          </a>

          {/* NASA FIRMS Live Status Badge */}
          <div
            title={
              quotaInfo
                ? `NASA FIRMS Rate Limit: ${quotaInfo.current} / ${quotaInfo.limit} requests consumed in 10-min window`
                : hasMapKey
                ? 'NASA FIRMS API Key active'
                : 'NASA FIRMS MAP_KEY required in backend/.env'
            }
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
              hasMapKey
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasMapKey ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasMapKey ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-[11px]">
              {quotaInfo ? `FIRMS (${quotaInfo.current}/${quotaInfo.limit})` : hasMapKey ? 'FIRMS Live' : 'No Key'}
            </span>
          </div>
        </div>
      </header>

      <AOISelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
