import math
import numpy as np
from datetime import datetime, timedelta, date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import DailyGridActivity

class AnomalyService:
    """
    Statistical Anomaly Detection Service for Wildfire Activity.
    
    Evaluates whether an observed daily active-grid-cell count is statistically elevated
    relative to an empirical multi-year historical seasonal baseline.
    
    IMPORTANT SCIENTIFIC NOTICE:
    This service performs statistical anomaly detection on historical satellite observations.
    It does NOT predict future wildfire ignitions, nor is it a certified emergency warning system.
    """

    MINIMUM_HISTORICAL_YEARS = 3
    MINIMUM_SAMPLE_SIZE = 15

    @classmethod
    def detect_anomalies_for_period(
        cls,
        db: Session,
        date_from: str,
        date_to: str,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
        percentile_threshold: float = 95.0,
        z_score_threshold: float = 2.0
    ) -> Dict[str, Any]:
        """
        Evaluate all dates in the requested period against multi-year historical seasonal baselines.
        Strictly enforces historical data sufficiency safeguards.
        """
        # 1. Retrieve all daily active cell counts in the system
        query = db.query(
            DailyGridActivity.activity_date_utc,
            func.count(DailyGridActivity.id).label("active_grid_cells")
        )
        if west is not None:
            query = query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            query = query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            query = query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            query = query.filter(DailyGridActivity.cell_center_lat <= north)

        query = query.group_by(DailyGridActivity.activity_date_utc)
        all_daily_records = {r.activity_date_utc: int(r.active_grid_cells) for r in query.all()}

        if not all_daily_records:
            return {
                "status": "NO_DATA",
                "message": "No observation records found in database for the selected AOI.",
                "anomalies": [],
                "safeguards": {
                    "sufficient_history": False,
                    "distinct_years_count": 0,
                    "required_years": cls.MINIMUM_HISTORICAL_YEARS
                }
            }

        # Check total distinct years in database
        distinct_years = set(int(d.split("-")[0]) for d in all_daily_records.keys())
        has_sufficient_years = len(distinct_years) >= cls.MINIMUM_HISTORICAL_YEARS

        # 2. Iterate dates in [date_from, date_to]
        d_start = datetime.strptime(date_from, "%Y-%m-%d").date()
        d_end = datetime.strptime(date_to, "%Y-%m-%d").date()

        evaluated_days = []
        anomalous_days = []

        curr = d_start
        while curr <= d_end:
            date_str = curr.strftime("%Y-%m-%d")
            observed_val = all_daily_records.get(date_str, 0)

            # Build seasonal baseline: match days across other years within +/- 15 calendar days
            baseline_samples = []
            for other_date_str, val in all_daily_records.items():
                if other_date_str == date_str:
                    continue  # exclude the target observation itself
                try:
                    other_dt = datetime.strptime(other_date_str, "%Y-%m-%d").date()
                    # Same calendar day-of-year window across different years
                    # Create normalized date on a leap-safe reference year (e.g. 2024)
                    ref_target = date(2024, curr.month, min(curr.day, 28))
                    ref_other = date(2024, other_dt.month, min(other_dt.day, 28))
                    day_diff = abs((ref_target - ref_other).days)
                    if day_diff <= 15:
                        baseline_samples.append(val)
                except ValueError:
                    continue

            # Check sufficiency safeguard for this specific day
            is_sufficient = has_sufficient_years and (len(baseline_samples) >= cls.MINIMUM_SAMPLE_SIZE)

            if not is_sufficient:
                evaluated_days.append({
                    "date_utc": date_str,
                    "observed_active_cells": observed_val,
                    "status": "INSUFFICIENT_HISTORY",
                    "explanation": "Insufficient historical data for reliable anomaly analysis.",
                    "sample_size": len(baseline_samples),
                    "distinct_years": len(distinct_years),
                    "is_anomaly": False
                })
            else:
                samples_arr = np.array(baseline_samples)
                med = float(np.median(samples_arr))
                # Median Absolute Deviation (MAD)
                mad = float(np.median(np.abs(samples_arr - med)))
                
                # Robust Z-Score: (X - median) / (1.4826 * MAD)
                if mad > 0:
                    robust_z = round(float((observed_val - med) / (1.4826 * mad)), 2)
                else:
                    robust_z = 0.0 if observed_val == med else (3.0 if observed_val > med else -3.0)

                # Empirical Percentile
                percentile = round(float((np.sum(samples_arr <= observed_val) / len(samples_arr)) * 100.0), 1)

                is_anom = (percentile >= percentile_threshold) or (robust_z >= z_score_threshold)

                day_res = {
                    "date_utc": date_str,
                    "observed_active_cells": observed_val,
                    "historical_median": round(med, 2),
                    "median_absolute_deviation": round(mad, 2),
                    "robust_z_score": robust_z,
                    "historical_percentile": percentile,
                    "sample_size": len(baseline_samples),
                    "distinct_years": len(distinct_years),
                    "reference_window": f"{curr.strftime('%b %d')} +/- 15 days historical baseline",
                    "method": "Robust Z-Score (MAD) & Seasonal Quantiles",
                    "is_anomaly": is_anom,
                    "explanation": f"Observed {observed_val} active cells vs historical seasonal median of {med:.1f} (Percentile: {percentile}%, Robust Z: {robust_z})."
                }
                evaluated_days.append(day_res)
                if is_anom:
                    anomalous_days.append(day_res)

            curr += timedelta(days=1)

        return {
            "status": "SUCCESS" if has_sufficient_years else "INSUFFICIENT_HISTORY",
            "message": "Seasonal anomaly evaluation complete" if has_sufficient_years else "Insufficient historical data for reliable anomaly analysis.",
            "safeguards": {
                "sufficient_history": has_sufficient_years,
                "distinct_years_count": len(distinct_years),
                "required_years": cls.MINIMUM_HISTORICAL_YEARS,
                "sample_threshold": cls.MINIMUM_SAMPLE_SIZE
            },
            "total_evaluated_days": len(evaluated_days),
            "anomaly_count": len(anomalous_days),
            "anomalies": anomalous_days,
            "all_evaluated_days": evaluated_days
        }
