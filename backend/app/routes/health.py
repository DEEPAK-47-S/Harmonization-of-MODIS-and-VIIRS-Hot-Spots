from flask import Blueprint, jsonify
from sqlalchemy import text
from ..config import Config
from ..db import SessionLocal

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint. Never exposes actual secrets."""
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
        db.close()
    except Exception as e:
        db_ok = False

    has_key = bool(Config.FIRMS_MAP_KEY and Config.FIRMS_MAP_KEY != "YOUR_NASA_MAP_KEY")

    return jsonify({
        "status": "healthy" if db_ok else "degraded",
        "service": "FirePulse Backend API",
        "version": "1.0.0",
        "database_connected": db_ok,
        "firms_map_key_configured": has_key,
        "supported_sources_count": len(Config.SUPPORTED_SOURCES),
        "default_aoi": Config.DEFAULT_AOI["name"],
        "notice": "Independent student project using NASA FIRMS data. Not an official NASA product or certified emergency alert system."
    }), 200
