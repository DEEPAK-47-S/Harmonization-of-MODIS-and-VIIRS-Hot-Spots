from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from ..db import SessionLocal
from ..services.anomaly_service import AnomalyService

anomalies_bp = Blueprint("anomalies", __name__)

@anomalies_bp.route("/anomalies", methods=["GET"])
def get_anomalies():
    """
    Detect statistically unusual burning activity relative to multi-year seasonal baselines.
    Enforces historical data sufficiency safeguards.
    """
    date_to = request.args.get("date_to")
    date_from = request.args.get("date_from")
    
    # Default to last 30 days if not provided
    if not date_to:
        date_to = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not date_from:
        d_end = datetime.strptime(date_to, "%Y-%m-%d").date()
        date_from = (d_end - timedelta(days=30)).strftime("%Y-%m-%d")

    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)
    percentile = request.args.get("percentile", default=95.0, type=float)
    z_score = request.args.get("z_score", default=2.0, type=float)

    db = SessionLocal()
    try:
        results = AnomalyService.detect_anomalies_for_period(
            db=db,
            date_from=date_from,
            date_to=date_to,
            west=west,
            south=south,
            east=east,
            north=north,
            percentile_threshold=percentile,
            z_score_threshold=z_score
        )
        return jsonify(results), 200
    finally:
        db.close()

