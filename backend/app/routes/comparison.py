from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.trend_service import TrendService

comparison_bp = Blueprint("comparison", __name__)

@comparison_bp.route("/comparison", methods=["GET"])
def get_sensor_comparison():
    """
    Sensor comparison endpoint (MODIS vs VIIRS).
    Returns detection statistics, FRP metrics, confidence distribution,
    1km common-grid overlap analysis, and daily timeline.
    """
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        comparison_data = TrendService.get_sensor_comparison(
            db=db,
            date_from=date_from,
            date_to=date_to,
            west=west,
            south=south,
            east=east,
            north=north
        )
        return jsonify(comparison_data), 200
    finally:
        db.close()

