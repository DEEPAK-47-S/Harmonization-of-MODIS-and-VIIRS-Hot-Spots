import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Database, 
  Upload, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  RefreshCw, 
  MapPin,
  Clock,
  FileText
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI, AOI_PRESETS } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { FirePulseAPI } from '../services/api';
import { formatAOIBounds } from '../types';

const ALL_SOURCES = [
  'MODIS_NRT', 'MODIS_SP',
  'VIIRS_NOAA20_NRT', 'VIIRS_NOAA20_SP',
  'VIIRS_NOAA21_NRT', 'VIIRS_NOAA21_SP',
  'VIIRS_SNPP_SP'
];

export const SettingsPage: React.FC = () => {
  const { aoi, setAOI, triggerRefresh } = useAOI();
  const { showToast } = useToast();

  // Health and MAP_KEY status
  const [health, setHealth] = useState<any | null>(null);
  const [dataQuality, setDataQuality] = useState<any | null>(null);
  const [firmsStatus, setFirmsStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Manual NRT Ingestion state
  const [ingestSources, setIngestSources] = useState<string[]>([
    'MODIS_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'
  ]);
  const [dayRange, setDayRange] = useState<number>(3);
  const [queryDate, setQueryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestResult, setIngestResult] = useState<any | null>(null);

  // Archive CSV Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const [h, dq, fs] = await Promise.all([
        FirePulseAPI.getHealth(),
        FirePulseAPI.getDataQuality(),
        FirePulseAPI.getFirmsStatus().catch(() => null)
      ]);
      setHealth(h);
      setDataQuality(dq);
      setFirmsStatus(fs);
    } catch (err) {
      console.error('Failed to load system status:', err);
      showToast('error', 'Status Load Failed', 'Could not reach the backend API.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestResult(null);
    try {
      const res = await FirePulseAPI.ingestRecent({
        sources: ingestSources,
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
        day_range: dayRange,
        date_str: queryDate,
        aoi_name: aoi.name
      });
      setIngestResult(res);
      showToast('success', 'NASA Ingestion Complete', `${res.total_records_saved} new observations processed.`);
      triggerRefresh();
      fetchSystemStatus();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      showToast('error', 'Ingestion Failed', msg);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleUploadArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await FirePulseAPI.importArchiveCSV(uploadFile, 'ARCHIVE_MANUAL');
      setUploadResult(res);
      showToast('success', 'Archive CSV Uploaded', `${res.records_saved} valid records saved.`);
      triggerRefresh();
      fetchSystemStatus();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      showToast('error', 'Upload Failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Settings & Data Ingestion" 
        subtitle="Manage NASA FIRMS API ingestion, archive uploads, and Area of Interest"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Configuration &amp; Operations
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              Settings &amp; ingestion.
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Configure NASA FIRMS streams, monitor live API transaction quotas, or upload historical archive datasets.
            </p>
          </div>
        </div>

        {/* Live System & Quota Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NASA API Key Status */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">NASA FIRMS API Key</span>
              <Key className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${health?.firms_map_key_configured ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
              <span className="font-semibold text-sm text-slate-900">
                {health?.firms_map_key_configured ? 'MAP_KEY Active & Verified' : 'MAP_KEY Not Configured'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Securely stored in backend environment variable. Never exposed to browser or logs.
            </p>
          </div>

          {/* Rate Limit / Quota Tracker */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Live Transaction Limit</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-center space-x-2 pt-1 font-mono text-sm font-semibold text-slate-900">
              {firmsStatus ? (
                <span>{firmsStatus.current_transactions} / {firmsStatus.transaction_limit} requests</span>
              ) : (
                <span>Rate limit tracking active</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              NASA FIRMS limit: 5,000 transactions / 10-minute sliding window.
            </p>
          </div>

          {/* Database Health */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Storage &amp; Database</span>
              <Database className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-center space-x-2 pt-1 font-semibold text-sm text-slate-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span>{health?.database_connected ? 'SQLite Connected (Spatial Schema)' : 'Database Offline'}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Repository layer ready for direct PostGIS / PostgreSQL scaling.
            </p>
          </div>
        </div>

        {/* Two Columns: Manual Ingestion Form & Archive CSV Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Near Real-Time Ingestion Form */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-sans font-semibold text-base text-slate-900">
                Query NASA FIRMS NRT API
              </h3>
              <p className="text-xs text-slate-500">
                Ingest recent observations for the active Area of Interest: <strong>{aoi.name}</strong>
              </p>
            </div>

            <form onSubmit={handleManualIngest} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1 font-semibold">
                  Select Feeds to Query
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {ALL_SOURCES.map(src => (
                    <label key={src} className="flex items-center space-x-2 text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ingestSources.includes(src)}
                        onChange={(e) => {
                          if (e.target.checked) setIngestSources([...ingestSources, src]);
                          else setIngestSources(ingestSources.filter(s => s !== src));
                        }}
                        className="rounded text-orange-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px]">{src}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1 font-semibold">
                    Day Range (1–5 days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={dayRange}
                    onChange={(e) => setDayRange(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1 font-semibold">
                    End Reference Date
                  </label>
                  <input
                    type="date"
                    value={queryDate}
                    onChange={(e) => setQueryDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 font-mono text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isIngesting || ingestSources.length === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded bg-orange-600 hover:bg-[#D44F29] text-white font-semibold transition disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
                  <span>{isIngesting ? 'Querying NASA FIRMS...' : 'Fetch NASA Observations'}</span>
                </button>
              </div>

              {ingestResult && (
                <div className="p-3 bg-emerald-600/10 border border-[#54785E]/30 rounded text-[11px] text-emerald-700 space-y-1">
                  <div className="font-bold">Ingestion Run Succeeded</div>
                  <div>Saved {ingestResult.total_records_saved} observations across {ingestSources.length} sources.</div>
                  <div>Created {ingestResult.harmonization?.active_grid_cells_created || 0} harmonized 1km grid cells.</div>
                </div>
              )}
            </form>
          </div>

          {/* NASA Archive CSV Upload */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-sans font-semibold text-base text-slate-900">
                NASA Archive CSV Upload
              </h3>
              <p className="text-xs text-slate-500">
                Import official NASA FIRMS archive downloads with SHA-256 duplicate prevention
              </p>
            </div>

            <form onSubmit={handleUploadArchive} className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-200 bg-white rounded p-6 text-center space-y-2">
                <Upload className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-slate-900 font-medium">Select a NASA FIRMS CSV file</p>
                <p className="text-[10px] text-slate-500">
                  Supports standard MODIS (fire_archive_M*.csv) and VIIRS (fire_archive_V*.csv) downloads
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="pt-2 text-xs text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !uploadFile}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-900 font-semibold transition disabled:opacity-50"
              >
                <span>{isUploading ? 'Processing File...' : 'Upload & Process Archive CSV'}</span>
              </button>

              {uploadResult && (
                <div className="p-3 bg-emerald-600/10 border border-[#54785E]/30 rounded text-[11px] text-emerald-700 space-y-1">
                  <div className="font-bold">Archive Ingest Complete</div>
                  <div>Processed {uploadResult.total_rows} rows: {uploadResult.records_saved} valid records saved.</div>
                  <div>Skipped {uploadResult.duplicate_records} duplicates; rejected {uploadResult.rejected_records} invalid rows.</div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Data Quality Report */}
        {dataQuality && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <h3 className="font-sans font-semibold text-base text-slate-900">Ingestion Data Quality Audit</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-[10px] font-mono uppercase text-slate-500">Total Ingested Rows</span>
                <div className="font-sans font-bold text-lg text-slate-900 mt-0.5">
                  {dataQuality.total_received?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-[10px] font-mono uppercase text-emerald-700">Valid Saved Observations</span>
                <div className="font-sans font-bold text-lg text-emerald-700 mt-0.5">
                  {dataQuality.total_saved?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-[10px] font-mono uppercase text-amber-700">Duplicates Prevented</span>
                <div className="font-sans font-bold text-lg text-amber-700 mt-0.5">
                  {dataQuality.duplicates_prevented?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded">
                <span className="text-[10px] font-mono uppercase text-red-600">Invalid / Rejected</span>
                <div className="font-sans font-bold text-lg text-red-600 mt-0.5">
                  {dataQuality.rejected?.toLocaleString() || '0'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
