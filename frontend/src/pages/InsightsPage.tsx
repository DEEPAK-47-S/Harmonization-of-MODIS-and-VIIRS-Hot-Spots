import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Info, 
  Sliders,
  Download,
  AlertCircle
} from 'lucide-react';
import { Header } from '../components/Header';
import { useAOI } from '../context/AOIContext';
import { FirePulseAPI } from '../services/api';
import { AnomalyEvaluation, formatAOIBounds } from '../types';

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

  const hasSufficientHistory = data?.safeguards?.sufficient_history ?? false;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto">
      <Header 
        title="Unusual Activity & Anomalies" 
        subtitle="Empirical deviation from multi-year seasonal baselines using robust statistical estimators"
      />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
        {/* Editorial Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-500 uppercase">
              Anomaly Detection / Statistical Evaluation
            </span>
            <h1 className="text-2xl md:text-3xl font-sans font-semibold text-slate-900 tracking-tight">
              Unusual Fire Activity Detection
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-sans max-w-2xl">
              Identify observation days where burning activity statistically exceeded historical baseline quantiles using Median Absolute Deviation (MAD).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={FirePulseAPI.getExportUrl('grid', { west: aoi.west, south: aoi.south, east: aoi.east, north: aoi.north })}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-md bg-white hover:bg-slate-100 text-xs font-semibold text-slate-900 border border-slate-200 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Export Grid CSV</span>
            </a>
          </div>
        </div>

        {/* Scientific Research Disclaimer */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex items-start space-x-3 shadow-sm">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-900 leading-relaxed">
            <strong className="text-slate-900 font-semibold block mb-0.5">
              Research Distinction: Statistical Anomaly &ne; Emergency Warning
            </strong>
            This module evaluates whether historical daily active-grid-cell counts statistically exceed regional seasonal baselines. FirePulse does NOT forecast future fires, and statistical anomaly flags must not be treated as a certified civil defense emergency warning.
          </div>
        </div>

        {/* Safeguard Status Box */}
        <div className={`p-4 rounded-lg border shadow-xs ${
          hasSufficientHistory 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              {hasSufficientHistory ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-[#B98B37] shrink-0" />
              )}
              <div>
                <h3 className="font-sans font-semibold text-sm text-slate-900">
                  {hasSufficientHistory 
                    ? 'Historical Baseline Safeguards Satisfied' 
                    : 'Insufficient Historical Data for Reliable Anomaly Flagging'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requires at least {data?.safeguards?.required_years || 3} distinct observation years to form a statistically robust baseline.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-900">
                Years in DB: <strong>{data?.safeguards?.distinct_years_count ?? 0} / {data?.safeguards?.required_years ?? 3}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Anomaly Filter Thresholds */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <Sliders className="w-4 h-4 text-orange-600" />
            <h3 className="font-sans font-semibold text-base text-slate-900">Statistical Sensitivity Thresholds</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-500">Percentile Cutoff (Empirical Quantile)</span>
                <span className="font-mono font-semibold text-xs text-orange-600 bg-[#FCECE7] px-2 py-0.5 rounded">
                  P{percentileThreshold}
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                step="1"
                value={percentileThreshold}
                onChange={(e) => setPercentileThreshold(Number(e.target.value))}
                className="w-full accent-[#E65C35] h-1.5 bg-slate-100 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Flag days exceeding the {percentileThreshold}th percentile of the regional baseline.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-500">Robust Z-Score Threshold (MAD-based)</span>
                <span className="font-mono font-semibold text-xs text-orange-600 bg-[#FCECE7] px-2 py-0.5 rounded">
                  Z &ge; {zScoreThreshold.toFixed(1)}&sigma;
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={zScoreThreshold}
                onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                className="w-full accent-[#E65C35] h-1.5 bg-slate-100 rounded cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Normalized deviation score: (x - Median) / (1.4826 &times; MAD).
              </span>
            </div>
          </div>
        </div>

        {/* Flagged Anomaly Results Table */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-sans font-semibold text-base text-slate-900">
                Flagged Unusual Observation Days
              </h3>
              <p className="text-xs text-slate-500">
                Days meeting both percentile and robust Z-score criteria
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
              {data?.anomalies?.length || 0} anomalies detected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 px-4 font-semibold">Observation Date</th>
                  <th className="py-2.5 px-4 font-semibold">Active 1km Cells</th>
                  <th className="py-2.5 px-4 font-semibold">Historical Median</th>
                  <th className="py-2.5 px-4 font-semibold">Robust Z-Score</th>
                  <th className="py-2.5 px-4 font-semibold">Percentile Rank</th>
                  <th className="py-2.5 px-4 font-semibold">Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1DED5] font-sans">
                {data && data.anomalies && data.anomalies.length > 0 ? (
                  data.anomalies.map((anom) => (
                    <tr key={anom.date_utc} className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{anom.date_utc} UTC</td>
                      <td className="py-3 px-4 font-mono font-bold text-orange-600">
                        {anom.observed_active_cells} cells
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{anom.historical_median?.toFixed(1) || '0'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600">
                        +{anom.robust_z_score?.toFixed(2)}&sigma;
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-900">
                        Top {(100 - anom.historical_percentile).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {anom.explanation || 'Significant empirical surge above regional seasonal median.'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      {!hasSufficientHistory 
                        ? 'Insufficient historical records to flag anomalies. Need multi-year baseline.' 
                        : 'No days in this date window exceed the selected statistical thresholds.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
