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
  CheckCircle2,
  ExternalLink
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

    if (hotspots.length > 0) {
      const lats = hotspots.map(h => h.latitude);
      const lons = hotspots.map(h => h.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const latPad = Math.max(0.04, (maxLat - minLat) * 0.12);
      const lonPad = Math.max(0.04, (maxLon - minLon) * 0.12);

      map.fitBounds([
        [minLat - latPad, minLon - lonPad],
        [maxLat + latPad, maxLon + lonPad]
      ], { padding: [24, 24], maxZoom: 12, animate: true });
    } else {
      map.fitBounds([
        [aoi.south, aoi.west],
        [aoi.north, aoi.east]
      ], { padding: [20, 20], animate: true });
    }
  }, [aoi, hotspots, map]);

  return null;
}

export const DashboardPage: React.FC = () => {
  const { aoi, refreshKey, triggerRefresh } = useAOI();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null);
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
  const pageSize = 10;

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
        day_range: 1,
        sources: ['MODIS_NRT', 'VIIRS_NOAA20_NRT']
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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
      <Header 
        title="Harmonized Fire Intelligence" 
        subtitle="Spatially and temporally calibrated NASA FIRMS observations (EPSG:6933 1km Grid)"
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title & Action Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isWorld ? 'Global Active Fires Overview' : `Active Fires: ${aoi.name}`}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-200/80 font-mono text-slate-700 font-medium">
                {isWorld ? 'Worldwide' : 'Regional AOI'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-calibrated Terra/Aqua MODIS (1,000m) and NOAA-20/21 VIIRS (375m) observations.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleQuickIngest}
              disabled={ingesting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
              <span>{ingesting ? 'Syncing FIRMS...' : 'Sync NASA Data'}</span>
            </button>
            <Link
              to="/settings"
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
            >
              Ingest Options
            </Link>
          </div>
        </div>

        {/* Ingestion notice */}
        {ingestMsg && (
          <div className={`p-3 rounded-md text-xs flex items-center space-x-2.5 border ${
            ingestMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-medium">{ingestMsg.text}</span>
          </div>
        )}

        {/* METRICS ROW (4 Metrics Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Active Grid Cells */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Active 1km Cells</span>
              <Grid className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {loading ? '—' : ((summary?.kpi?.active_grid_cell_days ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Harmonized footprint</span>
              <span className="font-mono text-[10px] text-slate-400">EPSG:6933</span>
            </div>
          </div>

          {/* 2. MODIS Observations */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">MODIS Detections</span>
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {loading ? '—' : ((summary?.kpi?.total_modis_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Terra &amp; Aqua</span>
              <span className="font-mono text-[10px] text-amber-700">1,000m</span>
            </div>
          </div>

          {/* 3. VIIRS Observations */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">VIIRS Detections</span>
              <Layers className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {loading ? '—' : ((summary?.kpi?.total_viirs_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>NOAA-20/21 &amp; S-NPP</span>
              <span className="font-mono text-[10px] text-sky-700">375m</span>
            </div>
          </div>

          {/* 4. Dual Verified / Co-Detected */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">Dual Co-Detected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {loading ? '—' : ((summary?.kpi?.cross_sensor_co_detected_cell_days ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Same-day verification</span>
              <span className="font-mono text-[10px] text-emerald-700">Both Sensors</span>
            </div>
          </div>
        </div>

        {/* MAP & RIGHT PANEL (2 columns: 8 cols + 4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Map Column */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-lg overflow-hidden shadow-xs flex flex-col">
            {/* Map Controls Header */}
            <div className="px-4 py-2.5 border-b border-slate-200/80 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-900">Geospatial Distribution</span>
                <span className="text-[10px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                  {isWorld 
                    ? `${densityClusters.length} clusters` 
                    : `${visibleHotspots.length} points visible`}
                </span>
              </div>

              {/* Layer toggles */}
              <div className="flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setShowModis(!showModis)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    showModis 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  MODIS
                </button>
                <button
                  type="button"
                  onClick={() => setShowViirs(!showViirs)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    showViirs 
                      ? 'bg-sky-100 text-sky-900 border border-sky-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  VIIRS
                </button>
                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    showGrid 
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                      : 'bg-white text-slate-400 border border-slate-200'
                  }`}
                >
                  1km Grid
                </button>

                <div className="h-3 w-[1px] bg-slate-200 mx-1"></div>

                <select
                  value={mapStyle}
                  onChange={e => setMapStyle(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded text-[11px] py-0.5 px-1.5 text-slate-700 focus:outline-none"
                >
                  <option value="light">Light Canvas</option>
                  <option value="satellite">Satellite</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="h-[440px] w-full relative z-0">
              <MapContainer
                center={isWorld ? [20, 0] : [aoi.south + (aoi.north - aoi.south) / 2, aoi.west + (aoi.east - aoi.west) / 2]}
                zoom={isWorld ? 2 : 7}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
              >
                {mapStyle === 'light' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                  />
                )}
                {mapStyle === 'satellite' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={18}
                  />
                )}
                {mapStyle === 'dark' && (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={16}
                  />
                )}

                {!isWorld && <MapBoundsFitter aoi={aoi} hotspots={visibleHotspots} />}

                {/* Regional AOI Bounding Box */}
                {!isWorld && (
                  <Rectangle
                    bounds={[
                      [aoi.south, aoi.west],
                      [aoi.north, aoi.east]
                    ]}
                    pathOptions={{
                      color: '#EA580C',
                      weight: 1.5,
                      dashArray: '4, 4',
                      fill: false
                    }}
                  />
                )}

                {/* Global Mode: Macro Density Clusters */}
                {isWorld && densityClusters.map((c, idx) => {
                  const detCount = c.total_detections || c.count || 1;
                  const radius = Math.min(20, Math.max(5, Math.sqrt(detCount) * 2.2));
                  const isCo = c.has_co_detection;
                  const hasViirs = (c.viirs_detections || c.viirs_count || 0) > 0;
                  const color = isCo ? '#10B981' : hasViirs ? '#0284C7' : '#D97706';

                  return (
                    <CircleMarker
                      key={`global-clust-${idx}`}
                      center={[c.lat, c.lon]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.85,
                        color: '#FFFFFF',
                        weight: 1.2
                      }}
                    >
                      <Popup>
                        <div className="p-1 space-y-1 font-sans text-xs">
                          <div className="font-semibold text-slate-900">
                            {detCount.toLocaleString()} Fire Detections
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {formatCoord(c.lat, true)}, {formatCoord(c.lon, false)}
                          </div>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                            <span className="text-amber-700">MODIS: {c.modis_detections ?? c.modis_count ?? 0}</span>
                            <span className="text-sky-700">VIIRS: {c.viirs_detections ?? c.viirs_count ?? 0}</span>
                          </div>
                          <div className="text-[10px] text-slate-600">
                            Mean FRP: {(c.mean_frp || 0).toFixed(1)} MW
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}

                {/* Regional Mode: 1km Grid Cells */}
                {!isWorld && showGrid && gridCells.map(cell => {
                  const b = cell.cell_bounds_wgs84;
                  if (!b) return null;
                  const isCo = cell.cross_sensor_presence;
                  return (
                    <Rectangle
                      key={cell.grid_cell_id}
                      bounds={[[b.south, b.west], [b.north, b.east]]}
                      pathOptions={{
                        color: isCo ? '#059669' : '#10B981',
                        weight: isCo ? 1.8 : 1.0,
                        fillColor: isCo ? '#10B981' : '#34D399',
                        fillOpacity: isCo ? 0.35 : 0.18
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 font-sans">
                          <div className="font-semibold text-slate-900">1km Grid Cell: {cell.grid_cell_id}</div>
                          <div className="text-slate-600">Detections: <strong>{cell.total_detections}</strong> ({cell.sensors_present})</div>
                          <div className="text-slate-600">Mean FRP: <strong>{((cell.modis_frp_mean || cell.viirs_frp_mean || 0)).toFixed(1)} MW</strong></div>
                        </div>
                      </Popup>
                    </Rectangle>
                  );
                })}

                {/* Regional Mode: Observation Points */}
                {!isWorld && visibleHotspots.map(h => {
                  const isModis = h.sensor_family === 'MODIS';
                  const color = isModis ? '#D97706' : '#0284C7';
                  return (
                    <CircleMarker
                      key={h.observation_id}
                      center={[h.latitude, h.longitude]}
                      radius={isModis ? 5 : 4}
                      pathOptions={{
                        color: '#FFFFFF',
                        weight: 1.2,
                        fillColor: color,
                        fillOpacity: 0.9
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 font-sans">
                          <div className="font-semibold text-slate-900">{h.sensor_family} ({h.satellite})</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 text-[11px] pt-1 border-t border-slate-100">
                            <div>FRP: <span className="font-bold text-orange-600">{h.frp_mw?.toFixed(1)} MW</span></div>
                            <div>Temp: <span>{h.brightness_temperature_kelvin?.toFixed(0)} K</span></div>
                            <div>Time: <span className="font-mono text-[10px]">{h.acquisition_datetime_utc?.slice(11, 16)} UTC</span></div>
                            <div>Confidence: <span>{h.confidence_raw || '—'}</span></div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map Legend Footer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <span className="text-[11px]">MODIS (1,000m)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                  <span className="text-[11px]">VIIRS (375m)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-[11px]">Dual Co-Detected</span>
                </span>
              </div>
              <Link to="/fire-map" className="text-orange-600 hover:text-orange-700 font-semibold text-[11px] flex items-center space-x-0.5">
                <span>Detailed Map</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Right Panel: Observation Summary */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="border-b border-slate-200/80 pb-2.5 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900">Observation Summary</h3>
                <span className="text-[10px] font-mono text-slate-400">UTC CLOCK</span>
              </div>

              {/* Sensor share bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Sensor Balance</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold">
                    {modisPct}% MODIS / {viirsPct}% VIIRS
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${modisPct}%` }} className="bg-amber-600" title={`MODIS: ${modisPct}%`}></div>
                  <div style={{ width: `${viirsPct}%` }} className="bg-sky-600" title={`VIIRS: ${viirsPct}%`}></div>
                </div>
              </div>

              {/* Metadata Items */}
              <div className="space-y-2 text-xs">
                {isWorld && globalSummary && globalSummary.top_countries && globalSummary.top_countries.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold">Top Active Nations</span>
                    <div className="space-y-1">
                      {globalSummary.top_countries.slice(0, 4).map((tc) => (
                        <div key={tc.iso3} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                          <span className="font-medium text-slate-800">{tc.name}</span>
                          <span className="font-mono text-slate-600 text-[11px]">
                            {((tc as any).observations_count || (tc as any).observation_count || 0).toLocaleString()} fires
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Latest Telemetry</span>
                      <div className="font-mono font-medium text-xs text-slate-900 mt-0.5">
                        {summary?.kpi?.latest_observation_utc ? summary.kpi.latest_observation_utc.replace('T', ' ').slice(0, 16) + ' UTC' : 'No records recorded'}
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Bounding Box</span>
                      <div className="font-mono text-[11px] text-slate-800 mt-0.5">{formatAOIBounds(aoi)}</div>
                    </div>
                  </>
                )}

                <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">Analytical Projection</span>
                  <div className="font-mono text-xs font-semibold text-slate-900 mt-0.5">EPSG:6933 Equal-Area</div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ensures true 1 km² cell surface area regardless of latitude.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              <Link 
                to="/comparison"
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
              >
                <span>Sensor Footprint Comparison</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link 
                to="/calendar"
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors"
              >
                <span>Harmonized Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* TIMELINE & RECENT ACTIVITY (2 columns: 7 cols + 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Daily Activity Chart */}
          <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Daily Observation Timeline</h3>
                  <p className="text-xs text-slate-500">
                    Active 1km grid cells vs raw detection counts
                  </p>
                </div>
              </div>

              <div className="h-60 w-full mt-2">
                {summary?.recent_timeline && summary.recent_timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.recent_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '6px', fontSize: '11px', color: '#0F172A' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                      <Bar dataKey="active_grid_cells" name="Active 1km Cells" fill="#EA580C" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="viirs_count" name="VIIRS (375m)" fill="#0284C7" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="modis_count" name="MODIS (1,000m)" fill="#D97706" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <p className="text-xs">No observation records ingested yet for this AOI.</p>
                    <button
                      onClick={handleQuickIngest}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                    >
                      Sync NASA Data
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>NASA FIRMS Near-Real-Time Data Streams</span>
              <span className="font-mono">UTC Standard</span>
            </div>
          </div>

          {/* Burning Calendar Overview */}
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-lg p-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Seasonality &amp; Calendar Preview</h3>
                  <p className="text-xs text-slate-500">
                    Daily 1km cell density across the last 14 observation dates
                  </p>
                </div>
                <Link to="/calendar" className="text-xs text-orange-600 font-semibold hover:underline">
                  Full View &rarr;
                </Link>
              </div>

              {/* Mini Calendar Scrubber */}
              <div className="my-3 p-3 bg-slate-50 border border-slate-200/80 rounded space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Recent Observation Dates</span>
                  <span className="font-mono text-[11px] font-semibold text-slate-800">
                    {summary?.recent_timeline?.filter(t => t.active_grid_cells > 0).length || 0} active days
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1 pt-1">
                  {(summary?.recent_timeline?.slice(-14) || []).map((day, idx) => {
                    const count = day.active_grid_cells;
                    let bg = '#E2E8F0';
                    let text = 'text-slate-700';
                    if (count > 0 && count <= 3) { bg = '#FFEDD5'; text = 'text-orange-900'; }
                    else if (count > 3 && count <= 10) { bg = '#FB923C'; text = 'text-white'; }
                    else if (count > 10) { bg = '#EA580C'; text = 'text-white'; }

                    return (
                      <div 
                        key={idx} 
                        title={`${day.date}: ${count} active 1km cells`}
                        style={{ backgroundColor: bg }}
                        className={`h-7 rounded flex items-center justify-center text-[10px] font-mono font-semibold ${text} transition-opacity hover:opacity-80`}
                      >
                        {day.date.slice(8, 10)}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-200">
                  <span>Zero</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded bg-slate-200"></span>
                    <span className="w-2 h-2 rounded bg-orange-100"></span>
                    <span className="w-2 h-2 rounded bg-orange-400"></span>
                    <span className="w-2 h-2 rounded bg-orange-600"></span>
                  </div>
                  <span>High Activity</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Standardizes raw satellite incident spikes by mapping detections to permanent 1km land surface cells.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link 
                to="/trends"
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium transition-colors"
              >
                <span>Multi-Year Historical Trends</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* OBSERVATIONS DATA TABLE */}
        <div className="bg-white border border-slate-200/90 rounded-lg shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Recent Satellite Observations</h3>
              <p className="text-xs text-slate-500">
                Granular incident telemetry from active satellite overpasses
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTableSortAsc(!tableSortAsc)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>{tableSortAsc ? 'Oldest' : 'Newest'}</span>
              </button>
              <a
                href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 px-3.5 font-semibold">UTC Date &amp; Time</th>
                  <th className="py-2.5 px-3.5 font-semibold">Coordinates</th>
                  <th className="py-2.5 px-3.5 font-semibold">Sensor</th>
                  <th className="py-2.5 px-3.5 font-semibold">Satellite</th>
                  <th className="py-2.5 px-3.5 font-semibold">FRP (MW)</th>
                  <th className="py-2.5 px-3.5 font-semibold">Brightness (K)</th>
                  <th className="py-2.5 px-3.5 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedHotspots.length > 0 ? (
                  paginatedHotspots.map(h => {
                    const isModis = h.sensor_family === 'MODIS';
                    return (
                      <tr key={h.observation_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono text-slate-900">
                          {h.acquisition_datetime_utc ? h.acquisition_datetime_utc.replace('T', ' ').slice(0, 16) + ' UTC' : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500 text-[11px]">
                          {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            isModis 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                          }`}>
                            {h.sensor_family}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700">{h.satellite}</td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-orange-600">
                          {h.frp_mw !== null && h.frp_mw !== undefined ? h.frp_mw.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600">
                          {h.brightness_temperature_kelvin ? h.brightness_temperature_kelvin.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">
                          {h.confidence_raw || '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                      No observations in database for this region. Click "Sync NASA Data" above to fetch telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="p-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-[11px]">
                Page {tablePage} of {totalPages} ({sortedHotspots.length} records)
              </span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  disabled={tablePage === 1}
                  className="px-2 py-0.5 rounded border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                  disabled={tablePage === totalPages}
                  className="px-2 py-0.5 rounded border border-slate-300 text-xs text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
