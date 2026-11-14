import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  Layers, 
  Grid, 
  Activity, 
  MapPin, 
  Calendar as CalendarIcon, 
  Play, 
  ChevronRight, 
  ArrowUpDown, 
  Info, 
  Download,
  Globe2,
  Sparkles,
  Sliders,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Rectangle, 
  Popup, 
  Tooltip as LeafletTooltip,
  useMap 
} from 'react-leaflet';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { FirePulseAPI } from '../services/api';
import { 
  DashboardSummary, 
  Observation, 
  GridCell, 
  GlobalSummary, 
  MapDensityCluster,
  formatCoord, 
  formatAOIBounds, 
  AOIBounds 
} from '../types';

// Map Auto-Fitter for regional views
function MapBoundsFitter({ aoi, hotspots }: { aoi: AOIBounds; hotspots: Observation[] }) {
  const map = useMap();

  useEffect(() => {
    const isWorld = aoi.name === 'Entire World' || (aoi.west <= -170 && aoi.east >= 170);
    if (isWorld) {
      map.setView([20, 0], 2);
      return;
    }

    if (hotspots && hotspots.length > 0) {
      const lats = hotspots.map(h => h.latitude);
      const lons = hotspots.map(h => h.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      const padLat = Math.max(0.15, (maxLat - minLat) * 0.1);
      const padLon = Math.max(0.15, (maxLon - minLon) * 0.1);
      
      map.fitBounds([
        [minLat - padLat, minLon - padLon],
        [maxLat + padLat, maxLon + padLon]
      ], { maxZoom: 12, animate: true });
    } else {
      map.fitBounds([
        [aoi.south, aoi.west],
        [aoi.north, aoi.east]
      ], { maxZoom: 10, animate: true });
    }
  }, [aoi, hotspots, map]);

  return null;
}

export const DashboardPage: React.FC = () => {
  const { aoi, refreshKey, triggerRefresh } = useAOI();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null);
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [densityClusters, setDensityClusters] = useState<MapDensityCluster[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [ingestMsg, setIngestMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Map layer controls
  const [showModis, setShowModis] = useState<boolean>(true);
  const [showViirs, setShowViirs] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');

  // Observations Table pagination
  const [tablePage, setTablePage] = useState<number>(1);
  const [tableSortAsc, setTableSortAsc] = useState<boolean>(false);
  const pageSize = 8;

  const isWorld = aoi.name === 'Entire World' || (aoi.west <= -170 && aoi.east >= 170);

  useEffect(() => {
    loadDashboardData();
  }, [aoi, refreshKey]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumData, spotData, globData, densData] = await Promise.all([
        FirePulseAPI.getDashboardSummary(aoi),
        FirePulseAPI.getHotspots({
          west: aoi.west,
          south: aoi.south,
          east: aoi.east,
          north: aoi.north,
          limit: isWorld ? 300 : 800,
          include_grid: true
        }).catch(() => ({ hotspots: [], grid_cells: [] })),
        isWorld ? FirePulseAPI.getGlobalSummary(7).catch(() => null) : Promise.resolve(null),
        isWorld ? FirePulseAPI.getMapDensity({ zoom: 3 }).catch(() => ({ clusters: [] })) : Promise.resolve({ clusters: [] })
      ]);

      setSummary(sumData);
      setHotspots(spotData.hotspots || []);
      setGridCells(spotData.grid_cells || []);
      setGlobalSummary(globData);
      setDensityClusters(densData?.clusters || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
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
        text: `NASA Sync complete: ${res.total_records_saved} new observations processed.`
      });
      showToast('success', 'NASA Telemetry Synced', `${res.total_records_saved} new active fire records ingested.`);
      triggerRefresh();
      loadDashboardData();
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

  // Filtered hotspots for map
  const visibleHotspots = hotspots.filter(h => {
    const isModis = h.sensor_family === 'MODIS';
    const isViirs = h.sensor_family === 'VIIRS';
    if (isModis && !showModis) return false;
    if (isViirs && !showViirs) return false;
    return true;
  });

  // Table sorting & pagination
  const sortedHotspots = [...hotspots].sort((a, b) => {
    const timeA = new Date(a.acquisition_datetime_utc).getTime();
    const timeB = new Date(b.acquisition_datetime_utc).getTime();
    return tableSortAsc ? timeA - timeB : timeB - timeA;
  });
  const totalPages = Math.ceil(sortedHotspots.length / pageSize) || 1;
  const paginatedHotspots = sortedHotspots.slice((tablePage - 1) * pageSize, tablePage * pageSize);

  // Sensor proportion
  const totalObs = (summary?.kpi?.total_modis_observations || 0) + (summary?.kpi?.total_viirs_observations || 0);
  const modisPct = totalObs > 0 ? Math.round(((summary?.kpi?.total_modis_observations || 0) / totalObs) * 100) : 0;
  const viirsPct = totalObs > 0 ? 100 - modisPct : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Harmonized Fire Intelligence" 
        subtitle="Spatially and temporally aggregated NASA FIRMS observations"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* HERO SECTION - MODERN GEN-Z LIGHT */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3" />
              <span>{isWorld ? 'Planetary Fire Intel • Global Scope' : `Focused Region • ${aoi.name}`}</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isWorld ? 'Real-time Planetary Active Fires' : `Thermal Intelligence: ${aoi.name}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
              {isWorld 
                ? 'NASA MODIS (Terra/Aqua) and VIIRS (NOAA-20/21) active fire observations, harmonized onto an analytical 1km equal-area grid.' 
                : `Satellite detections and 1km harmonized burning footprints across ${aoi.name}.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleQuickIngest}
              disabled={ingesting}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
              <span>{ingesting ? 'Syncing FIRMS...' : isWorld ? 'Sync Global NASA' : 'Sync Region NASA'}</span>
            </button>
            <Link
              to="/settings"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-2xs"
            >
              Archive
            </Link>
          </div>
        </div>

        {/* Ingestion notice */}
        {ingestMsg && (
          <div className={`p-4 rounded-xl text-xs flex items-center space-x-3 border ${
            ingestMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{ingestMsg.text}</span>
          </div>
        )}

        {/* METRIC CARDS STRIP - 4 COLS DESKTOP, 2X2 MOBILE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Active Grid Cells */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Active 1km Cells</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Grid className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((summary?.kpi?.active_grid_cell_days ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">Harmonized 1km footprint</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              EPSG:6933 standard cylindrical equal-area cells.
            </p>
          </div>

          {/* 2. MODIS Observations */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 font-semibold">MODIS Detections</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((summary?.kpi?.total_modis_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">Terra &amp; Aqua Satellites</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              1,000 m nominal nadir resolution.
            </p>
          </div>

          {/* 3. VIIRS Observations */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-600 font-semibold">VIIRS Detections</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((summary?.kpi?.total_viirs_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">NOAA-20/21 &amp; S-NPP</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              375 m high-resolution thermal I-bands.
            </p>
          </div>

          {/* 4. Cross-Sensor Co-Detected */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 font-semibold">Dual Verified</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((summary?.kpi?.cross_sensor_co_detected_cell_days ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">Co-Detected Cell-Days</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Detected by both MODIS &amp; VIIRS on same day.
            </p>
          </div>
        </div>

        {/* MAIN VISUALIZATION: MAP (8 cols) + RIGHT PANEL (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* MAP */}
          <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">Active Fire Map</span>
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs">
                  {isWorld 
                    ? `${densityClusters.length} clusters (${densityClusters.reduce((acc, c) => acc + (c.total_detections || c.count || 0), 0).toLocaleString()} fires)` 
                    : `${visibleHotspots.length} points visible`}
                </span>
              </div>

              {/* Modern layer toggle pills */}
              <div className="flex items-center space-x-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setShowModis(!showModis)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    showModis 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  MODIS
                </button>
                <button
                  type="button"
                  onClick={() => setShowViirs(!showViirs)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    showViirs 
                      ? 'bg-sky-100 text-sky-800 border border-sky-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  VIIRS
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    showGrid 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  1km Grid
                </button>

                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>

                <select
                  value={mapStyle}
                  onChange={e => setMapStyle(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-lg text-[11px] py-1 px-2 font-medium text-slate-700 focus:outline-none"
                >
                  <option value="light">Light Canvas</option>
                  <option value="satellite">Satellite Imagery</option>
                  <option value="dark">Dark Canvas</option>
                </select>
              </div>
            </div>

            <div className="h-[420px] sm:h-[480px] lg:h-[520px] w-full relative z-0">
              <MapContainer
                center={isWorld ? [20, 0] : [aoi.south + (aoi.north - aoi.south) / 2, aoi.west + (aoi.east - aoi.west) / 2]}
                zoom={isWorld ? 2 : 7}
                style={{ height: '100%', width: '100%' }}
                attributionControl={true}
              >
                {mapStyle === 'light' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri, HERE, Garmin"
                    maxZoom={16}
                  />
                )}
                {mapStyle === 'satellite' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri, Maxar, Earthstar Geographics"
                    maxZoom={18}
                  />
                )}
                {mapStyle === 'dark' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri, HERE, Garmin"
                    maxZoom={16}
                  />
                )}

                {!isWorld && <MapBoundsFitter aoi={aoi} hotspots={visibleHotspots} />}

                {/* AOI Bounding Box for regional views */}
                {!isWorld && (
                  <Rectangle
                    bounds={[
                      [aoi.south, aoi.west],
                      [aoi.north, aoi.east]
                    ]}
                    pathOptions={{
                      color: '#FF5722',
                      weight: 1.5,
                      dashArray: '4, 4',
                      fill: false
                    }}
                  />
                )}

                {/* World Mode: Macro Density Clusters with Rich Instant Tooltip */}
                {isWorld && densityClusters.map((c, idx) => {
                  const detCount = c.total_detections || c.count || 1;
                  const radius = Math.min(22, Math.max(6, Math.sqrt(detCount) * 2.5));
                  const isCo = c.has_co_detection;
                  const hasViirs = (c.viirs_detections || c.viirs_count || 0) > 0;
                  const color = isCo 
                    ? '#10B981' 
                    : hasViirs 
                    ? '#0EA5E9' 
                    : '#F59E0B';

                  return (
                    <CircleMarker
                      key={`global-clust-${idx}`}
                      center={[c.lat, c.lon]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.82,
                        color: '#FFFFFF',
                        weight: 1.5
                      }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -6]} opacity={1}>
                        <div className="p-1.5 text-xs font-sans text-slate-900 leading-tight">
                          <div className="font-bold flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                            <span>{detCount.toLocaleString()} Fire Detections</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatCoord(c.lat, true)}, {formatCoord(c.lon, false)}
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-700 mt-1">
                            <span className="text-amber-600">MODIS: {c.modis_detections ?? c.modis_count ?? 0}</span>
                            <span>•</span>
                            <span className="text-sky-600">VIIRS: {c.viirs_detections ?? c.viirs_count ?? 0}</span>
                          </div>
                          <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                            Mean FRP: {(c.mean_frp || 0).toFixed(1)} MW
                          </div>
                        </div>
                      </LeafletTooltip>
                      <Popup>
                        <div className="p-2 space-y-1.5 text-xs font-sans text-slate-800">
                          <div className="font-bold border-b border-slate-100 pb-1 text-sm text-slate-900">
                            {detCount.toLocaleString()} Fire Detections
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatCoord(c.lat, true)}, {formatCoord(c.lon, false)}
                          </div>
                          <div className="flex justify-between text-[11px] pt-1">
                            <span className="text-amber-600 font-medium">MODIS: {c.modis_detections ?? c.modis_count ?? 0}</span>
                            <span className="text-sky-600 font-medium">VIIRS: {c.viirs_detections ?? c.viirs_count ?? 0}</span>
                          </div>
                          {isCo && (
                            <div className="text-[10px] text-emerald-600 font-bold">
                              ✓ Cross-Sensor Co-Detection
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Mean FRP: {(c.mean_frp || 0).toFixed(1)} MW
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {/* Regional Mode: 1km Grid Cells with Instant Hover Tooltip */}
                {!isWorld && showGrid && gridCells.map(cell => {
                  const b = cell.cell_bounds_wgs84;
                  if (!b) return null;
                  const isCo = cell.cross_sensor_presence;
                  return (
                    <Rectangle
                      key={cell.grid_cell_id}
                      bounds={[[b.south, b.west], [b.north, b.east]]}
                      pathOptions={{
                        color: isCo ? '#10B981' : '#10B981',
                        weight: isCo ? 2 : 1.2,
                        fillColor: isCo ? '#10B981' : '#10B981',
                        fillOpacity: isCo ? 0.35 : 0.18
                      }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -4]} opacity={1}>
                        <div className="p-1.5 text-xs font-sans text-slate-900 leading-tight">
                          <div className="font-bold text-emerald-700 flex items-center space-x-1">
                            <span>1km Equal-Area Grid Cell</span>
                            {isCo && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">DUAL</span>}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{cell.grid_cell_id}</div>
                          <div className="text-[11px] font-semibold text-slate-800 mt-1">
                            {cell.total_detections} Detections • {cell.sensors_present}
                          </div>
                        </div>
                      </LeafletTooltip>
                      <Popup>
                        <div className="text-xs space-y-1.5 font-sans">
                          <div className="font-bold text-slate-900">1km Equal-Area Grid Cell</div>
                          <div className="font-mono text-[10px] text-slate-500">{cell.grid_cell_id}</div>
                          <div className="flex items-center space-x-1">
                            <span className="text-slate-500">Status:</span>
                            <span className="font-semibold text-slate-800">{cell.sensors_present}</span>
                          </div>
                          <div>Total Detections: <span className="font-bold text-slate-900">{cell.total_detections}</span></div>
                          <div>Mean FRP: <span className="font-bold text-orange-600">{((cell.modis_frp_mean || cell.viirs_frp_mean || 0)).toFixed(1)} MW</span></div>
                        </div>
                      </Popup>
                    </Rectangle>
                  );
                })}

                {/* Regional Mode: Granular Observation Points with Hover Tooltip */}
                {!isWorld && visibleHotspots.map(h => {
                  const isModis = h.sensor_family === 'MODIS';
                  const color = isModis ? '#F59E0B' : '#0EA5E9';
                  return (
                    <CircleMarker
                      key={h.observation_id}
                      center={[h.latitude, h.longitude]}
                      radius={isModis ? 6 : 4.5}
                      pathOptions={{
                        color: '#FFFFFF',
                        weight: 1.5,
                        fillColor: color,
                        fillOpacity: 0.92
                      }}
                    >
                      <LeafletTooltip direction="top" offset={[0, -6]} opacity={1}>
                        <div className="p-1.5 text-xs font-sans text-slate-900 leading-tight">
                          <div className="font-bold flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                            <span>{h.sensor_family} • {h.satellite}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] font-bold text-orange-600 mt-1">
                            <span>{h.frp_mw?.toFixed(1)} MW</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-700 font-semibold">{h.brightness_temperature_kelvin?.toFixed(0)} K</span>
                          </div>
                        </div>
                      </LeafletTooltip>
                      <Popup>
                        <div className="text-xs space-y-1.5 font-sans">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></span>
                            <span>{h.sensor_family} ({h.satellite})</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 text-[11px] pt-1.5 border-t border-slate-100">
                            <div>FRP: <span className="font-bold text-orange-600">{h.frp_mw?.toFixed(1)} MW</span></div>
                            <div>Temp: <span className="font-semibold text-slate-800">{h.brightness_temperature_kelvin?.toFixed(0)} K</span></div>
                            <div>Time: <span className="font-mono text-[10px] text-slate-600">{h.acquisition_datetime_utc?.slice(11, 16)} UTC</span></div>
                            <div>Conf: <span className="font-semibold text-slate-800">{h.confidence_raw || 'N/A'}</span></div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="p-3 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-medium">MODIS (1 km)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span className="font-medium">VIIRS (375 m)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-medium">Co-Detected 1km Cell</span>
                </span>
              </div>
              <Link to="/fire-map" className="text-orange-600 hover:text-orange-700 font-bold flex items-center space-x-1">
                <span>Open Full Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ACTIVITY SUMMARY (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
                <h3 className="font-bold text-base text-slate-900">Observation Summary</h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase">UTC Synchronized</span>
              </div>

              {/* Sensor share bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Sensor Balance</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    {modisPct}% MODIS / {viirsPct}% VIIRS
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${modisPct}%` }} className="bg-amber-500 transition-all duration-300" title={`MODIS: ${modisPct}%`}></div>
                  <div style={{ width: `${viirsPct}%` }} className="bg-sky-500 transition-all duration-300" title={`VIIRS: ${viirsPct}%`}></div>
                </div>
              </div>

              {/* Summary Items */}
              <div className="space-y-3 text-xs">
                {isWorld && globalSummary && globalSummary.top_countries && globalSummary.top_countries.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Active Regions</span>
                    <div className="space-y-1.5">
                      {globalSummary.top_countries.slice(0, 4).map((tc) => (
                        <div key={tc.iso3} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{tc.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 ml-1.5">{tc.iso3}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-orange-600">
                            {((tc as any).observations_count || (tc as any).observation_count || 0).toLocaleString()} fires
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Latest Satellite Acquisition</span>
                      <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                        {summary?.kpi?.latest_observation_utc ? summary.kpi.latest_observation_utc.replace('T', ' ').slice(0, 16) + ' UTC' : 'No records recorded'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                      <span className="text-[10px] font-mono uppercase text-slate-400">Active AOI</span>
                      <div className="font-bold text-xs text-slate-900 mt-0.5">{aoi.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{formatAOIBounds(aoi)}</div>
                    </div>
                  </>
                )}

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Analytical Projection</span>
                  <div className="font-mono font-bold text-xs text-slate-900 mt-0.5">EPSG:6933 Equal-Area</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Guarantees equal ground surface area (1 km²) per grid cell worldwide.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              {isWorld ? (
                <>
                  <Link 
                    to="/global-explorer"
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 transition-colors"
                  >
                    <span>Explore Continents &amp; Countries</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link 
                    to="/time-machine"
                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs font-bold text-orange-600 border border-orange-200 transition-colors"
                  >
                    <span>Launch Global Time Machine</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <Link 
                  to="/comparison"
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 border border-slate-200 transition-colors"
                >
                  <span>View Full Sensor Comparison</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* TWO-COLUMN SECTION: TIMELINE + MONTHLY SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Daily Activity Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Daily Activity Timeline</h3>
                  <p className="text-xs text-slate-500">
                    Harmonized 1km grid cells vs raw sensor detection counts per UTC day
                  </p>
                </div>
              </div>

              <div className="h-64 w-full mt-4">
                {summary && summary.recent_timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.recent_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', fontSize: '11px', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
                        iconType="circle"
                      />
                      <Bar dataKey="active_grid_cells" name="Active 1km Cells" fill="#FF5722" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="viirs_count" name="VIIRS Detections" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="modis_count" name="MODIS Detections" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <p className="text-xs">No observation records ingested yet for this AOI.</p>
                    <button
                      onClick={handleQuickIngest}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                    >
                      Fetch NASA Observations
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Source: NASA FIRMS (Terra/Aqua MODIS, NOAA-20/21 VIIRS)</span>
              <span className="font-mono">Timezone: UTC 24-hr</span>
            </div>
          </div>

          {/* Monthly Overview Card (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Burning Calendar Overview</h3>
                  <p className="text-xs text-slate-500">
                    Quantile-based distribution across recent observation days
                  </p>
                </div>
                <Link to="/calendar" className="text-xs text-orange-600 font-bold hover:underline">
                  Open Calendar &rarr;
                </Link>
              </div>

              {/* Visual Calendar Teaser Matrix */}
              <div className="my-4 p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">Recent Observation Grid</span>
                  <span className="font-mono text-[11px] font-bold text-slate-800">
                    {summary?.recent_timeline?.filter(t => t.active_grid_cells > 0).length || 0} active dates
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {(summary?.recent_timeline?.slice(-14) || []).map((day, idx) => {
                    const count = day.active_grid_cells;
                    let bg = '#E2E8F0';
                    if (count > 0 && count <= 3) bg = '#FFEDD5';
                    else if (count > 3 && count <= 10) bg = '#FDBA74';
                    else if (count > 10) bg = '#FF5722';

                    return (
                      <div 
                        key={idx} 
                        title={`${day.date}: ${count} active 1km cells`}
                        style={{ backgroundColor: bg }}
                        className="h-8 rounded-lg flex items-center justify-center text-[10px] font-mono text-slate-900 font-bold transition-transform hover:scale-105"
                      >
                        {day.date.slice(8, 10)}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                  <span>Lower Activity</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-slate-200"></span>
                    <span className="w-2.5 h-2.5 rounded bg-orange-100"></span>
                    <span className="w-2.5 h-2.5 rounded bg-orange-300"></span>
                    <span className="w-2.5 h-2.5 rounded bg-orange-500"></span>
                  </div>
                  <span>High Activity</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                The Burning Activity Calendar uses empirical relative quantiles instead of arbitrary universal risk cutoffs, making regional patterns comparable across seasons.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link 
                to="/calendar"
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs font-bold text-orange-600 border border-orange-200 transition-colors"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Launch Full Burning Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT OBSERVATIONS TABLE */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">Recent Satellite Observations</h3>
              <p className="text-xs text-slate-500">
                Individual sensor detections ingested into the active database
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTableSortAsc(!tableSortAsc)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{tableSortAsc ? 'Oldest First' : 'Newest First'}</span>
              </button>
              <a
                href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-sky-500" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-3 px-4 font-bold">UTC Date &amp; Time</th>
                  <th className="py-3 px-4 font-bold">Coordinates (WGS84)</th>
                  <th className="py-3 px-4 font-bold">Sensor Family</th>
                  <th className="py-3 px-4 font-bold">Satellite</th>
                  <th className="py-3 px-4 font-bold">FRP (MW)</th>
                  <th className="py-3 px-4 font-bold">Brightness (K)</th>
                  <th className="py-3 px-4 font-bold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedHotspots.length > 0 ? (
                  paginatedHotspots.map(h => {
                    const isModis = h.sensor_family === 'MODIS';
                    return (
                      <tr key={h.observation_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {h.acquisition_datetime_utc ? h.acquisition_datetime_utc.replace('T', ' ').slice(0, 16) + ' UTC' : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isModis 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {h.sensor_family}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-semibold">{h.satellite}</td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-600">
                          {h.frp_mw !== null && h.frp_mw !== undefined ? h.frp_mw.toFixed(1) : '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {h.brightness_temperature_kelvin ? h.brightness_temperature_kelvin.toFixed(1) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {h.confidence_raw || '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No observations available for this area. Click "Sync NASA FIRMS" above to fetch recent observations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">
                Showing page {tablePage} of {totalPages} ({sortedHotspots.length} total records)
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={tablePage === 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={tablePage === totalPages}
                  onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODERN FOOTER */}
        <footer className="border-t border-slate-200/80 pt-6 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
          <div className="space-y-1">
            <p className="font-bold text-slate-900">
              FirePulse: NASA Space Apps Challenge 2026 • Team Virtual Warriors
            </p>
            <p className="text-[11px] text-slate-400">
              Active fire data provided by NASA LANCE / FIRMS. Standardized on EPSG:6933 Equal-Area Grid.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>AOI: {aoi.name}</span>
            <span>•</span>
            <span>Harmonization: 1km Daily Cell</span>
            <span>•</span>
            <Link to="/about" className="text-orange-600 font-bold hover:underline">
              Read Methodology
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};
