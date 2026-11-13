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
  Info
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { CalendarResponse, CalendarDayItem } from '../types';

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

export const CalendarPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedMetric, setSelectedMetric] = useState<string>('active_grid_cells');
  
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Selected day detail modal / slideover
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayDetails, setDayDetails] = useState<any | null>(null);
  const [loadingDay, setLoadingDay] = useState<boolean>(false);

  useEffect(() => {
    fetchCalendar();
  }, [aoi, refreshKey, selectedYear, selectedMonth, selectedMetric]);

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

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Burning Activity Calendar" 
        subtitle="Spatially harmonized daily calendar based on EPSG:6933 1km analytical cells"
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Temporal Aggregation / Calendar
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              The Burning Activity Calendar
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              A consistent view of observed activity across sensors. Heatmap colors represent dynamic relative quantiles across the selected region.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
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
              <span>Export Monthly CSV</span>
            </a>
          </div>
        </div>

        {/* Navigation & Metric Selector Strip */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
          {/* Month & Year Controls */}
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
          </div>

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

        {/* CALENDAR HEATMAP MATRIX */}
        <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold text-lg text-[#252923]">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
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

            <div className="flex items-center space-x-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#54785E]"></span>
              <span>Green dot indicates MODIS + VIIRS co-detection</span>
            </div>
          </div>
        </div>

        {/* SELECTED DAY DETAIL PANEL (When a day is clicked) */}
        {selectedDay && (
          <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-[#E1DED5] pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777970]">Granular Inspection</span>
                <h3 className="font-serif font-bold text-xl text-[#252923] mt-0.5">
                  Activity on {selectedDay} (UTC)
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-[#777970] hover:text-[#252923] p-1 rounded hover:bg-[#FAF8F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDay ? (
              <div className="py-8 text-center text-xs text-[#777970] animate-pulse">
                Loading daily analytical breakdown...
              </div>
            ) : dayDetails && dayDetails.summary ? (
              <div className="space-y-4">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded">
                    <span className="text-[10px] font-mono uppercase text-[#777970]">Active 1km Cells</span>
                    <div className="text-xl font-bold font-serif text-[#252923] mt-0.5">
                      {dayDetails.summary.active_grid_cells_count}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded">
                    <span className="text-[10px] font-mono uppercase text-[#C27B26]">MODIS Detections</span>
                    <div className="text-xl font-bold font-serif text-[#252923] mt-0.5">
                      {dayDetails.summary.modis_observations_count}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded">
                    <span className="text-[10px] font-mono uppercase text-[#318C9B]">VIIRS Detections</span>
                    <div className="text-xl font-bold font-serif text-[#252923] mt-0.5">
                      {dayDetails.summary.viirs_observations_count}
                    </div>
                  </div>
                  <div className="p-3 bg-[#FAF8F3] border border-[#E1DED5] rounded">
                    <span className="text-[10px] font-mono uppercase text-[#54785E]">Co-Detected Cells</span>
                    <div className="text-xl font-bold font-serif text-[#252923] mt-0.5">
                      {dayDetails.summary.cross_sensor_co_detected_count}
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
                          {cell.mean_frp_mw && (
                            <div className="text-[10px] text-[#777970] mt-0.5">Mean FRP: {cell.mean_frp_mw.toFixed(1)} MW</div>
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
