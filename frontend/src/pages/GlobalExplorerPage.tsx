import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  MapPin, 
  Search, 
  Flame, 
  Layers, 
  BarChart3, 
  ArrowUpRight, 
  Check, 
  CheckCircle2,
  Info,
  Calendar,
  Activity,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Header } from '../components/Header';
import { FirePulseAPI } from '../services/api';
import { useAOI } from '../context/AOIContext';
import { useToast } from '../context/ToastContext';
import { 
  GlobalSummary, 
  CountryItem, 
  ContinentItem, 
  CountryAnalytics, 
  formatCoord, 
  AOIBounds 
} from '../types';

export const GlobalExplorerPage: React.FC = () => {
  const { setAOI, triggerRefresh } = useAOI();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [globalSummary, setGlobalSummary] = useState<GlobalSummary | null>(null);
  const [continents, setContinents] = useState<ContinentItem[]>([]);
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Country for drilldown
  const [selectedIso3, setSelectedIso3] = useState<string>('IND');
  const [countryAnalytics, setCountryAnalytics] = useState<CountryAnalytics | null>(null);
  const [loadingCountry, setLoadingCountry] = useState(false);

  useEffect(() => {
    loadGlobalData();
  }, []);

  useEffect(() => {
    if (selectedIso3) {
      loadCountryData(selectedIso3);
    }
  }, [selectedIso3]);

  const loadGlobalData = async () => {
    setLoading(true);
    try {
      const [sum, contList, countList] = await Promise.all([
        FirePulseAPI.getGlobalSummary(7).catch(() => null),
        FirePulseAPI.getContinents().catch(() => []),
        FirePulseAPI.getCountries().catch(() => [])
      ]);
      setGlobalSummary(sum);
      setContinents(contList);
      setCountries(countList);
    } catch (err) {
      console.error('Error loading global data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCountryData = async (iso3: string) => {
    setLoadingCountry(true);
    try {
      const data = await FirePulseAPI.getCountryAnalytics(iso3);
      setCountryAnalytics(data);
    } catch (err) {
      console.error(`Error loading country analytics for ${iso3}:`, err);
    } finally {
      setLoadingCountry(false);
    }
  };

  const extractBounds = (b: any): { west: number; south: number; east: number; north: number } => {
    if (Array.isArray(b)) {
      return { west: b[0], south: b[1], east: b[2], north: b[3] };
    }
    if (b && typeof b === 'object') {
      return {
        west: b.west ?? -180,
        south: b.south ?? -90,
        east: b.east ?? 180,
        north: b.north ?? 90
      };
    }
    return { west: -180, south: -90, east: 180, north: 90 };
  };

  const handleSetAOIToCountry = (c: CountryItem | CountryAnalytics['country']) => {
    const b = extractBounds(c.bounds);
    const newAoi: AOIBounds = {
      name: `${c.name} (${c.iso3})`,
      west: b.west,
      south: b.south,
      east: b.east,
      north: b.north
    };
    setAOI(newAoi);
    triggerRefresh();
    showToast('success', 'AOI Scope Updated', `Monitoring focused on ${c.name}`);
  };

  const filteredCountries = countries.filter(c => {
    const matchesContinent = selectedContinent === 'all' || c.continent.toLowerCase() === selectedContinent.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.iso3.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesContinent && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Global Fire Explorer" 
        subtitle="Worldwide country and continental active fire analytics" 
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* PAGE INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-[11px] font-semibold tracking-wide uppercase">
              Global Scale • Continental &amp; Country Breakdown
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Earth at a glance.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
              Cross-sensor active fire detections across all seven continents and 30+ monitored countries.
              Select any nation to inspect granular 1km grid harmonizations and sensor attribution.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setAOI({ name: 'Entire World', west: -180, south: -90, east: 180, north: 90 });
                triggerRefresh();
                showToast('info', 'Global Scope', 'Application reset to Worldwide coverage');
              }}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Globe2 className="w-4 h-4 text-orange-500" />
              <span>Set Global Scope</span>
            </button>
          </div>
        </div>

        {/* WORLDWIDE KPI STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Active Countries</span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                <Globe2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : (globalSummary?.kpi?.active_countries_count ?? countries.length)}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">Monitored Sovereign Borders</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Territories with recorded satellite fire hot spots in database.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 font-semibold">Global MODIS</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((globalSummary?.kpi?.modis_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">Terra &amp; Aqua Hotspots</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              1 km nadir resolution thermal detections globally.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-600 font-semibold">Global VIIRS</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((globalSummary?.kpi?.viirs_observations ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">NOAA-20/21 &amp; S-NPP Hotspots</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              375 m I-band detections capturing finer active flame fronts.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 font-semibold">Harmonized Grid Cells</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '—' : ((globalSummary?.kpi?.active_grid_cells ?? 0).toLocaleString())}
            </div>
            <div className="text-[11px] text-slate-600 font-medium mt-1">1 km Cylindrical Equal-Area</div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
              Standardized spatial binning preventing double-counting.
            </p>
          </div>
        </div>

        {/* CONTINENT SELECTOR PILLS */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Continental Filter</span>
            <span className="text-[11px] font-mono text-slate-400">{filteredCountries.length} countries matching</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedContinent('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedContinent === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              All Continents
            </button>
            {continents.map((cont) => {
              const cKey = cont.key || cont.id || cont.name;
              return (
                <button
                  key={cKey}
                  onClick={() => setSelectedContinent(cKey)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedContinent.toLowerCase() === cKey.toLowerCase()
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {cont.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* TWO-COLUMN EXPLORER: COUNTRY LIST (LEFT) & COUNTRY INSPECTOR (RIGHT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: COUNTRY LIST */}
          <div className="lg:col-span-4 bg-white border border-[#E1DED5] rounded-lg p-4 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <h3 className="font-serif font-semibold text-sm text-[#252923]">Country Directory</h3>
              <span className="text-[10px] font-mono text-[#777970] uppercase">Select to Inspect</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#777970]" />
              <input
                type="text"
                placeholder="Search by country or ISO code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#E1DED5] rounded text-[#252923] placeholder-[#A0A29A] focus:outline-none focus:border-[#E65C35]"
              />
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredCountries.map((c) => {
                const isSelected = selectedIso3 === c.iso3;
                return (
                  <button
                    key={c.iso3}
                    onClick={() => setSelectedIso3(c.iso3)}
                    className={`w-full text-left p-2.5 rounded-md text-xs border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-[#E65C35] bg-[#FCECE7] text-[#252923]'
                        : 'border-[#E1DED5] bg-white hover:bg-[#FAF8F3] text-[#252923]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs flex items-center space-x-1.5">
                        <span>{c.name}</span>
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-[#EBE8DF] rounded text-[#777970]">{c.iso3}</span>
                      </div>
                      <div className="text-[10px] text-[#777970] font-mono capitalize">
                        {c.continent} • {formatCoord(c.center_lat || 0, true)}, {formatCoord(c.center_lon || 0, false)}
                      </div>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#E65C35]' : 'text-[#A0A29A]'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: DETAILED COUNTRY INSPECTOR */}
          <div className="lg:col-span-8 space-y-6">
            {countryAnalytics ? (
              <div className="bg-white border border-[#E1DED5] rounded-lg p-6 shadow-card space-y-6">
                
                {/* Country Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E1DED5] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-serif font-bold text-[#252923]">
                        {countryAnalytics.country.name}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#FAF8F3] border border-[#E1DED5] font-semibold text-[#252923]">
                        {countryAnalytics.country.iso3}
                      </span>
                    </div>
                    <p className="text-xs text-[#777970] font-mono mt-0.5">
                      Continent: <span className="capitalize">{countryAnalytics.country.continent}</span> • 
                      Center: {formatCoord(countryAnalytics.country.center_lat || 0, true)}, {formatCoord(countryAnalytics.country.center_lon || 0, false)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSetAOIToCountry(countryAnalytics.country)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E65C35] hover:bg-[#D44F29] text-white text-xs font-semibold rounded-md shadow-sm transition-colors shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Focus Dashboard on {countryAnalytics.country.name}</span>
                  </button>
                </div>

                {/* Country KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono uppercase text-[#777970]">Total Observations</div>
                    <div className="text-lg font-serif font-bold text-[#252923] mt-0.5">
                      {(countryAnalytics.kpi?.total_observations ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#777970]">Active hot spots</div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono uppercase text-[#C27B26]">MODIS (1km)</div>
                    <div className="text-lg font-serif font-bold text-[#C27B26] mt-0.5">
                      {(countryAnalytics.kpi?.modis_observations ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#777970]">Terra + Aqua</div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono uppercase text-[#318C9B]">VIIRS (375m)</div>
                    <div className="text-lg font-serif font-bold text-[#318C9B] mt-0.5">
                      {(countryAnalytics.kpi?.viirs_observations ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#777970]">NOAA-20/21</div>
                  </div>

                  <div className="bg-[#FAF8F3] p-3 rounded-md border border-[#E1DED5]">
                    <div className="text-[10px] font-mono uppercase text-[#54785E]">Co-Detected Cells</div>
                    <div className="text-lg font-serif font-bold text-[#54785E] mt-0.5">
                      {(countryAnalytics.kpi?.co_detected_cells ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#777970]">Dual confirmation</div>
                  </div>
                </div>

                {/* Fire Radiative Power (MW) Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF8F3] p-3.5 rounded-md border border-[#E1DED5]">
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-[#E65C35]" />
                    <div>
                      <div className="text-xs font-semibold text-[#252923]">Mean Fire Radiative Power</div>
                      <div className="text-sm font-serif font-bold text-[#E65C35]">
                        {(countryAnalytics.kpi?.mean_frp_mw || 0).toFixed(1)} MW
                      </div>
                      <div className="text-[10px] text-[#777970]">Average intensity per detection</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Flame className="w-5 h-5 text-[#BD493C]" />
                    <div>
                      <div className="text-xs font-semibold text-[#252923]">Peak Radiative Power (Max)</div>
                      <div className="text-sm font-serif font-bold text-[#BD493C]">
                        {(countryAnalytics.kpi?.max_frp_mw || 0).toFixed(1)} MW
                      </div>
                      <div className="text-[10px] text-[#777970]">Highest energetic event recorded</div>
                    </div>
                  </div>
                </div>

                {/* 14-Day Timeline Bar Chart */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-serif font-semibold text-[#252923]">
                      14-Day Daily Hot Spot Timeline ({countryAnalytics.country.name})
                    </h4>
                    <span className="text-[10px] font-mono text-[#777970]">MODIS vs VIIRS</span>
                  </div>

                  <div className="h-56 w-full">
                    {countryAnalytics.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={countryAnalytics.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: '#777970' }} 
                            tickFormatter={(v) => v.slice(5)}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#777970' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#FFFFFF', 
                              borderColor: '#E1DED5', 
                              borderRadius: '6px', 
                              fontSize: '11px',
                              color: '#252923' 
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                          <Bar dataKey="modis_count" name="MODIS (1km)" fill="#C27B26" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="viirs_count" name="VIIRS (375m)" fill="#318C9B" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="active_grid_cells" name="1km Active Cells" fill="#E65C35" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-[#777970] bg-[#FAF8F3] rounded border border-dashed border-[#E1DED5]">
                        No timeline data recorded for this country in the current database.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sensor Resolution Note */}
                <div className="p-3 bg-[#FAF8F3] rounded-md border border-[#E1DED5] flex items-start space-x-2.5 text-[11px] text-[#777970]">
                  <Info className="w-4 h-4 text-[#777970] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#252923]">Sensor Harmonization Principle: </span>
                    VIIRS typically detects 3x to 5x more hot spots than MODIS due to its 375m footprint.
                    In FirePulse, both streams are aggregated into 1km equal-area cells to ensure consistent historical comparability.
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-[#E1DED5] rounded-lg p-12 text-center text-xs text-[#777970]">
                {loadingCountry ? 'Loading country data...' : 'Select a country on the left to inspect its active fire metrics.'}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
