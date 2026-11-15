import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Satellite 
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
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="NASA FIRMS Data Sources" 
        subtitle="Sensor specifications, operational availability, and official EOSDIS attribution"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Provenance & Specifications
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              NASA FIRMS Data Sources & Attribution
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Official NASA Earth Observing System Data and Information System (EOSDIS) active-fire streams.
            </p>
          </div>
        </div>

        {/* NASA Official Citation Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-orange-600" />
            <h2 className="font-sans font-bold text-base text-slate-900">
              NASA EOSDIS Land, Atmosphere Near real-time Capability (LANCE)
            </h2>
          </div>

          <p className="text-xs text-slate-900 leading-relaxed">
            We acknowledge the use of data and/or imagery from NASA's Land, Atmosphere Near real-time Capability for EOS (LANCE) system operated by NASA's Earth Science Data and Information System (ESDIS) with funding provided by NASA/HQ. Active fire observations are retrieved from the official NASA FIRMS Area API.
          </p>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors"
            >
              <span>FIRMS Portal</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/api/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors"
            >
              <span>API Documentation</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a 
              href="https://firms.modaps.eosdis.nasa.gov/api/data_availability/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 transition-colors"
            >
              <span>Data Availability Endpoint</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Operational Sensor Condition: Suomi-NPP Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-900 leading-relaxed">
            <strong className="text-slate-900 font-semibold block mb-0.5">
              Mission Status: Suomi-NPP Data Delivery Cessation (November 2, 2026)
            </strong>
            Operational data delivery for Suomi-NPP ceased on November 2, 2026. While historical S-NPP observations remain fully accessible for multi-year retrospective studies, live Near Real-Time (NRT) ingestion in FirePulse prioritizes <strong>NOAA-20 and NOAA-21 VIIRS</strong> alongside <strong>Terra and Aqua MODIS</strong>.
          </div>
        </div>

        {/* Supported Data Streams Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-sans font-semibold text-base text-slate-900">Supported NASA FIRMS Feeds</h3>
            <span className="text-xs font-mono text-slate-500">7 active &amp; historical streams</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Feed Identifier</th>
                  <th className="py-2.5 px-4 font-semibold">Sensor</th>
                  <th className="py-2.5 px-4 font-semibold">Satellites</th>
                  <th className="py-2.5 px-4 font-semibold">Footprint</th>
                  <th className="py-2.5 px-4 font-semibold">Processing Mode</th>
                  <th className="py-2.5 px-4 font-semibold">Operational Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DED5] font-sans">
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">MODIS_NRT</td>
                  <td className="py-2.5 px-4 font-semibold text-amber-700">MODIS</td>
                  <td className="py-2.5 px-4">Terra &amp; Aqua</td>
                  <td className="py-2.5 px-4 font-mono">1,000 m</td>
                  <td className="py-2.5 px-4">Near Real-Time (Within 3h)</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operational</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">MODIS_SP</td>
                  <td className="py-2.5 px-4 font-semibold text-amber-700">MODIS</td>
                  <td className="py-2.5 px-4">Terra &amp; Aqua</td>
                  <td className="py-2.5 px-4 font-mono">1,000 m</td>
                  <td className="py-2.5 px-4">Standard Processing (Science Quality)</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Historical Archive</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">VIIRS_NOAA20_NRT</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">VIIRS</td>
                  <td className="py-2.5 px-4">NOAA-20 (JPSS-1)</td>
                  <td className="py-2.5 px-4 font-mono">375 m</td>
                  <td className="py-2.5 px-4">Near Real-Time</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operational</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">VIIRS_NOAA20_SP</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">VIIRS</td>
                  <td className="py-2.5 px-4">NOAA-20 (JPSS-1)</td>
                  <td className="py-2.5 px-4 font-mono">375 m</td>
                  <td className="py-2.5 px-4">Standard Processing</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Historical Archive</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">VIIRS_NOAA21_NRT</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">VIIRS</td>
                  <td className="py-2.5 px-4">NOAA-21 (JPSS-2)</td>
                  <td className="py-2.5 px-4 font-mono">375 m</td>
                  <td className="py-2.5 px-4">Near Real-Time</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operational</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">VIIRS_NOAA21_SP</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">VIIRS</td>
                  <td className="py-2.5 px-4">NOAA-21 (JPSS-2)</td>
                  <td className="py-2.5 px-4 font-mono">375 m</td>
                  <td className="py-2.5 px-4">Standard Processing</td>
                  <td className="py-2.5 px-4 text-emerald-700 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Historical Archive</span>
                  </td>
                </tr>
                <tr className="hover:bg-white transition-colors">
                  <td className="py-2.5 px-4 font-mono font-medium text-slate-900">VIIRS_SNPP_SP</td>
                  <td className="py-2.5 px-4 font-semibold text-sky-600">VIIRS</td>
                  <td className="py-2.5 px-4">Suomi-NPP</td>
                  <td className="py-2.5 px-4 font-mono">375 m</td>
                  <td className="py-2.5 px-4">Standard Processing (Historical Only)</td>
                  <td className="py-2.5 px-4 text-slate-500 font-medium flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-amber-600" />
                    <span>Decommissioned (Nov 2026)</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
