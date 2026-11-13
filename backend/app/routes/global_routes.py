from flask import Blueprint, request, jsonify
from ..services.global_service import GlobalFireService
from ..utils.countries_data import get_countries_list, get_continents_list, get_country_by_iso3

global_bp = Blueprint("global_fire", __name__)

@global_bp.route("/global/summary", methods=["GET"])
def get_global_summary():
    """
    Worldwide aggregate metrics, continent breakdowns, and top active countries.
    """
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    summary = GlobalFireService.get_global_summary(date_from=date_from, date_to=date_to)
    return jsonify(summary)

@global_bp.route("/global/continents", methods=["GET"])
def get_continents():
    """
    Returns list of all continents with bounding boxes and centroids.
    """
    return jsonify(get_continents_list())

@global_bp.route("/global/countries", methods=["GET"])
def get_countries():
    """
    Returns directory of all countries with ISO3, names, continents, and bounds.
    """
    continent = request.args.get("continent")
    countries = get_countries_list()
    if continent and continent != "all":
        countries = [c for c in countries if c.get("continent", "").lower() == continent.lower()]
    return jsonify(countries)

@global_bp.route("/global/country/<iso3>/summary", methods=["GET"])
def get_country_summary(iso3):
    """
    Returns detailed fire observations and recent timeline for a specific country.
    """
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    res = GlobalFireService.get_country_analytics(iso3, date_from=date_from, date_to=date_to)
    if not res:
        return jsonify({"error": f"Country '{iso3}' not found"}), 404
    return jsonify(res)

@global_bp.route("/global/map-density", methods=["GET"])
def get_map_density():
    """
    Zoom-dependent server-side spatial clustering for high performance world viewing.
    """
    west = request.args.get("west", default=-180.0, type=float)
    south = request.args.get("south", default=-90.0, type=float)
    east = request.args.get("east", default=180.0, type=float)
    north = request.args.get("north", default=90.0, type=float)
    zoom = request.args.get("zoom", default=3, type=int)
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    density = GlobalFireService.get_map_density(
        west=west, south=south, east=east, north=north,
        zoom=zoom, date_from=date_from, date_to=date_to
    )
    return jsonify(density)

@global_bp.route("/global/coverage", methods=["GET"])
def get_coverage():
    """
    Returns the Global Data Coverage matrix.
    """
    coverage = GlobalFireService.get_coverage_matrix()
    return jsonify(coverage)

@global_bp.route("/global/timemachine", methods=["GET"])
def get_time_machine():
    """
    Returns pre-aggregated daily animation frames for the global time machine.
    """
    date_from = request.args.get("date_from", "2020-01-01")
    date_to = request.args.get("date_to", "2026-11-30")
    west = request.args.get("west", default=-180.0, type=float)
    south = request.args.get("south", default=-90.0, type=float)
    east = request.args.get("east", default=180.0, type=float)
    north = request.args.get("north", default=90.0, type=float)

    frames = GlobalFireService.get_time_machine_frames(
        date_from=date_from, date_to=date_to,
        west=west, south=south, east=east, north=north
    )
    return jsonify({
        "frames": frames,
        "total_days": len(frames),
        "data": frames
    })

@global_bp.route("/global/comparison", methods=["GET"])
def get_multi_country_comparison():
    """
    Compares up to 5 countries side-by-side.
    Query param: `countries=IND,BRA,USA,AUS,CAN`
    """
    countries_param = request.args.get("countries", "IND,BRA,USA,AUS,CAN")
    iso_list = [c.strip().upper() for c in countries_param.split(",") if c.strip()][:5]
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    formatted_countries = []
    raw_results = []
    for iso3 in iso_list:
        data = GlobalFireService.get_country_analytics(iso3, date_from=date_from, date_to=date_to)
        if data:
            raw_results.append(data)
            c = data["country"]
            k = data["kpi"]
            modis_cnt = k.get("modis_observations", 0)
            viirs_cnt = k.get("viirs_observations", 0)
            ratio = round(viirs_cnt / modis_cnt, 2) if modis_cnt > 0 else 0.0

            formatted_countries.append({
                "iso3": c.get("iso3", iso3),
                "name": c.get("name", iso3),
                "continent": c.get("continent", "Global"),
                "total_observations": k.get("total_observations", 0),
                "modis_observations": modis_cnt,
                "viirs_observations": viirs_cnt,
                "active_cells": k.get("active_grid_cells", 0),
                "mean_frp": k.get("mean_frp_mw", 0.0),
                "detection_ratio": ratio
            })

    return jsonify({
        "countries": formatted_countries,
        "comparison": raw_results,
        "metrics": {"total_compared": len(formatted_countries)}
    })
