import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Satellite, 
  Grid, 
  Layers, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Download, 
  Play, 
  Info,
  Calendar as CalendarIcon,
  Map as MapIcon,
  GitCompare
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { FirePulseAPI } from '../services/api';
import { DashboardSummary } from '../types';
import { DashboardSkeleton } from '../components/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { aoi, refreshKey, triggerRefresh } = useAOI();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [ingestMsg, setIngestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, [aoi, refreshKey]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const summary = await FirePulseAPI.getDashboardSummary(aoi);
      setData(summary);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickIngest = async () => {
    setIngesting(true);
    setIngestMsg(null);
    try {
      const res = await FirePulseAPI.ingestRecent({
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
        aoi_name: aoi.name,
        day_range: 3,
        sources: ['MODIS_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT']
      });
      setIngestMsg({
        type: 'success',
        text: `NASA FIRMS query successful: ${res.total_records_saved} new observations processed into ${res.harmonization?.active_grid_cells_created || 0} grid cells.`
      });
      showToast('success', 'NASA FIRMS Data Fetched', `${res.total_records_saved} observations ingested into ${res.harmonization?.active_grid_cells_created || 0} grid cells.`);
      triggerRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      setIngestMsg({
        type: 'error',
        text: `Ingestion failed: ${msg}`
      });
      showToast('error', 'Ingestion Failed', msg);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Harmonized Fire Intelligence Dashboard" 
        subtitle="Spatially and temporally aggregated NASA FIRMS MODIS and VIIRS observations"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Quick Ingestion Notice / Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Satellite className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Active Area of Interest: {aoi.name}</h2>
              <p className="text-xs text-slate-400">
                Boundaries: {aoi.west.toFixed(2)}°W, {aoi.south.toFixed(2)}°S to {aoi.east.toFixed(2)}°E, {aoi.north.toFixed(2)}°N
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleQuickIngest}
              disabled={ingesting}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-md shadow-orange-600/20 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
              <span>{ingesting ? 'Fetching NASA FIRMS...' : 'Fetch NASA FIRMS (Last 3 Days)'}</span>
            </button>
            <Link
              to="/settings"
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Archive Upload
            </Link>
          </div>
        </div>

        {/* Feedback message */}
        {ingestMsg && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center space-x-2.5 border ${
            ingestMsg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span>{ingestMsg.text}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: MODIS */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">MODIS Observations</span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? '...' : (data?.kpi.total_modis_observations.toLocaleString() ?? '0')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Terra & Aqua (1 km)</p>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-amber-500/5 rounded-full pointer-events-none"></div>
          </div>

          {/* Card 2: VIIRS */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-cyan-500/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">VIIRS Observations</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? '...' : (data?.kpi.total_viirs_observations.toLocaleString() ?? '0')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">NOAA-20/21 & S-NPP (375 m)</p>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-cyan-500/5 rounded-full pointer-events-none"></div>
          </div>

          {/* Card 3: Active 1km Cells */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-orange-500/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Active 1km Cells</span>
              <Grid className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? '...' : (data?.kpi.active_grid_cell_days.toLocaleString() ?? '0')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">EPSG:6933 Equal-Area Cell-Days</p>
          </div>

          {/* Card 4: Cross-Sensor Co-detected */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Co-Detected Cell-Days</span>
              <Layers className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {loading ? '...' : (data?.kpi.cross_sensor_co_detected_cell_days.toLocaleString() ?? '0')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Both MODIS & VIIRS Present</p>
          </div>

          {/* Card 5: Latest Observation */}
          <div className="bg-slate-900 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Timestamp</span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold text-white truncate font-mono">
              {loading ? '...' : (data?.kpi.latest_observation_utc ? data.kpi.latest_observation_utc.replace('T', ' ').slice(0, 16) + ' UTC' : 'No records')}
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>UTC Normalized</span>
            </p>
          </div>
        </div>

        {/* Recent Timeline Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Recent Daily Harmonized Burning Activity</h3>
              <p className="text-xs text-slate-400">Comparing MODIS and VIIRS detections across active equal-area grid cells (UTC)</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500"></span>
                <span className="text-slate-300">MODIS Detections</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-500"></span>
                <span className="text-slate-300">VIIRS Detections</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-600"></span>
                <span className="text-slate-300">Active 1km Cells</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            {data && data.recent_timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.recent_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorModis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViirs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCells" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="viirs_count" name="VIIRS Detections" stroke="#0284c7" fillOpacity={1} fill="url(#colorViirs)" />
                  <Area type="monotone" dataKey="modis_count" name="MODIS Detections" stroke="#f59e0b" fillOpacity={1} fill="url(#colorModis)" />
                  <Area type="monotone" dataKey="active_grid_cells" name="Active 1km Cells" stroke="#ea580c" strokeWidth={2} fillOpacity={1} fill="url(#colorCells)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Flame className="w-8 h-8 text-slate-600" />
                <p className="text-sm">No observations recorded yet for this AOI.</p>
                <button
                  onClick={handleQuickIngest}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-orange-600/30 text-orange-400 hover:bg-orange-600/50 transition"
                >
                  Fetch NASA FIRMS Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/calendar"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-orange-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base group-hover:text-orange-400 transition">
                Burning Activity Calendar
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Explore day-by-day and month-by-month activity heatmap using dynamic distribution quantiles.
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-orange-400 mt-4">
              <span>View Calendar</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/fire-map"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <MapIcon className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base group-hover:text-cyan-400 transition">
                Interactive Fire Map
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Inspect satellite hotspot locations, FRP intensity, and sensor overlays on an interactive leaflet map.
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-cyan-400 mt-4">
              <span>Explore Map</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/comparison"
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <GitCompare className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base group-hover:text-purple-400 transition">
                MODIS vs VIIRS Comparison
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Deep dive into spatial resolution differences (1km vs 375m), co-detection rate, and FRP distributions.
              </p>
            </div>
            <div className="flex items-center space-x-1 text-xs font-semibold text-purple-400 mt-4">
              <span>Compare Sensors</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

