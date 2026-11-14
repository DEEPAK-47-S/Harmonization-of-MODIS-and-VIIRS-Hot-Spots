import React, { useState, useEffect } from 'react';
import { X, Globe2, Search, Check, SlidersHorizontal, MapPin } from 'lucide-react';
import { useAOI, AOI_PRESETS } from '../context/AOIContext';
import { AOIBounds, formatAOIBounds, CountryItem } from '../types';
import { FirePulseAPI } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const REGIONAL_PRESETS: AOIBounds[] = [
  {
    name: 'Tamil Nadu, India',
    west: 76.2,
    south: 8.0,
    east: 80.4,
    north: 13.6
  },
  {
    name: 'California, USA',
    west: -124.4,
    south: 32.5,
    east: -114.1,
    north: 42.0
  },
  {
    name: 'Amazon Basin, Brazil',
    west: -70.0,
    south: -15.0,
    east: -50.0,
    north: 2.0
  },
  {
    name: 'Mediterranean Basin',
    west: -10.0,
    south: 35.0,
    east: 36.0,
    north: 44.0
  }
];

export const AOISelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { aoi, setAOI, triggerRefresh } = useAOI();
  const [activeTab, setActiveTab] = useState<'continents' | 'countries' | 'presets' | 'custom'>('continents');
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);

  const [customBounds, setCustomBounds] = useState<AOIBounds>({
    name: 'Custom Bounding Box',
    west: aoi.west,
    south: aoi.south,
    east: aoi.east,
    north: aoi.north
  });

  useEffect(() => {
    if (isOpen && activeTab === 'countries' && countries.length === 0) {
      setLoadingCountries(true);
      FirePulseAPI.getCountries()
        .then((data) => {
          setCountries(data);
          setLoadingCountries(false);
        })
        .catch(() => {
          setLoadingCountries(false);
        });
    }
  }, [isOpen, activeTab, countries.length]);

  if (!isOpen) return null;

  const handleApply = (newAoi: AOIBounds) => {
    setAOI(newAoi);
    triggerRefresh();
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    handleApply(customBounds);
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

  const continentPresets = AOI_PRESETS.filter(p => !p.name?.includes('Tamil Nadu') && !p.name?.includes('California'));

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.iso3.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.continent.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#252923]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E1DED5] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in duration-150 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E1DED5] bg-[#FAF8F3]">
          <div className="flex items-center space-x-2.5">
            <Globe2 className="w-5 h-5 text-[#E65C35]" />
            <div>
              <h3 className="font-serif font-bold text-lg text-[#252923]">Target Area of Interest</h3>
              <p className="text-xs text-[#777970]">Switch monitoring scope from Entire World to any continent, country, or custom bbox.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-[#777970] hover:text-[#252923] hover:bg-[#EBE8DF] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E1DED5] bg-white px-6">
          <button
            onClick={() => setActiveTab('continents')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'continents'
                ? 'border-[#E65C35] text-[#E65C35]'
                : 'border-transparent text-[#777970] hover:text-[#252923]'
            }`}
          >
            Global & Continents
          </button>
          <button
            onClick={() => setActiveTab('countries')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'countries'
                ? 'border-[#E65C35] text-[#E65C35]'
                : 'border-transparent text-[#777970] hover:text-[#252923]'
            }`}
          >
            Countries ({countries.length > 0 ? countries.length : '30+'})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-[#E65C35] text-[#E65C35]'
                : 'border-transparent text-[#777970] hover:text-[#252923]'
            }`}
          >
            Regional Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-[#E65C35] text-[#E65C35]'
                : 'border-transparent text-[#777970] hover:text-[#252923]'
            }`}
          >
            Custom BBox
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Continents */}
          {activeTab === 'continents' && (
            <div className="grid grid-cols-2 gap-3">
              {continentPresets.map((p) => {
                const isSelected = aoi.name === p.name;
                const isWorld = p.name === 'Entire World';
                return (
                  <button
                    key={p.name}
                    onClick={() => handleApply(p)}
                    className={`p-3.5 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'border-[#E65C35] bg-[#FCECE7] shadow-sm'
                        : isWorld
                        ? 'border-[#252923] bg-[#FAF8F3] hover:border-[#E65C35]'
                        : 'border-[#E1DED5] bg-white hover:border-[#CEC9BD] hover:bg-[#FAF8F3]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${isSelected ? 'font-bold text-[#E65C35]' : 'font-semibold text-[#252923]'}`}>
                        {p.name} {isWorld && '(Default)'}
                      </span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#E65C35]" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5 text-[#A0A29A]" />
                      )}
                    </div>
                    <p className="text-[10px] text-[#777970] font-mono">
                      {formatAOIBounds(p)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: Countries */}
          {activeTab === 'countries' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#777970]" />
                <input
                  type="text"
                  placeholder="Search countries by name or ISO code (e.g. India, USA, Brazil, Spain)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-[#FAF8F3] border border-[#E1DED5] rounded-lg text-[#252923] placeholder-[#A0A29A] focus:outline-none focus:border-[#E65C35]"
                />
              </div>

              {loadingCountries ? (
                <div className="text-center py-10 text-xs text-[#777970]">
                  Loading country registries...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredCountries.map((c) => {
                    const b = extractBounds(c.bounds);
                    const countryAoi: AOIBounds = {
                      name: `${c.name} (${c.iso3})`,
                      west: b.west,
                      south: b.south,
                      east: b.east,
                      north: b.north
                    };
                    const isSelected = aoi.name === countryAoi.name;

                    return (
                      <button
                        key={c.iso3}
                        onClick={() => handleApply(countryAoi)}
                        className={`p-2.5 rounded-lg text-left border transition-all text-xs flex items-center justify-between ${
                          isSelected
                            ? 'border-[#E65C35] bg-[#FCECE7] text-[#252923]'
                            : 'border-[#E1DED5] bg-white hover:border-[#CEC9BD] text-[#252923]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium truncate">{c.name}</div>
                          <div className="text-[10px] text-[#777970] font-mono capitalize">{c.continent} • {c.iso3}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#E65C35] shrink-0" />}
                      </button>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-xs text-[#777970]">
                      No countries found matching "{searchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Regional Presets */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-3">
              {REGIONAL_PRESETS.map((p) => {
                const isSelected = aoi.name === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => handleApply(p)}
                    className={`p-3.5 rounded-lg text-left border transition-all ${
                      isSelected
                        ? 'border-[#E65C35] bg-[#FCECE7]'
                        : 'border-[#E1DED5] bg-white hover:border-[#CEC9BD]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#252923]">{p.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#E65C35]" />}
                    </div>
                    <p className="text-[10px] text-[#777970] font-mono">
                      {formatAOIBounds(p)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 4: Custom Coordinates */}
          {activeTab === 'custom' && (
            <form onSubmit={handleApplyCustom} className="space-y-4">
              <p className="text-xs text-[#777970]">
                Specify coordinates in standard WGS-84 decimal degrees ([-180 to 180] longitude, [-90 to 90] latitude).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#777970] mb-1">West Longitude</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="-180"
                    max="180"
                    value={customBounds.west}
                    onChange={(e) => setCustomBounds({ ...customBounds, west: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-3 py-1.5 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#777970] mb-1">East Longitude</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="-180"
                    max="180"
                    value={customBounds.east}
                    onChange={(e) => setCustomBounds({ ...customBounds, east: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-3 py-1.5 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#777970] mb-1">South Latitude</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="-90"
                    max="90"
                    value={customBounds.south}
                    onChange={(e) => setCustomBounds({ ...customBounds, south: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-3 py-1.5 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#777970] mb-1">North Latitude</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="-90"
                    max="90"
                    value={customBounds.north}
                    onChange={(e) => setCustomBounds({ ...customBounds, north: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#FAF8F3] border border-[#E1DED5] rounded px-3 py-1.5 text-xs text-[#252923] focus:outline-none focus:border-[#E65C35]"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#E65C35] hover:bg-[#D44F29] text-white transition-colors"
                >
                  Apply Custom Coordinates
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#FAF8F3] border-t border-[#E1DED5] flex items-center justify-between text-[11px] text-[#777970]">
          <div>
            Current active: <span className="font-semibold text-[#252923]">{aoi.name || 'Custom'}</span>
          </div>
          <button
            onClick={() => handleApply(continentPresets[0])}
            className="text-[#E65C35] hover:underline font-medium"
          >
            Reset to Entire World
          </button>
        </div>

      </div>
    </div>
  );
};
