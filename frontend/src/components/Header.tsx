import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Download, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
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
      <header className="h-16 border-b border-[#E1DED5] bg-white px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3 min-w-0">
          <div>
            <h1 className="text-base sm:text-lg font-serif font-semibold text-[#252923] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[#777970] font-sans truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          {/* AOI Selector Pill */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] border border-[#E1DED5] text-xs font-medium text-[#252923] transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E65C35]" />
            <span className="font-semibold">{aoi.name || 'Custom AOI'}</span>
            <span className="text-[10px] text-[#777970] font-mono hidden sm:inline">
              {formatAOIBounds(aoi)}
            </span>
            <ChevronDown className="w-3 h-3 text-[#777970]" />
          </button>

          {/* Quick Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh active dataset"
            className="p-2 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] border border-[#E1DED5] text-[#777970] hover:text-[#252923] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#E65C35]' : ''}`} />
          </button>

          {/* Quick Export CSV Button */}
          <a
            href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
            download
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] border border-[#E1DED5] text-xs font-medium text-[#252923] transition-colors"
            title="Download observations CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#318C9B]" />
            <span>CSV</span>
          </a>

          {/* NASA FIRMS Live Quota Status */}
          <div
            title={
              quotaInfo
                ? `NASA FIRMS Rate Limit: ${quotaInfo.current} / ${quotaInfo.limit} requests consumed in 10-min window`
                : hasMapKey
                ? 'NASA FIRMS API Key active'
                : 'NASA FIRMS MAP_KEY required in backend/.env'
            }
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border ${
              hasMapKey
                ? 'bg-[#54785E]/10 border-[#54785E]/30 text-[#54785E]'
                : 'bg-[#B98B37]/10 border-[#B98B37]/30 text-[#B98B37]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${hasMapKey ? 'bg-[#54785E]' : 'bg-[#B98B37]'}`}></span>
            <span className="font-medium text-[11px]">
              {quotaInfo ? `FIRMS (${quotaInfo.current}/${quotaInfo.limit})` : hasMapKey ? 'FIRMS Connected' : 'FIRMS Key Missing'}
            </span>
          </div>
        </div>
      </header>

      <AOISelectorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
