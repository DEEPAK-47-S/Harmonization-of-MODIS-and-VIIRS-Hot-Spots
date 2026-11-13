import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  Plus, 
  X, 
  Globe2, 
  Flame, 
  Layers, 
  Activity, 
  Info,
  Check,
  TrendingUp
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
import { CountryItem } from '../types';

const POPULAR_COUNTRIES = ['IND', 'USA', 'BRA', 'AUS', 'IDN', 'CAN', 'RUS', 'ESP'];

export const CountryComparisonPage: React.FC = () => {
  const [availableCountries, setAvailableCountries] = useState<CountryItem[]>([]);
  const [selectedIsoList, setSelectedIsoList] = useState<string[]>(['IND', 'BRA', 'USA']);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedIsoList.length > 0) {
      loadComparison(selectedIsoList);
    }
  }, [selectedIsoList]);

  const loadCountries = async () => {
    try {
      const data = await FirePulseAPI.getCountries();
      setAvailableCountries(data);
    } catch (err) {
      console.error('Failed to load countries:', err);
    }
  };

  const loadComparison = async (isoList: string[]) => {
    setLoading(true);
    try {
      const data = await FirePulseAPI.getCountryComparison(isoList);
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to load country comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCountry = (iso3: string) => {
    if (selectedIsoList.includes(iso3)) {
      if (selectedIsoList.length > 1) {
        setSelectedIsoList(selectedIsoList.filter(c => c !== iso3));
      }
    } else {
      if (selectedIsoList.length < 5) {
        setSelectedIsoList([...selectedIsoList, iso3]);
      }
    }
  };

  const countriesData = comparisonData?.countries || [];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1E9] overflow-y-auto">
      <Header 
        title="Cross-Country Sensor Comparison" 
        subtitle="Benchmarking multi-sensor detection ratios and fire radiative power across sovereign territories" 
      />

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* PAGE INTRO */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E1DED5] pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[#777970] uppercase">
              Comparative Geography / Sensor Ratios
            </span>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-[#252923] tracking-tight">
              Compare sovereign fire dynamics.
            </h1>
            <p className="text-xs md:text-sm text-[#777970] font-sans max-w-2xl">
              Benchmark up to 5 countries side-by-side. Different vegetation structures, fuel loads, and burn types 
              (e.g. crop clearing vs crown forest fires) generate drastically different VIIRS-to-MODIS detection ratios.
            </p>
          </div>

          <div className="text-xs font-mono text-[#777970]">
            Comparing <span className="font-bold text-[#E65C35]">{selectedIsoList.length}</span> / 5 nations
          </div>
        </div>

        {/* COUNTRY SELECTOR PILLS */}
        <div className="bg-white border border-[#E1DED5] rounded-xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-semibold text-[#252923]">Choose Nations to Compare</span>
            <span className="text-[10px] font-mono text-[#777970]">Select between 2 and 5 countries</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableCountries.map((c) => {
              const isSelected = selectedIsoList.includes(c.iso3);
              return (
                <button
                  key={c.iso3}
                  onClick={() => handleToggleCountry(c.iso3)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'border-[#E65C35] bg-[#FCECE7] text-[#E65C35] font-semibold'
                      : 'border-[#E1DED5] bg-[#FAF8F3] text-[#777970] hover:text-[#252923] hover:border-[#CEC9BD]'
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-[10px] font-mono opacity-70">({c.iso3})</span>
                  {isSelected && <Check className="w-3 h-3 text-[#E65C35]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDE-BY-SIDE COUNTRY COMPARISON CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {countriesData.map((country: any) => (
            <div 
              key={country.iso3}
              className="bg-white border border-[#E1DED5] rounded-xl p-4 shadow-card flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between border-b border-[#E1DED5] pb-2 mb-2">
                  <h3 className="font-serif font-bold text-sm text-[#252923] truncate">{country.name}</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#FAF8F3] border rounded font-semibold text-[#777970]">
                    {country.iso3}
                  </span>
                </div>
                <div className="text-[10px] text-[#777970] font-mono capitalize mb-3">
                  Continent: {country.continent}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-[#FAF8F3] p-2 rounded">
                    <span className="text-[#777970]">Observations</span>
                    <span className="font-mono font-bold text-[#252923]">{(country.total_observations || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#FAF8F3] p-2 rounded">
                    <span className="text-[#C27B26]">MODIS (1km)</span>
                    <span className="font-mono font-bold text-[#C27B26]">{(country.modis_observations || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#FAF8F3] p-2 rounded">
                    <span className="text-[#318C9B]">VIIRS (375m)</span>
                    <span className="font-mono font-bold text-[#318C9B]">{country.viirs_observations.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center bg-[#FAF8F3] p-2 rounded">
                    <span className="text-[#E65C35]">VIIRS / MODIS Ratio</span>
                    <span className="font-mono font-bold text-[#E65C35]">
                      {country.detection_ratio && country.detection_ratio > 0 ? `${Number(country.detection_ratio).toFixed(2)}x` : '—'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-[#FAF8F3] p-2 rounded">
                    <span className="text-[#777970]">Mean FRP</span>
                    <span className="font-mono font-bold text-[#252923]">{country.mean_frp != null ? Number(country.mean_frp).toFixed(1) : '0.0'} MW</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E1DED5] text-[10px] text-[#777970] flex justify-between">
                <span>Active 1km Cells:</span>
                <span className="font-bold text-[#252923]">{country.active_cells || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {/* COMPARATIVE CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Sensor Detection Count Breakdown */}
          <div className="bg-white border border-[#E1DED5] rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#252923]">Hotspot Detections by Sensor</h3>
                <p className="text-[11px] text-[#777970]">Comparing MODIS vs VIIRS satellite observations</p>
              </div>
              <GitCompare className="w-4 h-4 text-[#E65C35]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#777970' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#777970' }} />
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
                  <Bar dataKey="modis_observations" name="MODIS (1km)" fill="#C27B26" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="viirs_observations" name="VIIRS (375m)" fill="#318C9B" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Mean Fire Radiative Power (MW) */}
          <div className="bg-white border border-[#E1DED5] rounded-xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#E1DED5] pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#252923]">Mean Fire Radiative Power (MW)</h3>
                <p className="text-[11px] text-[#777970]">Thermal energy release rate comparison per active point</p>
              </div>
              <Activity className="w-4 h-4 text-[#BD493C]" />
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#777970' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#777970' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E1DED5', 
                      borderRadius: '6px', 
                      fontSize: '11px',
                      color: '#252923' 
                    }} 
                  />
                  <Bar dataKey="mean_frp" name="Mean FRP (MW)" fill="#E65C35" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* SCIENTIFIC COMPARISON NOTES */}
        <div className="bg-white border border-[#E1DED5] rounded-xl p-5 shadow-card space-y-3">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-[#E65C35]" />
            <h4 className="font-serif font-semibold text-sm text-[#252923]">Why Detection Ratios Differ Across Countries</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#777970] pt-2 border-t border-[#E1DED5]">
            <div>
              <span className="font-semibold text-[#252923] block mb-1">Small-Fire Detection Advantage</span>
              In agricultural regions (e.g. crop residue burning in India or smallholder clearings in Indonesia), 
              the high 375m spatial resolution of VIIRS detects small fires that fall below MODIS's 1000m detection threshold.
            </div>
            <div>
              <span className="font-semibold text-[#252923] block mb-1">Dense Boreal Canopy Attenuation</span>
              In dense Canadian or Russian boreal forest canopies, thick smoke plumes and heavy canopy can obscure thermal 
              signatures, altering the relative detection efficiency between sensors.
            </div>
            <div>
              <span className="font-semibold text-[#252923] block mb-1">Intense Mega-Fire Convergence</span>
              In massive high-intensity wildfires (e.g. Australian bushfires or Western US crown fires), both MODIS and VIIRS 
              readily co-detect the active fire perimeter, resulting in high co-detection rates.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
