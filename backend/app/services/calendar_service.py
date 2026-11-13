import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..models import DailyGridActivity, Observation

class CalendarService:
    """
    Burning Activity Calendar Service.
    Generates daily, weekly, and monthly activity heatmaps based on harmonized spatial grid cells
    and dynamic relative quantile thresholds.
    """

    @classmethod
    def get_calendar_heatmap(
        cls,
        db: Session,
        year: Optional[int] = None,
        month: Optional[int] = None,
        metric: str = "active_grid_cells",
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve daily aggregated activity for heatmap visualization.
        Metrics available:
        - 'active_grid_cells' (Count of distinct active 1km cells)
        - 'modis_observations' (Total MODIS detections)
        - 'viirs_observations' (Total VIIRS detections)
        - 'cross_sensor_co_detections' (Cells detected by both sensors on the same UTC day)
        - 'mean_frp' (Harmonized mean Fire Radiative Power in MW)
        """
        query = db.query(
            DailyGridActivity.activity_date_utc,
            func.count(DailyGridActivity.id).label("active_grid_cells"),
            func.sum(DailyGridActivity.modis_detection_count).label("modis_observations"),
            func.sum(DailyGridActivity.viirs_detection_count).label("viirs_observations"),
            func.sum(case((DailyGridActivity.cross_sensor_presence == True, 1), else_=0)).label("cross_sensor_co_detections"),
            func.avg(DailyGridActivity.modis_frp_mean).label("modis_mean_frp"),
            func.avg(DailyGridActivity.viirs_frp_mean).label("viirs_mean_frp"),
        )

        if west is not None:
            query = query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            query = query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            query = query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            query = query.filter(DailyGridActivity.cell_center_lat <= north)

        if year:
            year_prefix = f"{year}-"
            query = query.filter(DailyGridActivity.activity_date_utc.like(f"{year_prefix}%"))
            if month:
                month_prefix = f"{year}-{month:02d}-"
                query = query.filter(DailyGridActivity.activity_date_utc.like(f"{month_prefix}%"))

        query = query.group_by(DailyGridActivity.activity_date_utc).order_by(DailyGridActivity.activity_date_utc)
        results = query.all()

        daily_data = []
        metric_values = []

        for r in results:
            date_str = r.activity_date_utc
            active_cells = int(r.active_grid_cells or 0)
            modis_count = int(r.modis_observations or 0)
            viirs_count = int(r.viirs_observations or 0)
            co_detected = int(r.cross_sensor_co_detections or 0)
            modis_frp = round(float(r.modis_mean_frp), 2) if r.modis_mean_frp is not None else None
            viirs_frp = round(float(r.viirs_mean_frp), 2) if r.viirs_mean_frp is not None else None

            # Compute combined mean FRP if available
            frp_vals = [f for f in (modis_frp, viirs_frp) if f is not None]
            combined_frp = round(sum(frp_vals) / len(frp_vals), 2) if frp_vals else 0.0

            # Select chosen metric value
            if metric == "modis_observations":
                chosen_val = modis_count
            elif metric == "viirs_observations":
                chosen_val = viirs_count
            elif metric == "cross_sensor_co_detections":
                chosen_val = co_detected
            elif metric == "mean_frp":
                chosen_val = combined_frp
            else:  # default 'active_grid_cells'
                chosen_val = active_cells

            metric_values.append(chosen_val)

            daily_data.append({
                "date": date_str,
                "active_grid_cells": active_cells,
                "modis_observations": modis_count,
                "viirs_observations": viirs_count,
                "cross_sensor_co_detections": co_detected,
                "modis_mean_frp": modis_frp,
                "viirs_mean_frp": viirs_frp,
                "mean_frp": combined_frp,
                "metric_value": chosen_val,
            })

        # Calculate dynamic empirical distribution levels (quintiles: 20%, 40%, 60%, 80%)
        # Avoid arbitrary universal thresholds as required by scientific principles
        nonzero_values = [v for v in metric_values if v > 0]
        if nonzero_values:
            q20 = float(np.percentile(nonzero_values, 20))
            q40 = float(np.percentile(nonzero_values, 40))
            q60 = float(np.percentile(nonzero_values, 60))
            q80 = float(np.percentile(nonzero_values, 80))
            thresholds = {
                "level_1_min": 1,
                "level_2_min": round(q20, 2),
                "level_3_min": round(q40, 2),
                "level_4_min": round(q60, 2),
                "level_5_min": round(q80, 2),
            }
        else:
            thresholds = {
                "level_1_min": 1,
                "level_2_min": 5,
                "level_3_min": 15,
                "level_4_min": 30,
                "level_5_min": 60,
            }

        # Assign activity levels (0: none, 1-5: quintile tiers)
        for day in daily_data:
            val = day["metric_value"]
            if val <= 0:
                lvl = 0
            elif val < thresholds["level_2_min"]:
                lvl = 1
            elif val < thresholds["level_3_min"]:
                lvl = 2
            elif val < thresholds["level_4_min"]:
                lvl = 3
            elif val < thresholds["level_5_min"]:
                lvl = 4
            else:
                lvl = 5
            day["activity_level"] = lvl

        return {
            "metric": metric,
            "year": year,
            "month": month,
            "total_active_days": len(daily_data),
            "thresholds": thresholds,
            "days": daily_data
        }

    @classmethod
    def get_day_details(
        cls,
        db: Session,
        date_str: str,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Retrieve granular breakdown of a single calendar day:
        - Daily summary stats
        - Active grid cells and sensor presence
        - Hotspot locations with acquisition time
        """
        # Daily grid activity
        g_query = db.query(DailyGridActivity).filter(DailyGridActivity.activity_date_utc == date_str)
        if west is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lat <= north)

        grid_cells = g_query.all()

        # Raw observations on that date
        o_query = db.query(Observation).filter(Observation.acquisition_date_utc == date_str)
        if west is not None:
            o_query = o_query.filter(Observation.longitude >= west)
        if east is not None:
            o_query = o_query.filter(Observation.longitude <= east)
        if south is not None:
            o_query = o_query.filter(Observation.latitude >= south)
        if north is not None:
            o_query = o_query.filter(Observation.latitude <= north)

        obs_records = o_query.order_by(Observation.acquisition_datetime_utc).limit(500).all()

        modis_obs = [o for o in obs_records if o.sensor_family == "MODIS"]
        viirs_obs = [o for o in obs_records if o.sensor_family == "VIIRS"]
        co_detected_cells = [g for g in grid_cells if g.cross_sensor_presence]

        return {
            "date_utc": date_str,
            "summary": {
                "active_grid_cells": len(grid_cells),
                "total_modis_observations": len(modis_obs),
                "total_viirs_observations": len(viirs_obs),
                "cross_sensor_co_detected_cells": len(co_detected_cells),
                "modis_only_cells": len([g for g in grid_cells if g.sensors_present == "MODIS"]),
                "viirs_only_cells": len([g for g in grid_cells if g.sensors_present == "VIIRS"]),
            },
            "grid_cells": [g.to_dict() for g in grid_cells],
            "observations": [o.to_dict() for o in obs_records]
        }
