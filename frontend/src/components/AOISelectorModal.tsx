import React, { useState } from 'react';
import { X, MapPin, Check } from 'lucide-react';
import { useAOI, AOI_PRESETS } from '../context/AOIContext';
import { AOIBounds } from '../types';

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <MapPin className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-bold text-white">Select Area of Interest (AOI)</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Preset buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Official Region Presets
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AOI_PRESETS.map((p) => {
                const isSelected = aoi.name === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => handleApplyPreset(p)}
                    className={`p-3.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{p.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-orange-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      [{p.west.toFixed(1)}°W, {p.south.toFixed(1)}°S, {p.east.toFixed(1)}°E, {p.north.toFixed(1)}°N]
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Bounding Box */}
          <form onSubmit={handleApplyCustom} className="space-y-4 pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Custom Bounding Box (WGS84 Degrees)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">West Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="-180"
                  max="180"
                  value={customBounds.west}
                  onChange={(e) => setCustomBounds({ ...customBounds, west: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">East Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="-180"
                  max="180"
                  value={customBounds.east}
                  onChange={(e) => setCustomBounds({ ...customBounds, east: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">South Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="-90"
                  max="90"
                  value={customBounds.south}
                  onChange={(e) => setCustomBounds({ ...customBounds, south: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">North Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="-90"
                  max="90"
                  value={customBounds.north}
                  onChange={(e) => setCustomBounds({ ...customBounds, north: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg shadow-orange-600/20"
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

