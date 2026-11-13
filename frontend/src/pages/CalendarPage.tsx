import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Flame, 
  Grid, 
  Clock, 
  Info,
  CheckCircle2,
  X,
  Satellite,
  Download
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { CalendarResponse, CalendarDayItem } from '../types';

const METRIC_OPTIONS = [
  { id: 'active_grid_cells', label: 'Active 1km Grid Cells', desc: 'Distinct 1km cells with satellite detections' },
  { id: 'modis_observations', label: 'MODIS Observations', desc: 'Raw detections from Terra & Aqua' },
  { id: 'viirs_observations', label: 'VIIRS Observations', desc: 'Raw detections from NOAA-20 & NOAA-21' },
  { id: 'cross_sensor_co_detections', label: 'Co-Detected Cell-Days', desc: 'Cells observed by both MODIS and VIIRS on same UTC day' },
  { id: 'mean_frp', label: 'Mean Fire Radiative Power (MW)', desc: 'Average thermal energy emitted' },
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

  // Get color for activity level
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-amber-950/60 border-amber-800/80 text-amber-300';
      case 2: return 'bg-amber-700/60 border-amber-600 text-white';
      case 3: return 'bg-orange-600 border-orange-500 text-white';
      case 4: return 'bg-orange-700 border-orange-600 text-white font-bold shadow-sm shadow-orange-700/40';
      case 5: return 'bg-red-700 border-red-500 text-white font-extrabold shadow-md shadow-red-700/50';
      default: return 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Burning Activity Calendar" 
        subtitle="Harmonized daily thermal activity calendar based on spatial 1km grid cells"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Controls: Month/Year navigation & Metric selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          {/* Month & Year Navigator */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center px-3">
              <h2 className="text-lg font-black text-white tracking-tight">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Timezone: UTC
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Export Monthly Grid Data */}
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
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-semibold"
              title="Download Monthly Harmonized Grid CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </a>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedMetric(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedMetric === opt.id
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Heatmap Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Daily Heatmap Distribution</h3>
              <p className="text-xs text-slate-400">
                Colors are scaled dynamically using empirical quantiles within the selected period (not arbitrary fixed values)
              </p>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-[11px]">Activity:</span>
              <span className="w-4 h-4 rounded bg-slate-900/60 border border-slate-800 text-[10px] flex items-center justify-center text-slate-500">0</span>
              <span className="w-4 h-4 rounded bg-amber-950/60 border border-amber-800 text-[10px] flex items-center justify-center text-amber-300">1</span>
              <span className="w-4 h-4 rounded bg-amber-700/60 border border-amber-600 text-[10px] flex items-center justify-center text-white">2</span>
              <span className="w-4 h-4 rounded bg-orange-600 border border-orange-500 text-[10px] flex items-center justify-center text-white">3</span>
              <span className="w-4 h-4 rounded bg-orange-700 border border-orange-600 text-[10px] flex items-center justify-center text-white">4</span>
              <span className="w-4 h-4 rounded bg-red-700 border border-red-500 text-[10px] flex items-center justify-center text-white font-bold">5</span>
              <span className="text-slate-400 ml-1 text-[11px]">Intense</span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
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
            {/* Empty offset cells before 1st day of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-24 rounded-xl border border-transparent bg-transparent opacity-0 pointer-events-none" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayData = dayMap.get(dateStr);
              const activityLevel = dayData ? dayData.activity_level : 0;
              const metricVal = dayData ? dayData.metric_value : 0;
              const isSelected = selectedDay === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-24 p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 group relative ${getLevelColor(activityLevel)} ${
                    isSelected ? 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950 scale-[1.02]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-bold font-mono">{dayNum}</span>
                    {dayData && dayData.cross_sensor_co_detections > 0 && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-purple-900/60 text-purple-300 font-bold border border-purple-700/60" title="Cross-sensor co-detected cells present">
                        Co-Det
                      </span>
                    )}
                  </div>

                  {dayData ? (
                    <div className="space-y-0.5">
                      <div className="text-base font-extrabold leading-tight">
                        {metricVal}
                      </div>
                      <div className="text-[10px] opacity-80 truncate flex items-center justify-between">
                        <span>M: {dayData.modis_observations}</span>
                        <span>V: {dayData.viirs_observations}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] opacity-40">No activity</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Granular Detail Panel */}
        {selectedDay && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-800 pb-3">
              <CalendarIcon className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Observation Details for {selectedDay} (UTC)
                </h3>
                <p className="text-xs text-slate-400">
                  Granular spatial breakdown of harmonized grid cells and sensor passes
                </p>
              </div>
            </div>

            {loadingDay ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading observations...
              </div>
            ) : dayDetails ? (
              <div className="space-y-6">
                {/* Day Summary KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Active 1km Cells</span>
                    <span className="text-xl font-bold text-white">{dayDetails.summary.active_grid_cells}</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-amber-400 block mb-1">MODIS Detections</span>
                    <span className="text-xl font-bold text-amber-400">{dayDetails.summary.total_modis_observations}</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-cyan-400 block mb-1">VIIRS Detections</span>
                    <span className="text-xl font-bold text-cyan-400">{dayDetails.summary.total_viirs_observations}</span>
                  </div>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-purple-400 block mb-1">Co-Detected Cells</span>
                    <span className="text-xl font-bold text-purple-400">{dayDetails.summary.cross_sensor_co_detected_cells}</span>
                  </div>
                </div>

                {/* Grid Cells List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Active 1km Grid Cells ({dayDetails.grid_cells.length})
                  </h4>
                  {dayDetails.grid_cells.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {dayDetails.grid_cells.map((cell: any) => (
                        <div 
                          key={cell.grid_cell_id}
                          className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-white">{cell.grid_cell_id}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                cell.cross_sensor_presence ? 'bg-purple-900/60 text-purple-300' : 'bg-slate-800 text-slate-300'
                              }`}>
                                {cell.sensors_present}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Centroid: {cell.cell_center_lat}°N, {cell.cell_center_lon}°E
                            </p>
                          </div>

                          <div className="text-right space-y-0.5">
                            <span className="text-slate-300">
                              MODIS: <strong className="text-amber-400">{cell.modis_detection_count}</strong> | VIIRS: <strong className="text-cyan-400">{cell.viirs_detection_count}</strong>
                            </span>
                            {cell.modis_frp_mean !== null && (
                              <p className="text-[11px] text-slate-400">MODIS FRP: {cell.modis_frp_mean} MW</p>
                            )}
                            {cell.viirs_frp_mean !== null && (
                              <p className="text-[11px] text-slate-400">VIIRS FRP: {cell.viirs_frp_mean} MW</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-3">No active cells recorded on this date.</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
};

