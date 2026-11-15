import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Satellite, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  Layers,
  RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { FirePulseAPI } from '../services/api';
import { CoverageMatrix } from '../types';

export const CoverageMatrixPage: React.FC = () => {
  const [matrix, setMatrix] = useState<CoverageMatrix | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCoverage();
  }, []);

  const loadCoverage = async () => {
    setLoading(true);
    try {
      const data = await FirePulseAPI.getGlobalCoverage();
      setMatrix(data);
    } catch (err) {
      console.error('Failed to load coverage matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Global NASA Data Coverage Matrix" 
        subtitle="Dynamic sensor availability, observation eras, and Suomi-NPP archive status" 
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* PAGE INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Satellite Sensors / Operational Status
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              Satellite Sensor Operational Status
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Track the operational lifespan and data coverage for all 7 MODIS and VIIRS satellite feeds.
              FirePulse queries NASA FIRMS endpoints dynamically to ensure scientific transparency and prevent gap hallucination.
            </p>
          </div>

          <button
            onClick={loadCoverage}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-900 hover:bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Availability</span>
          </button>
        </div>

        {/* SUOMI-NPP OFFICIAL CESSATION NOTICE BANNER */}
        <div className="bg-white border-l-4 border-amber-400 border border-slate-200 p-5 rounded-r-lg shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-700">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-sans font-bold text-sm text-slate-900">
              Suomi-NPP Historical Archive Cessation Notice
            </span>
          </div>
          <p className="text-xs text-slate-900 leading-relaxed">
            The Suomi National Polar-orbiting Partnership (S-NPP) VIIRS sensor ceased operational archive recording on{' '}
            <strong className="font-mono text-red-600">November 2, 2026</strong>. 
            FirePulse preserves all historical S-NPP observations (2012–2026) for longitudinal climate baselining, while routing present and future active fire ingestion to the operational 
            <strong className="font-mono text-sky-600"> NOAA-20 (JPSS-1)</strong> and{' '}
            <strong className="font-mono text-sky-600"> NOAA-21 (JPSS-2)</strong> satellite constellations.
          </p>
        </div>

        {/* LOCAL DATABASE REPOSITORIES STATS */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-orange-600" />
              <h3 className="font-sans font-bold text-sm text-slate-900">Local FirePulse Ingested Database</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Verified Records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Total Observations</span>
              <div className="text-xl font-sans font-bold text-slate-900 mt-0.5">
                {(matrix?.database_records?.total_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-mono text-amber-700 uppercase">MODIS Records</span>
              <div className="text-xl font-sans font-bold text-amber-700 mt-0.5">
                {(matrix?.database_records?.modis_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-mono text-sky-600 uppercase">VIIRS Records</span>
              <div className="text-xl font-sans font-bold text-sky-600 mt-0.5">
                {(matrix?.database_records?.viirs_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-white p-3 rounded-md border border-slate-200">
              <span className="text-[10px] font-mono text-emerald-700 uppercase">Archive Range</span>
              <div className="text-xs font-mono font-semibold text-slate-900 mt-1.5 truncate">
                {matrix?.database_records?.earliest_observation || 'N/A'} → {matrix?.database_records?.latest_observation || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED SENSOR FEEDS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-orange-600" />
              <h3 className="font-sans font-bold text-sm text-slate-900">Official NASA FIRMS Feed Registry</h3>
            </div>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/api/data_availability/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-orange-600 hover:underline"
            >
              <span>NASA Data Availability API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Feed Identifier</th>
                  <th className="py-2.5 px-4 font-semibold">Sensor</th>
                  <th className="py-2.5 px-4 font-semibold">Satellite Platform</th>
                  <th className="py-2.5 px-4 font-semibold">Processing Tier</th>
                  <th className="py-2.5 px-4 font-semibold">Temporal Span</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Scientific Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DED5] text-slate-900">
                {matrix?.sources.map((src) => (
                  <tr key={src.source_id} className="hover:bg-white transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs">{src.source_id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        src.sensor_family === 'MODIS' ? 'bg-[#FAF2E8] text-amber-700' : 'bg-[#EBF5F7] text-sky-600'
                      }`}>
                        {src.sensor_family}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">{src.satellite}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{src.processing_type}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {src.nominal_start} → {src.nominal_end}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        src.operational 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${src.operational ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                        <span>{src.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs">{src.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
