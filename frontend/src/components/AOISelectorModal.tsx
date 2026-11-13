import React, { useState } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { useAOI, AOI_PRESETS } from '../context/AOIContext';
import { AOIBounds, formatAOIBounds } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AOISelectorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { aoi, setAOI, triggerRefresh } = useAOI();

  const [customBounds, setCustomBounds] = useState<AOIBounds>({
    name: 'Custom Bounding Box',
    west: aoi.west,
    south: aoi.south,
    east: aoi.east,
    north: aoi.north
  });

  if (!isOpen) return null;

  const handleApplyPreset = (preset: AOIBounds) => {
    setAOI(preset);
    triggerRefresh();
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setAOI(customBounds);
    triggerRefresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#252923]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E1DED5] rounded-lg w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between p-5 border-b border-[#E1DED5]">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-[#E65C35]" />
            <h3 className="font-serif font-semibold text-lg text-[#252923]">Select Area of Interest (AOI)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#777970] hover:text-[#252923] hover:bg-[#F4F1E9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Preset buttons */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#777970] mb-2.5 font-semibold">
              Pre-configured Regions
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AOI_PRESETS.map((p) => {
                const isSelected = aoi.name === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3 rounded-md text-left border transition-all ${
                      isSelected
                        ? 'border-[#E65C35] bg-[#FCECE7] text-[#252923]'
                        : 'border-[#E1DED5] bg-[#FAF8F3] text-[#252923] hover:border-[#CEC9BD]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#252923]">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#E65C35]" />}
                    </div>
                    <p className="text-[10px] text-[#777970] font-mono">
                      {formatAOIBounds(p)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Bounding Box */}
          <form onSubmit={handleApplyCustom} className="space-y-4 pt-3 border-t border-[#E1DED5]">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#777970] font-semibold">
              Custom Bounding Box (WGS84 Degrees)
            </label>

            <div className="grid grid-cols-2 gap-3 font-sans">
              <div>
                <label className="block text-[11px] text-[#777970] mb-1">West Longitude</label>
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
                <label className="block text-[11px] text-[#777970] mb-1">East Longitude</label>
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
                <label className="block text-[11px] text-[#777970] mb-1">South Latitude</label>
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
                <label className="block text-[11px] text-[#777970] mb-1">North Latitude</label>
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

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded text-xs font-medium text-[#777970] hover:text-[#252923] hover:bg-[#F4F1E9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded text-xs font-semibold bg-[#E65C35] hover:bg-[#D44F29] text-white transition-colors"
              >
                Apply Custom AOI
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
