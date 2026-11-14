import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Flame, 
  Grid, 
  X, 
  Download,
  Calendar as CalendarIcon,
  Info,
  Table,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { CalendarResponse, CalendarDayItem, CalendarMatrixResponse, CalendarMatrixMonthItem } from '../types';

const METRIC_OPTIONS = [
  { id: 'active_grid_cells', label: 'Active 1km Cells', desc: 'Distinct 1km cells with satellite detections' },
  { id: 'modis_observations', label: 'MODIS Detections', desc: 'Raw detections from Terra & Aqua' },
  { id: 'viirs_observations', label: 'VIIRS Detections', desc: 'Raw detections from NOAA-20 & NOAA-21' },
  { id: 'cross_sensor_co_detections', label: 'Co-Detected Cells', desc: 'Cells observed by both MODIS and VIIRS on same day' },
  { id: 'mean_frp', label: 'Mean FRP (MW)', desc: 'Average thermal radiative energy' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const CalendarPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  
  const now = new Date();
  const [viewMode, setViewMode] = useState<'matrix' | 'month'>('matrix');
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedMetric, setSelectedMetric] = useState<string>('active_grid_cells');
  
  // Matrix data
  const [matrixData, setMatrixData] = useState<CalendarMatrixResponse | null>(null);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(true);
  const [hoveredCell, setHoveredCell] = useState<CalendarMatrixMonthItem | null>(null);

  // Single month day-by-day data
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Selected day detail modal / slideover
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<any | null>(null);
  const [loadingDay, setLoadingDay] = useState<boolean>(false);

  useEffect(() => {
    fetchMatrix();
  }, [aoi, refreshKey, selectedMetric]);

  useEffect(() => {
    fetchCalendar();
  }, [aoi, refreshKey, selectedYear, selectedMonth, selectedMetric]);

  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const data = await FirePulseAPI.getCalendarMatrix({
        metric: selectedMetric,
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
      });
      setMatrixData(data);
    } catch (err) {
      console.error('Failed to load calendar matrix:', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const data = await FirePulseAPI.getCalendar({
        year: selectedYear,
        month: selectedMonth,
        metric: selectedMetric,
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
      });
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = async (dateStr: string) => {
    setSelectedDay(dateStr);
    setLoadingDay(true);
    try {
      const details = await FirePulseAPI.getCalendarDay(dateStr, aoi);
      setDayDetails(details);
    } catch (err) {
      console.error('Failed to load day details:', err);
    } finally {
      setLoadingDay(false);
    }
  };

  const handleCellClick = (yr: number, mo: number) => {
    setSelectedYear(yr);
    setSelectedMonth(mo);
    setViewMode('month');
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Build grid days for selected month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday

  // Lookup map of returned days
  const dayMap = new Map<string, CalendarDayItem>();
  if (calendarData?.days) {
    calendarData.days.forEach(d => dayMap.set(d.date, d));
  }

  // Activity level styling (Editorial warm ivory & fire orange palette)
  const getLevelStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#FCECE7] text-slate-900 border-slate-200 hover:border-orange-500';
      case 2:
        return 'bg-[#F7D6CB] text-slate-900 border-slate-200 hover:border-orange-500 font-medium';
      case 3:
        return 'bg-[#F29E85] text-slate-900 border-slate-200 hover:border-orange-500 font-semibold';
      case 4:
        return 'bg-orange-600 text-white border-orange-500 hover:brightness-95 font-bold shadow-sm';
      case 5:
        return 'bg-red-600 text-white border-red-400 hover:brightness-95 font-bold shadow-sm';
      default:
        return 'bg-white text-slate-500 border-slate-200 hover:bg-white hover:border-[#CEC9BD]';
    }
  };

  // Matrix cell background based on ratio to baseline
  const getMatrixCellStyle = (item: CalendarMatrixMonthItem) => {
    if (!item.has_data || item.value === 0) {
      return 'bg-white/60 text-slate-500/40 border-slate-200';
    }
    const val = item.value;
    const median = item.historical_median;
    if (item.is_anomaly) {
      return 'bg-red-600 text-white font-bold border-[#A53A2E] shadow-sm';
    }
    if (median > 0) {
      const ratio = val / median;
      if (ratio > 1.25) return 'bg-orange-600 text-white font-semibold border-[#D44F29]';
      if (ratio > 0.8) return 'bg-[#F29E85] text-slate-900 font-medium border-slate-200';
      return 'bg-[#FCECE7] text-slate-900 border-slate-200';
    }
    if (val > 100) return 'bg-orange-600 text-white font-bold border-orange-500';
    if (val > 10) return 'bg-[#F7D6CB] text-slate-900 font-semibold border-slate-200';
    return 'bg-[#FCECE7] text-slate-900 border-slate-200';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Harmonized Burning Calendar" 
        subtitle="Multi-year temporal active-fire intelligence based on EPSG:6933 1km analytical cells"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Modern Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-semibold tracking-wide uppercase">
              NASA Space Apps 2026 Core Objective • Temporal Intelligence
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Harmonized Burning Activity Calendar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
              Track seasonal fire dynamics across satellites. Explore year-by-month historical baselines, detect unusual monthly anomalies, and drill down into individual day observations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Annual Heatmap (Years × Months)</span>
                <span className="sm:hidden">Annual Heatmap</span>
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Monthly Day Grid</span>
                <span className="sm:hidden">Day Grid</span>
              </button>
            </div>

            <a
              href={FirePulseAPI.getExportUrl('grid', {
                date_from: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
                date_to: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`,
                west: aoi.west,
                south: aoi.south,
                east: aoi.east,
                north: aoi.north
              })}
              download
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 transition-colors shadow-2xs"
              title="Download Monthly Harmonized Grid CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Navigation & Metric Selector Strip */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {viewMode === 'month' ? (
            /* Month & Year Controls */
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-slate-900">
                  {MONTH_NAMES[selectedMonth - 1]}
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  UTC
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('matrix')}
                className="text-xs text-orange-600 hover:underline font-bold ml-2 flex items-center space-x-1"
              >
                <span>← Back to All Years</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900">Multi-Year Temporal Heatmap</span>
              <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                {matrixData?.years.length || 0} Years Active
              </span>
            </div>
          )}

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedMetric(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedMetric === opt.id
                    ? 'bg-white text-orange-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title={opt.desc}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIEW MODE 1: MULTI-YEAR ANNUAL HEATMAP MATRIX (Years x Jan-Dec) */}
        {viewMode === 'matrix' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">
                    Annual Burning Activity Matrix (2021–2026)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standardized calendar cells. Click any month cell to drill down into the daily breakdown.
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-white border border-slate-200"></span>
                    <span>No Activity</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></span>
                    <span>Low</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-orange-300"></span>
                    <span>Normal</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-orange-500"></span>
                    <span>High</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded bg-red-600"></span>
                    <span>Anomaly</span>
                  </span>
                </div>
              </div>

              {/* Responsive Scrollable Heatmap Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-mono font-bold text-slate-400">
                      <th className="py-3 px-3.5 sticky left-0 bg-slate-50/90 backdrop-blur-xs z-10">Year</th>
                      {MONTH_SHORT.map((m) => (
                        <th key={m} className="py-3 px-2 text-center font-bold">{m}</th>
                      ))}
                      <th className="py-3 px-3.5 text-right font-bold">Annual Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {loadingMatrix ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-xs text-slate-400 animate-pulse">
                          Loading historical burning activity matrix across satellites...
                        </td>
                      </tr>
                    ) : matrixData && matrixData.matrix.length > 0 ? (
                      matrixData.matrix.map((row) => {
                        const annualTotal = row.months.reduce((acc, m) => acc + (m.value || 0), 0);
                        return (
                          <tr key={row.year} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                              {row.year}
                            </td>
                            {row.months.map((item) => (
                              <td
                                key={`${row.year}-${item.month}`}
                                onClick={() => handleCellClick(row.year, item.month)}
                                onMouseEnter={() => setHoveredCell(item)}
                                onMouseLeave={() => setHoveredCell(null)}
                                className="p-1 text-center"
                              >
                                <div 
                                  className={`h-10 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-xs p-1 relative ${getMatrixCellStyle(item)}`}
                                  title={`${MONTH_NAMES[item.month - 1]} ${row.year}: ${item.value} ${METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label} (Baseline: ${item.historical_median})`}
                                >
                                  {item.has_data && item.value > 0 ? (
                                    <>
                                      <span className="font-mono text-[11px] font-bold leading-tight">
                                        {selectedMetric === 'mean_frp' ? `${item.value.toFixed(1)}` : item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                                      </span>
                                      {item.is_anomaly && (
                                        <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 border border-white" title="Unusual Anomaly"></span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] opacity-25 font-mono">—</span>
                                  )}
                                </div>
                              </td>
                            ))}
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                              {selectedMetric === 'mean_frp' ? (annualTotal / 12).toFixed(1) : annualTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-xs text-slate-400">
                          No historical matrix records available for this Area of Interest.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Historical Baseline Row */}
                  {matrixData && Object.keys(matrixData.monthly_medians).length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200 text-[11px] font-mono text-slate-600">
                        <td className="py-3 px-3.5 font-bold text-slate-900 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                          Historical Median
                        </td>
                        {MONTH_SHORT.map((_, idx) => {
                          const med = matrixData.monthly_medians[String(idx + 1)] ?? 0;
                          return (
                            <td key={`med-${idx}`} className="py-3 px-2 text-center font-bold text-slate-900">
                              {med > 0 ? (selectedMetric === 'mean_frp' ? med.toFixed(1) : Math.round(med).toLocaleString()) : '—'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3.5 text-right font-bold text-slate-900">
                          Baseline
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Cell Inspection Preview Strip */}
              {hoveredCell && hoveredCell.has_data && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-sm text-slate-900">
                      {MONTH_NAMES[hoveredCell.month - 1]} {hoveredCell.year}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-2xs">
                      {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label}: <strong className="text-orange-600">{hoveredCell.value.toLocaleString()}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Historical Median: <strong>{hoveredCell.historical_median.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-mono">
                    <span className="text-amber-700">MODIS: {hoveredCell.modis_observations.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-sky-600">VIIRS: {hoveredCell.viirs_observations.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-emerald-700">Co-Detected: {hoveredCell.cross_sensor_co_detections.toLocaleString()}</span>
                    {hoveredCell.is_anomaly && (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px]">
                        Anomaly (+{hoveredCell.anomaly_delta.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scientific Harmonization Principle Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 text-orange-600 mb-1">
                  <Grid className="w-4 h-4" />
                  <span className="font-sans font-semibold text-xs text-slate-900">EPSG:6933 1km Equal-Area</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Raw pixel counts differ by satellite footprint (MODIS 1km vs VIIRS 375m). All monthly counts above are harmonized into standardized 1km² analytical cell-days to ensure scientific comparability.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 text-sky-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-sans font-semibold text-xs text-slate-900">Calendar Baseline Anomaly</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fire seasonality is naturally periodic. Each month is evaluated against historical medians of that same calendar month rather than annual averages, eliminating seasonal bias.
                </p>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2 text-emerald-700 mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="font-sans font-semibold text-xs text-slate-900">Sensor Transition Provenance</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Observations preserve full instrument origin: MODIS Terra (2000+), Aqua (2002+), VIIRS S-NPP (2012–2026), NOAA-20 (2018+), and NOAA-21 (2023+).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: MONTHLY DAY-BY-DAY CALENDAR */}
        {viewMode === 'month' && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-sans font-semibold text-lg text-slate-900">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear} (Daily Breakdown)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Metric: {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label}
              </span>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-mono uppercase text-slate-500 font-semibold">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty offset spaces */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-24 md:h-28 rounded border border-transparent bg-transparent"></div>
              ))}

              {/* Days of current month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayItem = dayMap.get(dateStr);
                const level = dayItem ? dayItem.activity_level : 0;
                const value = dayItem ? dayItem.metric_value : 0;
                const isSelected = selectedDay === dateStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`h-24 md:h-28 p-2 rounded border transition-all cursor-pointer flex flex-col justify-between ${
                      getLevelStyle(level)
                    } ${isSelected ? 'ring-2 ring-[#E65C35]' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{dayNum}</span>
                      {dayItem && dayItem.cross_sensor_co_detections > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" title="Cross-sensor co-detection present"></span>
                      )}
                    </div>

                    {dayItem && value > 0 ? (
                      <div className="space-y-0.5 text-right font-mono">
                        <div className="text-sm font-bold">
                          {selectedMetric === 'mean_frp' ? `${value.toFixed(1)} MW` : Math.round(value).toLocaleString()}
                        </div>
                        <div className="text-[10px] opacity-75">
                          {dayItem.modis_observations} M / {dayItem.viirs_observations} V
                        </div>
                      </div>
                    ) : (
                      <div className="text-right text-[10px] opacity-40 font-mono">
                        —
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Heatmap Legend */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium text-slate-900">Activity Quantile:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-white border border-slate-200"></span>
                    <span className="text-[10px]">None</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#FCECE7] border border-slate-200"></span>
                    <span className="text-[10px]">Q1</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#F7D6CB] border border-slate-200"></span>
                    <span className="text-[10px]">Q2</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#F29E85] border border-slate-200"></span>
                    <span className="text-[10px]">Q3</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-orange-600"></span>
                    <span className="text-[10px]">Q4</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-red-600"></span>
                    <span className="text-[10px]">High</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>Cross-Sensor Co-Detection</span>
                </span>
                <span>•</span>
                <span>Click any day to view granular grid cell and satellite detections</span>
              </div>
            </div>
          </div>
        )}

        {/* DAY DRILLDOWN INSPECTION CARD */}
        {selectedDay && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-orange-600" />
                <h3 className="font-sans font-semibold text-lg text-slate-900">
                  Granular Activity Inspection: {selectedDay} (UTC)
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDay ? (
              <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                Loading observations and analytical grid cells...
              </div>
            ) : dayDetails && dayDetails.summary ? (
              <div className="space-y-6">
                {/* Day KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Active 1km Cells</div>
                    <div className="text-xl font-sans font-bold text-slate-900 mt-0.5">
                      {dayDetails.summary.active_grid_cells.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-[10px] font-mono text-amber-700 uppercase">MODIS Observations</div>
                    <div className="text-xl font-sans font-bold text-amber-700 mt-0.5">
                      {dayDetails.summary.total_modis_observations.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-[10px] font-mono text-sky-600 uppercase">VIIRS Observations</div>
                    <div className="text-xl font-sans font-bold text-sky-600 mt-0.5">
                      {dayDetails.summary.total_viirs_observations.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-md border border-slate-200">
                    <div className="text-[10px] font-mono text-emerald-700 uppercase">Co-Detected Cells</div>
                    <div className="text-xl font-sans font-bold text-emerald-700 mt-0.5">
                      {dayDetails.summary.cross_sensor_co_detected_cells.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Granular grid cells list */}
                {dayDetails.grid_cells && dayDetails.grid_cells.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 mb-2">
                      Active Equal-Area 1km Cells on this Date ({dayDetails.grid_cells.length} cells)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                      {dayDetails.grid_cells.map((cell: any) => (
                        <div key={cell.grid_cell_id} className="p-2.5 bg-white border border-slate-200 rounded text-xs">
                          <div className="font-mono text-[10px] text-slate-500 truncate">{cell.grid_cell_id}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-semibold text-slate-900">{cell.sensors_present}</span>
                            <span className="font-mono text-orange-600">{cell.total_detections} det.</span>
                          </div>
                          {cell.mean_frp_mw !== null && cell.mean_frp_mw !== undefined && (
                            <div className="text-[10px] text-slate-500 mt-0.5">Mean FRP: {Number(cell.mean_frp_mw).toFixed(1)} MW</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No active cells recorded for this specific date.</p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No satellite observations were detected on {selectedDay} in this Area of Interest.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
