import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import Observation, DailyGridActivity
from ..utils.geo import grid_cell_to_bounds_wgs84

logger = logging.getLogger(__name__)

class HarmonizationEngine:
    """
    Core Geospatial & Temporal Harmonization Engine for MODIS and VIIRS Hotspots.
    
    Transforms heterogeneous satellite detections from MODIS (1km nominal resolution)
    and VIIRS (375m nominal resolution) into a standardized 1km x 1km equal-area analytical grid
    (EPSG:6933) on UTC daily periods.
    
    Identifies cross-sensor co-detected cell-days while preserving sensor integrity,
    original thermal measurements, and individual sensor footprints.
    """

    @staticmethod
    def aggregate_observations(observations: List[Observation]) -> List[Dict[str, Any]]:
        """
        Group normalized observations by (grid_cell_id, acquisition_date_utc) and compute
        harmonized metrics.
        """
        grouped = defaultdict(list)
        for obs in observations:
            key = (obs.grid_cell_id, obs.acquisition_date_utc)
            grouped[key].append(obs)

        harmonized_records = []

        for (grid_cell_id, date_utc), obs_list in grouped.items():
            modis_obs = [o for o in obs_list if o.sensor_family == "MODIS"]
            viirs_obs = [o for o in obs_list if o.sensor_family == "VIIRS"]

            modis_count = len(modis_obs)
            viirs_count = len(viirs_obs)

            # Determine sensor presence
            if modis_count > 0 and viirs_count > 0:
                sensors_present = "MODIS+VIIRS"
                cross_sensor_presence = True
            elif modis_count > 0:
                sensors_present = "MODIS"
                cross_sensor_presence = False
            else:
                sensors_present = "VIIRS"
                cross_sensor_presence = False

            # MODIS FRP metrics
            modis_frp_vals = [o.frp_mw for o in modis_obs if o.frp_mw is not None and o.frp_mw >= 0]
            modis_frp_mean = round(sum(modis_frp_vals) / len(modis_frp_vals), 2) if modis_frp_vals else None
            modis_frp_max = round(max(modis_frp_vals), 2) if modis_frp_vals else None

            # VIIRS FRP metrics
            viirs_frp_vals = [o.frp_mw for o in viirs_obs if o.frp_mw is not None and o.frp_mw >= 0]
            viirs_frp_mean = round(sum(viirs_frp_vals) / len(viirs_frp_vals), 2) if viirs_frp_vals else None
            viirs_frp_max = round(max(viirs_frp_vals), 2) if viirs_frp_vals else None

            # Confidence distributions
            modis_conf_dist = {"low": 0, "nominal": 0, "high": 0}
            for o in modis_obs:
                try:
                    conf_int = int(o.confidence_raw)
                    if conf_int < 30:
                        modis_conf_dist["low"] += 1
                    elif conf_int <= 80:
                        modis_conf_dist["nominal"] += 1
                    else:
                        modis_conf_dist["high"] += 1
                except (ValueError, TypeError):
                    modis_conf_dist["nominal"] += 1

            viirs_conf_dist = {"low": 0, "nominal": 0, "high": 0}
            for o in viirs_obs:
                c_str = str(o.confidence_raw).lower()
                if c_str in ("l", "low"):
                    viirs_conf_dist["low"] += 1
                elif c_str in ("h", "high"):
                    viirs_conf_dist["high"] += 1
                else:
                    viirs_conf_dist["nominal"] += 1

            # Grid cell geometry calculation
            # Parse cell coordinates from grid_cell_id: "cell_1km_{cell_x}_{cell_y}"
            parts = grid_cell_id.split("_")
            cell_x = int(parts[2])
            cell_y = int(parts[3])
            bounds_info = grid_cell_to_bounds_wgs84(cell_x, cell_y)

            harmonized_records.append({
                "grid_cell_id": grid_cell_id,
                "activity_date_utc": date_utc,
                "modis_detection_count": modis_count,
                "viirs_detection_count": viirs_count,
                "active_grid_cell": True,
                "sensors_present": sensors_present,
                "cross_sensor_presence": cross_sensor_presence,
                "modis_frp_mean": modis_frp_mean,
                "modis_frp_max": modis_frp_max,
                "viirs_frp_mean": viirs_frp_mean,
                "viirs_frp_max": viirs_frp_max,
                "modis_confidence_distribution": modis_conf_dist,
                "viirs_confidence_distribution": viirs_conf_dist,
                "cell_center_lat": round(bounds_info["center_lat"], 6),
                "cell_center_lon": round(bounds_info["center_lon"], 6),
                "cell_bounds_wgs84": {
                    "west": round(bounds_info["west"], 6),
                    "south": round(bounds_info["south"], 6),
                    "east": round(bounds_info["east"], 6),
                    "north": round(bounds_info["north"], 6),
                }
            })

        return harmonized_records

    @classmethod
    def run_harmonization(
        cls,
        db: Session,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Execute harmonization pipeline across specified date and coordinate filters.
        Updates or inserts daily_grid_activity records and returns summary report.
        """
        query = db.query(Observation)
        if date_from:
            query = query.filter(Observation.acquisition_date_utc >= date_from)
        if date_to:
            query = query.filter(Observation.acquisition_date_utc <= date_to)
        if west is not None:
            query = query.filter(Observation.longitude >= west)
        if east is not None:
            query = query.filter(Observation.longitude <= east)
        if south is not None:
            query = query.filter(Observation.latitude >= south)
        if north is not None:
            query = query.filter(Observation.latitude <= north)

        observations = query.all()
        if not observations:
            return {
                "status": "NO_DATA",
                "observations_processed": 0,
                "active_grid_cells_created": 0,
                "cross_sensor_cell_days": 0,
                "modis_only_cell_days": 0,
                "viirs_only_cell_days": 0,
            }

        harmonized = cls.aggregate_observations(observations)
        
        # Persist / Upsert into daily_grid_activity
        cells_upserted = 0
        cross_sensor_count = 0
        modis_only_count = 0
        viirs_only_count = 0

        for item in harmonized:
            existing = db.query(DailyGridActivity).filter_by(
                grid_cell_id=item["grid_cell_id"],
                activity_date_utc=item["activity_date_utc"]
            ).first()

            if existing:
                existing.modis_detection_count = item["modis_detection_count"]
                existing.viirs_detection_count = item["viirs_detection_count"]
                existing.active_grid_cell = item["active_grid_cell"]
                existing.sensors_present = item["sensors_present"]
                existing.cross_sensor_presence = item["cross_sensor_presence"]
                existing.modis_frp_mean = item["modis_frp_mean"]
                existing.modis_frp_max = item["modis_frp_max"]
                existing.viirs_frp_mean = item["viirs_frp_mean"]
                existing.viirs_frp_max = item["viirs_frp_max"]
                existing.modis_confidence_distribution = json.dumps(item["modis_confidence_distribution"])
                existing.viirs_confidence_distribution = json.dumps(item["viirs_confidence_distribution"])
                existing.cell_center_lat = item["cell_center_lat"]
                existing.cell_center_lon = item["cell_center_lon"]
                existing.cell_bounds_wgs84 = json.dumps(item["cell_bounds_wgs84"])
            else:
                new_grid = DailyGridActivity(
                    grid_cell_id=item["grid_cell_id"],
                    activity_date_utc=item["activity_date_utc"],
                    modis_detection_count=item["modis_detection_count"],
                    viirs_detection_count=item["viirs_detection_count"],
                    active_grid_cell=item["active_grid_cell"],
                    sensors_present=item["sensors_present"],
                    cross_sensor_presence=item["cross_sensor_presence"],
                    modis_frp_mean=item["modis_frp_mean"],
                    modis_frp_max=item["modis_frp_max"],
                    viirs_frp_mean=item["viirs_frp_mean"],
                    viirs_frp_max=item["viirs_frp_max"],
                    modis_confidence_distribution=json.dumps(item["modis_confidence_distribution"]),
                    viirs_confidence_distribution=json.dumps(item["viirs_confidence_distribution"]),
                    cell_center_lat=item["cell_center_lat"],
                    cell_center_lon=item["cell_center_lon"],
                    cell_bounds_wgs84=json.dumps(item["cell_bounds_wgs84"]),
                    created_at=datetime.now(timezone.utc)
                )
                db.add(new_grid)

            cells_upserted += 1
            if item["cross_sensor_presence"]:
                cross_sensor_count += 1
            elif item["sensors_present"] == "MODIS":
                modis_only_count += 1
            else:
                viirs_only_count += 1

        db.commit()

        return {
            "status": "SUCCESS",
            "observations_processed": len(observations),
            "active_grid_cells_created": cells_upserted,
            "cross_sensor_cell_days": cross_sensor_count,
            "modis_only_cell_days": modis_only_count,
            "viirs_only_cell_days": viirs_only_count,
        }

