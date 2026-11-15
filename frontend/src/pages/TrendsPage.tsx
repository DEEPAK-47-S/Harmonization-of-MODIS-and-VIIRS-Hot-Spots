import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
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
  Legend 
} from 'recharts';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TrendsPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [seriesType, setSeriesType] = useState<string>('harmonized');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTrends();
  }, [aoi, refreshKey, seriesType]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await FirePulseAPI.getTrends({
        series_type: seriesType,
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const yearlyData = (data?.years || data?.yearly_totals || []).map((y: any) => {
    let metric = y.active_grid_cells ?? y.active_cells ?? y.total_metric ?? 0;
    if (seriesType === 'modis') metric = y.modis_observations ?? y.modis_count ?? 0;
    if (seriesType === 'viirs') metric = y.viirs_observations ?? y.viirs_count ?? 0;
    if (seriesType === 'overlap') metric = y.co_detected_cells ?? 0;
    return {
      ...y,
      year: String(y.year),
      total_metric: metric,
      modis_count: y.modis_observations ?? y.modis_count ?? 0,
      viirs_count: y.viirs_observations ?? y.viirs_count ?? 0,
    };
  });

  const formattedSeasonality = data?.seasonality?.map((s: any) => {
    let val = s.active_cells ?? s.mean_active_cells ?? 0;
    if (seriesType === 'modis') val = s.modis_count ?? 0;
    if (seriesType === 'viirs') val = s.viirs_count ?? 0;
    return {
      ...s,
      month_name: MONTH_LABELS[s.month - 1] || `M${s.month}`,
      active_cells: val,
    };
  }) || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Historical Trends" 
        subtitle="Long-term multi-year burning activity, seasonal patterns, and sensor timeline calibration"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Historical Analysis / Trends
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              Historical Trends & Burning Seasonality
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Understand multi-year shifts and annual burning seasonality while respecting sensor launch and decommissioning eras.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={FirePulseAPI.getExportUrl('grid', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-md bg-white hover:bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-200 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Export Trends CSV</span>
            </a>
          </div>
        </div>

        {/* Series Type Selector Strip */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-sans font-semibold text-sm text-slate-900 block">Historical Series Calibration</span>
            <p className="text-xs text-slate-500">
              Prevents false continuous trend claims by isolating sensor eras
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            {[
              { id: 'harmonized', label: 'Harmonized 1km Cells' },
              { id: 'modis', label: 'MODIS Series Only' },
              { id: 'viirs', label: 'VIIRS Series Only' },
              { id: 'overlap', label: 'Sensor Overlap Period' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSeriesType(t.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  seriesType === t.id
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Two-Column Trends Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Year-by-Year Activity Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-sans font-semibold text-base text-slate-900">Annual Burning Activity Totals</h3>
              <p className="text-xs text-slate-500">
                Total active 1km cell-days observed per calendar year (UTC)
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="year" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', color: '#0F172A' }}
                    />
                    <Bar 
                      dataKey="total_metric" 
                      name={seriesType === 'modis' ? 'MODIS Detections' : seriesType === 'viirs' ? 'VIIRS Detections' : seriesType === 'overlap' ? 'Co-detected Cells' : 'Harmonized 1km Cells'} 
                      fill="#EA580C" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No historical multi-year records available for this AOI.
                </div>
              )}
            </div>
          </div>

          {/* Seasonality Curve Line Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-sans font-semibold text-base text-slate-900">12-Month Seasonality Profile</h3>
              <p className="text-xs text-slate-500">
                Average active cell-days per calendar month (Jan–Dec cyclical patterns)
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              {formattedSeasonality.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedSeasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month_name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', color: '#0F172A' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="active_cells" 
                      name={seriesType === 'modis' ? 'MODIS Observations' : seriesType === 'viirs' ? 'VIIRS Observations' : 'Active Cell-Days'} 
                      stroke="#0284C7" 
                      strokeWidth={2}
                      dot={{ fill: '#0284C7', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Seasonality calculations require recorded observations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sensor Era Demarcation Timeline */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-semibold text-base text-slate-900">Observational Sensor Eras</h3>
          <p className="text-xs text-slate-500">
            NASA Earth Observation satellite timelines must be considered when evaluating long-term historical trends:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 bg-white border border-slate-200 rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-amber-700 font-semibold">2000 — 2011</span>
              <h4 className="font-semibold text-slate-900">MODIS-Only Era</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Terra (2000) and Aqua (2002) at 1,000m. Lowest baseline detection volume due to coarse resolution.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-sky-600 font-semibold">2012 — 2017</span>
              <h4 className="font-semibold text-slate-900">Early Overlap Era</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Suomi-NPP VIIRS introduces 375m I-bands alongside ongoing MODIS observations.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-emerald-700 font-semibold">2018 — 2026</span>
              <h4 className="font-semibold text-slate-900">Modern JPSS Constellation</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                NOAA-20 and NOAA-21 join S-NPP and MODIS, giving comprehensive morning and afternoon orbital coverage.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-red-600 font-semibold">Nov 2, 2026+</span>
              <h4 className="font-semibold text-slate-900">Post-Suomi-NPP Era</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Suomi-NPP operational delivery ceases. Operational monitoring relies on NOAA-20 and NOAA-21.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
