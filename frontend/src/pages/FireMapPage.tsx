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
  Sliders, 
  Flame, 
  Grid, 
  Download, 
  X, 
  Copy, 
  Check, 
  RotateCcw,
  Layers,
  MapPin,
  Calendar,
  Satellite
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { Observation, GridCell, MapDensityCluster, formatCoord } from '../types';

// Map Auto-Fitter
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
      const latPad = Math.max(0.06, (maxLat - minLat) * 0.15);
      const lonPad = Math.max(0.06, (maxLon - minLon) * 0.15);
      map.fitBounds([
        [minLat - latPad, minLon - lonPad],
        [maxLat + latPad, maxLon + lonPad]
      ], { padding: [40, 40], maxZoom: 13, animate: true });
    } else {
      map.fitBounds([
        [aoi.south, aoi.west],
        [aoi.north, aoi.east]
      ], { padding: [30, 30], animate: true });
    }
  }, [aoi, hotspots, map]);
  return null;
};

export const FireMapPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [hotspots, setHotspots] = useState<Observation[]>([]);
  const [gridCells, setGridCells] = useState<GridCell[]>([]);
  const [densityClusters, setDensityClusters] = useState<MapDensityCluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Basemap style: 'light' (ESRI Light Gray), 'satellite' (ESRI World Imagery), 'osm' (OpenStreetMap)
  const [basemap, setBasemap] = useState<'light' | 'satellite' | 'osm'>('light');
  
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

  const isWorld = aoi.name === 'Entire World' || (aoi.west <= -170 && aoi.east >= 170);

  useEffect(() => {
    fetchHotspots();
  }, [aoi, refreshKey, sensorFilter, minFrp, showGrid, dateFrom, dateTo]);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      if (isWorld) {
        const dens = await FirePulseAPI.getMapDensity({ zoom: 3 });
        setDensityClusters(dens.clusters || []);
        setHotspots([]);
        setGridCells([]);
      } else {
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
        setDensityClusters([]);
      }
    } catch (err) {
      console.error('Failed to load hotspots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSensorFilter('ALL');
    setMinFrp(0);
    setDateFrom('');
    setDateTo('');
    setShowGrid(true);
    setShowPoints(true);
  };

  const handleCopyCoord = (lat: number, lon: number) => {
    navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setCopiedCoord(true);
    setTimeout(() => setCopiedCoord(false), 1500);
  };

  const centerLat = (aoi.south + aoi.north) / 2;
  const centerLon = (aoi.west + aoi.east) / 2;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] h-screen overflow-hidden select-none">
      <Header 
        title="Interactive Fire & Hotspot Map" 
        subtitle="Individual satellite detections and harmonized 1km analytical grid cells (EPSG:6933)"
      />

      <div className="flex-1 flex relative overflow-hidden">
        {/* Full Screen Map Canvas */}
        <div className="flex-1 h-full w-full relative z-0">
          <MapContainer
            center={isWorld ? [20, 0] : [centerLat, centerLon]}
            zoom={isWorld ? 2 : 9}
            className="h-full w-full"
            zoomControl={false}
          >
            {/* Basemap: ESRI Light Gray Canvas */}
            {basemap === 'light' && (
              <>
                <TileLayer
                  key="esri-light-base"
                  attribution='&copy; ESRI Light Gray Canvas & OpenStreetMap'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
                <TileLayer
                  key="esri-light-ref"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={16}
                />
              </>
            )}

            {/* Basemap: ESRI World Imagery */}
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

            {/* Basemap: OpenStreetMap Standard */}
            {basemap === 'osm' && (
              <TileLayer
                key="osm-base"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
            )}

            {!isWorld && <MapFitter aoi={aoi} hotspots={hotspots} />}

            {/* AOI Bounding Box for regional view */}
            {!isWorld && (
              <Rectangle
                bounds={[
                  [aoi.south, aoi.west],
                  [aoi.north, aoi.east]
                ]}
                pathOptions={{
                  color: '#E65C35',
                  weight: 1.5,
                  fill: true,
                  fillColor: '#E65C35',
                  fillOpacity: 0.04,
                  dashArray: '5, 5'
                }}
              />
            )}

            {/* World Scope: Macro Density Clusters */}
            {isWorld && densityClusters.map((c, idx) => {
              const radius = Math.min(22, Math.max(6, Math.sqrt(c.total_detections) * 2.8));
              const color = c.has_co_detection 
                ? '#BD493C' 
                : c.viirs_detections > 0 
                ? '#318C9B' 
                : '#C27B26';

              return (
                <CircleMarker
                  key={`world-map-clust-${idx}`}
                  center={[c.lat, c.lon]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.75,
                    color: '#FFFFFF',
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div className="p-2 space-y-1.5 text-xs font-sans text-[#252923]">
                      <div className="font-bold border-b border-[#E1DED5] pb-1">
                        {c.total_detections} Fire Detections
                      </div>
                      <div className="text-[10px] text-[#777970] font-mono">
                        Coordinates: {formatCoord(c.lat, true)}, {formatCoord(c.lon, false)}
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

            {/* Harmonized 1km Grid Cells Overlay (EPSG:6933) */}
            {showGrid && gridCells.map((cell) => {
              const bounds = cell.cell_bounds_wgs84;
              if (!bounds) return null;
              const isCoDetected = cell.cross_sensor_presence;
              const strokeColor = isCoDetected ? '#54785E' : '#E65C35';
              const fillColor = isCoDetected ? '#54785E' : '#E65C35';

              return (
                <Rectangle
                  key={cell.grid_cell_id}
                  bounds={[
                    [bounds.south, bounds.west],
                    [bounds.north, bounds.east]
                  ]}
                  pathOptions={{
                    color: strokeColor,
                    weight: isCoDetected ? 1.5 : 1,
                    fillColor: fillColor,
                    fillOpacity: isCoDetected ? 0.35 : 0.18,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 p-0.5 font-sans">
                      <div className="flex items-center justify-between border-b border-[#E1DED5] pb-1">
                        <span className="font-serif font-semibold text-[#252923]">1km Analytical Cell</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF8F3] text-[#252923] border border-[#E1DED5]">
                          {cell.sensors_present}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-[#777970] truncate">
                        ID: {cell.grid_cell_id}
                      </div>
                      <div className="space-y-0.5 text-[11px] text-[#252923]">
                        <div>Date: <strong className="font-mono">{cell.activity_date_utc} UTC</strong></div>
                        <div>MODIS Detections: <strong>{cell.modis_detection_count}</strong></div>
                        <div>VIIRS Detections: <strong>{cell.viirs_detection_count}</strong></div>
                        {(cell.modis_frp_mean || cell.viirs_frp_mean) !== undefined && (
                          <div>Mean FRP: <strong>{(cell.modis_frp_mean || cell.viirs_frp_mean || 0).toFixed(1)} MW</strong></div>
                        )}
                      </div>
                      {isCoDetected && (
                        <div className="p-1 rounded bg-[#54785E]/10 border border-[#54785E]/30 text-[10px] text-[#54785E] font-medium">
                          Cross-Sensor Co-Detected Cell
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
              const color = isModis ? '#C27B26' : '#318C9B';
              const frp = obs.frp_mw || 1;
              const radius = Math.min(12, Math.max(4.5, Math.sqrt(frp) * 1.5));

              return (
                <CircleMarker
                  key={obs.observation_id}
                  center={[obs.latitude, obs.longitude]}
                  radius={radius}
                  eventHandlers={{
                    click: () => setSelectedObs(obs)
                  }}
                  pathOptions={{
                    color: '#FFFFFF',
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1.5 p-0.5 font-sans min-w-[200px]">
                      <div className="flex items-center justify-between border-b border-[#E1DED5] pb-1">
                        <div className="flex items-center space-x-1 font-semibold text-[#252923]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                          <span>{obs.sensor_family}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 rounded bg-[#FAF8F3] text-[#777970] border border-[#E1DED5]">
                          {obs.satellite}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-[11px] text-[#252923]">
                        <div className="flex justify-between">
                          <span className="text-[#777970]">Coords:</span>
                          <span className="font-mono">{formatCoord(obs.latitude, true)}, {formatCoord(obs.longitude, false)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#777970]">UTC Time:</span>
                          <span className="font-mono">{obs.acquisition_date_utc} {obs.acquisition_datetime_utc?.slice(11, 16)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#777970]">Thermal FRP:</span>
                          <span className="font-semibold text-[#E65C35]">{obs.frp_mw} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#777970]">Brightness:</span>
                          <span>{obs.brightness_temperature_kelvin} K</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#777970]">Confidence:</span>
                          <span>{obs.confidence_raw} ({obs.confidence_type})</span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-[#E1DED5] flex justify-between items-center text-[10px]">
                        <span className="font-mono text-[#777970] truncate max-w-[120px]">{obs.grid_cell_id}</span>
                        <button
                          onClick={() => setSelectedObs(obs)}
                          className="text-[#E65C35] font-semibold hover:underline"
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

        {/* Top Editorial Floating Bar */}
        <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Left stats pills */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white border border-[#E1DED5] shadow-card text-xs font-medium text-[#252923]">
              <Flame className="w-3.5 h-3.5 text-[#E65C35]" />
              <span className="font-bold">
                {isWorld ? densityClusters.reduce((acc, c) => acc + c.total_detections, 0).toLocaleString() : hotspots.length.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#777970]">{isWorld ? 'Global Detections' : 'Hotspots'}</span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-white border border-[#E1DED5] shadow-card text-xs font-medium text-[#252923]">
              <Grid className="w-3.5 h-3.5 text-[#54785E]" />
              <span className="font-bold">
                {isWorld ? densityClusters.length.toLocaleString() : gridCells.length.toLocaleString()}
              </span>
              <span className="text-[11px] text-[#777970]">{isWorld ? 'Macro Clusters' : '1km Cells'}</span>
            </div>

            {loading && (
              <div className="px-3 py-1.5 rounded-md bg-[#FAF8F3] border border-[#E1DED5] text-xs font-medium text-[#777970] animate-pulse">
                Fetching satellite observations...
              </div>
            )}
          </div>

          {/* Right quick toggles: Basemap & Controls Button */}
          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Basemap Switcher */}
            <div className="flex items-center p-0.5 rounded-md bg-white border border-[#E1DED5] shadow-card text-xs">
              <button
                type="button"
                onClick={() => setBasemap('light')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  basemap === 'light' ? 'bg-[#FAF8F3] text-[#E65C35] font-semibold' : 'text-[#777970] hover:text-[#252923]'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setBasemap('satellite')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  basemap === 'satellite' ? 'bg-[#FAF8F3] text-[#318C9B] font-semibold' : 'text-[#777970] hover:text-[#252923]'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setBasemap('osm')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  basemap === 'osm' ? 'bg-[#FAF8F3] text-[#54785E] font-semibold' : 'text-[#777970] hover:text-[#252923]'
                }`}
              >
                Street
              </button>
            </div>

            {/* Toggle Drawer Button */}
            <button
              onClick={() => setControlsOpen(!controlsOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition border shadow-card ${
                controlsOpen 
                  ? 'bg-[#FCECE7] text-[#E65C35] border-[#E65C35]/30' 
                  : 'bg-white text-[#252923] border-[#E1DED5] hover:bg-[#FAF8F3]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#E65C35]" />
              <span>{controlsOpen ? 'Hide Filters' : 'Map Filters'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Left Filter Drawer (Editorial Clean Style) */}
        {controlsOpen && (
          <div className="absolute top-16 left-6 z-20 w-80 max-w-[calc(100vw-3rem)] bg-white border border-[#E1DED5] rounded-lg p-4 shadow-float space-y-4 animate-in slide-in-from-left duration-150">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-2.5">
              <div className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-[#E65C35]" />
                <h3 className="font-serif font-semibold text-sm text-[#252923]">Filter Observations</h3>
              </div>
              <button
                onClick={() => setControlsOpen(false)}
                className="text-[#777970] hover:text-[#252923] p-1 rounded hover:bg-[#FAF8F3]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sensor Filter */}
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#777970] mb-1.5 font-semibold">
                Sensor Instrument
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#FAF8F3] p-1 rounded border border-[#E1DED5]">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'MODIS', label: 'MODIS' },
                  { id: 'VIIRS', label: 'VIIRS' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSensorFilter(s.id)}
                    className={`py-1 rounded text-xs font-medium transition ${
                      sensorFilter === s.id 
                        ? 'bg-white text-[#E65C35] shadow-sm font-semibold' 
                        : 'text-[#777970] hover:text-[#252923]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min FRP slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#777970]">Min Thermal Power (FRP)</span>
                <span className="font-mono text-[11px] font-semibold text-[#E65C35] bg-[#FCECE7] px-1.5 py-0.5 rounded">
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
                className="w-full accent-[#E65C35] h-1.5 bg-[#EBE8DF] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#777970] mt-0.5 font-mono">
                <span>0 MW</span>
                <span>50 MW</span>
                <span>100 MW</span>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2 pt-2 border-t border-[#E1DED5]">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[#777970] font-semibold">
                Date Range (UTC)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#777970] block mb-0.5">Start</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-2 py-1 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35] font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#777970] block mb-0.5">End</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-2 py-1 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-2 pt-2 border-t border-[#E1DED5] text-xs">
              <label className="flex items-center space-x-2 text-[#252923] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPoints}
                  onChange={(e) => setShowPoints(e.target.checked)}
                  className="rounded text-[#E65C35] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Satellite Hotspot Points</span>
              </label>
              <label className="flex items-center space-x-2 text-[#252923] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded text-[#E65C35] focus:ring-0 w-3.5 h-3.5"
                />
                <span>Harmonized 1km Grid (EPSG:6933)</span>
              </label>
            </div>

            {/* Reset Filters & Export */}
            <div className="pt-2 border-t border-[#E1DED5] flex items-center justify-between text-xs">
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-[#777970] hover:text-[#252923]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
              <a
                href={FirePulseAPI.getExportUrl('observations', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1 text-[#318C9B] font-medium hover:underline"
              >
                <Download className="w-3 h-3" />
                <span>Download CSV</span>
              </a>
            </div>
          </div>
        )}

        {/* Slide-over Hotspot Inspector Drawer (Right Side) */}
        {selectedObs && (
          <div className="absolute top-4 right-6 bottom-4 z-20 w-88 max-w-[calc(100vw-3rem)] bg-white border border-[#E1DED5] rounded-lg p-5 shadow-float flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-150">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#E1DED5] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777970]">Inspection Panel</span>
                  <h3 className="font-serif font-semibold text-lg text-[#252923] flex items-center gap-1.5 mt-0.5">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: selectedObs.sensor_family === 'MODIS' ? '#C27B26' : '#318C9B' }}
                    ></span>
                    <span>{selectedObs.sensor_family} Observation</span>
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedObs(null)}
                  className="text-[#777970] hover:text-[#252923] p-1 rounded hover:bg-[#FAF8F3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Coordinates Pill */}
              <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777970] block">WGS84 Coordinates</span>
                  <span className="font-mono text-xs text-[#252923] font-semibold">
                    {formatCoord(selectedObs.latitude, true)}, {formatCoord(selectedObs.longitude, false)}
                  </span>
                </div>
                <button
                  onClick={() => handleCopyCoord(selectedObs.latitude, selectedObs.longitude)}
                  className="p-1.5 rounded border border-[#E1DED5] bg-white text-[#777970] hover:text-[#252923] transition"
                  title="Copy GPS coordinates"
                >
                  {copiedCoord ? <Check className="w-3.5 h-3.5 text-[#54785E]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Key Scientific Attributes */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">Satellite Platform:</span>
                  <span className="font-semibold text-[#252923]">{selectedObs.satellite} ({selectedObs.instrument})</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">UTC Timestamp:</span>
                  <span className="font-mono text-[#252923]">
                    {selectedObs.acquisition_date_utc} {selectedObs.acquisition_datetime_utc?.slice(11, 16)} UTC
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">Fire Radiative Power:</span>
                  <span className="font-mono font-bold text-[#E65C35]">
                    {selectedObs.frp_mw?.toFixed(1)} MW
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">Brightness Temperature:</span>
                  <span className="font-mono text-[#252923]">
                    {selectedObs.brightness_temperature_kelvin ? `${selectedObs.brightness_temperature_kelvin.toFixed(1)} K` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">Detection Confidence:</span>
                  <span className="font-semibold text-[#252923]">
                    {selectedObs.confidence_raw} ({selectedObs.confidence_type})
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#E1DED5]">
                  <span className="text-[#777970]">Overpass Category:</span>
                  <span className="text-[#252923]">
                    {selectedObs.daynight === 'D' ? 'Daytime (Solar Heated)' : 'Nighttime (Cool Background)'}
                  </span>
                </div>
              </div>

              {/* Grid Association */}
              <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md space-y-1">
                <span className="text-[10px] font-mono uppercase text-[#777970]">Assigned 1km Cell ID</span>
                <div className="font-mono text-[11px] font-semibold text-[#252923] truncate">
                  {selectedObs.grid_cell_id}
                </div>
                <p className="text-[10px] text-[#777970] leading-tight">
                  Projected via EPSG:6933 into an equal-area 1,000m x 1,000m analytical grid cell.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E1DED5]">
              <button
                onClick={() => setSelectedObs(null)}
                className="w-full py-2 rounded bg-[#FAF8F3] hover:bg-[#EBE8DF] border border-[#E1DED5] text-xs font-semibold text-[#252923] transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
