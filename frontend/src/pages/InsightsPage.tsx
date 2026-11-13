import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  HelpCircle, 
  Activity, 
  Calendar, 
  Sliders,
  Download 
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { AnomalyEvaluation } from '../types';

export const InsightsPage: React.FC = () => {
  const { aoi, refreshKey } = useAOI();
  const [data, setData] = useState<AnomalyEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [percentileThreshold, setPercentileThreshold] = useState<number>(95);
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.0);

  useEffect(() => {
    fetchAnomalies();
  }, [aoi, refreshKey, percentileThreshold, zScoreThreshold]);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await FirePulseAPI.getAnomalies({
        west: aoi.west,
        south: aoi.south,
        east: aoi.east,
        north: aoi.north,
        percentile: percentileThreshold,
        z_score: zScoreThreshold,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load anomaly insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasSufficientHistory = data?.safeguards.sufficient_history ?? false;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
      <Header 
        title="Unusual Activity & Statistical Anomaly Detection" 
        subtitle="Empirical deviation from multi-year seasonal baselines using robust statistical estimators"
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Important Scientific Notice */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start space-x-3.5 shadow-md">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-amber-400 font-bold block mb-0.5">
              Scientific Evaluation Disclaimer: Statistical Retrospective Flags
            </strong>
            This module evaluates whether historical daily active-grid-cell counts statistically exceed seasonal baselines using Median Absolute Deviation (MAD) and empirical quantiles.
            <span className="text-slate-400 block mt-1">
              FirePulse does NOT forecast or predict future wildfires, and statistical anomaly flags must not be conflated with certified civil protection alerts.
            </span>
          </div>
        </div>

        {/* Safeguard Status Box */}
        <div className={`p-5 rounded-2xl border ${
          hasSufficientHistory 
            ? 'bg-emerald-950/20 border-emerald-800/60' 
            : 'bg-amber-950/20 border-amber-800/60'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              {hasSufficientHistory ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold text-white">
                  {hasSufficientHistory 
                    ? 'Historical Baseline Safeguards Satisfied' 
                    : 'Insufficient Historical Data for Reliable Anomaly Analysis'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Requires at least {data?.safeguards.required_years || 3} distinct observation years to form a statistically robust seasonal baseline.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Years in DB: <strong className="text-white">{data?.safeguards.distinct_years_count ?? 0} / {data?.safeguards.required_years ?? 3}</strong>
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                hasSufficientHistory 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {data?.status}
              </span>
            </div>
          </div>
        </div>

        {/* Configurable Statistical Thresholds */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Sliders className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Configurable Statistical Anomaly Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Empirical Historical Percentile Threshold</span>
                <span className="text-orange-400 font-mono">≥ {percentileThreshold}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                step="1"
                value={percentileThreshold}
                onChange={(e) => setPercentileThreshold(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">Flags observations exceeding the top {(100 - percentileThreshold).toFixed(0)}% of seasonal peers</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Robust Z-Score Threshold (MAD-derived)</span>
                <span className="text-orange-400 font-mono">≥ {zScoreThreshold.toFixed(1)} σ</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={zScoreThreshold}
                onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                className="w-full accent-orange-500 bg-slate-800 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">Calculated via Median Absolute Deviation: (X - median) / (1.4826 * MAD)</p>
            </div>
          </div>
        </div>

        {/* Anomalies List / Results */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Detected Statistically Elevated Activity Days</h3>
              <p className="text-xs text-slate-400">
                Days where active 1km grid cell counts exceeded configured thresholds relative to historical reference windows
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-600/20 text-orange-400 border border-orange-500/30">
                {data?.anomaly_count ?? 0} Days Flagged
              </span>
              <a
                href={FirePulseAPI.getExportUrl('grid', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
                download
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition text-xs font-semibold"
                title="Download Grid Activity CSV"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Export Grid CSV</span>
              </a>
            </div>
          </div>

          {!hasSufficientHistory ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Insufficient historical data for reliable anomaly analysis.</h4>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Statistical anomalies require at least 3 distinct years of observation data in this AOI to compute valid seasonal medians and MAD envelopes. You can ingest historical FIRMS datasets or upload NASA FIRMS archive CSVs in the Settings tab.
              </p>
            </div>
          ) : data && data.anomalies.length > 0 ? (
            <div className="space-y-3">
              {data.anomalies.map((anom, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm font-mono">{anom.date_utc}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-500/30">
                        ANOMALY
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{anom.explanation}</p>
                    <p className="text-[11px] text-slate-400">Reference: {anom.reference_window} (n={anom.sample_size})</p>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Observed</span>
                      <strong className="text-white text-base">{anom.observed_active_cells}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Median</span>
                      <span className="text-slate-300">{anom.historical_median}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Percentile</span>
                      <span className="text-orange-400 font-bold">{anom.historical_percentile}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] block">Robust Z</span>
                      <span className="text-red-400 font-bold">+{anom.robust_z_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
              No days in the evaluated period exceeded the statistical anomaly thresholds.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

