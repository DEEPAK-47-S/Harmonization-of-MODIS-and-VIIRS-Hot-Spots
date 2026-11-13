import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Play, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Layers, 
  Grid, 
  Clock, 
  Info, 
  Download, 
  ChevronRight,
  Filter,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  Rectangle, 
  useMap 
} from 'react-leaflet';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { FirePulseAPI } from '../services/api';
import { DashboardSummary, Observation, GridCell, GlobalSummary, MapDensityCluster, formatAOIBounds, formatCoord } from '../types';

// Map auto-fitter helper
const MapBoundsFitter: React.FC<{ 
  aoi: { west: number; south: number; east: number; north: number };
  hotspots: Observation[];
}> = ({ aoi, hotspots }) => {
  const map = useMap();
  useEffect(() => {
    if (hotspots.length > 0) {
      const lats = hotspots.map(h => h.latitude);
      const lons = hotspots.map(h => h.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const latPad = Math.max(0.05, (maxLat - minLat) * 0.15);
      const lonPad = Math.max(0.05, (maxLon - minLon) * 0.15);
      map.fitBounds([
        [minLat - latPad, minLon - lonPad],
        [maxLat + latPad, maxLon + lonPad]
      ], { padding: [30, 30], maxZoom: 12, animate: true });
    } else {
      map.fitBounds([
        [aoi.south, aoi.west],
        [aoi.north, aoi.east]
      ], { padding: [25, 25], animate: true });
    }
  }, [aoi, hotspots, map]);
  return null;
};

export const DashboardPage: React.FC = () => {
  const { aoi, refreshKey, triggerRefresh } = useAOI();
  const { showToast } = useToast();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null);
  const [densityClusters, setDensityClusters] = useState<MapDensityCluster[]>([]);
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
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
          limit: isWorld ? 0 : 150,
          include_grid: !isWorld
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
        text: `NASA FIRMS query complete: ${res.total_records_saved} new observations processed into ${res.harmonization?.active_grid_cells_created || 0} grid cells.`
      });
      showToast('success', 'NASA FIRMS Data Fetched', `${res.total_records_saved} observations ingested.`);
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
  const totalObs = (summary?.kpi.total_modis_observations || 0) + (summary?.kpi.total_viirs_observations || 0);
  const modisPct = totalObs > 0 ? Math.round(((summary?.kpi.total_modis_observations || 0) / totalObs) * 100) : 0;
  const viirsPct = totalObs > 0 ? 100 - modisPct : 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Harmonized Fire Intelligence" 
        subtitle="Spatially and temporally aggregated NASA FIRMS observations"
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* PAGE INTRODUCTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              {isWorld ? 'Global Earth Observation / Planetary Fire Intel' : `Regional Earth Observation / ${aoi.name}`}
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              {isWorld ? 'One planet. A clearer picture of fire activity.' : `Fire activity, in focus: ${aoi.name}`}
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              {isWorld 
                ? 'Worldwide active fire detections across all seven continents, harmonized from NASA MODIS (Terra/Aqua) and VIIRS (NOAA-20/21/S-NPP) into a standardized 1km equal-area grid.' 
                : `Explore where satellite observations detect burning activity across ${aoi.name}, harmonized to a common 1km grid.`}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={handleQuickIngest}
              disabled={ingesting}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-semibold bg-[#E65C35] hover:bg-[#D44F29] text-white transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${ingesting ? 'animate-spin' : ''}`} />
              <span>{ingesting ? 'Fetching NASA FIRMS...' : isWorld ? 'Sync Global NASA (3 Days)' : 'Sync Region NASA (3 Days)'}</span>
            </button>
            <Link
              to="/settings"
              className="px-3.5 py-2 rounded-md text-xs font-medium bg-white hover:bg-[#EBE8DF] text-[#252923] border border-[#E1DED5] transition-colors"
            >
              Upload Archive
            </Link>
          </div>
        </div>

        {/* Ingestion status notice */}
        {ingestMsg && (
          <div className={`p-3.5 rounded-md text-xs flex items-center space-x-2.5 border ${
            ingestMsg.type === 'success'
              ? 'bg-[#54785E]/10 border-[#54785E]/30 text-[#54785E]'
              : 'bg-[#BD493C]/10 border-[#BD493C]/30 text-[#BD493C]'
          }`}>
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-medium">{ingestMsg.text}</span>
          </div>
        )}

        {/* METRIC STRIP (4 Compact Editorial Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Active Grid Cells */}
          <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#777970] font-semibold">Active Grid Cells</span>
              <Grid className="w-3.5 h-3.5 text-[#E65C35]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#252923]">
              {loading ? '—' : (summary?.kpi.active_grid_cell_days.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-[#252923] font-medium mt-0.5">1 km analytical cells</div>
            <p className="text-[10px] text-[#777970] mt-1 leading-tight">
              EPSG:6933 equal-area cell-days with verified thermal activity.
            </p>
          </div>

          {/* 2. MODIS Observations */}
          <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#C27B26] font-semibold">MODIS Detections</span>
              <span className="w-2 h-2 rounded-full bg-[#C27B26]"></span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#252923]">
              {loading ? '—' : (summary?.kpi.total_modis_observations.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-[#252923] font-medium mt-0.5">Observations (Terra &amp; Aqua)</div>
            <p className="text-[10px] text-[#777970] mt-1 leading-tight">
              1,000 m nadir footprint. Not confirmed single fires.
            </p>
          </div>

          {/* 3. VIIRS Observations */}
          <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#318C9B] font-semibold">VIIRS Detections</span>
              <span className="w-2 h-2 rounded-full bg-[#318C9B]"></span>
            </div>
            <div className="text-2xl font-serif font-bold text-[#252923]">
              {loading ? '—' : (summary?.kpi.total_viirs_observations.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-[#252923] font-medium mt-0.5">Observations (NOAA-20/21)</div>
            <p className="text-[10px] text-[#777970] mt-1 leading-tight">
              375 m nadir footprint (~7.11x finer area resolution).
            </p>
          </div>

          {/* 4. Cross-Sensor Co-Detected */}
          <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#777970] font-semibold">Co-Detected Cell-Days</span>
              <Layers className="w-3.5 h-3.5 text-[#54785E]" />
            </div>
            <div className="text-2xl font-serif font-bold text-[#252923]">
              {loading ? '—' : (summary?.kpi.cross_sensor_co_detected_cell_days.toLocaleString() ?? '0')}
            </div>
            <div className="text-[11px] text-[#252923] font-medium mt-0.5">Joint Sensor Overlap</div>
            <p className="text-[10px] text-[#777970] mt-1 leading-tight">
              1 km cells observed by both MODIS and VIIRS on the same UTC day.
            </p>
          </div>
        </div>

        {/* MAIN VISUALIZATION: 65% MAP / 35% ACTIVITY SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* MAP (65% width) */}
          <div className="lg:col-span-8 bg-white border border-[#E1DED5] rounded-lg overflow-hidden shadow-card flex flex-col">
            <div className="p-3.5 border-b border-[#E1DED5] bg-[#FAF8F3] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-serif font-semibold text-[#252923]">Active Observations Map</span>
                <span className="text-[10px] font-mono text-[#777970] bg-[#EBE8DF] px-2 py-0.5 rounded">
                  {visibleHotspots.length} points visible
                </span>
              </div>

              {/* Layer toggles & basemap switcher */}
              <div className="flex items-center space-x-2 text-xs">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showModis} 
                    onChange={e => setShowModis(e.target.checked)} 
                    className="rounded text-[#C27B26] focus:ring-0" 
                  />
                  <span className="text-[11px] text-[#777970]">MODIS</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showViirs} 
                    onChange={e => setShowViirs(e.target.checked)} 
                    className="rounded text-[#318C9B] focus:ring-0" 
                  />
                  <span className="text-[11px] text-[#777970]">VIIRS</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showGrid} 
                    onChange={e => setShowGrid(e.target.checked)} 
                    className="rounded text-[#E65C35] focus:ring-0" 
                  />
                  <span className="text-[11px] text-[#777970]">1km Grid</span>
                </label>

                <div className="h-3.5 w-[1px] bg-[#E1DED5] mx-1"></div>

                <select
                  value={mapStyle}
                  onChange={e => setMapStyle(e.target.value as any)}
                  className="bg-white border border-[#E1DED5] rounded text-[11px] py-1 px-1.5 text-[#252923] focus:outline-none"
                >
                  <option value="light">Light Canvas</option>
                  <option value="satellite">Satellite</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <div className="h-[380px] w-full relative">
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
                      color: '#E65C35',
                      weight: 1.5,
                      dashArray: '4, 4',
                      fill: false
                    }}
                  />
                )}

                {/* World Mode: Macro Density Clusters */}
                {isWorld && densityClusters.map((c, idx) => {
                  const radius = Math.min(20, Math.max(5, Math.sqrt(c.total_detections) * 2.5));
                  const color = c.has_co_detection 
                    ? '#BD493C' 
                    : c.viirs_detections > 0 
                    ? '#318C9B' 
                    : '#C27B26';

                  return (
                    <CircleMarker
                      key={`global-clust-${idx}`}
                      center={[c.lat, c.lon]}
                      radius={radius}
                      pathOptions={{
                        fillColor: color,
                        fillOpacity: 0.75,
                        color: '#FFFFFF',
                        weight: 1
                      }}
                    >
                      <Popup>
                        <div className="p-2 space-y-1 text-xs font-sans text-[#252923]">
                          <div className="font-bold border-b pb-1">
                            {c.total_detections} Total Detections
                          </div>
                          <div className="text-[10px] text-[#777970] font-mono">
                            {formatCoord(c.lat, true)}, {formatCoord(c.lon, false)}
                          </div>
                          <div className="flex justify-between text-[11px] pt-1">
                            <span className="text-[#C27B26]">MODIS: {c.modis_detections}</span>
                            <span className="text-[#318C9B]">VIIRS: {c.viirs_detections}</span>
                          </div>
                          {c.has_co_detection && (
                            <div className="text-[10px] text-[#BD493C] font-semibold">
                              ✓ Cross-Sensor Co-Detection
                            </div>
                          )}
                          <div className="text-[10px] text-[#777970]">
                            Mean FRP: {c.mean_frp.toFixed(1)} MW
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
                        color: isCo ? '#54785E' : '#E65C35',
                        weight: 1,
                        fillColor: isCo ? '#54785E' : '#E65C35',
                        fillOpacity: 0.18
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 font-sans">
                          <div className="font-semibold text-[#252923]">1km Analytical Cell</div>
                          <div className="font-mono text-[10px] text-[#777970]">{cell.grid_cell_id}</div>
                          <div>Status: <span className="font-medium">{cell.sensors_present}</span></div>
                          <div>Total Detections: <span className="font-semibold">{cell.total_detections}</span></div>
                          <div>Mean FRP: <span className="font-semibold">{((cell.modis_frp_mean || cell.viirs_frp_mean || 0)).toFixed(1)} MW</span></div>
                        </div>
                      </Popup>
                    </Rectangle>
                  );
                })}

                {/* Regional Mode: Granular Observation Points */}
                {!isWorld && visibleHotspots.map(h => {
                  const isModis = h.sensor_family === 'MODIS';
                  const color = isModis ? '#C27B26' : '#318C9B';
                  return (
                    <CircleMarker
                      key={h.observation_id}
                      center={[h.latitude, h.longitude]}
                      radius={isModis ? 5.5 : 4}
                      pathOptions={{
                        color: '#FFFFFF',
                        weight: 1,
                        fillColor: color,
                        fillOpacity: 0.85
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 font-sans">
                          <div className="flex items-center space-x-1.5 font-semibold text-[#252923]">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                            <span>{h.sensor_family} ({h.satellite})</span>
                          </div>
                          <div className="font-mono text-[10px] text-[#777970]">
                            {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 text-[11px] pt-1 border-t border-[#E1DED5]">
                            <div>FRP: <span className="font-semibold">{h.frp_mw?.toFixed(1)} MW</span></div>
                            <div>Brightness: <span className="font-semibold">{h.brightness_temperature_kelvin?.toFixed(0)} K</span></div>
                            <div>Time: <span className="font-mono text-[10px]">{h.acquisition_datetime_utc?.slice(11, 16)} UTC</span></div>
                            <div>Conf: <span className="font-medium">{h.confidence_raw || 'N/A'}</span></div>
                          </div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="p-2.5 bg-[#FAF8F3] border-t border-[#E1DED5] flex items-center justify-between text-[11px] text-[#777970]">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#C27B26]"></span>
                  <span>MODIS (1 km)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#318C9B]"></span>
                  <span>VIIRS (375 m)</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 border border-[#54785E] bg-[#54785E]/20"></span>
                  <span>Co-Detected 1km Cell</span>
                </span>
              </div>
              <Link to="/fire-map" className="text-[#E65C35] hover:underline font-medium flex items-center space-x-1">
                <span>Dedicated Map Experience</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ACTIVITY SUMMARY (35% width) */}
          <div className="lg:col-span-4 bg-white border border-[#E1DED5] rounded-lg p-5 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#E1DED5] pb-2 mb-3">
                <h3 className="font-serif font-semibold text-base text-[#252923]">Observation Summary</h3>
                <span className="text-[10px] font-mono text-[#777970] uppercase">UTC Synchronized</span>
              </div>

              {/* Sensor share bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#777970]">Sensor Share</span>
                  <span className="font-mono text-[11px] text-[#252923]">
                    {modisPct}% MODIS / {viirsPct}% VIIRS
                  </span>
                </div>
                <div className="h-2 w-full bg-[#EBE8DF] rounded-full overflow-hidden flex">
                  <div style={{ width: `${modisPct}%` }} className="bg-[#C27B26]" title={`MODIS: ${modisPct}%`}></div>
                  <div style={{ width: `${viirsPct}%` }} className="bg-[#318C9B]" title={`VIIRS: ${viirsPct}%`}></div>
                </div>
              </div>

              {/* Summary Items */}
              <div className="space-y-3 text-xs">
                {isWorld && globalSummary && globalSummary.top_countries.length > 0 ? (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase text-[#777970] font-semibold">Top Active Nations</span>
                    <div className="space-y-1.5">
                      {globalSummary.top_countries.slice(0, 4).map((tc) => (
                        <div key={tc.iso3} className="p-2 bg-[#FAF8F3] border border-[#E1DED5] rounded flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#252923] text-xs">{tc.name}</span>
                            <span className="text-[10px] font-mono text-[#777970] ml-1.5">{tc.iso3}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[#E65C35]">
                            {tc.observations_count.toLocaleString()} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md">
                      <span className="text-[10px] font-mono uppercase text-[#777970]">Latest UTC Acquisition</span>
                      <div className="font-mono font-medium text-sm text-[#252923] mt-0.5">
                        {summary?.kpi.latest_observation_utc ? summary.kpi.latest_observation_utc.replace('T', ' ').slice(0, 16) + ' UTC' : 'No records recorded'}
                      </div>
                    </div>

                    <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md">
                      <span className="text-[10px] font-mono uppercase text-[#777970]">Active Area of Interest</span>
                      <div className="font-semibold text-xs text-[#252923] mt-0.5">{aoi.name}</div>
                      <div className="font-mono text-[10px] text-[#777970]">{formatAOIBounds(aoi)}</div>
                    </div>
                  </>
                )}

                <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md">
                  <span className="text-[10px] font-mono uppercase text-[#777970]">Analytical Projection</span>
                  <div className="font-mono font-medium text-xs text-[#252923] mt-0.5">EPSG:6933 Equal-Area</div>
                  <p className="text-[10px] text-[#777970] mt-0.5">
                    Guarantees equal ground surface area (1 km²) per grid cell worldwide.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E1DED5] space-y-1.5">
              {isWorld ? (
                <>
                  <Link 
                    to="/global-explorer"
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] text-xs font-semibold text-[#252923] border border-[#E1DED5] transition-colors"
                  >
                    <span>Explore Continents &amp; Countries</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link 
                    to="/time-machine"
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] text-xs font-semibold text-[#E65C35] border border-[#E1DED5] transition-colors"
                  >
                    <span>Launch Global Time Machine</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              ) : (
                <Link 
                  to="/comparison"
                  className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] text-xs font-semibold text-[#252923] border border-[#E1DED5] transition-colors"
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
          <div className="lg:col-span-7 bg-white border border-[#E1DED5] rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#252923]">Daily Activity Timeline</h3>
                  <p className="text-xs text-[#777970]">
                    Harmonized 1km grid cells vs raw sensor detection counts per UTC day
                  </p>
                </div>
              </div>

              <div className="h-64 w-full mt-4">
                {summary && summary.recent_timeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.recent_timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#777970" fontSize={10} tickLine={false} />
                      <YAxis stroke="#777970" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1DED5', borderRadius: '6px', fontSize: '11px', color: '#252923' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
                        iconType="circle"
                      />
                      <Bar dataKey="active_grid_cells" name="Active 1km Cells" fill="#E65C35" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="viirs_count" name="VIIRS Detections" fill="#318C9B" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="modis_count" name="MODIS Detections" fill="#C27B26" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#777970] space-y-2">
                    <p className="text-xs">No observation records ingested yet for this AOI.</p>
                    <button
                      onClick={handleQuickIngest}
                      className="px-3 py-1.5 text-xs font-semibold rounded bg-[#E65C35] text-white hover:bg-[#D44F29] transition-colors"
                    >
                      Fetch NASA Observations
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E1DED5] text-[10px] text-[#777970] flex items-center justify-between">
              <span>Source: NASA FIRMS (Terra/Aqua MODIS, NOAA-20/21 VIIRS)</span>
              <span className="font-mono">Timezone: UTC 24-hr</span>
            </div>
          </div>

          {/* Monthly Overview Card (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E1DED5] rounded-lg p-5 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-serif font-semibold text-base text-[#252923]">Burning Calendar Overview</h3>
                  <p className="text-xs text-[#777970]">
                    Quantile-based distribution across recent observation days
                  </p>
                </div>
                <Link to="/calendar" className="text-xs text-[#E65C35] font-semibold hover:underline">
                  Open Calendar
                </Link>
              </div>

              {/* Visual Calendar Teaser Matrix */}
              <div className="my-4 p-4 bg-[#FAF8F3] border border-[#E1DED5] rounded-md space-y-3">
                <div className="flex items-center justify-between text-xs text-[#777970]">
                  <span>Recent Active Days</span>
                  <span className="font-mono text-[11px] text-[#252923]">
                    {summary?.recent_timeline.filter(t => t.active_grid_cells > 0).length || 0} active dates
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {(summary?.recent_timeline.slice(-14) || []).map((day, idx) => {
                    const count = day.active_grid_cells;
                    let bg = '#EBE8DF';
                    if (count > 0 && count <= 3) bg = '#FCECE7';
                    else if (count > 3 && count <= 10) bg = '#F7D6CB';
                    else if (count > 10) bg = '#E65C35';

                    return (
                      <div 
                        key={idx} 
                        title={`${day.date}: ${count} active 1km cells`}
                        style={{ backgroundColor: bg }}
                        className="h-7 rounded flex items-center justify-center text-[10px] font-mono text-[#252923] font-medium transition-transform hover:scale-110"
                      >
                        {day.date.slice(8, 10)}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#777970] pt-2 border-t border-[#E1DED5]">
                  <span>Lower Activity</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded bg-[#EBE8DF]"></span>
                    <span className="w-2.5 h-2.5 rounded bg-[#FCECE7]"></span>
                    <span className="w-2.5 h-2.5 rounded bg-[#F7D6CB]"></span>
                    <span className="w-2.5 h-2.5 rounded bg-[#E65C35]"></span>
                  </div>
                  <span>High Activity</span>
                </div>
              </div>

              <p className="text-xs text-[#777970] leading-relaxed">
                The Burning Activity Calendar uses empirical relative quantiles instead of arbitrary universal risk cutoffs, making regional patterns comparable across seasons.
              </p>
            </div>

            <div className="pt-3 border-t border-[#E1DED5]">
              <Link 
                to="/calendar"
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-md bg-[#FAF8F3] hover:bg-[#EBE8DF] text-xs font-semibold text-[#252923] border border-[#E1DED5] transition-colors"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#E65C35]" />
                <span>Launch Full Burning Calendar</span>
              </Link>
            </div>
          </div>
        </div>

        {/* RECENT OBSERVATIONS TABLE */}
        <div className="bg-white border border-[#E1DED5] rounded-lg shadow-card overflow-hidden">
          <div className="p-4 border-b border-[#E1DED5] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#252923]">Recent Satellite Observations</h3>
              <p className="text-xs text-[#777970]">
                Individual sensor detections ingested into the active database
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTableSortAsc(!tableSortAsc)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded border border-[#E1DED5] text-xs text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3] transition-colors"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{tableSortAsc ? 'Oldest First' : 'Newest First'}</span>
              </button>
              <a
                href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded border border-[#E1DED5] text-xs font-medium text-[#252923] hover:bg-[#FAF8F3] transition-colors"
              >
                <Download className="w-3 h-3 text-[#318C9B]" />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F3] border-b border-[#E1DED5] text-[10px] font-mono uppercase text-[#777970]">
                  <th className="py-2.5 px-4 font-semibold">UTC Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-semibold">Coordinates (WGS84)</th>
                  <th className="py-2.5 px-4 font-semibold">Sensor Family</th>
                  <th className="py-2.5 px-4 font-semibold">Satellite</th>
                  <th className="py-2.5 px-4 font-semibold">FRP (MW)</th>
                  <th className="py-2.5 px-4 font-semibold">Brightness (K)</th>
                  <th className="py-2.5 px-4 font-semibold">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DED5] font-sans">
                {paginatedHotspots.length > 0 ? (
                  paginatedHotspots.map(h => {
                    const isModis = h.sensor_family === 'MODIS';
                    return (
                      <tr key={h.observation_id} className="hover:bg-[#FAF8F3] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[#252923]">
                          {h.acquisition_datetime_utc ? h.acquisition_datetime_utc.replace('T', ' ').slice(0, 16) + ' UTC' : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#777970]">
                          {formatCoord(h.latitude, true)}, {formatCoord(h.longitude, false)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            isModis 
                              ? 'bg-[#C27B26]/10 text-[#C27B26] border border-[#C27B26]/20' 
                              : 'bg-[#318C9B]/10 text-[#318C9B] border border-[#318C9B]/20'
                          }`}>
                            {h.sensor_family}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-[#252923] font-medium">{h.satellite}</td>
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#252923]">
                          {h.frp_mw !== null && h.frp_mw !== undefined ? h.frp_mw.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#777970]">
                          {h.brightness_temperature_kelvin ? h.brightness_temperature_kelvin.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-[#777970]">
                          {h.confidence_raw || '—'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-[#777970]">
                      No observations available for this area. Click "Sync NASA FIRMS" above to fetch recent observations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-[#E1DED5] bg-[#FAF8F3] flex items-center justify-between text-xs text-[#777970]">
              <span>
                Showing page {tablePage} of {totalPages} ({sortedHotspots.length} total records)
              </span>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={tablePage === 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-[#E1DED5] bg-white text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={tablePage === totalPages}
                  onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-[#E1DED5] bg-white text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SCIENTIFIC EDITORIAL FOOTER */}
        <footer className="border-t border-[#E1DED5] pt-6 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#777970]">
          <div className="space-y-1">
            <p className="font-serif font-medium text-[#252923]">
              FirePulse: NASA Space Apps Challenge 2026 • Team Virtual Warriors
            </p>
            <p className="text-[11px]">
              Active fire data provided by NASA LANCE / FIRMS. Standardized on EPSG:6933 Equal-Area Grid.
            </p>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>AOI: {aoi.name}</span>
            <span>•</span>
            <span>Harmonization: 1km Daily Cell</span>
            <span>•</span>
            <Link to="/about" className="text-[#E65C35] hover:underline">
              Read Methodology
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
};
