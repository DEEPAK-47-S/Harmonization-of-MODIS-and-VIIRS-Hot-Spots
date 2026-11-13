from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..models import Observation, DailyGridActivity

class TrendService:
    """
    Sensor Comparison & Historical Trend Analysis Service.
    Provides rigorous comparison of MODIS and VIIRS detections and temporal patterns,
    with explicit labeling of sensor eras and scientific caveats.
    """

    @classmethod
    def get_sensor_comparison(
        cls,
        db: Session,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Compare MODIS and VIIRS observation counts, FRP metrics, confidence distributions,
        and common 1km grid cell overlaps.
        """
        # 1. Observation-level metrics
        obs_q = db.query(Observation)
        if date_from:
            obs_q = obs_q.filter(Observation.acquisition_date_utc >= date_from)
        if date_to:
            obs_q = obs_q.filter(Observation.acquisition_date_utc <= date_to)
        if west is not None:
            obs_q = obs_q.filter(Observation.longitude >= west)
        if east is not None:
            obs_q = obs_q.filter(Observation.longitude <= east)
        if south is not None:
            obs_q = obs_q.filter(Observation.latitude >= south)
        if north is not None:
            obs_q = obs_q.filter(Observation.latitude <= north)

        all_obs = obs_q.all()

        modis_obs = [o for o in all_obs if o.sensor_family == "MODIS"]
        viirs_obs = [o for o in all_obs if o.sensor_family == "VIIRS"]

        # MODIS Stats
        modis_frps = [o.frp_mw for o in modis_obs if o.frp_mw is not None and o.frp_mw >= 0]
        modis_stats = {
            "observation_count": len(modis_obs),
            "frp_mean": round(sum(modis_frps) / len(modis_frps), 2) if modis_frps else 0.0,
            "frp_max": round(max(modis_frps), 2) if modis_frps else 0.0,
            "satellites": list(set(o.satellite for o in modis_obs)),
            "confidence_distribution": {"low": 0, "nominal": 0, "high": 0}
        }
        for o in modis_obs:
            try:
                c_val = int(o.confidence_raw)
                if c_val < 30:
                    modis_stats["confidence_distribution"]["low"] += 1
                elif c_val <= 80:
                    modis_stats["confidence_distribution"]["nominal"] += 1
                else:
                    modis_stats["confidence_distribution"]["high"] += 1
            except (ValueError, TypeError):
                modis_stats["confidence_distribution"]["nominal"] += 1

        # VIIRS Stats
        viirs_frps = [o.frp_mw for o in viirs_obs if o.frp_mw is not None and o.frp_mw >= 0]
        viirs_stats = {
            "observation_count": len(viirs_obs),
            "frp_mean": round(sum(viirs_frps) / len(viirs_frps), 2) if viirs_frps else 0.0,
            "frp_max": round(max(viirs_frps), 2) if viirs_frps else 0.0,
            "satellites": list(set(o.satellite for o in viirs_obs)),
            "confidence_distribution": {"low": 0, "nominal": 0, "high": 0}
        }
        for o in viirs_obs:
            c_val = str(o.confidence_raw).lower()
            if c_val in ("l", "low"):
                viirs_stats["confidence_distribution"]["low"] += 1
            elif c_val in ("h", "high"):
                viirs_stats["confidence_distribution"]["high"] += 1
            else:
                viirs_stats["confidence_distribution"]["nominal"] += 1

        # 2. Grid-level Overlap Metrics
        grid_q = db.query(DailyGridActivity)
        if date_from:
            grid_q = grid_q.filter(DailyGridActivity.activity_date_utc >= date_from)
        if date_to:
            grid_q = grid_q.filter(DailyGridActivity.activity_date_utc <= date_to)
        if west is not None:
            grid_q = grid_q.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            grid_q = grid_q.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            grid_q = grid_q.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            grid_q = grid_q.filter(DailyGridActivity.cell_center_lat <= north)

        grid_cells = grid_q.all()

        total_cells = len(grid_cells)
        co_detected_cells = sum(1 for g in grid_cells if g.cross_sensor_presence)
        modis_only_cells = sum(1 for g in grid_cells if g.sensors_present == "MODIS")
        viirs_only_cells = sum(1 for g in grid_cells if g.sensors_present == "VIIRS")

        overlap_breakdown = {
            "total_active_cell_days": total_cells,
            "co_detected_cell_days": co_detected_cells,
            "modis_only_cell_days": modis_only_cells,
            "viirs_only_cell_days": viirs_only_cells,
            "co_detection_rate_pct": round((co_detected_cells / total_cells * 100), 2) if total_cells > 0 else 0.0
        }

        # 3. Daily Time Series
        daily_map = {}
        for g in grid_cells:
            d = g.activity_date_utc
            if d not in daily_map:
                daily_map[d] = {
                    "date": d,
                    "modis_detections": 0,
                    "viirs_detections": 0,
                    "active_grid_cells": 0,
                    "co_detected_cells": 0
                }
            daily_map[d]["modis_detections"] += g.modis_detection_count
            daily_map[d]["viirs_detections"] += g.viirs_detection_count
            daily_map[d]["active_grid_cells"] += 1
            if g.cross_sensor_presence:
                daily_map[d]["co_detected_cells"] += 1

        daily_timeline = sorted(daily_map.values(), key=lambda x: x["date"])

        # Scientific Methodology and Sensor Caveat Notes
        scientific_notes = [
            "Spatial Resolution: VIIRS features 375 m nominal pixel resolution (I-bands) compared to MODIS's 1,000 m nominal resolution. VIIRS can detect smaller, cooler fires and produces a higher detection density.",
            "Overpass Geometry: Terra crosses equator ~10:30 AM/PM, Aqua and Suomi-NPP ~01:30 AM/PM, NOAA-20 ~12:45 PM (half orbit offset). Different acquisition times capture different phases of the diurnal fire cycle.",
            "Raw Counts vs True Fires: Raw observation counts differ because of pixel size and scan geometry, not necessarily because the number of distinct wildfire events changed.",
            "Equal-Area Harmonization: Aggregating observations into 1km x 1km equal-area cells (EPSG:6933) allows standardized spatial comparison across differing satellite scan swaths."
        ]

        return {
            "modis": modis_stats,
            "viirs": viirs_stats,
            "overlap": overlap_breakdown,
            "timeline": daily_timeline,
            "scientific_notes": scientific_notes
        }

    @classmethod
    def get_historical_trends(
        cls,
        db: Session,
        series_type: str = "harmonized",
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Historical trend analytics across years and months, with sensor era demarcation.
        series_type options: 'harmonized', 'modis', 'viirs', 'overlap'
        """
        query = db.query(DailyGridActivity)
        if west is not None:
            query = query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            query = query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            query = query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            query = query.filter(DailyGridActivity.cell_center_lat <= north)

        records = query.all()

        # Group by Year and Month
        yearly_data = {}
        monthly_seasonality = {m: {"month": m, "active_cells": 0, "modis_count": 0, "viirs_count": 0} for m in range(1, 13)}

        for r in records:
            d_parts = r.activity_date_utc.split("-")
            yr = int(d_parts[0])
            mo = int(d_parts[1])

            if yr not in yearly_data:
                yearly_data[yr] = {
                    "year": yr,
                    "active_grid_cells": 0,
                    "modis_observations": 0,
                    "viirs_observations": 0,
                    "co_detected_cells": 0,
                }

            yearly_data[yr]["active_grid_cells"] += 1
            yearly_data[yr]["modis_observations"] += r.modis_detection_count
            yearly_data[yr]["viirs_observations"] += r.viirs_detection_count
            if r.cross_sensor_presence:
                yearly_data[yr]["co_detected_cells"] += 1

            monthly_seasonality[mo]["active_cells"] += 1
            monthly_seasonality[mo]["modis_count"] += r.modis_detection_count
            monthly_seasonality[mo]["viirs_count"] += r.viirs_detection_count

        years_sorted = sorted(yearly_data.values(), key=lambda x: x["year"])
        seasonality_sorted = sorted(monthly_seasonality.values(), key=lambda x: x["month"])

        # Sensor historical eras documentation
        sensor_eras = [
            {"era": "MODIS Baseline Era", "years": "2000 - 2011", "satellites": "Terra (2000+), Aqua (2002+)", "description": "Single-family continuous 1km observation baseline"},
            {"era": "MODIS + VIIRS Suomi-NPP Overlap", "years": "2012 - 2017", "satellites": "Terra, Aqua, Suomi-NPP", "description": "Introduction of 375m VIIRS sensor on S-NPP"},
            {"era": "Modern Constellation Era", "years": "2018 - 2026", "satellites": "Terra, Aqua, NOAA-20 (2018+), NOAA-21 (2023+)", "description": "Multi-satellite high-frequency active fire observation"},
            {"era": "Post-Suomi-NPP Era", "years": "Nov 2026+", "satellites": "Terra, Aqua, NOAA-20, NOAA-21", "description": "Suomi-NPP data delivery ceased on Nov 2, 2026"}
        ]

        return {
            "series_type": series_type,
            "years": years_sorted,
            "seasonality": seasonality_sorted,
            "sensor_eras": sensor_eras
        }

