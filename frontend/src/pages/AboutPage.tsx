import React from 'react';
import { 
  BookOpen, Satellite, Grid, Layers, FlaskConical, ShieldCheck,
  GitBranch, ExternalLink, Globe, AlertTriangle, BarChart3, Info
} from 'lucide-react';
import { Header } from '../components/Header';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; color?: string }> = ({
  icon, title, children, color = 'orange',
}) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
    <div className="flex items-center space-x-3 mb-4">
      <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 text-${color}-400 flex items-center justify-center`}>
        {icon}
      </div>
      <h3 className="text-base font-bold text-white">{title}</h3>
    </div>
    <div className="text-xs text-slate-300 leading-relaxed space-y-2">{children}</div>
  </div>
);

export const AboutPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header
        title="About FirePulse & Scientific Methodology"
        subtitle="Data harmonization principles, sensor comparison, and research limitations"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-start space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <span className="text-3xl">🔥</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-1">FirePulse</h2>
              <p className="text-orange-400 font-semibold text-sm mb-3">NASA Space Apps Challenge 2026 — Team: Virtual Warriors</p>
              <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                FirePulse is an open research prototype that harmonizes active-fire observations from NASA's MODIS (Moderate Resolution Imaging Spectroradiometer) 
                and VIIRS (Visible Infrared Imaging Radiometer Suite) instruments into a unified, spatially and temporally consistent Burning Activity Calendar. 
                It is designed to help environmental researchers, fire managers, and Earth science students compare multi-sensor satellite fire data with rigorous scientific transparency.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">MODIS Terra/Aqua</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">VIIRS NOAA-20 (JPSS-1)</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">VIIRS NOAA-21 (JPSS-2)</span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700/80 text-slate-400 border border-slate-700">VIIRS S-NPP (Historical)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical disclaimer */}
        <div className="bg-amber-950/20 border border-amber-800/60 p-5 rounded-2xl flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed space-y-1">
            <strong className="text-amber-300 font-bold block text-sm">Important Disclaimer</strong>
            <p>FirePulse is an independent student project using NASA FIRMS data. It is <strong className="text-white">NOT</strong> an official NASA product, nor a certified civil protection, emergency alert, or wildfire warning system.</p>
            <p>All statistical outputs are retrospective analytical flags, not predictions. Never use FirePulse outputs for evacuation or emergency response decisions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spatial Harmonization */}
          <Section icon={<Grid className="w-5 h-5" />} title="Spatial Harmonization (EPSG:6933 → 1km Grid)" color="orange">
            <p>
              MODIS fire pixels have a nominal ground resolution of ~1,000 m, while VIIRS I-band pixels are ~375 m. 
              Directly adding observation counts would conflate sensor resolution differences with actual fire intensity differences.
            </p>
            <p>
              FirePulse projects all observation coordinates from geographic WGS84 (EPSG:4326) to the 
              NSIDC EASE-Grid 2.0 equal-area projection (EPSG:6933) using PyProj, then assigns each point 
              to a fixed 1,000 m × 1,000 m analytical grid cell via integer floor division of its projected coordinates.
            </p>
            <p className="text-amber-300 font-semibold">
              This is centroid-based analytical aggregation, NOT a claim that MODIS and VIIRS pixel footprints are physically identical.
            </p>
          </Section>

          {/* Temporal Harmonization */}
          <Section icon={<Layers className="w-5 h-5" />} title="Temporal Harmonization (UTC Standardization)" color="cyan">
            <p>
              Satellite acquisition times are stored and analyzed exclusively in Coordinated Universal Time (UTC). 
              All acquisition times in HHMM integer format are correctly zero-padded and parsed into full ISO-8601 UTC datetimes.
            </p>
            <p>
              Daily aggregation keys are formed from the UTC acquisition date only, 
              preventing local-time boundary ambiguities from corrupting multi-sensor comparisons.
            </p>
            <p>All calendar views and exported reports explicitly label their timezone as UTC.</p>
          </Section>

          {/* Confidence handling */}
          <Section icon={<ShieldCheck className="w-5 h-5" />} title="Sensor Confidence Scale Integrity" color="emerald">
            <p>
              <strong className="text-amber-400">MODIS</strong> confidence values are numeric percentages (0–100%). 
              A value of 0% indicates low confidence; 100% indicates high confidence.
            </p>
            <p>
              <strong className="text-cyan-400">VIIRS</strong> confidence values are categorical: <code className="bg-slate-800 px-1 rounded text-[11px]">'l'</code> (low), 
              <code className="bg-slate-800 px-1 rounded text-[11px]">'n'</code> (nominal), <code className="bg-slate-800 px-1 rounded text-[11px]">'h'</code> (high).
            </p>
            <p className="text-amber-300 font-semibold">
              FirePulse never converts MODIS confidence percentages into VIIRS categorical labels using invented thresholds. 
              Each sensor's confidence scale is preserved separately in the database and in all exports.
            </p>
          </Section>

          {/* Cross-sensor detection */}
          <Section icon={<GitBranch className="w-5 h-5" />} title="Cross-Sensor Co-Detection Logic" color="purple">
            <p>
              When both MODIS and VIIRS register at least one detection in the same 1km grid cell on the same UTC day, 
              that cell-day is labeled <strong className="text-purple-400">cross-sensor co-detected</strong>.
            </p>
            <p>
              Co-detection does not imply that sensors observed the same fire simultaneously—orbit timing differences 
              mean passes can be hours apart. It indicates spatial-temporal agreement within the common grid.
            </p>
            <p className="text-amber-300 font-semibold">
              A single active 1km grid cell is NOT reported as one fire. It is reported as one aggregated observation unit.
            </p>
          </Section>
        </div>

        {/* Anomaly detection methodology */}
        <Section icon={<BarChart3 className="w-5 h-5" />} title="Statistical Anomaly Detection Methodology" color="orange">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Median Absolute Deviation (MAD)</h4>
              <p>
                FirePulse uses the Median Absolute Deviation (MAD) rather than standard deviation for robust anomaly detection,
                because MAD is less sensitive to extreme outlier values that can distort fire activity baselines.
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                Robust Z = (X − median) / (1.4826 × MAD)
              </div>
              <p>The 1.4826 scale factor makes the MAD-based estimator consistent with the standard deviation for normally distributed data.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-white text-sm">Minimum History Requirement</h4>
              <p>
                FirePulse requires at least <strong className="text-orange-400">3 distinct calendar years</strong> of observation data 
                in the selected AOI before generating any anomaly flags.
              </p>
              <p>
                This safeguard prevents statistically meaningless flags from single-year or two-year datasets. 
                If the history requirement is not met, the Unusual Activity page clearly displays a warning and suppresses all anomaly outputs.
              </p>
              <p>
                Only matching calendar-month windows (±30 days same month across years) are used to form each day's reference distribution.
              </p>
            </div>
          </div>
        </Section>

        {/* Suomi-NPP notice */}
        <div className="bg-amber-950/20 border border-amber-800/60 p-5 rounded-2xl">
          <div className="flex items-start space-x-3.5">
            <Satellite className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
              <h4 className="font-bold text-amber-300 text-sm">Suomi-NPP Data Delivery Ceased: November 2, 2026</h4>
              <p>
                The Suomi National Polar-Orbiting Partnership (Suomi-NPP) satellite ceased active-fire data delivery on November 2, 2026,
                per official NASA/NOAA operations updates. FirePulse preserves all historical Suomi-NPP VIIRS observations (2012–2026)
                in its database for long-term baseline calibration, but does not query Suomi-NPP as a source for new Near Real-Time observations.
              </p>
              <p>
                Current monitoring prioritizes: <strong className="text-cyan-400">VIIRS NOAA-20 (JPSS-1)</strong>, 
                <strong className="text-cyan-400"> VIIRS NOAA-21 (JPSS-2)</strong>, and 
                <strong className="text-amber-400"> MODIS Terra/Aqua</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Pipeline overview */}
        <Section icon={<FlaskConical className="w-5 h-5" />} title="Data Processing Pipeline" color="cyan">
          <ol className="list-none space-y-3">
            {[
              ['1. FIRMS API Fetch', 'Chunked 5-day requests to NASA FIRMS Area API (CSV format). Validates AOI, source, date range, HTTP status, and response columns.'],
              ['2. Normalization', 'Sensor-specific column mapping (MODIS vs VIIRS field name differences). UTC datetime parsing. Data quality checks (coordinate range, FRP sign, date validity). Hash-based duplicate detection.'],
              ['3. Spatial Harmonization', 'PyProj EPSG:4326→6933 projection. 1km grid-cell ID assignment via floor division. Original lat/lon preserved.'],
              ['4. Temporal Harmonization', 'UTC date and hour extraction. Daily aggregation key formation.'],
              ['5. Observation Aggregation', 'Group by grid_cell_id + acquisition_date_utc. Compute per-sensor detection counts, FRP statistics, and cross-sensor co-detection flags.'],
              ['6. Analytics & Export', 'Calendar heatmap quantiles, anomaly detection, trend series, and filtered CSV exports.'],
            ].map(([step, desc]) => (
              <li key={step} className="flex items-start space-x-3">
                <span className="text-orange-400 font-bold shrink-0 font-mono text-[11px] mt-0.5">{step}</span>
                <span className="text-slate-300">{desc}</span>
              </li>
            ))}
          </ol>
        </Section>

        {/* Attribution */}
        <Section icon={<Globe className="w-5 h-5" />} title="Data Attribution & References" color="emerald">
          <p>
            We acknowledge the use of data from NASA's Land, Atmosphere Near real-time Capability for EOS (LANCE) system operated by 
            NASA's Earth Science Data and Information System (ESDIS) with funding provided by NASA/HQ.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { label: 'NASA FIRMS Portal', href: 'https://firms.modaps.eosdis.nasa.gov/' },
              { label: 'FIRMS API Documentation', href: 'https://firms.modaps.eosdis.nasa.gov/api/' },
              { label: 'Register MAP_KEY', href: 'https://firms.modaps.eosdis.nasa.gov/api/map_key/' },
              { label: 'Data Availability', href: 'https://firms.modaps.eosdis.nasa.gov/api/data_availability/' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-[11px]"
              >
                <span>{label}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            ))}
          </div>
          <p className="pt-3 text-slate-400 text-[11px] border-t border-slate-800 mt-2">
            Schroeder, W., Oliva, P., Giglio, L., & Csiszar, I. A. (2014). The New VIIRS 375m active fire detection data product:
            Algorithm description and initial assessment. Remote Sensing of Environment, 143, 85–96.
          </p>
          <p className="text-slate-400 text-[11px]">
            Giglio, L., Schroeder, W., & Justice, C. O. (2016). The collection 6 MODIS active fire detection algorithm and
            fire products. Remote Sensing of Environment, 178, 31–41.
          </p>
        </Section>

        {/* Tech stack */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <Info className="w-5 h-5 text-slate-400" />
            <span>Technology Stack</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Backend</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                <li><span className="text-orange-400 font-semibold">Python 3.12+</span> — Flask, Flask-CORS, SQLAlchemy</li>
                <li><span className="text-orange-400 font-semibold">PyProj</span> — EPSG:4326 → EPSG:6933 projection</li>
                <li><span className="text-orange-400 font-semibold">Pandas / NumPy</span> — Data normalization and analytics</li>
                <li><span className="text-orange-400 font-semibold">SQLite (SQLAlchemy)</span> — Replaceable with PostgreSQL/PostGIS</li>
                <li><span className="text-orange-400 font-semibold">NASA FIRMS REST API</span> — Active fire data source</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Frontend</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                <li><span className="text-cyan-400 font-semibold">React 18 + Vite + TypeScript</span></li>
                <li><span className="text-cyan-400 font-semibold">Tailwind CSS</span> — Utility-first dark-mode UI</li>
                <li><span className="text-cyan-400 font-semibold">React Leaflet</span> — Satellite fire map (CartoDB dark tiles)</li>
                <li><span className="text-cyan-400 font-semibold">Recharts</span> — Time series, bar, pie, and area charts</li>
                <li><span className="text-cyan-400 font-semibold">Axios</span> — Typed REST API client with proxy</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

