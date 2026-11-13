import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Satellite, 
  Layers, 
  Info, 
  Clock, 
  BarChart3,
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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Historical Trend Analysis & Sensor Eras" 
        subtitle="Long-term multi-year burning activity, seasonal patterns, and sensor timeline calibration"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Sensor Series Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Select Historical Series Mode</h3>
            <p className="text-xs text-slate-400">
              Avoids uncalibrated continuous series conflation across differing sensor eras
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {[
                { id: 'harmonized', label: 'Harmonized 1km Cells' },
                { id: 'modis', label: 'MODIS Series Only' },
                { id: 'viirs', label: 'VIIRS Series Only' },
                { id: 'overlap', label: 'Sensor Overlap Period' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSeriesType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    seriesType === t.id
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <a
              href={FirePulseAPI.getExportUrl(seriesType === 'harmonized' ? 'grid' : 'observations', {
                west: aoi.west,
                south: aoi.south,
                east: aoi.east,
                north: aoi.north,
                sensor: seriesType === 'modis' ? 'MODIS' : (seriesType === 'viirs' ? 'VIIRS' : undefined)
              })}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-semibold"
              title="Download Series CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Multi-Year Activity Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Year-over-Year Burning Activity</h3>
          <p className="text-xs text-slate-400 mb-6">
            Annual volume across historical satellite observation records in {aoi.name}
          </p>

          <div className="h-64 w-full">
            {data && data.years.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.years} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {seriesType === 'harmonized' && (
                    <Bar dataKey="active_grid_cells" name="Active 1km Cells" fill="#ea580c" radius={[4, 4, 0, 0]} />
                  )}
                  {(seriesType === 'modis' || seriesType === 'overlap') && (
                    <Bar dataKey="modis_observations" name="MODIS Detections" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  )}
                  {(seriesType === 'viirs' || seriesType === 'overlap') && (
                    <Bar dataKey="viirs_observations" name="VIIRS Detections" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No multi-year records in database yet. Ingest recent or historical NASA data.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Seasonality Pattern */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Monthly Seasonality Profile (Jan – Dec)</h3>
          <p className="text-xs text-slate-400 mb-6">
            Aggregated multi-year fire seasonality curve highlighting peak burning months
          </p>

          <div className="h-64 w-full">
            {formattedSeasonality.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedSeasonality} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month_name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="active_cells" name="Active Grid Cells" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="modis_count" name="MODIS Detections" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="viirs_count" name="VIIRS Detections" stroke="#0284c7" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No seasonality data available.
              </div>
            )}
          </div>
        </div>

        {/* Historical Sensor Eras Demarcation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-1">Earth Observation Satellite Eras & Sensor Continuity</h3>
          <p className="text-xs text-slate-400 mb-5">
            Understanding shifts in sensor resolution, constellation density, and decommissioned assets
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.sensor_eras?.map((era: any, idx: number) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {era.years}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm mb-1">{era.era}</h4>
                  <p className="text-[11px] text-cyan-400 font-medium mb-2">{era.satellites}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{era.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

