import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  RefreshCw, 
  Satellite, 
  ShieldCheck 
} from 'lucide-react';
import { Header } from '../components/Header';
import { FirePulseAPI } from '../services/api';

export const DataSourcesPage: React.FC = () => {
  const [availability, setAvailability] = useState<any | null>(null);
  const [sourcesMeta, setSourcesMeta] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    setLoading(true);
    try {
      const [avail, src] = await Promise.all([
        FirePulseAPI.getAvailability(),
        FirePulseAPI.getSources()
      ]);
      setAvailability(avail);
      setSourcesMeta(src);
    } catch (err) {
      console.error('Failed to load source metadata:', err);
    } finally {
      setLoading(false);
    }
  };

  const sourcesList = availability?.sources ? Object.entries(availability.sources) : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="NASA FIRMS Data Sources & Transparency" 
        subtitle="Sensor specifications, operational availability, and official EOSDIS attribution"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Attribution & Legal Notice */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">NASA Earth Observing System Data and Information System (EOSDIS)</h2>
              <p className="text-xs text-slate-400">Fire Information for Resource Management System (FIRMS)</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            We acknowledge the use of data and/or imagery from NASA's Land, Atmosphere Near real-time Capability for EOS (LANCE) system operated by NASA's Earth Science Data and Information System (ESDIS) with funding provided by NASA/HQ. Active fire observations are retrieved from the official NASA FIRMS Area API.
          </p>

          <div className="flex flex-wrap gap-3 pt-2 text-xs">
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>FIRMS Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/api/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>API Documentation</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>Register MAP_KEY</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/api/data_availability/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <span>Data Availability Endpoint</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Critical Sensor Condition Banner: Suomi-NPP */}
        <div className="bg-amber-950/20 border border-amber-800/60 p-5 rounded-2xl flex items-start space-x-3.5 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-300 text-sm">
              Critical Sensor Condition: Suomi-NPP Data Delivery Ceased on November 2, 2026
            </h4>
            <p className="text-slate-300 leading-relaxed">
              As reported in official NASA/NOAA updates, Suomi-NPP VIIRS operational data delivery ceased on November 2, 2026. In accordance with science guidelines, FirePulse preserves historical Suomi-NPP observations (2012–2026) for baseline calibration, but prioritizes VIIRS NOAA-20 (JPSS-1), VIIRS NOAA-21 (JPSS-2), and MODIS Terra/Aqua for current and future monitoring.
            </p>
          </div>
        </div>

        {/* Supported Satellite Sensors Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Supported Satellite Sensors & Processing Streams</h3>
              <p className="text-xs text-slate-400">Detailed operational parameters for each instrument and stream</p>
            </div>
            <button
              onClick={fetchMetadata}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourcesList.map(([key, item]: [string, any]) => {
              const isCeased = item.status === 'CEASED_DELIVERY';
              const isModis = item.family === 'MODIS';

              return (
                <div 
                  key={key} 
                  className={`bg-slate-950 p-4 rounded-xl border flex flex-col justify-between ${
                    isCeased ? 'border-amber-900/40 opacity-75' : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white">{key}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isCeased 
                          ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-200 text-xs">{item.name}</h4>

                    <div className="space-y-1 text-[11px] text-slate-400">
                      <p><span className="text-slate-500">Satellites:</span> {item.satellites?.join(', ')}</p>
                      <p><span className="text-slate-500">Resolution:</span> {item.resolution}</p>
                      <p><span className="text-slate-500">Latency:</span> {item.latency}</p>
                      <p><span className="text-slate-500">Coverage:</span> {item.historical_cutoff}</p>
                    </div>

                    <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 italic">
                      {item.notes}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

