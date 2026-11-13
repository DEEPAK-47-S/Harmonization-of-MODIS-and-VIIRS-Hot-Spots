import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  Rectangle, 
  useMap 
} from 'react-leaflet';
import { 
  Layers, 
  Filter, 
  Flame, 
  Grid, 
  Info,
  Maximize2,
  Download,
  Calendar,
  X,
  Sparkles,
  Sliders,
  Copy,
  Check,
  Compass,
  Satellite
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { Observation, GridCell, formatCoord } from '../types';

// Map Auto-Fitter: zooms and centers dynamically to fit loaded detections or AOI bounds
const MapFitter: React.FC<{ 
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
      
      // If single point or very tight cluster, pad slightly
      const latPad = Math.max(0.08, (maxLat - minLat) * 0.2);
      const lonPad = Math.max(0.08, (maxLon - minLon) * 0.2);
      
      map.fitBounds([
        [minLat - latPad, minLon - lonPad],
        [maxLat + latPad, maxLon + lonPad]
      ], { padding: [50, 50], maxZoom: 13, animate: true });
    } else {
      map.fitBounds([
        [aoi.south, aoi.west],
        [aoi.north, aoi.east]
      ], { padding: [40, 40], animate: true });
    }
  }, [aoi, hotspots, map]);
  return null;
};

export const FireMapPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Basemap style: 'dark' (ESRI Dark Gray - No watermark), 'satellite' (ESRI World Imagery), 'osm' (OpenStreetMap)
  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'osm'>('dark');
  
  // Filters
  const [sensorFilter, setSensorFilter] = useState<string>('ALL'); // 'ALL' | 'MODIS' | 'VIIRS'
  const [minFrp, setMinFrp] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // UI Panels
  const [controlsOpen, setControlsOpen] = useState<boolean>(true);
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);
  const [copiedCoord, setCopiedCoord] = useState<boolean>(false);

  useEffect(() => {
    fetchHotspots();
  }, [aoi, refreshKey, sensorFilter, minFrp, showGrid, dateFrom, dateTo]);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      const res = await FirePulseAPI.getHotspots({
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
        sensor: sensorFilter === 'ALL' ? undefined : sensorFilter,
        min_frp: minFrp > 0 ? minFrp : undefined,
        include_grid: showGrid,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: 5000
      });
      setHotspots(res.hotspots);
      setGridCells(res.grid_cells || []);
    } catch (err) {
      console.error('Failed to load hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  const centerLat = (aoi.south + aoi.north) / 2;
  const centerLon = (aoi.west + aoi.east) / 2;

  const handleCopyCoord = (lat: number, lon: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 1500);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 h-screen overflow-hidden select-none">
      <Header 
        title="Interactive Fire & Hotspot Map" 
        subtitle="Individual satellite detections and harmonized 1km analytical grid cells (EPSG:6933)"
      />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Full Screen Map Canvas */}
        <div className="flex-1 h-full w-full relative z-0">
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={9}
            className="h-full w-full"
            zoomControl={false}
          >
            {/* Tile Layer: ESRI Dark Gray Canvas (Zero Watermark) */}
            {basemap === 'dark' && (
              <>
                <TileLayer
                  key="esri-dark-base"
                  attribution='&copy; ESRI Dark Gray Canvas & OpenStreetMap'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
                <TileLayer
                  key="esri-dark-ref"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
              </>
            )}

            {/* Tile Layer: ESRI World Imagery Satellite (Zero Watermark) */}
            {basemap === 'satellite' && (
              <>
                <TileLayer
                  key="esri-sat-base"
                  attribution='&copy; ESRI World Imagery, Earthstar Geographics'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
                <TileLayer
                  key="esri-sat-labels"
                  url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              </>
            )}

            {/* Tile Layer: OpenStreetMap Standard */}
            {basemap === 'osm' && (
              <TileLayer
                key="osm-base"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            {/* Auto fitter */}
            <MapFitter aoi={aoi} hotspots={hotspots} />

            {/* AOI Bounding Box outline */}
            <Rectangle
              bounds={[
                [aoi.south, aoi.west],
                [aoi.north, aoi.east]
              ]}
              pathOptions={{
                color: '#f97316',
                weight: 2,
                fill: true,
                fillColor: '#f97316',
                fillOpacity: 0.03,
                dashArray: '6, 6'
              }}
            />

            {/* Harmonized 1km Grid Cells Overlay (EPSG:6933) */}
            {showGrid && gridCells.map((cell) => {
              const bounds = cell.cell_bounds_wgs84;
              if (!bounds) return null;
              
              const isCoDetected = cell.cross_sensor_presence;
              const isModisOnly = cell.sensors_present === 'MODIS';
              
              // Gen-Z glowing color palette
              const strokeColor = isCoDetected ? '#c084fc' : (isModisOnly ? '#f59e0b' : '#38bdf8');
              const fillColor = isCoDetected ? '#a855f7' : (isModisOnly ? '#f59e0b' : '#0284c7');
              const fillOpacity = isCoDetected ? 0.45 : 0.25;

              return (
                <Rectangle
                  key={cell.grid_cell_id}
                  bounds={[
                    [bounds.south, bounds.west],
                    [bounds.north, bounds.east]
                  ]}
                  pathOptions={{
                    color: strokeColor,
                    weight: isCoDetected ? 2 : 1.2,
                    fillColor: fillColor,
                    fillOpacity: fillOpacity,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-2 p-1 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <Grid className="w-3.5 h-3.5 text-orange-400" />
                          <span className="font-extrabold text-white text-xs">1km Analytical Grid</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCoDetected 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {cell.sensors_present}
                        </span>
                      </div>
                      
                      <p className="text-[11px] font-mono text-slate-400 bg-slate-950/70 p-1 rounded border border-white/5 truncate">
                        ID: {cell.grid_cell_id}
                      </p>
                      
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p><span className="text-slate-400">Date:</span> <strong className="text-white">{cell.activity_date_utc} UTC</strong></p>
                        <p><span className="text-amber-400">MODIS Detections:</span> <strong>{cell.modis_detection_count}</strong></p>
                        <p><span className="text-cyan-400">VIIRS Detections:</span> <strong>{cell.viirs_detection_count}</strong></p>
                        {cell.modis_frp_mean !== undefined && (
                          <p><span className="text-slate-400">MODIS Mean FRP:</span> {cell.modis_frp_mean.toFixed(1)} MW</p>
                        )}
                        {cell.viirs_frp_mean !== undefined && (
                          <p><span className="text-slate-400">VIIRS Mean FRP:</span> {cell.viirs_frp_mean.toFixed(1)} MW</p>
                        )}
                      </div>

                      {cell.cross_sensor_presence && (
                        <div className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-800/60 text-[10px] text-purple-300 font-bold flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Cross-Sensor Co-Detected Cell</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Rectangle>
              );
            })}

            {/* Hotspot Observation Points */}
            {showPoints && hotspots.map((obs) => {
              const isModis = obs.sensor_family === 'MODIS';
              const color = isModis ? '#f59e0b' : '#00f0ff';
              const frp = obs.frp_mw || 1;
              const radius = Math.min(13, Math.max(5, Math.sqrt(frp) * 1.8));

              return (
                <CircleMarker
                  key={obs.observation_id}
                  center={[obs.latitude, obs.longitude]}
                  radius={radius}
                  eventHandlers={{
                    click: () => setSelectedObs(obs)
                  }}
                  pathOptions={{
                    color: isModis ? '#fbbf24' : '#38bdf8',
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: frp > 30 ? 2.5 : 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-2 p-1 min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <Flame className={`w-4 h-4 ${isModis ? 'text-amber-400' : 'text-cyan-400'}`} />
                          <span className="font-extrabold text-white">
                            {obs.sensor_family} Fire Hotspot
                          </span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-700">
                          {obs.satellite}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-slate-300 text-[11px]">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Position:</span>
                          <span className="font-mono text-white">{formatCoord(obs.latitude, true)}, {formatCoord(obs.longitude, false)}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Time (UTC):</span>
                          <strong className="text-white">{obs.acquisition_date_utc} {obs.acquisition_datetime_utc ? obs.acquisition_datetime_utc.slice(11, 16) : ''}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Thermal Energy:</span>
                          <span className="font-extrabold text-orange-400">{obs.frp_mw} MW</span>
                        </p>
                        {obs.brightness_temperature_kelvin && (
                          <p className="flex justify-between">
                            <span className="text-slate-400">Brightness:</span>
                            <span className="text-white">{obs.brightness_temperature_kelvin} K</span>
                          </p>
                        )}
                        <p className="flex justify-between">
                          <span className="text-slate-400">Confidence:</span>
                          <span className="font-semibold text-white">{obs.confidence_raw} ({obs.confidence_type})</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Pass:</span>
                          <span>{obs.daynight === 'D' ? 'Day Overpass' : 'Night Overpass'}</span>
                        </p>
                      </div>

                      <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 font-mono flex justify-between items-center">
                        <span className="truncate max-w-[140px]">Grid: {obs.grid_cell_id}</span>
                        <button
                          onClick={() => setSelectedObs(obs)}
                          className="text-orange-400 hover:text-orange-300 font-semibold"
                        >
                          Inspect &rarr;
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Top Floating Action Pill Bar (Gen-Z Clean Design) */}
        <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Left stats pills */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-panel shadow-xl text-xs font-bold text-white">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>{hotspots.length}</span>
              <span className="text-[11px] text-slate-400 font-normal">Hotspots</span>
            </div>

            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl glass-panel shadow-xl text-xs font-bold text-white">
              <Grid className="w-4 h-4 text-purple-400" />
              <span>{gridCells.length}</span>
              <span className="text-[11px] text-slate-400 font-normal">1km Cells</span>
            </div>

            {loading && (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-orange-600/30 border border-orange-500/50 backdrop-blur-md text-xs font-semibold text-orange-300 animate-pulse">
                <span>Updating satellite points...</span>
              </div>
            )}
          </div>

          {/* Right quick toggles: Basemap & Controls Button */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Basemap Switcher Pill */}
            <div className="flex items-center p-1 rounded-2xl glass-panel shadow-xl text-xs">
              <button
                type="button"
                onClick={() => setBasemap('dark')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  basemap === 'dark' 
                    ? 'bg-slate-800 text-orange-400 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌌 Cyber Dark
              </button>
              <button
                type="button"
                onClick={() => setBasemap('satellite')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  basemap === 'satellite' 
                    ? 'bg-slate-800 text-cyan-400 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => setBasemap('osm')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  basemap === 'osm' 
                    ? 'bg-slate-800 text-emerald-400 shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🗺️ Street
              </button>
            </div>

            {/* Toggle Drawer Button */}
            <button
              onClick={() => setControlsOpen(!controlsOpen)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl font-bold text-xs transition glass-panel shadow-xl ${
                controlsOpen ? 'text-orange-400 border-orange-500/40 bg-orange-950/20' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>{controlsOpen ? 'Hide Controls' : 'Map Controls'}</span>
            </button>
          </div>
        </div>

        {/* Floating Collapsible Map Control Panel (Gen-Z Glass Drawer) */}
        {controlsOpen && (
          <div className="absolute top-20 left-6 z-20 w-84 max-w-[calc(100vw-3rem)] glass-panel border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Map Layer Controls</h3>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sensor Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Satellite Sensor Filter</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950/70 p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'ALL', label: 'All Sensors' },
                  { id: 'MODIS', label: 'MODIS 1km' },
                  { id: 'VIIRS', label: 'VIIRS 375m' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSensorFilter(s.id)}
                    className={`py-1.5 rounded-xl text-xs font-black transition ${
                      sensorFilter === s.id 
                        ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min FRP slider with gradient track */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-400">Min Thermal Power (FRP)</span>
                <span className="text-orange-400 font-mono bg-orange-950/60 px-2 py-0.5 rounded-md border border-orange-800/60">
                  &ge; {minFrp} MW
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minFrp}
                onChange={(e) => setMinFrp(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                <span>0 MW</span>
                <span>50 MW</span>
                <span>100 MW</span>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date Window (UTC)</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">Start Date</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">End Date</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <label className="flex items-center space-x-2.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                  className="rounded-md accent-orange-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold">Satellite Hotspot Points (MODIS / VIIRS)</span>
              </label>
              <label className="flex items-center space-x-2.5 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded-md accent-orange-500 bg-slate-900 border-slate-700 w-4 h-4 cursor-pointer"
                />
                <span className="font-semibold">Harmonized 1km Grid (EPSG:6933)</span>
              </label>
            </div>

            {/* Clean Legend */}
            <div className="pt-2 border-t border-white/10 space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Legend</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span>
                  <span>MODIS (1,000m)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]"></span>
                  <span>VIIRS (375m)</span>
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500/30 border border-purple-400 shadow-[0_0_6px_#c084fc]"></span>
                  <span>Cross-Sensor Co-Detected 1km Cell</span>
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="pt-3 border-t border-white/10 flex gap-2">
              <a
                href={FirePulseAPI.getExportUrl('observations', {
                  west: aoi.west,
                  south: aoi.south,
                  east: aoi.east,
                  north: aoi.north,
                  sensor: sensorFilter === 'ALL' ? undefined : sensorFilter,
                  date_from: dateFrom || undefined,
                  date_to: dateTo || undefined
                })}
                download
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition hover:border-cyan-500/50"
                title="Download filtered hotspots CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Points CSV</span>
              </a>
              <a
                href={FirePulseAPI.getExportUrl('grid', {
                  west: aoi.west,
                  south: aoi.south,
                  east: aoi.east,
                  north: aoi.north,
                  date_from: dateFrom || undefined,
                  date_to: dateTo || undefined
                })}
                download
                className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition hover:border-orange-500/50"
                title="Download harmonized grid cells CSV"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>1km Grid CSV</span>
              </a>
            </div>
          </div>
        )}

        {/* Selected Hotspot Inspector Slide-over Card */}
        {selectedObs && (
          <div className="absolute bottom-6 right-6 z-20 w-84 max-w-[calc(100vw-3rem)] glass-panel border border-white/10 rounded-3xl p-5 shadow-2xl space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center space-x-2">
                <Flame className={`w-5 h-5 ${selectedObs.sensor_family === 'MODIS' ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div>
                  <h4 className="text-sm font-black text-white">{selectedObs.sensor_family} Observation</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{selectedObs.satellite} Satellite</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedObs(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Fire Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Thermal Power (FRP)</span>
                <span className="text-lg font-black text-orange-400">{selectedObs.frp_mw} <span className="text-xs font-normal text-slate-400">MW</span></span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Brightness Temp</span>
                <span className="text-lg font-black text-white">{selectedObs.brightness_temperature_kelvin || '—'} <span className="text-xs font-normal text-slate-400">K</span></span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Acquisition Time</span>
                <strong className="text-white font-mono">{selectedObs.acquisition_date_utc} {selectedObs.acquisition_datetime_utc ? selectedObs.acquisition_datetime_utc.slice(11, 16) : ''} UTC</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Confidence Scale</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white border border-slate-700">
                  {selectedObs.confidence_raw} ({selectedObs.confidence_type})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/5">
                <span className="text-slate-400">Overpass Period</span>
                <span>{selectedObs.daynight === 'D' ? '☀️ Daytime Pass' : '🌙 Nighttime Pass'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">GPS Coordinates</span>
                <button
                  onClick={() => handleCopyCoord(selectedObs.latitude, selectedObs.longitude)}
                  className="flex items-center space-x-1 text-slate-300 hover:text-white font-mono text-[11px] bg-slate-950/60 px-2 py-0.5 rounded border border-white/5"
                  title="Click to copy coordinates"
                >
                  <span>{selectedObs.latitude.toFixed(4)}°, {selectedObs.longitude.toFixed(4)}°</span>
                  {copiedCoord ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/70 border border-white/5 text-[10px] text-slate-400 font-mono truncate">
              Analytical Cell: <strong className="text-purple-400">{selectedObs.grid_cell_id}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
