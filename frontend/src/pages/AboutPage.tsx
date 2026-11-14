import React from 'react';
import { 
  BookOpen, 
  Grid, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { Header } from '../components/Header';

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header
        title="Scientific Methodology"
        subtitle="Data harmonization principles, mathematical formulation, and remote sensing limitations"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Documentation / Methodology
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              Harmonization Methodology & Pipeline
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              How FirePulse bridges MODIS and VIIRS satellite observations into an equal-area burning intelligence system.
            </p>
          </div>
        </div>

        {/* Hero Paper Abstract Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-orange-600 font-semibold">
            <span>NASA Space Apps Challenge 2026</span>
            <span>•</span>
            <span>Team Virtual Warriors</span>
          </div>
          <h2 className="font-sans font-bold text-xl text-slate-900">
            Spatially and Temporally Harmonized Active-Fire Intelligence
          </h2>
          <p className="text-xs text-slate-900 leading-relaxed max-w-3xl">
            FirePulse harmonizes thermal anomalies from NASA's Moderate Resolution Imaging Spectroradiometer (MODIS) 
            and Visible Infrared Imaging Radiometer Suite (VIIRS) instruments into a unified, spatially and temporally 
            aggregated Burning Activity Calendar. It provides environmental researchers, land managers, and climate scientists 
            with a statistically transparent baseline that respects sensor resolution and orbit characteristics.
          </p>
        </div>

        {/* VISUAL METHODOLOGY PIPELINE (Requested in Phase 12) */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-semibold text-base text-slate-900">Processing Pipeline Flow</h3>
          <p className="text-xs text-slate-500">
            Every satellite observation passes through a deterministic 7-stage pipeline:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
            {[
              { step: '1', title: 'Raw Ingestion', desc: 'NASA FIRMS API or validated archive CSV' },
              { step: '2', title: 'Normalization', desc: 'Disjoint sensor schemas unified to standard types' },
              { step: '3', title: 'UTC Conversion', desc: 'Zero-padded HHMM to ISO-8601 UTC timestamp' },
              { step: '4', title: 'EPSG:6933', desc: 'PyProj transformation to equal-area cylindrical grid' },
              { step: '5', title: '1km Grid Binning', desc: 'floor(x/1000), floor(y/1000) deterministic cell ID' },
              { step: '6', title: 'Daily Aggregation', desc: 'Co-detection flagging & energy calculations' },
              { step: '7', title: 'Burning Calendar', desc: 'Dynamic quantile heatmap & anomaly Z-scores' }
            ].map((p, idx) => (
              <div key={idx} className="p-3 bg-white border border-slate-200 rounded flex flex-col justify-between text-xs space-y-1">
                <div>
                  <span className="font-mono text-[10px] text-orange-600 font-bold">Step 0{p.step}</span>
                  <h4 className="font-semibold text-slate-900 text-xs mt-0.5">{p.title}</h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Methodology Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spatial Harmonization */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Grid className="w-4 h-4 text-orange-600" />
              <h3 className="font-sans font-semibold text-base text-slate-900">
                Spatial Equal-Area Grid (EPSG:6933)
              </h3>
            </div>
            <div className="text-xs text-slate-900 leading-relaxed space-y-2">
              <p>
                Standard Web Mercator (EPSG:3857) projects severe area distortion at higher latitudes (Greenland distortion). Latitude/Longitude degrees (EPSG:4326) also shrink significantly toward the poles.
              </p>
              <p>
                FirePulse projects all geographic coordinates into <strong>EPSG:6933 (WGS 84 / World Cylindrical Equal Area)</strong> using PyProj, then computes integer grid coordinates:
              </p>
              <div className="bg-white p-2.5 rounded border border-slate-200 font-mono text-[11px] text-slate-900">
                cell_x = floor(x_m / 1000)<br />
                cell_y = floor(y_m / 1000)<br />
                grid_cell_id = "E6933_1KM_X" + cell_x + "_Y" + cell_y
              </div>
              <p className="text-slate-500 text-[11px]">
                This ensures that every analytical grid cell occupies exactly 1,000,000 m² (1 km²) anywhere on Earth.
              </p>
            </div>
          </div>

          {/* Temporal Harmonization */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <h3 className="font-sans font-semibold text-base text-slate-900">
                Temporal Standardization (UTC 24-hr)
              </h3>
            </div>
            <div className="text-xs text-slate-900 leading-relaxed space-y-2">
              <p>
                Satellite overpasses capture fire activity at distinct times in the diurnal cycle:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-500 text-[11px]">
                <li><strong>MODIS Terra:</strong> ~10:30 AM/PM equatorial crossing</li>
                <li><strong>MODIS Aqua:</strong> ~01:30 AM/PM equatorial crossing</li>
                <li><strong>VIIRS NOAA-20:</strong> ~12:45 PM equatorial crossing</li>
                <li><strong>VIIRS NOAA-21:</strong> ~01:30 PM equatorial crossing</li>
              </ul>
              <p>
                All timestamps are standardized strictly into <strong>Coordinated Universal Time (UTC)</strong>. Integer HHMM formats are zero-padded and parsed to ISO-8601 UTC timestamps, preventing local boundary shifts from corrupting daily aggregates.
              </p>
            </div>
          </div>
        </div>

        {/* What Harmonization Does vs Does Not Do */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
          <h3 className="font-sans font-semibold text-base text-slate-900">
            What Harmonization Does — and Does Not Do
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1 text-xs">
            <div className="p-4 bg-emerald-600/5 border border-[#54785E]/30 rounded space-y-2">
              <h4 className="font-semibold text-emerald-700">What FirePulse DOES</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-900 text-[11px]">
                <li>Projects coordinates onto a consistent, equal-area spatial grid (EPSG:6933).</li>
                <li>Normalizes diverse attribute column structures across MODIS and VIIRS.</li>
                <li>Identifies when both sensors detect activity in the same 1km cell on the same UTC day.</li>
                <li>Preserves original raw confidence values, overpass times, and sensor identity.</li>
                <li>Computes relative empirical quantiles for regional burning calendars.</li>
              </ul>
            </div>

            <div className="p-4 bg-red-600/5 border border-red-400/30 rounded space-y-2">
              <h4 className="font-semibold text-red-600">What FirePulse DOES NOT DO</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-900 text-[11px]">
                <li>Never sums raw MODIS and VIIRS counts into a single "number of fires".</li>
                <li>Does not fabricate data when satellite coverage is unavailable or obstructed by clouds.</li>
                <li>Does not convert MODIS percentage confidences into VIIRS categorical strings using invented rules.</li>
                <li>Does not predict future fire spread, direction, or behavior.</li>
                <li>Never serves as an official civil protection emergency alarm.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
