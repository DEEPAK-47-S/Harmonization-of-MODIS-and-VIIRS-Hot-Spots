import React, { useState, useEffect } from 'react';
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
  Calendar, 
  Flame, 
  Eye, 
  Grid, 
  Info,
  Maximize2,
  Download
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { Observation, GridCell } from '../types';

// Helper component to auto-pan map when AOI changes
const MapRecenter: React.FC<{ west: number; south: number; east: number; north: number }> = ({ west, south, east, north }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds([
      [south, west],
      [north, east]
    ]);
  }, [west, south, east, north, map]);
  return null;
};

export const FireMapPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [sensorFilter, setSensorFilter] = useState<string>('ALL'); // 'ALL' | 'MODIS' | 'VIIRS'
  const [minFrp, setMinFrp] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 h-screen overflow-hidden">
      <Header 
        title="Interactive Fire & Hotspot Map" 
        subtitle="Individual satellite detections and harmonized 1km analytical grid cells"
      />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Map Canvas */}
        <div className="flex-1 h-full w-full relative z-0">
          <MapContainer
            center={[centerLat, centerLon]}
            zoom={8}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            <MapRecenter west={aoi.west} south={aoi.south} east={aoi.east} north={aoi.north} />

            {/* AOI Bounding Box outline */}
            <Rectangle
              bounds={[
                [aoi.south, aoi.west],
                [aoi.north, aoi.east]
              ]}
              pathOptions={{
                color: '#f97316',
                weight: 1.5,
                fill: false,
                dashArray: '4, 4'
              }}
            />

            {/* Harmonized 1km Grid Cells Overlay */}
            {showGrid && gridCells.map((cell) => {
              const bounds = cell.cell_bounds_wgs84;
              if (!bounds) return null;
              
              const isCoDetected = cell.cross_sensor_presence;
              const isModisOnly = cell.sensors_present === 'MODIS';
              
              const color = isCoDetected ? '#c084fc' : (isModisOnly ? '#f59e0b' : '#38bdf8');
              const fillOpacity = isCoDetected ? 0.35 : 0.2;

              return (
                <Rectangle
                  key={cell.grid_cell_id}
                  bounds={[
                    [bounds.south, bounds.west],
                    [bounds.north, bounds.east]
                  ]}
                  pathOptions={{
                    color: color,
                    weight: 1,
                    fillColor: color,
                    fillOpacity: fillOpacity
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-white flex items-center justify-between border-b border-slate-700 pb-1">
                        <span>1km Grid Cell</span>
                        <span className={`px-1 rounded text-[10px] font-bold ${
                          isCoDetected ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {cell.sensors_present}
                        </span>
                      </div>
                      <p className="text-slate-400 font-mono text-[11px]">{cell.grid_cell_id}</p>
                      <p><span className="text-slate-400">Date:</span> {cell.activity_date_utc} UTC</p>
                      <p><span className="text-slate-400">MODIS Detections:</span> {cell.modis_detection_count}</p>
                      <p><span className="text-slate-400">VIIRS Detections:</span> {cell.viirs_detection_count}</p>
                      {cell.modis_frp_mean !== undefined && (
                        <p><span className="text-amber-400">MODIS Mean FRP:</span> {cell.modis_frp_mean} MW</p>
                      )}
                      {cell.viirs_frp_mean !== undefined && (
                        <p><span className="text-cyan-400">VIIRS Mean FRP:</span> {cell.viirs_frp_mean} MW</p>
                      )}
                      {cell.cross_sensor_presence && (
                        <p className="text-purple-300 font-semibold pt-0.5">✦ Co-detected by both sensors</p>
                      )}
                    </div>
                  </Popup>
                </Rectangle>
              );
            })}

            {/* Hotspot Observation Points */}
            {showPoints && hotspots.map((obs) => {
              const isModis = obs.sensor_family === 'MODIS';
              const color = isModis ? '#f59e0b' : '#0284c7';
              const radius = Math.min(10, Math.max(4, Math.sqrt(obs.frp_mw || 1) * 1.5));

              return (
                <CircleMarker
                  key={obs.observation_id}
                  center={[obs.latitude, obs.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.8,
                    weight: 1
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 min-w-[190px]">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                        <span className={`font-bold ${isModis ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {obs.sensor_family} Hotspot
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          {obs.satellite}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5 text-slate-300">
                        <p><span className="text-slate-400">Coord:</span> {obs.latitude.toFixed(4)}°N, {obs.longitude.toFixed(4)}°E</p>
                        <p><span className="text-slate-400">Time:</span> {obs.acquisition_date_utc} {obs.acquisition_datetime_utc ? obs.acquisition_datetime_utc.slice(11, 16) : ''} UTC</p>
                        <p><span className="text-slate-400">FRP:</span> <strong className="text-white">{obs.frp_mw} MW</strong></p>
                        {obs.brightness_temperature_kelvin && (
                          <p><span className="text-slate-400">Brightness:</span> {obs.brightness_temperature_kelvin} K</p>
                        )}
                        <p><span className="text-slate-400">Confidence:</span> {obs.confidence_raw} ({obs.confidence_type})</p>
                        <p><span className="text-slate-400">Pass:</span> {obs.daynight === 'D' ? 'Day' : 'Night'}</p>
                      </div>

                      <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                        Grid: {obs.grid_cell_id}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Floating Map Control Panel */}
        <div className="absolute top-4 left-4 z-20 w-80 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Map Layer Controls</h3>
            </div>
            {loading && <span className="text-[11px] text-orange-400 animate-pulse font-medium">Loading...</span>}
          </div>

          {/* Sensor Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Sensor Filter</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['ALL', 'MODIS', 'VIIRS'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSensorFilter(s)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    sensorFilter === s 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Min FRP slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
              <span>Min FRP Threshold</span>
              <span className="text-orange-400 font-mono">{minFrp} MW</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minFrp}
              onChange={(e) => setMinFrp(Number(e.target.value))}
              className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Date Filter */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800">
            <label className="block text-[11px] font-semibold text-slate-400">Date Range (UTC)</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-orange-500"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Layer toggles */}
          <div className="space-y-2 pt-1 border-t border-slate-800 text-xs">
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
                className="rounded accent-orange-500 bg-slate-800 border-slate-700"
              />
              <span>Show Satellite Hotspot Points</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded accent-orange-500 bg-slate-800 border-slate-700"
              />
              <span>Show 1km Analytical Grid Cells (EPSG:6933)</span>
            </label>
          </div>

          {/* Map Legend */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
            <span className="font-semibold text-slate-400 uppercase tracking-wider block text-[10px]">Legend</span>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>MODIS (Terra/Aqua, 1 km)</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
              <span>VIIRS (NOAA-20/21, 375 m)</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/40 border border-purple-400"></span>
              <span>Cross-Sensor Co-detected Cell</span>
            </div>
          </div>

          {/* Stats count */}
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Points: <strong className="text-white">{hotspots.length}</strong></span>
            <span>Cells: <strong className="text-white">{gridCells.length}</strong></span>
          </div>

          {/* Export Map View CSV */}
          <div className="pt-2 border-t border-slate-800 flex gap-2">
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
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition"
              title="Download filtered hotspots CSV"
            >
              <Download className="w-3 h-3 text-cyan-400" />
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
              className="flex-1 flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition"
              title="Download harmonized grid cells CSV"
            >
              <Download className="w-3 h-3 text-orange-400" />
              <span>1km Grid CSV</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

