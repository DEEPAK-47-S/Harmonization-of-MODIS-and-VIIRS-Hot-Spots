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
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Global NASA Data Coverage Matrix" 
        subtitle="Dynamic sensor availability, observation eras, and Suomi-NPP archive status" 
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* PAGE INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Observational Fidelity / Multi-Sensor Lifecycle
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              NASA satellite sensor availability.
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Track the operational lifespan and data coverage for all 7 MODIS and VIIRS satellite feeds.
              FirePulse queries NASA FIRMS endpoints dynamically to ensure scientific transparency and prevent gap hallucination.
            </p>
          </div>

          <button
            onClick={loadCoverage}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-[#E1DED5] rounded-md text-xs font-medium text-[#252923] hover:bg-[#FAF8F3]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Availability</span>
          </button>
        </div>

        {/* SUOMI-NPP OFFICIAL CESSATION NOTICE BANNER */}
        <div className="bg-[#FAF8F3] border-l-4 border-[#C27B26] border border-[#E1DED5] p-5 rounded-r-lg shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-[#C27B26]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="font-serif font-bold text-sm text-[#252923]">
              Suomi-NPP Historical Archive Cessation Notice
            </span>
          </div>
          <p className="text-xs text-[#252923] leading-relaxed">
            The Suomi National Polar-orbiting Partnership (S-NPP) VIIRS sensor ceased operational archive recording on{' '}
            <strong className="font-mono text-[#BD493C]">November 2, 2026</strong>. 
            FirePulse preserves all historical S-NPP observations (2012–2026) for longitudinal climate baselining, while routing present and future active fire ingestion to the operational 
            <strong className="font-mono text-[#318C9B]"> NOAA-20 (JPSS-1)</strong> and{' '}
            <strong className="font-mono text-[#318C9B]"> NOAA-21 (JPSS-2)</strong> satellite constellations.
          </p>
        </div>

        {/* LOCAL DATABASE REPOSITORIES STATS */}
        <div className="bg-white border border-[#E1DED5] rounded-xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-[#E65C35]" />
              <h3 className="font-serif font-bold text-sm text-[#252923]">Local FirePulse Ingested Database</h3>
            </div>
            <span className="text-[10px] font-mono text-[#777970]">
              Verified Records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
              <span className="text-[10px] font-mono text-[#777970] uppercase">Total Observations</span>
              <div className="text-xl font-serif font-bold text-[#252923] mt-0.5">
                {(matrix?.database_records?.total_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
              <span className="text-[10px] font-mono text-[#C27B26] uppercase">MODIS Records</span>
              <div className="text-xl font-serif font-bold text-[#C27B26] mt-0.5">
                {(matrix?.database_records?.modis_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
              <span className="text-[10px] font-mono text-[#318C9B] uppercase">VIIRS Records</span>
              <div className="text-xl font-serif font-bold text-[#318C9B] mt-0.5">
                {(matrix?.database_records?.viirs_observations ?? 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
              <span className="text-[10px] font-mono text-[#54785E] uppercase">Archive Range</span>
              <div className="text-xs font-mono font-semibold text-[#252923] mt-1.5 truncate">
                {matrix?.database_records.earliest_observation || 'N/A'} → {matrix?.database_records.latest_observation || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED SENSOR FEEDS TABLE */}
        <div className="bg-white border border-[#E1DED5] rounded-xl overflow-hidden shadow-card">
          <div className="p-4 bg-[#FAF8F3] border-b border-[#E1DED5] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Satellite className="w-4 h-4 text-[#E65C35]" />
              <h3 className="font-serif font-bold text-sm text-[#252923]">Official NASA FIRMS Feed Registry</h3>
            </div>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/api/data_availability/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-[#E65C35] hover:underline"
            >
              <span>NASA Data Availability API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F3] border-b border-[#E1DED5] text-[10px] font-mono uppercase text-[#777970]">
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
              <tbody className="divide-y divide-[#E1DED5] text-[#252923]">
                {matrix?.sources.map((src) => (
                  <tr key={src.source_id} className="hover:bg-[#FAF8F3] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-xs">{src.source_id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        src.sensor_family === 'MODIS' ? 'bg-[#FAF2E8] text-[#C27B26]' : 'bg-[#EBF5F7] text-[#318C9B]'
                      }`}>
                        {src.sensor_family}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">{src.satellite}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">{src.processing_type}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#777970]">
                      {src.nominal_start} → {src.nominal_end}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        src.operational 
                          ? 'bg-[#54785E]/15 text-[#54785E]' 
                          : 'bg-[#B98B37]/15 text-[#B98B37]'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${src.operational ? 'bg-[#54785E]' : 'bg-[#B98B37]'}`}></span>
                        <span>{src.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#777970] max-w-xs">{src.notes}</td>
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
