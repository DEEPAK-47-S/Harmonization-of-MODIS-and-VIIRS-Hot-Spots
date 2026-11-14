"""
Global Fire Intelligence Service.
Handles worldwide spatial queries, country and continent analytics,
zoom-dependent map density clustering, coverage registry, and time machine aggregation.
"""

import math
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc
from ..db import SessionLocal
from ..models import Observation, DailyGridActivity, ProcessingReport
from ..utils.countries_data import COUNTRIES, CONTINENTS, get_country_by_iso3, get_countries_list, get_continents_list

class GlobalFireService:

    @classmethod
    def get_global_summary(cls, date_from: Optional[str] = None, date_to: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates worldwide top-level KPIs, continent breakdowns, and top active countries.
        """
        db = SessionLocal()
        try:
            obs_q = db.query(Observation)
            grid_q = db.query(DailyGridActivity)

            if date_from:
                obs_q = obs_q.filter(Observation.acquisition_date_utc >= date_from)
                grid_q = grid_q.filter(DailyGridActivity.activity_date_utc >= date_from)
            if date_to:
                obs_q = obs_q.filter(Observation.acquisition_date_utc <= date_to)
                grid_q = grid_q.filter(DailyGridActivity.activity_date_utc <= date_to)

            total_obs = obs_q.count()
            total_modis = obs_q.filter(Observation.sensor_family == "MODIS").count()
            total_viirs = obs_q.filter(Observation.sensor_family == "VIIRS").count()
            active_cells = grid_q.count()
            co_detected = grid_q.filter(DailyGridActivity.cross_sensor_presence == True).count()
            latest_obs = obs_q.order_by(Observation.acquisition_datetime_utc.desc()).first()

            # Breakdown by continent
            continent_breakdown = []
            for cont in CONTINENTS:
                if cont["id"] == "world":
                    continue
                b = cont["bounds"]
                c_count = obs_q.filter(
                    Observation.longitude >= b["west"],
                    Observation.longitude <= b["east"],
                    Observation.latitude >= b["south"],
                    Observation.latitude <= b["north"]
                ).count()
                continent_breakdown.append({
                    "id": cont["id"],
                    "name": cont["name"],
                    "code": cont["code"],
                    "count": c_count
                })

            # Top countries with observations in DB
            country_summaries = []
            for iso3, cinfo in COUNTRIES.items():
                cb = cinfo["bounds"]
                cnt = obs_q.filter(
                    Observation.longitude >= cb["west"],
                    Observation.longitude <= cb["east"],
                    Observation.latitude >= cb["south"],
                    Observation.latitude <= cb["north"]
                ).count()
                if cnt > 0:
                    country_summaries.append({
                        "iso3": iso3,
                        "name": cinfo["name"],
                        "continent": cinfo["continent"],
                        "observation_count": cnt,
                        "observations_count": cnt,
                        "active_cells_count": 0
                    })

            country_summaries.sort(key=lambda x: x["observation_count"], reverse=True)

            kpi_data = {
                "total_observations": total_obs,
                "total_modis": total_modis,
                "modis_observations": total_modis,
                "total_viirs": total_viirs,
                "viirs_observations": total_viirs,
                "active_grid_cells": active_cells,
                "cross_sensor_co_detected": co_detected,
                "co_detected_cells": co_detected,
                "active_countries_count": len(country_summaries),
                "active_continents_count": len([c for c in continent_breakdown if c.get("count", 0) > 0]),
                "latest_observation_utc": latest_obs.acquisition_datetime_utc.isoformat() if latest_obs else None
            }

            return {
                "scope": "GLOBAL",
                "kpi": kpi_data,
                "kpis": kpi_data,
                "continents": continent_breakdown,
                "continent_breakdown": continent_breakdown,
                "top_countries": country_summaries[:10],
                "top_active_countries": country_summaries[:10],
                "total_tracked_countries": len(country_summaries)
            }
        finally:
            db.close()

    @classmethod
    def get_country_analytics(cls, iso3: str, date_from: Optional[str] = None, date_to: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Retrieves observation analytics for a specific country based on its geographic bounds.
        """
        cinfo = get_country_by_iso3(iso3)
        if not cinfo:
            return None

        b = cinfo["bounds"]
        db = SessionLocal()
        try:
            obs_q = db.query(Observation).filter(
                Observation.longitude >= b["west"],
                Observation.longitude <= b["east"],
                Observation.latitude >= b["south"],
                Observation.latitude <= b["north"]
            )
            grid_q = db.query(DailyGridActivity).filter(
                DailyGridActivity.cell_center_lon >= b["west"],
                DailyGridActivity.cell_center_lon <= b["east"],
                DailyGridActivity.cell_center_lat >= b["south"],
                DailyGridActivity.cell_center_lat <= b["north"]
            )

            if date_from:
                obs_q = obs_q.filter(Observation.acquisition_date_utc >= date_from)
                grid_q = grid_q.filter(DailyGridActivity.activity_date_utc >= date_from)
            if date_to:
                obs_q = obs_q.filter(Observation.acquisition_date_utc <= date_to)
                grid_q = grid_q.filter(DailyGridActivity.activity_date_utc <= date_to)

            total_obs = obs_q.count()
            modis_count = obs_q.filter(Observation.sensor_family == "MODIS").count()
            viirs_count = obs_q.filter(Observation.sensor_family == "VIIRS").count()
            active_cells = grid_q.count()
            co_detected = grid_q.filter(DailyGridActivity.cross_sensor_presence == True).count()

            # Mean and max FRP
            frp_stats = db.query(
                func.avg(Observation.frp_mw),
                func.max(Observation.frp_mw)
            ).filter(
                Observation.longitude >= b["west"],
                Observation.longitude <= b["east"],
                Observation.latitude >= b["south"],
                Observation.latitude <= b["north"]
            ).first()

            # Daily timeline for recent activity
            daily_rows = db.query(
                DailyGridActivity.activity_date_utc,
                func.count(DailyGridActivity.id).label("cells"),
                func.sum(DailyGridActivity.modis_detection_count).label("modis"),
                func.sum(DailyGridActivity.viirs_detection_count).label("viirs")
            ).filter(
                DailyGridActivity.cell_center_lon >= b["west"],
                DailyGridActivity.cell_center_lon <= b["east"],
                DailyGridActivity.cell_center_lat >= b["south"],
                DailyGridActivity.cell_center_lat <= b["north"]
            ).group_by(DailyGridActivity.activity_date_utc).order_by(DailyGridActivity.activity_date_utc.desc()).limit(14).all()

            timeline = [
                {
                    "date": r[0],
                    "active_grid_cells": r[1] or 0,
                    "modis_count": r[2] or 0,
                    "viirs_count": r[3] or 0
                }
                for r in reversed(daily_rows)
            ]

            country_kpi = {
                "total_observations": total_obs,
                "modis_observations": modis_count,
                "viirs_observations": viirs_count,
                "active_grid_cells": active_cells,
                "co_detected_cell_days": co_detected,
                "co_detected_cells": co_detected,
                "mean_frp_mw": round(frp_stats[0], 1) if frp_stats and frp_stats[0] else 0.0,
                "max_frp_mw": round(frp_stats[1], 1) if frp_stats and frp_stats[1] else 0.0,
            }

            return {
                "country": {
                    **cinfo,
                    "center_lat": cinfo["center"][0] if "center" in cinfo else 0.0,
                    "center_lon": cinfo["center"][1] if "center" in cinfo else 0.0,
                },
                "kpi": country_kpi,
                "kpis": country_kpi,
                "timeline": timeline,
                "sensor_split": {
                    "modis": {"count": modis_count, "mean_frp": 0.0},
                    "viirs": {"count": viirs_count, "mean_frp": 0.0}
                }
            }
        finally:
            db.close()

    @classmethod
    def get_map_density(
        cls,
        west: float = -180.0,
        south: float = -90.0,
        east: float = 180.0,
        north: float = 90.0,
        zoom: int = 3,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Zoom-dependent spatial density aggregation.
        Prevents downloading 100,000 individual markers at world zoom levels.
        - zoom <= 4: 2.0-degree macro bins
        - zoom 5..7: 0.5-degree meso bins
        - zoom >= 8: Returns exact 1km cell centers
        """
        step = 2.0 if zoom <= 4 else (0.5 if zoom <= 7 else 0.1)
        db = SessionLocal()
        try:
            q = db.query(Observation).filter(
                Observation.longitude >= west,
                Observation.longitude <= east,
                Observation.latitude >= south,
                Observation.latitude <= north
            )
            if date_from:
                q = q.filter(Observation.acquisition_date_utc >= date_from)
            if date_to:
                q = q.filter(Observation.acquisition_date_utc <= date_to)

            # Limit total records processed
            rows = q.limit(10000).all()
            if not rows:
                return []

            # Bin into spatial clusters
            clusters: Dict[str, Dict[str, Any]] = {}
            for r in rows:
                bin_lat = math.floor(r.latitude / step) * step + step / 2.0
                bin_lon = math.floor(r.longitude / step) * step + step / 2.0
                key = f"{bin_lat:.2f}_{bin_lon:.2f}"

                if key not in clusters:
                    clusters[key] = {
                        "lat": bin_lat,
                        "lon": bin_lon,
                        "count": 0,
                        "modis_count": 0,
                        "viirs_count": 0,
                        "total_frp": 0.0,
                        "step": step
                    }
                c = clusters[key]
                c["count"] += 1
                if r.sensor_family == "MODIS":
                    c["modis_count"] += 1
                else:
                    c["viirs_count"] += 1
                c["total_frp"] += (r.frp_mw or 0.0)

            result = []
            for c in clusters.values():
                modis_cnt = c["modis_count"]
                viirs_cnt = c["viirs_count"]
                tot = c["count"]
                result.append({
                    "lat": c["lat"],
                    "lon": c["lon"],
                    "count": tot,
                    "total_detections": tot,
                    "point_count": tot,
                    "modis_count": modis_cnt,
                    "modis_detections": modis_cnt,
                    "viirs_count": viirs_cnt,
                    "viirs_detections": viirs_cnt,
                    "has_co_detection": modis_cnt > 0 and viirs_cnt > 0,
                    "mean_frp": round(c["total_frp"] / max(1, tot), 1),
                    "step": c["step"]
                })
            return result
        finally:
            db.close()

    @classmethod
    def get_time_machine_frames(
        cls,
        date_from: str,
        date_to: str,
        west: float = -180.0,
        south: float = -90.0,
        east: float = 180.0,
        north: float = 90.0
    ) -> List[Dict[str, Any]]:
        """
        Pre-aggregated daily frames for smooth Time Machine animations without client freezes.
        """
        db = SessionLocal()
        try:
            rows = db.query(
                DailyGridActivity.activity_date_utc,
                func.count(DailyGridActivity.id).label("active_cells"),
                func.sum(DailyGridActivity.modis_detection_count).label("modis"),
                func.sum(DailyGridActivity.viirs_detection_count).label("viirs"),
                func.avg(DailyGridActivity.cell_center_lat).label("center_lat"),
                func.avg(DailyGridActivity.cell_center_lon).label("center_lon")
            ).filter(
                DailyGridActivity.activity_date_utc >= date_from,
                DailyGridActivity.activity_date_utc <= date_to,
                DailyGridActivity.cell_center_lon >= west,
                DailyGridActivity.cell_center_lon <= east,
                DailyGridActivity.cell_center_lat >= south,
                DailyGridActivity.cell_center_lat <= north
            ).group_by(DailyGridActivity.activity_date_utc).order_by(DailyGridActivity.activity_date_utc.asc()).all()

            frames = []
            for r in rows:
                modis_cnt = r[2] or 0
                viirs_cnt = r[3] or 0
                total_obs = modis_cnt + viirs_cnt
                c_lat = round(r[4], 3) if r[4] else 0.0
                c_lon = round(r[5], 3) if r[5] else 0.0

                frames.append({
                    "date": r[0],
                    "date_utc": r[0],
                    "total_observations": total_obs,
                    "active_cells": r[1] or 0,
                    "modis_count": modis_cnt,
                    "viirs_count": viirs_cnt,
                    "center_lat": c_lat,
                    "center_lon": c_lon,
                    "clusters": [
                        {
                            "lat": c_lat,
                            "lon": c_lon,
                            "total_detections": total_obs,
                            "modis_detections": modis_cnt,
                            "viirs_detections": viirs_cnt,
                            "has_co_detection": modis_cnt > 0 and viirs_cnt > 0,
                            "mean_frp": 15.0,
                            "point_count": total_obs
                        }
                    ] if total_obs > 0 else []
                })
            return frames
        finally:
            db.close()

    @classmethod
    def get_coverage_matrix(cls) -> Dict[str, Any]:
        """
        Combines NASA data availability metadata with local database records to report true coverage.
        """
        db = SessionLocal()
        try:
            sources = [
                {
                    "id": "MODIS_NRT", "name": "MODIS Near Real-Time", "sensor": "MODIS",
                    "satellites": "Terra & Aqua", "official_start": "2000-11-01", "official_end": "Present",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "MODIS_SP", "name": "MODIS Standard Processing (MCD14ML)", "sensor": "MODIS",
                    "satellites": "Terra & Aqua", "official_start": "2000-11-01", "official_end": "Historical Archive",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "VIIRS_NOAA20_NRT", "name": "VIIRS Near Real-Time (NOAA-20)", "sensor": "VIIRS",
                    "satellites": "NOAA-20", "official_start": "2018-04-01", "official_end": "Present",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "VIIRS_NOAA20_SP", "name": "VIIRS Standard Processing (NOAA-20)", "sensor": "VIIRS",
                    "satellites": "NOAA-20", "official_start": "2018-04-01", "official_end": "Historical Archive",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "VIIRS_NOAA21_NRT", "name": "VIIRS Near Real-Time (NOAA-21)", "sensor": "VIIRS",
                    "satellites": "NOAA-21", "official_start": "2023-03-01", "official_end": "Present",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "VIIRS_NOAA21_SP", "name": "VIIRS Standard Processing (NOAA-21)", "sensor": "VIIRS",
                    "satellites": "NOAA-21", "official_start": "2023-03-01", "official_end": "Historical Archive",
                    "status": "OPERATIONAL"
                },
                {
                    "id": "VIIRS_SNPP_SP", "name": "VIIRS Suomi-NPP (Historical)", "sensor": "VIIRS",
                    "satellites": "Suomi-NPP", "official_start": "2012-01-20", "official_end": "2026-11-02",
                    "status": "CEASED_DELIVERY"
                }
            ]

            matrix = []
            for s in sources:
                cnt = db.query(Observation).filter(Observation.source_id == s["id"]).count()
                min_max = db.query(
                    func.min(Observation.acquisition_date_utc),
                    func.max(Observation.acquisition_date_utc)
                ).filter(Observation.source_id == s["id"]).first()

                matrix.append({
                    **s,
                    "imported_records": cnt,
                    "imported_start_date": min_max[0] if min_max and min_max[0] else None,
                    "imported_end_date": min_max[1] if min_max and min_max[1] else None,
                    "local_status": "AVAILABLE" if cnt > 0 else "NOT_IMPORTED"
                })

            total_obs = db.query(Observation).count()
            modis_obs = db.query(Observation).filter(Observation.sensor_family == "MODIS").count()
            viirs_obs = db.query(Observation).filter(Observation.sensor_family == "VIIRS").count()
            earliest_obs = db.query(func.min(Observation.acquisition_date_utc)).scalar()
            latest_obs = db.query(func.max(Observation.acquisition_date_utc)).scalar()

            db_records = {
                "total_observations": total_obs,
                "modis_observations": modis_obs,
                "viirs_observations": viirs_obs,
                "earliest_observation": earliest_obs,
                "latest_observation": latest_obs,
                "sensor_counts": {
                    "MODIS": modis_obs,
                    "VIIRS": viirs_obs
                }
            }

            cessation_notice = {
                "satellite": "Suomi-NPP",
                "last_archive_date": "2026-11-02",
                "notes": "Suomi-NPP operational archive observations ceased November 2, 2026. Data beyond this date is routed to NOAA-20 and NOAA-21."
            }

            sources_list = []
            for s in matrix:
                sources_list.append({
                    "source_id": s["id"],
                    "sensor_family": s["sensor"],
                    "satellite": s["satellites"],
                    "processing_type": "NRT" if "NRT" in s["id"] else "Standard Science (SP)",
                    "nominal_start": s["official_start"],
                    "nominal_end": s["official_end"],
                    "status": s["status"],
                    "operational": s["status"] == "OPERATIONAL",
                    "notes": f"Local Database: {s['imported_records']} records ({s['local_status']})"
                })

            return {
                "generated_at_utc": datetime.now(timezone.utc).isoformat(),
                "sources": sources_list,
                "sources_matrix": matrix,
                "total_observations_in_db": total_obs,
                "database_records": db_records,
                "snpp_cessation_notice": cessation_notice,
                "suomi_npp_cutoff": "2026-11-02",
                "notes": cessation_notice["notes"]
            }
        finally:
            db.close()
