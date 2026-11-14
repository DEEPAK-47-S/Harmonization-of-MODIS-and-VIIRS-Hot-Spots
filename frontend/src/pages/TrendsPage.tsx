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

  const formattedSeasonality = data?.seasonality?.map((s: any) => ({
    ...s,
    month_name: MONTH_LABELS[s.month - 1]
  })) || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Historical Trends" 
        subtitle="Long-term multi-year burning activity, seasonal patterns, and sensor timeline calibration"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Longitudinal Analysis / Trends
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              Patterns over time.
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Understand multi-year shifts and annual burning seasonality while respecting sensor launch and decommissioning eras.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={FirePulseAPI.getExportUrl('grid', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-md bg-white hover:bg-[#EBE8DF] text-xs font-semibold text-[#252923] border border-[#E1DED5] transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-[#318C9B]" />
              <span>Export Trends CSV</span>
            </a>
          </div>
        </div>

        {/* Series Type Selector Strip */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="font-serif font-semibold text-sm text-[#252923] block">Historical Series Calibration</span>
            <p className="text-xs text-[#777970]">
              Prevents false continuous trend claims by isolating sensor eras
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F3] p-1 rounded-md border border-[#E1DED5]">
            {[
              { id: 'harmonized', label: 'Harmonized 1km Cells' },
              { id: 'modis', label: 'MODIS Series Only' },
              { id: 'viirs', label: 'VIIRS Series Only' },
              { id: 'overlap', label: 'Sensor Overlap Period' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSeriesType(t.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                  seriesType === t.id
                    ? 'bg-white text-[#E65C35] font-semibold shadow-sm'
                    : 'text-[#777970] hover:text-[#252923]'
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
          <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#252923]">Annual Burning Activity Totals</h3>
              <p className="text-xs text-[#777970]">
                Total active 1km cell-days observed per calendar year (UTC)
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              {data && data.yearly_totals?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.yearly_totals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="year" stroke="#777970" fontSize={11} tickLine={false} />
                    <YAxis stroke="#777970" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1DED5', borderRadius: '6px', fontSize: '11px', color: '#252923' }}
                    />
                    <Bar dataKey="total_metric" name="Active 1km Cells" fill="#E65C35" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#777970]">
                  No historical multi-year records available for this AOI.
                </div>
              )}
            </div>
          </div>

          {/* Seasonality Curve Line Chart */}
          <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
            <div>
              <h3 className="font-serif font-semibold text-base text-[#252923]">12-Month Seasonality Profile</h3>
              <p className="text-xs text-[#777970]">
                Average active cell-days per calendar month (Jan–Dec cyclical patterns)
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              {formattedSeasonality.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedSeasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month_name" stroke="#777970" fontSize={11} tickLine={false} />
                    <YAxis stroke="#777970" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E1DED5', borderRadius: '6px', fontSize: '11px', color: '#252923' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mean_active_cells" 
                      name="Mean Active Cells" 
                      stroke="#318C9B" 
                      strokeWidth={2}
                      dot={{ fill: '#318C9B', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#777970]">
                  Seasonality calculations require recorded observations.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sensor Era Demarcation Timeline */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
          <h3 className="font-serif font-semibold text-base text-[#252923]">Observational Sensor Eras</h3>
          <p className="text-xs text-[#777970]">
            NASA Earth Observation satellite timelines must be considered when evaluating long-term historical trends:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 bg-[#FAF8F3] border border-[#E1DED5] rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#C27B26] font-semibold">2000 — 2011</span>
              <h4 className="font-semibold text-[#252923]">MODIS-Only Era</h4>
              <p className="text-[#777970] text-[11px] leading-relaxed">
                Terra (2000) and Aqua (2002) at 1,000m. Lowest baseline detection volume due to coarse resolution.
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF8F3] border border-[#E1DED5] rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#318C9B] font-semibold">2012 — 2017</span>
              <h4 className="font-semibold text-[#252923]">Early Overlap Era</h4>
              <p className="text-[#777970] text-[11px] leading-relaxed">
                Suomi-NPP VIIRS introduces 375m I-bands alongside ongoing MODIS observations.
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF8F3] border border-[#E1DED5] rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#54785E] font-semibold">2018 — 2026</span>
              <h4 className="font-semibold text-[#252923]">Modern JPSS Constellation</h4>
              <p className="text-[#777970] text-[11px] leading-relaxed">
                NOAA-20 and NOAA-21 join S-NPP and MODIS, giving comprehensive morning and afternoon orbital coverage.
              </p>
            </div>

            <div className="p-3.5 bg-[#FAF8F3] border border-[#E1DED5] rounded text-xs space-y-1">
              <span className="font-mono text-[10px] uppercase text-[#BD493C] font-semibold">Nov 2, 2026+</span>
              <h4 className="font-semibold text-[#252923]">Post-Suomi-NPP Era</h4>
              <p className="text-[#777970] text-[11px] leading-relaxed">
                Suomi-NPP operational delivery ceases. Operational monitoring relies on NOAA-20 and NOAA-21.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
