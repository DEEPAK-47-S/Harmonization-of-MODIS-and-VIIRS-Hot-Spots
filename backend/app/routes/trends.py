from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.trend_service import TrendService

trends_bp = Blueprint("trends", __name__)

@trends_bp.route("/trends", methods=["GET"])
def get_trends():
    """
    Historical trends across years and months, with sensor era demarcation.
    Query params:
    - series_type: 'harmonized', 'modis', 'viirs', 'overlap'
    - west, south, east, north
    """
    series_type = request.args.get("series_type", "harmonized")
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        trends_data = TrendService.get_historical_trends(
            db=db,
            series_type=series_type,
            west=west,
            south=south,
            east=east,
            north=north
        )
        return jsonify(trends_data), 200
    finally:
        db.close()

