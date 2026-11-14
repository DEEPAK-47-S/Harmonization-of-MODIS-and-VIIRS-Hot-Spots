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
        return 'bg-[#FCECE7] text-[#252923] border-[#E1DED5] hover:border-[#E65C35]';
      case 2:
        return 'bg-[#F7D6CB] text-[#252923] border-[#E1DED5] hover:border-[#E65C35] font-medium';
      case 3:
        return 'bg-[#F29E85] text-[#252923] border-[#E1DED5] hover:border-[#E65C35] font-semibold';
      case 4:
        return 'bg-[#E65C35] text-white border-[#E65C35] hover:brightness-95 font-bold shadow-sm';
      case 5:
        return 'bg-[#BD493C] text-white border-[#BD493C] hover:brightness-95 font-bold shadow-sm';
      default:
        return 'bg-white text-[#777970] border-[#E1DED5] hover:bg-[#FAF8F3] hover:border-[#CEC9BD]';
    }
  };

  // Matrix cell background based on ratio to baseline
  const getMatrixCellStyle = (item: CalendarMatrixMonthItem) => {
    if (!item.has_data || item.value === 0) {
      return 'bg-white/60 text-[#777970]/40 border-[#E1DED5]';
    }
    const val = item.value;
    const median = item.historical_median;
    if (item.is_anomaly) {
      return 'bg-[#BD493C] text-white font-bold border-[#A53A2E] shadow-sm';
    }
    if (median > 0) {
      const ratio = val / median;
      if (ratio > 1.25) return 'bg-[#E65C35] text-white font-semibold border-[#D44F29]';
      if (ratio > 0.8) return 'bg-[#F29E85] text-[#252923] font-medium border-[#E1DED5]';
      return 'bg-[#FCECE7] text-[#252923] border-[#E1DED5]';
    }
    if (val > 100) return 'bg-[#E65C35] text-white font-bold border-[#E65C35]';
    if (val > 10) return 'bg-[#F7D6CB] text-[#252923] font-semibold border-[#E1DED5]';
    return 'bg-[#FCECE7] text-[#252923] border-[#E1DED5]';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Burning Activity Calendar" 
        subtitle="Spatially harmonized temporal calendar based on EPSG:6933 1km analytical cells"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              NASA Space Apps 2026 Core Objective / Temporal Intelligence
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              The Harmonized Burning Activity Calendar
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Track seasonal fire dynamics across satellites. Explore year-by-month historical baselines, detect unusual monthly anomalies, and drill down into individual day observations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#FAF8F3] p-1 rounded-md border border-[#E1DED5]">
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold transition ${
                  viewMode === 'matrix'
                    ? 'bg-white text-[#E65C35] shadow-sm'
                    : 'text-[#777970] hover:text-[#252923]'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Annual Heatmap (Years × Months)</span>
                <span className="sm:hidden">Annual Heatmap</span>
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded text-xs font-semibold transition ${
                  viewMode === 'month'
                    ? 'bg-white text-[#E65C35] shadow-sm'
                    : 'text-[#777970] hover:text-[#252923]'
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
              className="flex items-center space-x-1.5 px-3 py-2 rounded-md bg-white hover:bg-[#EBE8DF] text-xs font-semibold text-[#252923] border border-[#E1DED5] transition-colors shadow-sm"
              title="Download Monthly Harmonized Grid CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#318C9B]" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Navigation & Metric Selector Strip */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
          {viewMode === 'month' ? (
            /* Month & Year Controls */
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded border border-[#E1DED5] bg-[#FAF8F3] hover:bg-[#EBE8DF] text-[#777970] hover:text-[#252923] transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2">
                <span className="font-serif font-bold text-base text-[#252923]">
                  {MONTH_NAMES[selectedMonth - 1]}
                </span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#FAF8F3] border border-[#E1DED5] rounded px-2 py-0.5 text-xs font-mono font-semibold text-[#252923] focus:outline-none"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-[10px] font-mono text-[#777970] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#E1DED5]">
                  UTC
                </span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded border border-[#E1DED5] bg-[#FAF8F3] hover:bg-[#EBE8DF] text-[#777970] hover:text-[#252923] transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('matrix')}
                className="text-xs text-[#E65C35] hover:underline font-medium ml-2 flex items-center space-x-1"
              >
                <span>← Back to All Years</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-serif font-semibold text-[#252923]">Multi-Year Temporal Heatmap</span>
              <span className="text-[10px] font-mono text-[#777970] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#E1DED5]">
                {matrixData?.years.length || 0} Years Recorded
              </span>
            </div>
          )}

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-[#FAF8F3] p-1 rounded-md border border-[#E1DED5]">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedMetric(opt.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  selectedMetric === opt.id
                    ? 'bg-white text-[#E65C35] font-semibold shadow-sm'
                    : 'text-[#777970] hover:text-[#252923]'
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
            <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1DED5] pb-3">
                <div>
                  <h3 className="font-serif font-semibold text-lg text-[#252923]">
                    Annual Burning Activity Matrix (2000–2026)
                  </h3>
                  <p className="text-xs text-[#777970]">
                    Standardized calendar cells. Click any month cell to drill down into the daily breakdown.
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs text-[#777970]">
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-white border border-[#E1DED5]"></span>
                    <span>No Activity</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#FCECE7] border border-[#E1DED5]"></span>
                    <span>Low</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#F29E85]"></span>
                    <span>Baseline Normal</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#E65C35]"></span>
                    <span>High</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#BD493C]"></span>
                    <span>Unusual Anomaly</span>
                  </span>
                </div>
              </div>

              {/* Responsive Scrollable Heatmap Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#FAF8F3] border-b border-[#E1DED5] text-[11px] font-mono text-[#777970]">
                      <th className="py-2.5 px-3 font-semibold sticky left-0 bg-[#FAF8F3] z-10">Year</th>
                      {MONTH_SHORT.map((m) => (
                        <th key={m} className="py-2.5 px-2 text-center font-semibold">{m}</th>
                      ))}
                      <th className="py-2.5 px-3 text-right font-semibold">Annual Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E1DED5] font-sans">
                    {loadingMatrix ? (
                      <tr>
                        <td colSpan={14} className="py-12 text-center text-xs text-[#777970] animate-pulse">
                          Loading historical burning activity matrix across satellites...
                        </td>
                      </tr>
                    ) : matrixData && matrixData.matrix.length > 0 ? (
                      matrixData.matrix.map((row) => {
                        const annualTotal = row.months.reduce((acc, m) => acc + (m.value || 0), 0);
                        return (
                          <tr key={row.year} className="hover:bg-[#FAF8F3]/50 transition-colors">
                            <td className="py-2 px-3 font-mono font-bold text-[#252923] sticky left-0 bg-white z-10 border-r border-[#E1DED5]">
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
                                  className={`h-10 rounded border flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-105 p-1 relative ${getMatrixCellStyle(item)}`}
                                  title={`${MONTH_NAMES[item.month - 1]} ${row.year}: ${item.value} ${METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label} (Baseline: ${item.historical_median})`}
                                >
                                  {item.has_data && item.value > 0 ? (
                                    <>
                                      <span className="font-mono text-[11px] font-semibold leading-tight">
                                        {selectedMetric === 'mean_frp' ? `${item.value.toFixed(1)}` : item.value >= 1000 ? `${(item.value / 1000).toFixed(1)}k` : item.value}
                                      </span>
                                      {item.is_anomaly && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 absolute top-1 right-1" title="Unusual Anomaly"></span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[10px] opacity-30 font-mono">—</span>
                                  )}
                                </div>
                              </td>
                            ))}
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#252923] bg-[#FAF8F3]">
                              {selectedMetric === 'mean_frp' ? (annualTotal / 12).toFixed(1) : annualTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={14} className="py-8 text-center text-xs text-[#777970]">
                          No historical matrix records available for this Area of Interest.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* Historical Baseline Row */}
                  {matrixData && Object.keys(matrixData.monthly_medians).length > 0 && (
                    <tfoot>
                      <tr className="bg-[#FAF8F3] border-t-2 border-[#E1DED5] text-[11px] font-mono text-[#777970]">
                        <td className="py-2.5 px-3 font-bold text-[#252923] sticky left-0 bg-[#FAF8F3] z-10 border-r border-[#E1DED5]">
                          Historical Median
                        </td>
                        {MONTH_SHORT.map((_, idx) => {
                          const med = matrixData.monthly_medians[String(idx + 1)] ?? 0;
                          return (
                            <td key={`med-${idx}`} className="py-2.5 px-2 text-center font-bold text-[#252923]">
                              {med > 0 ? (selectedMetric === 'mean_frp' ? med.toFixed(1) : Math.round(med).toLocaleString()) : '—'}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-bold text-[#252923]">
                          Baseline
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Cell Inspection Preview Strip */}
              {hoveredCell && hoveredCell.has_data && (
                <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded-md flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-serif font-bold text-sm text-[#252923]">
                      {MONTH_NAMES[hoveredCell.month - 1]} {hoveredCell.year}
                    </span>
                    <span className="text-[10px] font-mono text-[#777970] bg-white px-2 py-0.5 rounded border border-[#E1DED5]">
                      {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label}: <strong className="text-[#E65C35]">{hoveredCell.value.toLocaleString()}</strong>
                    </span>
                    <span className="text-[10px] font-mono text-[#777970]">
                      Historical Median: <strong>{hoveredCell.historical_median.toLocaleString()}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-mono">
                    <span className="text-[#C27B26]">MODIS: {hoveredCell.modis_observations.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-[#318C9B]">VIIRS: {hoveredCell.viirs_observations.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-[#54785E]">Co-Detected: {hoveredCell.cross_sensor_co_detections.toLocaleString()}</span>
                    {hoveredCell.is_anomaly && (
                      <span className="px-2 py-0.5 rounded bg-[#BD493C] text-white font-bold text-[10px]">
                        Anomaly (+{hoveredCell.anomaly_delta.toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scientific Harmonization Principle Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
                <div className="flex items-center space-x-2 text-[#E65C35] mb-1">
                  <Grid className="w-4 h-4" />
                  <span className="font-serif font-semibold text-xs text-[#252923]">EPSG:6933 1km Equal-Area</span>
                </div>
                <p className="text-[11px] text-[#777970] leading-relaxed">
                  Raw pixel counts differ by satellite footprint (MODIS 1km vs VIIRS 375m). All monthly counts above are harmonized into standardized 1km² analytical cell-days to ensure scientific comparability.
                </p>
              </div>

              <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
                <div className="flex items-center space-x-2 text-[#318C9B] mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-serif font-semibold text-xs text-[#252923]">Calendar Baseline Anomaly</span>
                </div>
                <p className="text-[11px] text-[#777970] leading-relaxed">
                  Fire seasonality is naturally periodic. Each month is evaluated against historical medians of that same calendar month rather than annual averages, eliminating seasonal bias.
                </p>
              </div>

              <div className="bg-white border border-[#E1DED5] p-4 rounded-lg shadow-card">
                <div className="flex items-center space-x-2 text-[#54785E] mb-1">
                  <Layers className="w-4 h-4" />
                  <span className="font-serif font-semibold text-xs text-[#252923]">Sensor Transition Provenance</span>
                </div>
                <p className="text-[11px] text-[#777970] leading-relaxed">
                  Observations preserve full instrument origin: MODIS Terra (2000+), Aqua (2002+), VIIRS S-NPP (2012–2026), NOAA-20 (2018+), and NOAA-21 (2023+).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: MONTHLY DAY-BY-DAY CALENDAR */}
        {viewMode === 'month' && (
          <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-lg text-[#252923]">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear} (Daily Breakdown)
              </h3>
              <span className="text-xs text-[#777970] font-mono">
                Metric: {METRIC_OPTIONS.find(m => m.id === selectedMetric)?.label}
              </span>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-mono uppercase text-[#777970] font-semibold">
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
                        <span className="w-1.5 h-1.5 rounded-full bg-[#54785E]" title="Cross-sensor co-detection present"></span>
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
            <div className="mt-6 pt-4 border-t border-[#E1DED5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#777970]">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-medium text-[#252923]">Activity Quantile:</span>
                <div className="flex items-center space-x-1.5">
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-white border border-[#E1DED5]"></span>
                    <span className="text-[10px]">None</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#FCECE7] border border-[#E1DED5]"></span>
                    <span className="text-[10px]">Q1</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#F7D6CB] border border-[#E1DED5]"></span>
                    <span className="text-[10px]">Q2</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#F29E85] border border-[#E1DED5]"></span>
                    <span className="text-[10px]">Q3</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#E65C35]"></span>
                    <span className="text-[10px]">Q4</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded bg-[#BD493C]"></span>
                    <span className="text-[10px]">High</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#54785E]"></span>
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
          <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-[#E65C35]" />
                <h3 className="font-serif font-semibold text-lg text-[#252923]">
                  Granular Activity Inspection: {selectedDay} (UTC)
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded text-[#777970] hover:text-[#252923] hover:bg-[#FAF8F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDay ? (
              <div className="py-12 text-center text-xs text-[#777970] animate-pulse">
                Loading observations and analytical grid cells...
              </div>
            ) : dayDetails && dayDetails.summary ? (
              <div className="space-y-6">
                {/* Day KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono text-[#777970] uppercase">Active 1km Cells</div>
                    <div className="text-xl font-serif font-bold text-[#252923] mt-0.5">
                      {dayDetails.summary.active_grid_cells.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono text-[#C27B26] uppercase">MODIS Observations</div>
                    <div className="text-xl font-serif font-bold text-[#C27B26] mt-0.5">
                      {dayDetails.summary.total_modis_observations.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono text-[#318C9B] uppercase">VIIRS Observations</div>
                    <div className="text-xl font-serif font-bold text-[#318C9B] mt-0.5">
                      {dayDetails.summary.total_viirs_observations.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono text-[#54785E] uppercase">Co-Detected Cells</div>
                    <div className="text-xl font-serif font-bold text-[#54785E] mt-0.5">
                      {dayDetails.summary.cross_sensor_co_detected_cells.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Granular grid cells list */}
                {dayDetails.grid_cells && dayDetails.grid_cells.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-semibold text-[#252923] mb-2">
                      Active Equal-Area 1km Cells on this Date ({dayDetails.grid_cells.length} cells)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                      {dayDetails.grid_cells.map((cell: any) => (
                        <div key={cell.grid_cell_id} className="p-2.5 bg-[#FAF8F3] border border-[#E1DED5] rounded text-xs">
                          <div className="font-mono text-[10px] text-[#777970] truncate">{cell.grid_cell_id}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-semibold text-[#252923]">{cell.sensors_present}</span>
                            <span className="font-mono text-[#E65C35]">{cell.total_detections} det.</span>
                          </div>
                          {cell.mean_frp_mw !== null && cell.mean_frp_mw !== undefined && (
                            <div className="text-[10px] text-[#777970] mt-0.5">Mean FRP: {Number(cell.mean_frp_mw).toFixed(1)} MW</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#777970] italic">No active cells recorded for this specific date.</p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#777970]">
                No satellite observations were detected on {selectedDay} in this Area of Interest.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
