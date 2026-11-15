import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Satellite, 
  Flame, 
  Layers, 
  Info, 
  Download 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { SensorComparisonData } from '../types';

export const ComparisonPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [data, setData] = useState<SensorComparisonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchComparison();
  }, [aoi, refreshKey]);

  const fetchComparison = async () => {
    setLoading(true);
    try {
      const res = await FirePulseAPI.getComparison({
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load sensor comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const overlapPieData = data?.overlap ? [
    { name: 'Co-Detected (Both)', value: data.overlap.co_detected_cell_days || 0, color: '#059669' },
    { name: 'VIIRS Only', value: data.overlap.viirs_only_cell_days || 0, color: '#0284C7' },
    { name: 'MODIS Only', value: data.overlap.modis_only_cell_days || 0, color: '#D97706' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Sensor Comparison" 
        subtitle="Comparing sensor footprint resolution, thermal detection sensitivity, and spatial co-occurrence"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Sensor Comparison / MODIS vs VIIRS
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              MODIS vs VIIRS Sensor Comparison
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Differing sensor footprints, equatorial overpass times, and detection algorithms mean raw observation counts cannot be directly summed.
            </p>
          </div>
        </div>

        {/* Scientific Principle Notice */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-start space-x-3 shadow-sm">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-900 leading-relaxed">
            <strong className="text-slate-900 font-semibold block mb-0.5">
              Remote Sensing Caveat: Resolution vs Incident Counts
            </strong>
            MODIS operates at a 1,000 m nominal nadir footprint, while VIIRS features 375 m I-bands capable of resolving smaller and cooler fires. Because a 1km MODIS pixel contains approximately 7.11 VIIRS pixels, VIIRS naturally yields multiple detections for a single burning perimeter.
            <span className="text-amber-700 font-medium block mt-1">
              Never treat raw observation differences as a direct measure of physical wildfire occurrences.
            </span>
          </div>
        </div>

        {/* Side-by-Side Sensor Attribute Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MODIS Column (Amber Identity) */}
          <div className="bg-white border-t-2 border-t-amber-600 border-x border-b border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900">MODIS Active Fire</h3>
                  <p className="text-[11px] text-slate-500">Terra &amp; Aqua Satellites</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                1,000 m Nominal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Detections</span>
                <span className="text-xl font-bold font-sans text-amber-700">{data?.modis?.observation_count ?? 0}</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Mean FRP</span>
                <span className="text-xl font-bold font-sans text-slate-900">
                  {data?.modis?.frp_mean ?? 0} <span className="text-[10px] font-normal font-sans text-slate-500">MW</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Max FRP</span>
                <span className="text-xl font-bold font-sans text-slate-900">
                  {data?.modis?.frp_max ?? 0} <span className="text-[10px] font-normal font-sans text-slate-500">MW</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">Confidence Scale (0–100%)</span>
              <div className="flex items-center justify-between text-slate-900 pt-0.5 font-mono text-[11px]">
                <span>Low (&lt;30%): <strong>{data?.modis?.confidence_distribution?.low ?? 0}</strong></span>
                <span>Nominal (30-80%): <strong>{data?.modis?.confidence_distribution?.nominal ?? 0}</strong></span>
                <span>High (&gt;80%): <strong>{data?.modis?.confidence_distribution?.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'MODIS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-amber-700 border border-slate-200 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MODIS CSV</span>
              </a>
            </div>
          </div>

          {/* VIIRS Column (Sky Identity) */}
          <div className="bg-white border-t-2 border-t-sky-600 border-x border-b border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                  V
                </div>
                <div>
                  <h3 className="font-sans font-bold text-base text-slate-900">VIIRS Active Fire</h3>
                  <p className="text-[11px] text-slate-500">NOAA-20, NOAA-21 &amp; S-NPP</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                375 m Nominal (I-Bands)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Detections</span>
                <span className="text-xl font-bold font-sans text-sky-600">{data?.viirs?.observation_count ?? 0}</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Mean FRP</span>
                <span className="text-xl font-bold font-sans text-slate-900">
                  {data?.viirs?.frp_mean ?? 0} <span className="text-[10px] font-normal font-sans text-slate-500">MW</span>
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Max FRP</span>
                <span className="text-xl font-bold font-sans text-slate-900">
                  {data?.viirs?.frp_max ?? 0} <span className="text-[10px] font-normal font-sans text-slate-500">MW</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">Confidence Scale (Categorical)</span>
              <div className="flex items-center justify-between text-slate-900 pt-0.5 font-mono text-[11px]">
                <span>Low ('l'): <strong>{data?.viirs?.confidence_distribution?.low ?? 0}</strong></span>
                <span>Nominal ('n'): <strong>{data?.viirs?.confidence_distribution?.nominal ?? 0}</strong></span>
                <span>High ('h'): <strong>{data?.viirs?.confidence_distribution?.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'VIIRS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-sky-600 border border-slate-200 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export VIIRS CSV</span>
              </a>
            </div>
          </div>
        </div>

        {/* Spatial Footprint Discrepancy & Area Ratio Infographic */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-sans font-semibold text-base text-slate-900">
                Spatial Footprint Discrepancy &amp; Area Ratio
              </h3>
              <p className="text-xs text-slate-500">
                Geometric comparison of sensor nadir pixel footprints
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-white text-orange-600 border border-slate-200">
              Area Ratio: 1 MODIS &approx; 7.11 VIIRS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
            {/* Visual Box Diagram */}
            <div className="bg-white p-4 rounded border border-slate-200 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono uppercase text-slate-500 mb-3 font-semibold">Pixel Scale Diagram</span>
              <div className="relative w-40 h-40 border-2 border-dashed border-amber-400 bg-amber-50 rounded flex flex-wrap p-1 gap-1 items-start justify-start">
                <span className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] font-mono font-bold text-amber-700 border border-slate-200 rounded">
                  MODIS: 1,000 m
                </span>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 border border-sky-400 bg-sky-50 rounded flex items-center justify-center text-[9px] font-mono text-sky-700 font-bold"
                  >
                    375m
                  </div>
                ))}
                <div className="w-11 h-11 border border-sky-300 border-dashed rounded flex items-center justify-center text-[8px] text-sky-600 font-mono">
                  +0.11
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-3">Area: 1.00 km² vs 0.14 km²</span>
            </div>

            {/* Math Breakdown */}
            <div className="md:col-span-2 space-y-3 text-xs text-slate-900">
              <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                <div>
                  <strong className="text-amber-700 block">MODIS Footprint Ground Area</strong>
                  <span className="text-[11px] text-slate-500">1,000 m &times; 1,000 m nominal nadir resolution</span>
                </div>
                <span className="font-mono font-semibold text-sm">1,000,000 m² (1.00 km²)</span>
              </div>

              <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                <div>
                  <strong className="text-sky-600 block">VIIRS Footprint Ground Area</strong>
                  <span className="text-[11px] text-slate-500">375 m &times; 375 m nominal I-Band resolution</span>
                </div>
                <span className="font-mono font-semibold text-sm">140,625 m² (0.14 km²)</span>
              </div>

              <p className="text-slate-500 leading-relaxed text-[11px]">
                Because each VIIRS detection observes only 14% of a MODIS pixel's ground area, a single wildfire perimeter is frequently recorded as multiple adjacent VIIRS detections, whereas MODIS records a single detection. This is why FirePulse performs <strong className="text-slate-900">analytical aggregation onto a common 1km grid (EPSG:6933)</strong> rather than summing raw sensor counts.
              </p>
            </div>
          </div>
        </div>

        {/* 1km Common Grid Overlap Analysis */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <h3 className="font-sans font-semibold text-base text-slate-900">
              Common 1km Analytical Grid Overlap Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Spatial aggregation into fixed 1km x 1km equal-area cells (EPSG:6933) to determine cross-sensor co-occurrence
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center pt-2">
            {/* Donut Chart */}
            <div className="h-52 flex flex-col items-center justify-center">
              {overlapPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overlapPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {overlapPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1DED5', borderRadius: '6px', fontSize: '11px', color: '#252923' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500">No overlap records</span>
              )}
            </div>

            {/* Overlap Metrics Breakdown */}
            <div className="lg:col-span-2 space-y-2.5">
              <div className="p-3 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Cross-Sensor Co-Detected Cell-Days</span>
                    <span className="text-[11px] text-slate-500">Jointly detected by MODIS and VIIRS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-base">
                  {data?.overlap?.co_detected_cell_days ?? 0}
                </span>
              </div>

              <div className="p-3 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">VIIRS-Only Cell-Days</span>
                    <span className="text-[11px] text-slate-500">Thermal anomaly detected only by VIIRS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-sky-600 text-base">
                  {data?.overlap?.viirs_only_cell_days ?? 0}
                </span>
              </div>

              <div className="p-3 rounded bg-white border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">MODIS-Only Cell-Days</span>
                    <span className="text-[11px] text-slate-500">Thermal anomaly detected only by MODIS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-amber-700 text-base">
                  {data?.overlap?.modis_only_cell_days ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
