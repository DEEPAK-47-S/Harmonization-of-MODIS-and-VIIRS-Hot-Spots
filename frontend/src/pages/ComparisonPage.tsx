import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Satellite, 
  Flame, 
  Layers, 
  Info, 
  BarChart2, 
  TrendingUp, 
  ShieldAlert,
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
    { name: 'Co-Detected (Both)', value: data.overlap.co_detected_cell_days, color: '#c084fc' },
    { name: 'VIIRS Only', value: data.overlap.viirs_only_cell_days, color: '#38bdf8' },
    { name: 'MODIS Only', value: data.overlap.modis_only_cell_days, color: '#f59e0b' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="MODIS vs VIIRS Sensor Comparison" 
        subtitle="Comparing sensor footprint resolution, thermal detection sensitivity, and spatial co-occurrence"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Critical Scientific Caveat Banner */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3.5 shadow-md">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-400 font-bold block mb-1">
              Scientific Principle: Resolution & Observation Timing Impact
            </strong>
            MODIS operates at a 1,000 m nominal resolution, while VIIRS features 375 m I-bands capable of resolving smaller and cooler thermal anomalies. Detections also differ due to differing orbit tracks, equatorial crossing times, scan angles, and cloud obscuration.
            <span className="text-amber-300 font-semibold block mt-1">
              Never interpret differences in raw observation counts as a direct difference in the physical number of wildfires.
            </span>
          </div>
        </div>

        {/* Side-by-Side Sensor Attribute Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MODIS Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg border-t-4 border-t-amber-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">MODIS Active Fire</h3>
                  <p className="text-[11px] text-slate-400">Terra & Aqua Satellites</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                1,000 m Nominal
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Detections</span>
                <span className="text-xl font-bold text-amber-400">{data?.modis.observation_count ?? 0}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Mean FRP</span>
                <span className="text-xl font-bold text-white">{data?.modis.frp_mean ?? 0} <span className="text-xs font-normal text-slate-400">MW</span></span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Max FRP</span>
                <span className="text-xl font-bold text-white">{data?.modis.frp_max ?? 0} <span className="text-xs font-normal text-slate-400">MW</span></span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confidence Distribution (Percentage)</span>
              <div className="flex items-center justify-between text-slate-300">
                <span>Low (&lt;30%): <strong>{data?.modis.confidence_distribution.low ?? 0}</strong></span>
                <span>Nominal (30-80%): <strong>{data?.modis.confidence_distribution.nominal ?? 0}</strong></span>
                <span>High (&gt;80%): <strong>{data?.modis.confidence_distribution.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'MODIS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MODIS Observations CSV</span>
              </a>
            </div>
          </div>

          {/* VIIRS Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg border-t-4 border-t-cyan-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  V
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">VIIRS Active Fire</h3>
                  <p className="text-[11px] text-slate-400">NOAA-20 & NOAA-21 (JPSS)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                375 m Nominal (I-Bands)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Total Detections</span>
                <span className="text-xl font-bold text-cyan-400">{data?.viirs.observation_count ?? 0}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Mean FRP</span>
                <span className="text-xl font-bold text-white">{data?.viirs.frp_mean ?? 0} <span className="text-xs font-normal text-slate-400">MW</span></span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Max FRP</span>
                <span className="text-xl font-bold text-white">{data?.viirs.frp_max ?? 0} <span className="text-xs font-normal text-slate-400">MW</span></span>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Confidence Distribution (Categorical)</span>
              <div className="flex items-center justify-between text-slate-300">
                <span>Low ('l'): <strong>{data?.viirs.confidence_distribution.low ?? 0}</strong></span>
                <span>Nominal ('n'): <strong>{data?.viirs.confidence_distribution.nominal ?? 0}</strong></span>
                <span>High ('h'): <strong>{data?.viirs.confidence_distribution.high ?? 0}</strong></span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
              <a
                href={FirePulseAPI.getExportUrl('observations', { sensor: 'VIIRS', west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export VIIRS Observations CSV</span>
              </a>
            </div>
          </div>
        </div>

        {/* 1km Common Grid Overlap Analysis */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Common 1km Analytical Grid Overlap Analysis</h3>
          <p className="text-xs text-slate-400 mb-6">
            Spatial aggregation into fixed 1km x 1km equal-area cells (EPSG:6933) to determine cross-sensor co-occurrence
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Donut Chart */}
            <div className="h-56 flex flex-col items-center justify-center">
              {overlapPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={overlapPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {overlapPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500">No overlap records</span>
              )}
            </div>

            {/* Overlap Metrics Breakdown */}
            <div className="lg:col-span-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-400"></span>
                  <div>
                    <span className="font-semibold text-white text-xs block">Cross-Sensor Co-Detected Cell-Days</span>
                    <span className="text-[11px] text-slate-400">Observed by both MODIS and VIIRS on the same UTC day</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-400">{data?.overlap.co_detected_cell_days ?? 0}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">({data?.overlap.co_detection_rate_pct ?? 0}%)</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400"></span>
                  <div>
                    <span className="font-semibold text-white text-xs block">VIIRS Only Active Cells</span>
                    <span className="text-[11px] text-slate-400">Detected by VIIRS 375m but not recorded by MODIS 1km</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-sky-400">{data?.overlap.viirs_only_cell_days ?? 0}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <div>
                    <span className="font-semibold text-white text-xs block">MODIS Only Active Cells</span>
                    <span className="text-[11px] text-slate-400">Detected by MODIS Terra/Aqua only</span>
                  </div>
                </div>
                <span className="text-lg font-bold text-amber-400">{data?.overlap.modis_only_cell_days ?? 0}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <a
                  href={FirePulseAPI.getExportUrl('grid', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Harmonized 1km Grid CSV</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Time Series Comparison */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Daily Observation Comparison Timeline</h3>
          <p className="text-xs text-slate-400 mb-4">
            Side-by-side detection counts over time across the selected Area of Interest
          </p>

          <div className="h-64 w-full">
            {data && data.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="viirs_detections" name="VIIRS (375m)" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="modis_detections" name="MODIS (1km)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="co_detected_cells" name="Co-Detected Cells" stroke="#c084fc" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No observations to compare in this range.
              </div>
            )}
          </div>
        </div>

        {/* Scientific Methodology Notes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Scientific Reference & Methodology Notes</h4>
          {data?.scientific_notes.map((note, idx) => (
            <p key={idx} className="text-xs text-slate-300 flex items-start space-x-2">
              <span className="text-orange-400 font-bold shrink-0">•</span>
              <span>{note}</span>
            </p>
          ))}
        </div>
      </main>
    </div>
  );
};

