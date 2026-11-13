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

  const overlapPieData = data ? [
    { name: 'Co-Detected (Both)', value: data.overlap.co_detected_cell_days, color: '#54785E' },
    { name: 'VIIRS Only', value: data.overlap.viirs_only_cell_days, color: '#318C9B' },
    { name: 'MODIS Only', value: data.overlap.modis_only_cell_days, color: '#C27B26' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Sensor Comparison" 
        subtitle="Comparing sensor footprint resolution, thermal detection sensitivity, and spatial co-occurrence"
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Analytical Comparison / MODIS vs VIIRS
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              Two sensors. One clearer picture.
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Differing sensor footprints, equatorial overpass times, and detection algorithms mean raw observation counts cannot be directly summed.
            </p>
          </div>
        </div>

        {/* Scientific Principle Notice */}
        <div className="bg-white border border-[#E1DED5] p-4 rounded-lg flex items-start space-x-3 shadow-card">
          <Info className="w-4 h-4 text-[#C27B26] shrink-0 mt-0.5" />
          <div className="text-xs text-[#252923] leading-relaxed">
            <strong className="text-[#252923] font-semibold block mb-0.5">
              Remote Sensing Caveat: Resolution vs Incident Counts
            </strong>
            MODIS operates at a 1,000 m nominal nadir footprint, while VIIRS features 375 m I-bands capable of resolving smaller and cooler fires. Because a 1km MODIS pixel contains approximately 7.11 VIIRS pixels, VIIRS naturally yields multiple detections for a single burning perimeter.
            <span className="text-[#C27B26] font-medium block mt-1">
              Never treat raw observation differences as a direct measure of physical wildfire occurrences.
            </span>
          </div>
        </div>

        {/* Side-by-Side Sensor Attribute Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MODIS Column (Amber Identity) */}
          <div className="bg-white border-t-4 border-t-[#C27B26] border-x border-b border-[#E1DED5] rounded-lg p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded bg-[#C27B26]/10 text-[#C27B26] flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#252923]">MODIS Active Fire</h3>
                  <p className="text-[11px] text-[#777970]">Terra &amp; Aqua Satellites</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#C27B26]/10 text-[#C27B26] border border-[#C27B26]/30">
                1,000 m Nominal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Detections</span>
                <span className="text-xl font-bold font-serif text-[#C27B26]">{data?.modis.observation_count ?? 0}</span>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Mean FRP</span>
                <span className="text-xl font-bold font-serif text-[#252923]">
                  {data?.modis.frp_mean ?? 0} <span className="text-[10px] font-normal font-sans text-[#777970]">MW</span>
                </span>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Max FRP</span>
                <span className="text-xl font-bold font-serif text-[#252923]">
                  {data?.modis.frp_max ?? 0} <span className="text-[10px] font-normal font-sans text-[#777970]">MW</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F3] rounded border border-[#E1DED5] text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#777970] font-semibold block">Confidence Scale (0–100%)</span>
              <div className="flex items-center justify-between text-[#252923] pt-0.5 font-mono text-[11px]">
                <span>Low (&lt;30%): <strong>{data?.modis.confidence_distribution.low ?? 0}</strong></span>
                <span>Nominal (30-80%): <strong>{data?.modis.confidence_distribution.nominal ?? 0}</strong></span>
                <span>High (&gt;80%): <strong>{data?.modis.confidence_distribution.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'MODIS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#FAF8F3] hover:bg-[#EBE8DF] text-[#C27B26] border border-[#E1DED5] text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MODIS CSV</span>
              </a>
            </div>
          </div>

          {/* VIIRS Column (Teal Identity) */}
          <div className="bg-white border-t-4 border-t-[#318C9B] border-x border-b border-[#E1DED5] rounded-lg p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded bg-[#318C9B]/10 text-[#318C9B] flex items-center justify-center font-bold text-xs">
                  V
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#252923]">VIIRS Active Fire</h3>
                  <p className="text-[11px] text-[#777970]">NOAA-20, NOAA-21 &amp; S-NPP</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#318C9B]/10 text-[#318C9B] border border-[#318C9B]/30">
                375 m Nominal (I-Bands)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Detections</span>
                <span className="text-xl font-bold font-serif text-[#318C9B]">{data?.viirs.observation_count ?? 0}</span>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Mean FRP</span>
                <span className="text-xl font-bold font-serif text-[#252923]">
                  {data?.viirs.frp_mean ?? 0} <span className="text-[10px] font-normal font-sans text-[#777970]">MW</span>
                </span>
              </div>
              <div className="bg-[#FAF8F3] p-3 rounded border border-[#E1DED5]">
                <span className="text-[10px] font-mono uppercase text-[#777970] block">Max FRP</span>
                <span className="text-xl font-bold font-serif text-[#252923]">
                  {data?.viirs.frp_max ?? 0} <span className="text-[10px] font-normal font-sans text-[#777970]">MW</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F3] rounded border border-[#E1DED5] text-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#777970] font-semibold block">Confidence Scale (Categorical)</span>
              <div className="flex items-center justify-between text-[#252923] pt-0.5 font-mono text-[11px]">
                <span>Low ('l'): <strong>{data?.viirs.confidence_distribution.low ?? 0}</strong></span>
                <span>Nominal ('n'): <strong>{data?.viirs.confidence_distribution.nominal ?? 0}</strong></span>
                <span>High ('h'): <strong>{data?.viirs.confidence_distribution.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'VIIRS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#FAF8F3] hover:bg-[#EBE8DF] text-[#318C9B] border border-[#E1DED5] text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export VIIRS CSV</span>
              </a>
            </div>
          </div>
        </div>

        {/* Spatial Footprint Discrepancy & Area Ratio Infographic */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1DED5] pb-3">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#252923]">
                Spatial Footprint Discrepancy &amp; Area Ratio
              </h3>
              <p className="text-xs text-[#777970]">
                Geometric comparison of sensor nadir pixel footprints
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#FAF8F3] text-[#E65C35] border border-[#E1DED5]">
              Area Ratio: 1 MODIS &approx; 7.11 VIIRS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
            {/* Visual Box Diagram */}
            <div className="bg-[#FAF8F3] p-4 rounded border border-[#E1DED5] flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono uppercase text-[#777970] mb-3 font-semibold">Pixel Scale Diagram</span>
              <div className="relative w-40 h-40 border-2 border-dashed border-[#C27B26] bg-[#C27B26]/5 rounded flex flex-wrap p-1 gap-1 items-start justify-start">
                <span className="absolute -top-2.5 left-2 bg-white px-1 text-[9px] font-mono font-bold text-[#C27B26] border border-[#E1DED5] rounded">
                  MODIS: 1,000 m
                </span>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 border border-[#318C9B] bg-[#318C9B]/15 rounded flex items-center justify-center text-[9px] font-mono text-[#318C9B] font-bold"
                  >
                    375m
                  </div>
                ))}
                <div className="w-11 h-11 border border-[#318C9B]/40 border-dashed rounded flex items-center justify-center text-[8px] text-[#318C9B] font-mono">
                  +0.11
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#777970] mt-3">Area: 1.00 km² vs 0.14 km²</span>
            </div>

            {/* Math Breakdown */}
            <div className="md:col-span-2 space-y-3 text-xs text-[#252923]">
              <div className="p-3 bg-[#FAF8F3] rounded border border-[#E1DED5] flex justify-between items-center">
                <div>
                  <strong className="text-[#C27B26] block">MODIS Footprint Ground Area</strong>
                  <span className="text-[11px] text-[#777970]">1,000 m &times; 1,000 m nominal nadir resolution</span>
                </div>
                <span className="font-mono font-semibold text-sm">1,000,000 m² (1.00 km²)</span>
              </div>

              <div className="p-3 bg-[#FAF8F3] rounded border border-[#E1DED5] flex justify-between items-center">
                <div>
                  <strong className="text-[#318C9B] block">VIIRS Footprint Ground Area</strong>
                  <span className="text-[11px] text-[#777970]">375 m &times; 375 m nominal I-Band resolution</span>
                </div>
                <span className="font-mono font-semibold text-sm">140,625 m² (0.14 km²)</span>
              </div>

              <p className="text-[#777970] leading-relaxed text-[11px]">
                Because each VIIRS detection observes only 14% of a MODIS pixel's ground area, a single wildfire perimeter is frequently recorded as multiple adjacent VIIRS detections, whereas MODIS records a single detection. This is why FirePulse performs <strong className="text-[#252923]">analytical aggregation onto a common 1km grid (EPSG:6933)</strong> rather than summing raw sensor counts.
              </p>
            </div>
          </div>
        </div>

        {/* 1km Common Grid Overlap Analysis */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
          <div>
            <h3 className="font-serif font-semibold text-base text-[#252923]">
              Common 1km Analytical Grid Overlap Analysis
            </h3>
            <p className="text-xs text-[#777970]">
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
                <span className="text-xs text-[#777970]">No overlap records</span>
              )}
            </div>

            {/* Overlap Metrics Breakdown */}
            <div className="lg:col-span-2 space-y-2.5">
              <div className="p-3 rounded bg-[#FAF8F3] border border-[#E1DED5] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#54785E]"></span>
                  <div>
                    <span className="font-semibold text-xs text-[#252923] block">Cross-Sensor Co-Detected Cell-Days</span>
                    <span className="text-[11px] text-[#777970]">Jointly detected by MODIS and VIIRS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#54785E] text-base">
                  {data?.overlap.co_detected_cell_days ?? 0}
                </span>
              </div>

              <div className="p-3 rounded bg-[#FAF8F3] border border-[#E1DED5] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#318C9B]"></span>
                  <div>
                    <span className="font-semibold text-xs text-[#252923] block">VIIRS-Only Cell-Days</span>
                    <span className="text-[11px] text-[#777970]">Thermal anomaly detected only by VIIRS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#318C9B] text-base">
                  {data?.overlap.viirs_only_cell_days ?? 0}
                </span>
              </div>

              <div className="p-3 rounded bg-[#FAF8F3] border border-[#E1DED5] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C27B26]"></span>
                  <div>
                    <span className="font-semibold text-xs text-[#252923] block">MODIS-Only Cell-Days</span>
                    <span className="text-[11px] text-[#777970]">Thermal anomaly detected only by MODIS</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#C27B26] text-base">
                  {data?.overlap.modis_only_cell_days ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
