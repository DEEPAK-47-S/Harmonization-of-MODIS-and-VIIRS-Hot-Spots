import React, { useState, useEffect } from 'react';
import { 
  Settings, Key, Database, Upload, Play, CheckCircle2, AlertCircle, Info,
  FileText, History, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI, AOI_PRESETS } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { FirePulseAPI } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

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
  const [loading, setLoading] = useState<boolean>(true);

  // Manual NRT Ingestion state
  const [ingestSources, setIngestSources] = useState<string[]>([
    'MODIS_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'
  ]);
  const [dayRange, setDayRange] = useState<number>(3);
  const [queryDate, setQueryDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestResult, setIngestResult] = useState<any | null>(null);

  // Historical SP Ingestion state
  const [showHistorical, setShowHistorical] = useState<boolean>(false);
  const [histSource, setHistSource] = useState<string>('MODIS_SP');
  const [histStartDate, setHistStartDate] = useState<string>('2024-01-01');
  const [histEndDate, setHistEndDate] = useState<string>('2024-01-31');
  const [isHistIngesting, setIsHistIngesting] = useState<boolean>(false);
  const [histResult, setHistResult] = useState<any | null>(null);

  // Archive CSV Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  // AOI override in settings
  const [showAOIPanel, setShowAOIPanel] = useState<boolean>(false);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    setLoading(true);
    try {
      const [h, dq] = await Promise.all([
        FirePulseAPI.getHealth(),
        FirePulseAPI.getDataQuality()
      ]);
      setHealth(h);
      setDataQuality(dq);
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
      setIngestResult({ status: 'SUCCESS', data: res });
      triggerRefresh();
      fetchSystemStatus();
      showToast('success', 'Ingestion Complete', `Saved ${res.total_records_saved} observations into ${res.harmonization?.active_grid_cells_created || 0} grid cells.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setIngestResult({ status: 'ERROR', error: msg });
      showToast('error', 'Ingestion Failed', msg);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleHistoricalIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsHistIngesting(true);
    setHistResult(null);
    try {
      const res = await FirePulseAPI.ingestHistorical({
        source: histSource,
        start_date: histStartDate,
        end_date: histEndDate,
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
        aoi_name: aoi.name,
      });
      setHistResult({ status: 'SUCCESS', data: res });
      triggerRefresh();
      fetchSystemStatus();
      showToast('success', 'Historical Ingestion Complete', `Saved ${res.records_saved} observations from ${histSource}.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setHistResult({ status: 'ERROR', error: msg });
      showToast('error', 'Historical Ingestion Failed', msg);
    } finally {
      setIsHistIngesting(false);
    }
  };

  const handleArchiveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadResult(null);
    try {
      const res = await FirePulseAPI.importArchiveCSV(uploadFile, 'MANUAL_ARCHIVE_UPLOAD');
      setUploadResult({ status: 'SUCCESS', data: res });
      triggerRefresh();
      fetchSystemStatus();
      showToast('success', 'Archive Imported', `Read ${res.records_received} rows, saved ${res.records_saved} observations.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setUploadResult({ status: 'ERROR', error: msg });
      showToast('error', 'Upload Failed', msg);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSource = (src: string) => {
    setIngestSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header
        title="Settings & Data Ingestion"
        subtitle="Manage NASA FIRMS API connection, live query executions, and archive dataset imports"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">

        {/* API Credentials & Security Notice */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Key className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">NASA FIRMS API Key Configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2 text-xs text-slate-300">
              <p>
                In compliance with scientific security standards, API keys are strictly configured on the backend server 
                environment and never exposed to the frontend browser or JavaScript bundles.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                <span className="text-slate-500"># backend/.env</span><br />
                <span className="text-emerald-400">FIRMS_MAP_KEY=YOUR_FREE_NASA_KEY</span>
              </div>
              <p className="text-slate-400">
                Register a free MAP_KEY at:{' '}
                <a
                  href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-400 hover:underline font-semibold"
                >
                  firms.modaps.eosdis.nasa.gov/api/map_key/
                </a>
              </p>
              <p className="text-slate-500 text-[11px]">
                Limit: 5,000 API transactions per 10 minutes. FirePulse automatically rate-limits and caches requests.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">MAP_KEY Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  health?.firms_map_key_configured
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  {health?.firms_map_key_configured ? '✓ KEY CONFIGURED' : '⚠ KEY MISSING'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Engine</span>
                <span className="font-mono text-white">SQLite (SQLAlchemy)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Connection</span>
                {loading ? (
                  <span className="text-slate-500 text-xs">Checking…</span>
                ) : health?.database_connected ? (
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Connected</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-semibold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Disconnected</span>
                  </span>
                )}
              </div>
              <button
                onClick={fetchSystemStatus}
                className="w-full flex items-center justify-center space-x-1.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* AOI Quick-Switch */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowAOIPanel(v => !v)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center space-x-3">
              <span className="text-orange-400">📍</span>
              <div>
                <h3 className="text-base font-bold text-white">Active Area of Interest</h3>
                <p className="text-xs text-slate-400">Currently: <strong className="text-orange-400">{aoi.name || 'Custom'}</strong> — [{aoi.west.toFixed(2)}, {aoi.south.toFixed(2)}, {aoi.east.toFixed(2)}, {aoi.north.toFixed(2)}]</p>
              </div>
            </div>
            {showAOIPanel ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showAOIPanel && (
            <div className="p-5 pt-0 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preset Regions</label>
              <div className="grid grid-cols-2 gap-3">
                {AOI_PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => { setAOI(p); triggerRefresh(); showToast('info', 'AOI Changed', `Area of Interest set to ${p.name}`); }}
                    className={`p-3 rounded-xl text-left border text-xs transition ${
                      aoi.name === p.name
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <strong className="block text-sm">{p.name}</strong>
                    <span className="text-slate-400">[{p.west}, {p.south} → {p.east}, {p.north}]</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Manual NRT NASA FIRMS Ingestion */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Play className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-white">Query NASA FIRMS — Near Real-Time (NRT)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            Fetch real NRT satellite observations for <strong className="text-orange-400">{aoi.name}</strong>. 
            Best for recent observations within the last 7 days.
          </p>

          <form onSubmit={handleManualIngest} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Query Date (UTC)</label>
                <input
                  type="date"
                  value={queryDate}
                  onChange={(e) => setQueryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Day Range (1–5 days)</label>
                <select
                  value={dayRange}
                  onChange={(e) => setDayRange(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                >
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={3}>3 Days (Recommended)</option>
                  <option value={4}>4 Days</option>
                  <option value={5}>5 Days (Max)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">NRT Sensors</label>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {['MODIS_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT'].map((src) => {
                    const active = ingestSources.includes(src);
                    return (
                      <button
                        type="button"
                        key={src}
                        onClick={() => toggleSource(src)}
                        className={`px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition ${
                          active
                            ? 'bg-orange-600/20 text-orange-400 border-orange-500/40 font-bold'
                            : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        {src}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isIngesting || ingestSources.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg shadow-orange-600/20 disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isIngesting ? 'animate-spin' : ''}`} />
                <span>{isIngesting ? 'Querying NASA FIRMS…' : 'Execute NRT Query'}</span>
              </button>
            </div>
          </form>

          {ingestResult && (
            <div className={`mt-4 p-4 rounded-xl border text-xs ${
              ingestResult.status === 'SUCCESS'
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
            }`}>
              {ingestResult.status === 'SUCCESS' ? (
                <div>
                  <strong className="font-bold block mb-1">✓ NRT Ingestion Complete</strong>
                  <p>Saved <strong>{ingestResult.data.total_records_saved}</strong> new observations. Created <strong>{ingestResult.data.harmonization?.active_grid_cells_created || 0}</strong> harmonized 1km grid cells.</p>
                  {ingestResult.data.source_results?.map((r: any, i: number) => (
                    <p key={i} className="text-emerald-400/70 text-[11px] mt-0.5">
                      {r.source}: {r.records_saved} saved / {r.records_rejected} rejected / {r.duplicate_records} duplicates
                    </p>
                  ))}
                </div>
              ) : (
                <div>
                  <strong className="font-bold block mb-1">✗ Ingestion Error</strong>
                  <p>{ingestResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historical SP Ingestion */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <button
            onClick={() => setShowHistorical(v => !v)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/40 transition"
          >
            <div className="flex items-center space-x-3">
              <History className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-base font-bold text-white">Historical Standard Processing (SP) Ingestion</h3>
                <p className="text-xs text-slate-400">Fetch validated SP-reprocessed data for multi-year baseline calibration</p>
              </div>
            </div>
            {showHistorical ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showHistorical && (
            <div className="p-6 pt-0 border-t border-slate-800">
              <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl text-xs text-amber-300 mb-5 flex items-start space-x-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>SP data requests are automatically chunked into 5-day segments. Large date ranges may take several minutes and consume API quota. Suomi-NPP data is available for historical periods only (pre Nov 2, 2026).</span>
              </div>
              <form onSubmit={handleHistoricalIngest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">SP Source</label>
                    <select
                      value={histSource}
                      onChange={e => setHistSource(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      {['MODIS_SP', 'VIIRS_NOAA20_SP', 'VIIRS_NOAA21_SP', 'VIIRS_SNPP_SP'].map(s => (
                        <option key={s} value={s}>{s}{s === 'VIIRS_SNPP_SP' ? ' (Historical ≤ Nov 2026)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Start Date (UTC)</label>
                    <input
                      type="date"
                      value={histStartDate}
                      onChange={e => setHistStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">End Date (UTC)</label>
                    <input
                      type="date"
                      value={histEndDate}
                      onChange={e => setHistEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isHistIngesting}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                  >
                    <History className={`w-4 h-4 ${isHistIngesting ? 'animate-spin' : ''}`} />
                    <span>{isHistIngesting ? 'Fetching Historical Data…' : 'Fetch Historical SP Data'}</span>
                  </button>
                </div>
              </form>

              {histResult && (
                <div className={`mt-4 p-4 rounded-xl border text-xs ${
                  histResult.status === 'SUCCESS'
                    ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
                }`}>
                  {histResult.status === 'SUCCESS' ? (
                    <div>
                      <strong className="font-bold block mb-1">✓ Historical Ingestion Complete</strong>
                      <p>Source: <strong>{histSource}</strong> | Saved: <strong>{histResult.data.records_saved}</strong> observations | Grid Cells Created: <strong>{histResult.data.harmonization?.active_grid_cells_created || 0}</strong></p>
                    </div>
                  ) : (
                    <div>
                      <strong className="font-bold block mb-1">✗ Historical Ingestion Failed</strong>
                      <p>{histResult.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* NASA FIRMS Archive CSV Upload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Import NASA FIRMS Archive CSV</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5">
            If historical API queries are unavailable or impractical, upload official NASA FIRMS CSV files 
            (e.g., downloaded from FIRMS Archive Download) for normalization and harmonization. 
            Supports standard MODIS (MCD14ML) and VIIRS archive column schemas.
          </p>

          <form onSubmit={handleArchiveUpload} className="space-y-4">
            <label
              htmlFor="archiveFileInput"
              className="border-2 border-dashed border-slate-700 hover:border-cyan-600 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/40 transition flex flex-col items-center space-y-2"
            >
              <FileText className="w-8 h-8 text-slate-500" />
              <span className="text-sm font-semibold text-slate-200">
                {uploadFile ? uploadFile.name : 'Click to select NASA FIRMS CSV File'}
              </span>
              {uploadFile && (
                <span className="text-xs text-slate-500">
                  {(uploadFile.size / 1024).toFixed(1)} KB
                </span>
              )}
              <span className="text-xs text-slate-500">Accepts .csv files only</span>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="hidden"
                id="archiveFileInput"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUploading || !uploadFile}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
              >
                <Upload className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                <span>{isUploading ? 'Parsing & Harmonizing…' : 'Upload & Process Archive CSV'}</span>
              </button>
            </div>
          </form>

          {uploadResult && (
            <div className={`mt-4 p-4 rounded-xl border text-xs ${
              uploadResult.status === 'SUCCESS'
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                : 'bg-rose-950/30 border-rose-800/80 text-rose-300'
            }`}>
              {uploadResult.status === 'SUCCESS' ? (
                <div>
                  <strong className="font-bold block mb-1">✓ Archive File Successfully Processed</strong>
                  <p>Read <strong>{uploadResult.data.records_received}</strong> rows. Saved <strong>{uploadResult.data.records_saved}</strong> validated observations. Created <strong>{uploadResult.data.harmonization?.active_grid_cells_created || 0}</strong> active grid cells.</p>
                </div>
              ) : (
                <div>
                  <strong className="font-bold block mb-1">✗ Upload Processing Failed</strong>
                  <p>{uploadResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Database Audit & Data Quality */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Database Integrity & Data Quality Audit</h3>
          <p className="text-xs text-slate-400 mb-4">
            Deterministic record counting, validation rejections, and processing provenance logs
          </p>

          {loading ? (
            <LoadingSpinner size="sm" text="Loading audit data…" />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-amber-400 block mb-1">MODIS Observations</span>
                  <span className="text-xl font-bold text-amber-400">{dataQuality?.totals?.modis_observations ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-cyan-400 block mb-1">VIIRS Observations</span>
                  <span className="text-xl font-bold text-cyan-400">{dataQuality?.totals?.viirs_observations ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-orange-400 block mb-1">Active 1km Cell-Days</span>
                  <span className="text-xl font-bold text-orange-400">{dataQuality?.totals?.active_grid_cell_days ?? 0}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-purple-400 block mb-1">Co-Detected Cell-Days</span>
                  <span className="text-xl font-bold text-purple-400">{dataQuality?.totals?.cross_sensor_cell_days ?? 0}</span>
                </div>
              </div>

              {/* Recent Processing Reports */}
              {dataQuality?.recent_reports?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                        <th className="py-2.5 px-3">Timestamp (UTC)</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3">Received</th>
                        <th className="py-2.5 px-3 text-emerald-400">Accepted</th>
                        <th className="py-2.5 px-3 text-rose-400">Rejected</th>
                        <th className="py-2.5 px-3">Duplicates</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {dataQuality.recent_reports.map((r: any) => (
                        <tr key={r.id} className="text-slate-300 hover:bg-slate-950/40">
                          <td className="py-2.5 px-3 text-slate-400">{r.created_at?.slice(0, 16).replace('T', ' ')} UTC</td>
                          <td className="py-2.5 px-3 font-semibold text-white text-[11px]">{r.source}</td>
                          <td className="py-2.5 px-3">{r.records_received}</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.records_accepted}</td>
                          <td className="py-2.5 px-3 text-rose-400">{r.records_rejected}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.duplicate_records}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No processing reports yet. Run an ingestion to see quality audit logs.
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
