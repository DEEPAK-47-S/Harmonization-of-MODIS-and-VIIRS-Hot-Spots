from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.calendar_service import CalendarService

calendar_bp = Blueprint("calendar", __name__)

@calendar_bp.route("/calendar", methods=["GET"])
def get_calendar():
    """
    Retrieve burning activity calendar heatmap data.
    Query params:
    - year: int (e.g. 2026)
    - month: int (1-12)
    - metric: 'active_grid_cells', 'modis_observations', 'viirs_observations', 'cross_sensor_co_detections', 'mean_frp'
    - west, south, east, north
    """
    year = request.args.get("year", type=int)
    month = request.args.get("month", type=int)
    metric = request.args.get("metric", "active_grid_cells")
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        heatmap_data = CalendarService.get_calendar_heatmap(
            db=db,
            year=year,
            month=month,
            metric=metric,
            west=west,
            south=south,
            east=east,
            north=north
        )
        return jsonify(heatmap_data), 200
    finally:
        db.close()

@calendar_bp.route("/calendar/day", methods=["GET"])
def get_calendar_day():
    """
    Retrieve granular details for a single calendar day.
    Query params:
    - date: str (YYYY-MM-DD, required)
    - west, south, east, north
    """
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Query param 'date' (YYYY-MM-DD) is required"}), 400

    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        day_details = CalendarService.get_day_details(
            db=db,
            date_str=date_str,
            west=west,
            south=south,
            east=east,
            north=north
        )
        return jsonify(day_details), 200
    finally:
        db.close()

@calendar_bp.route("/calendar/matrix", methods=["GET"])
def get_calendar_matrix():
    """
    Retrieve Year x Month burning activity heatmap matrix (Rows: Years, Columns: Jan-Dec)
    with historical medians and anomaly indicators.
    Query params:
    - metric: 'active_grid_cells', 'modis_observations', 'viirs_observations', 'cross_sensor_co_detections', 'mean_frp'
    - west, south, east, north
    """
    metric = request.args.get("metric", "active_grid_cells")
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        matrix_data = CalendarService.get_multi_year_matrix(
            db=db,
            metric=metric,
            west=west,
            south=south,
            east=east,
            north=north
        )
        return jsonify(matrix_data), 200
    finally:
        db.close()

