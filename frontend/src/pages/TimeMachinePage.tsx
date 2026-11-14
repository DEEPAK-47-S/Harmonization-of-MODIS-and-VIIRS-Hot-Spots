import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Globe2, 
  Flame, 
  Layers, 
  Clock,
  Sliders,
  Info
} from 'lucide-react';
import { 
  MapContainer, 
  TileLayer, 
  CircleMarker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import { Header } from '../components/Header';
import { FirePulseAPI } from '../services/api';
import { TimeMachineFrame, MapDensityCluster, formatCoord } from '../types';

export const TimeMachinePage: React.FC = () => {
  const [frames, setFrames] = useState<TimeMachineFrame[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step
  const [loading, setLoading] = useState<boolean>(true);
  const [mapStyle, setMapStyle] = useState<'light' | 'dark' | 'satellite'>('light');

  const timerRef = useRef<any>(null);

  useEffect(() => {
    loadFrames();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, frames.length, playbackSpeed]);

  const loadFrames = async () => {
    setLoading(true);
    try {
      const data = await FirePulseAPI.getTimeMachineFrames({ days: 30 });
      if (data && data.frames && data.frames.length > 0) {
        setFrames(data.frames);
        setCurrentIndex(data.frames.length - 1); // Start at latest
      }
    } catch (err) {
      console.error('Failed to load Time Machine frames:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlay = () => {
    if (currentIndex >= frames.length - 1 && !isPlaying) {
      setCurrentIndex(0); // Loop from beginning
    }
    setIsPlaying(!isPlaying);
  };

  const handleStep = (direction: 'prev' | 'next') => {
    setIsPlaying(false);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < frames.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentFrame: TimeMachineFrame | undefined = frames[currentIndex];

  const getTileUrl = () => {
    switch (mapStyle) {
      case 'dark':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'light':
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Global Fire Time Machine" 
        subtitle="Chronological multi-sensor animation of Earth's thermal hot spots" 
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Temporal Playback / Global Fire Dynamics
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              Watch fire migrate across the planet.
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Step through daily NASA satellite observations. Scrub the timeline to observe how fire clusters 
              ignite, spread, and extinguish across agricultural belts and boreal forests.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-white border border-[#E1DED5] rounded text-xs py-1.5 px-2 text-[#252923] focus:outline-none"
            >
              <option value={1500}>0.75x (Slow)</option>
              <option value={1000}>1.0x (Normal)</option>
              <option value={500}>2.0x (Fast)</option>
              <option value={250}>4.0x (Hyper)</option>
            </select>
          </div>
        </div>

        {/* TIME MACHINE PLAYER CONTROLS CARD */}
        <div className="bg-white border border-[#E1DED5] rounded-xl p-5 shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E1DED5] pb-4">
            
            {/* Active Date Display */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-[#FAF8F3] border border-[#E1DED5] flex items-center justify-center text-[#E65C35]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777970] font-semibold">Observation Date (UTC)</span>
                <div className="text-xl font-serif font-bold text-[#252923]">
                  {currentFrame ? currentFrame.date_utc : 'Loading...'}
                </div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentIndex(0)}
                disabled={currentIndex === 0 || loading}
                title="Rewind to First Frame"
                className="p-2 rounded-md border border-[#E1DED5] text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3] disabled:opacity-40 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStep('prev')}
                disabled={currentIndex === 0 || loading}
                title="Step Back 1 Day"
                className="p-2 rounded-md border border-[#E1DED5] text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTogglePlay}
                disabled={loading || frames.length === 0}
                className="flex items-center space-x-2 px-4 py-2 rounded-md bg-[#E65C35] hover:bg-[#D44F29] text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play Simulation'}</span>
              </button>
              <button
                onClick={() => handleStep('next')}
                disabled={currentIndex >= frames.length - 1 || loading}
                title="Step Forward 1 Day"
                className="p-2 rounded-md border border-[#E1DED5] text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Frame Counter */}
            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-[#777970]">Timeline Frame</span>
              <div className="text-sm font-mono font-semibold text-[#252923]">
                {frames.length > 0 ? `Day ${currentIndex + 1} of ${frames.length}` : 'No frames recorded'}
              </div>
            </div>
          </div>

          {/* Interactive Timeline Scrubber Slider */}
          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min={0}
              max={Math.max(0, frames.length - 1)}
              value={currentIndex}
              disabled={frames.length <= 1}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentIndex(Number(e.target.value));
              }}
              className="w-full accent-[#E65C35] cursor-pointer h-2 bg-[#FAF8F3] border border-[#E1DED5] rounded-lg disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#777970]">
              <span>{frames[0]?.date_utc || 'Start'}</span>
              <span>Drag slider to travel in time</span>
              <span>{frames[frames.length - 1]?.date_utc || 'End'}</span>
            </div>
          </div>

          {/* Day KPIs */}
          {currentFrame && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                <div className="text-[10px] font-mono text-[#777970] uppercase">Detections Today</div>
                <div className="text-lg font-serif font-bold text-[#252923]">
                  {(currentFrame.total_observations || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                <div className="text-[10px] font-mono text-[#C27B26] uppercase">MODIS (1km)</div>
                <div className="text-lg font-serif font-bold text-[#C27B26]">
                  {(currentFrame.modis_count || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                <div className="text-[10px] font-mono text-[#318C9B] uppercase">VIIRS (375m)</div>
                <div className="text-lg font-serif font-bold text-[#318C9B]">
                  {(currentFrame.viirs_count || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                <div className="text-[10px] font-mono text-[#54785E] uppercase">1km Active Cells</div>
                <div className="text-lg font-serif font-bold text-[#54785E]">
                  {(currentFrame.active_cells || 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAP CONTAINER */}
        <div className="bg-white border border-[#E1DED5] rounded-xl overflow-hidden shadow-card flex flex-col">
          <div className="p-3.5 bg-[#FAF8F3] border-b border-[#E1DED5] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe2 className="w-4 h-4 text-[#E65C35]" />
              <span className="font-serif font-semibold text-xs text-[#252923]">
                Worldwide Fire Dispersion on {currentFrame ? currentFrame.date_utc : 'Selected Day'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={mapStyle}
                onChange={e => setMapStyle(e.target.value as any)}
                className="bg-white border border-[#E1DED5] rounded text-[11px] py-1 px-1.5 text-[#252923] focus:outline-none"
              >
                <option value="light">Light Canvas</option>
                <option value="satellite">Satellite</option>
                <option value="dark">Dark Canvas</option>
              </select>
            </div>
          </div>

          <div className="h-[480px] w-full relative">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={1}
              maxZoom={10}
              className="h-full w-full"
              attributionControl={false}
            >
              <TileLayer url={getTileUrl()} />

              {/* Daily Density Clusters */}
              {currentFrame?.clusters && currentFrame.clusters.map((c, idx) => {
                const radius = Math.min(22, Math.max(6, Math.sqrt(c.total_detections) * 3));
                const color = c.has_co_detection 
                  ? '#BD493C' // High confidence joint co-detection
                  : c.viirs_detections > 0 
                  ? '#318C9B' 
                  : '#C27B26';

                return (
                  <CircleMarker
                    key={`time-cluster-${idx}`}
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
                      <div className="p-2 space-y-1 text-xs font-sans text-[#252923]">
                        <div className="font-bold border-b pb-1">
                          {c.total_detections} Total Detections
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
                            ✓ Co-detected by both sensors
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
            </MapContainer>
          </div>

          <div className="p-3 bg-[#FAF8F3] border-t border-[#E1DED5] flex flex-wrap items-center justify-between text-[11px] text-[#777970]">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BD493C]"></span>
                <span>Cross-Sensor Co-Detected Clusters</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#318C9B]"></span>
                <span>VIIRS Dominated Hotspots</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C27B26]"></span>
                <span>MODIS Dominated Hotspots</span>
              </span>
            </div>
            <div>
              Source: NASA FIRMS Global Feed • Harmonized to EPSG:6933
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
