from flask import Blueprint, request, Response
from ..db import SessionLocal
from ..services.export_service import ExportService

export_bp = Blueprint("export", __name__)

@export_bp.route("/export/csv", methods=["GET"])
def export_csv():
    """
    Download filtered active fire observations or daily grid activity as a CSV file.
    Query params:
    - type: 'observations' (default) or 'grid'
    - date_from, date_to
    - sensor: 'MODIS' or 'VIIRS'
    - west, south, east, north
    """
    export_type = request.args.get("type", "observations").lower()
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")
    sensor = request.args.get("sensor")
    west = request.args.get("west", type=float)
    south = request.args.get("south", type=float)
    east = request.args.get("east", type=float)
    north = request.args.get("north", type=float)

    db = SessionLocal()
    try:
        if export_type == "grid":
            csv_data = ExportService.export_grid_activity_csv(
                db=db,
                date_from=date_from,
                date_to=date_to,
                west=west,
                south=south,
                east=east,
                north=north
            )
            filename = f"firepulse_harmonized_grid_{date_from or 'all'}_{date_to or 'all'}.csv"
        else:
            csv_data = ExportService.export_observations_csv(
                db=db,
                date_from=date_from,
                date_to=date_to,
                sensor=sensor,
                west=west,
                south=south,
                east=east,
                north=north
            )
            filename = f"firepulse_observations_{sensor or 'all'}_{date_from or 'all'}_{date_to or 'all'}.csv"

        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    finally:
        db.close()

