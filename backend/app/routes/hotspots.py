from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..models import Observation, DailyGridActivity

hotspots_bp = Blueprint("hotspots", __name__)

@hotspots_bp.route("/hotspots", methods=["GET"])
def get_hotspots():
    """
    Retrieve hotspot observations for the interactive map.
    Supports sensor filters, spatial bounds, date ranges, and optional grid cell overlays.
    """
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    sensor = request.args.get("sensor")
    min_frp = request.args.get("min_frp", type=float)
    limit = min(request.args.get("limit", default=5000, type=int), 20000)
    include_grid = request.args.get("include_grid", "false").lower() == "true"

    db = SessionLocal()

    query = db.query(Observation)
    if west is not None:
        query = query.filter(Observation.longitude >= west)
    if east is not None:
        query = query.filter(Observation.longitude <= east)
    if south is not None:
        query = query.filter(Observation.latitude >= south)
    if north is not None:
        query = query.filter(Observation.latitude <= north)
    if date_from:
        query = query.filter(Observation.acquisition_date_utc >= date_from)
    if date_to:
        query = query.filter(Observation.acquisition_date_utc <= date_to)
    if sensor and sensor.upper() in ("MODIS", "VIIRS"):
        query = query.filter(Observation.sensor_family == sensor.upper())
    if min_frp is not None and min_frp > 0:
        query = query.filter(Observation.frp_mw >= min_frp)

    total_count = query.count()
    records = query.order_by(Observation.acquisition_datetime_utc.desc()).limit(limit).all()

    hotspots = [r.to_dict() for r in records]

    grid_cells = []
    if include_grid:
        g_query = db.query(DailyGridActivity)
        if west is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            g_query = g_query.filter(DailyGridActivity.cell_center_lat <= north)
        if date_from:
            g_query = g_query.filter(DailyGridActivity.activity_date_utc >= date_from)
        if date_to:
            g_query = g_query.filter(DailyGridActivity.activity_date_utc <= date_to)

        grid_cells = [g.to_dict() for g in g_query.limit(2000).all()]

    db.close()

    return jsonify({
        "total_matching": total_count,
        "returned_count": len(hotspots),
        "hotspots": hotspots,
        "grid_cells": grid_cells
    }), 200

