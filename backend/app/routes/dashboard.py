from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from sqlalchemy import func, case
from ..config import Config
from ..db import SessionLocal
from ..models import Observation, DailyGridActivity, ProcessingReport

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/summary", methods=["GET"])
def get_dashboard_summary():
    """
    Get top-level dashboard metrics for the selected AOI and date range.
    Includes KPI counters, sensor breakdown, and latest 14-day activity timeline.
    """
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    db = SessionLocal()

    # Query Observations
    obs_q = db.query(Observation)
    if west is not None:
        obs_q = obs_q.filter(Observation.longitude >= west)
    if east is not None:
        obs_q = obs_q.filter(Observation.longitude <= east)
    if south is not None:
        obs_q = obs_q.filter(Observation.latitude >= south)
    if north is not None:
        obs_q = obs_q.filter(Observation.latitude <= north)
    if date_from:
        obs_q = obs_q.filter(Observation.acquisition_date_utc >= date_from)
    if date_to:
        obs_q = obs_q.filter(Observation.acquisition_date_utc <= date_to)

    total_modis = obs_q.filter(Observation.sensor_family == "MODIS").count()
    total_viirs = obs_q.filter(Observation.sensor_family == "VIIRS").count()
    latest_obs = obs_q.order_by(Observation.acquisition_datetime_utc.desc()).first()

    # Query DailyGridActivity
    grid_q = db.query(DailyGridActivity)
    if west is not None:
        grid_q = grid_q.filter(DailyGridActivity.cell_center_lon >= west)
    if east is not None:
        grid_q = grid_q.filter(DailyGridActivity.cell_center_lon <= east)
    if south is not None:
        grid_q = grid_q.filter(DailyGridActivity.cell_center_lat >= south)
    if north is not None:
        grid_q = grid_q.filter(DailyGridActivity.cell_center_lat <= north)
    if date_from:
        grid_q = grid_q.filter(DailyGridActivity.activity_date_utc >= date_from)
    if date_to:
        grid_q = grid_q.filter(DailyGridActivity.activity_date_utc <= date_to)

    active_grid_cells = grid_q.count()
    co_detected_cells = grid_q.filter(DailyGridActivity.cross_sensor_presence == True).count()

    # Recent 14-day timeline
    timeline_q = db.query(
        DailyGridActivity.activity_date_utc,
        func.count(DailyGridActivity.id).label("active_cells"),
        func.sum(DailyGridActivity.modis_detection_count).label("modis_count"),
        func.sum(DailyGridActivity.viirs_detection_count).label("viirs_count"),
        func.sum(case((DailyGridActivity.cross_sensor_presence == True, 1), else_=0)).label("co_detected")
    )
    if west is not None:
        timeline_q = timeline_q.filter(DailyGridActivity.cell_center_lon >= west)
    if east is not None:
        timeline_q = timeline_q.filter(DailyGridActivity.cell_center_lon <= east)
    if south is not None:
        timeline_q = timeline_q.filter(DailyGridActivity.cell_center_lat >= south)
    if north is not None:
        timeline_q = timeline_q.filter(DailyGridActivity.cell_center_lat <= north)

    timeline_data = timeline_q.group_by(DailyGridActivity.activity_date_utc)\
                              .order_by(DailyGridActivity.activity_date_utc.desc())\
                              .limit(14).all()

    timeline = []
    for t in reversed(timeline_data):
        timeline.append({
            "date": t.activity_date_utc,
            "active_grid_cells": int(t.active_cells or 0),
            "modis_count": int(t.modis_count or 0),
            "viirs_count": int(t.viirs_count or 0),
            "co_detected_cells": int(t.co_detected or 0)
        })

    # Latest data quality summary
    latest_report = db.query(ProcessingReport).order_by(ProcessingReport.created_at.desc()).first()

    db.close()

    return jsonify({
        "kpi": {
            "total_modis_observations": total_modis,
            "total_viirs_observations": total_viirs,
            "total_observations": total_modis + total_viirs,
            "active_grid_cell_days": active_grid_cells,
            "cross_sensor_co_detected_cell_days": co_detected_cells,
            "latest_observation_utc": latest_obs.acquisition_datetime_utc.isoformat() if latest_obs and latest_obs.acquisition_datetime_utc else None,
        },
        "recent_timeline": timeline,
        "latest_data_quality": latest_report.to_dict() if latest_report else None,
        "selected_aoi": {
            "west": west,
            "south": south,
            "east": east,
            "north": north
        }
    }), 200
