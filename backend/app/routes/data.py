import csv
import io
import json
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..config import Config
from ..db import SessionLocal
from ..models import Observation, IngestionJob, ProcessingReport, DailyGridActivity
from ..services.firms_client import (
    FirmsClient, FirmsAPIError, MissingMapKeyError, InvalidMapKeyError, RateLimitExceededError
)
from ..services.data_availability import DataAvailabilityService
from ..services.normalization import NormalizationService
from ..services.harmonization_engine import HarmonizationEngine
from ..utils.geo import validate_aoi

logger = logging.getLogger(__name__)
data_bp = Blueprint("data", __name__)

@data_bp.route("/data/sources", methods=["GET"])
def get_sources():
    """List supported NASA FIRMS data sources with metadata and sensor status."""
    return jsonify({
        "supported_sources": Config.SUPPORTED_SOURCES,
        "aoi_presets": Config.AOI_PRESETS,
        "critical_sensor_condition": {
            "satellite": "Suomi-NPP",
            "condition": "Data delivery ceased on November 2, 2026.",
            "guideline": "Suomi-NPP VIIRS data is available for historical analysis only. For current/recent observations, prioritize MODIS (Terra/Aqua), VIIRS NOAA-20, and VIIRS NOAA-21."
        }
    }), 200

@data_bp.route("/data/availability", methods=["GET"])
def get_availability():
    """Check data availability against official NASA FIRMS."""
    availability = DataAvailabilityService.get_source_availability()
    return jsonify(availability), 200

@data_bp.route("/data/ingest/recent", methods=["POST"])
def ingest_recent():
    """
    Ingest recent Near Real-Time (NRT) active fire observations from NASA FIRMS.
    Request body JSON:
    - sources: List[str] (e.g. ["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"])
    - west, south, east, north (optional, defaults to Tamil Nadu)
    - day_range: int (1 to 5, default 2)
    - date_str: str (YYYY-MM-DD, optional, default today)
    """
    body = request.get_json(silent=True) or {}
    
    west = float(body.get("west", Config.DEFAULT_AOI["west"]))
    south = float(body.get("south", Config.DEFAULT_AOI["south"]))
    east = float(body.get("east", Config.DEFAULT_AOI["east"]))
    north = float(body.get("north", Config.DEFAULT_AOI["north"]))
    aoi_name = body.get("aoi_name", "Selected AOI")
    
    valid_aoi, err_aoi = validate_aoi(west, south, east, north)
    if not valid_aoi:
        return jsonify({"error": f"Invalid AOI bounding box: {err_aoi}"}), 400

    sources = body.get("sources") or ["MODIS_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT"]
    day_range = int(body.get("day_range", 3))
    day_range = max(1, min(5, day_range))
    
    date_str = body.get("date_str")
    if not date_str:
        date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    db = SessionLocal()
    client = FirmsClient()
    
    results = []
    total_accepted = 0
    total_rejected = 0
    total_duplicates = 0

    try:
        client.validate_key()
    except MissingMapKeyError as e:
        return jsonify({
            "error_type": "MISSING_MAP_KEY",
            "message": str(e),
            "instructions": "Add FIRMS_MAP_KEY=YOUR_KEY to backend/.env and restart server."
        }), 401

    for src in sources:
        if src not in Config.SUPPORTED_SOURCES:
            continue
            
        # Create IngestionJob record
        job = IngestionJob(
            source=src,
            aoi_name=aoi_name,
            west=west,
            south=south,
            east=east,
            north=north,
            start_date=date_str,
            end_date=date_str,
            status="RUNNING"
        )
        db.add(job)
        db.commit()

        try:
            raw_records = client.fetch_area_chunk(
                source=src,
                west=west,
                south=south,
                east=east,
                north=north,
                day_range=day_range,
                date_str=date_str,
                use_cache=True
            )

            # Normalize batch
            norm_res = NormalizationService.normalize_batch(
                records=raw_records,
                source_id=src,
                processing_type="NRT"
            )

            accepted = norm_res["accepted_records"]
            rejected = norm_res["rejected_records"]
            duplicates = norm_res["duplicate_records"]
            report_data = norm_res["quality_report"]

            # Save accepted observations
            saved_count = 0
            for item in accepted:
                # Idempotency check against database
                exists = db.query(Observation.id).filter_by(source_record_hash=item["source_record_hash"]).first()
                if not exists:
                    obs = Observation(**item)
                    db.add(obs)
                    saved_count += 1
                else:
                    duplicates.append(item)

            db.commit()

            # Record processing report
            prep = ProcessingReport(
                job_id=job.job_id,
                source=src,
                records_received=len(raw_records),
                records_accepted=saved_count,
                records_rejected=len(rejected),
                duplicate_records=len(duplicates),
                rejection_reasons=json.dumps(report_data["rejection_reasons"]),
                missing_values_summary=json.dumps(report_data["missing_values_summary"]),
                source_counts=json.dumps(report_data["source_counts"])
            )
            db.add(prep)

            # Update job status
            job.status = "COMPLETED"
            job.records_received = len(raw_records)
            job.records_processed = saved_count
            job.records_rejected = len(rejected)
            job.duplicate_records = len(duplicates)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

            total_accepted += saved_count
            total_rejected += len(rejected)
            total_duplicates += len(duplicates)

            results.append({
                "source": src,
                "status": "COMPLETED",
                "records_received": len(raw_records),
                "records_saved": saved_count,
                "records_rejected": len(rejected),
                "duplicate_records": len(duplicates),
            })

        except (FirmsAPIError, Exception) as err:
            logger.error(f"Error during ingestion for {src}: {err}")
            job.status = "FAILED"
            job.error_message = str(err)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            results.append({
                "source": src,
                "status": "FAILED",
                "error": str(err)
            })

    # Run Harmonization Engine across ingested data
    harm_summary = HarmonizationEngine.run_harmonization(
        db=db,
        west=west,
        south=south,
        east=east,
        north=north
    )

    db.close()

    return jsonify({
        "status": "SUCCESS",
        "aoi": {"name": aoi_name, "west": west, "south": south, "east": east, "north": north},
        "query_date": date_str,
        "day_range": day_range,
        "total_records_saved": total_accepted,
        "total_records_rejected": total_rejected,
        "total_duplicates": total_duplicates,
        "source_results": results,
        "harmonization": harm_summary
    }), 200

@data_bp.route("/data/ingest/historical", methods=["POST"])
def ingest_historical():
    """
    Ingest historical Standard Processing (SP) data with automatic <= 5-day chunking.
    Request body JSON:
    - source: str (e.g. 'MODIS_SP', 'VIIRS_NOAA20_SP', 'VIIRS_NOAA21_SP', or 'VIIRS_SNPP_SP')
    - start_date: str (YYYY-MM-DD)
    - end_date: str (YYYY-MM-DD)
    - west, south, east, north
    """
    body = request.get_json(silent=True) or {}
    source = body.get("source", "MODIS_SP")
    start_date = body.get("start_date")
    end_date = body.get("end_date")

    if not start_date or not end_date:
        return jsonify({"error": "start_date and end_date (YYYY-MM-DD) are required"}), 400

    west = float(body.get("west", Config.DEFAULT_AOI["west"]))
    south = float(body.get("south", Config.DEFAULT_AOI["south"]))
    east = float(body.get("east", Config.DEFAULT_AOI["east"]))
    north = float(body.get("north", Config.DEFAULT_AOI["north"]))
    aoi_name = body.get("aoi_name", "Selected AOI")

    valid_aoi, err_aoi = validate_aoi(west, south, east, north)
    if not valid_aoi:
        return jsonify({"error": f"Invalid AOI bounding box: {err_aoi}"}), 400

    db = SessionLocal()
    client = FirmsClient()

    try:
        client.validate_key()
    except MissingMapKeyError as e:
        return jsonify({
            "error_type": "MISSING_MAP_KEY",
            "message": str(e),
            "instructions": "Add FIRMS_MAP_KEY=YOUR_KEY to backend/.env and restart server."
        }), 401

    job = IngestionJob(
        source=source,
        aoi_name=aoi_name,
        west=west,
        south=south,
        east=east,
        north=north,
        start_date=start_date,
        end_date=end_date,
        status="RUNNING"
    )
    db.add(job)
    db.commit()

    try:
        raw_records = client.fetch_date_range(
            source=source,
            west=west,
            south=south,
            east=east,
            north=north,
            start_date=start_date,
            end_date=end_date,
            use_cache=True
        )

        norm_res = NormalizationService.normalize_batch(
            records=raw_records,
            source_id=source,
            processing_type="SP"
        )

        accepted = norm_res["accepted_records"]
        rejected = norm_res["rejected_records"]
        duplicates = norm_res["duplicate_records"]
        report_data = norm_res["quality_report"]

        saved_count = 0
        for item in accepted:
            exists = db.query(Observation.id).filter_by(source_record_hash=item["source_record_hash"]).first()
            if not exists:
                obs = Observation(**item)
                db.add(obs)
                saved_count += 1
            else:
                duplicates.append(item)

        db.commit()

        # Report & Job completion
        prep = ProcessingReport(
            job_id=job.job_id,
            source=source,
            records_received=len(raw_records),
            records_accepted=saved_count,
            records_rejected=len(rejected),
            duplicate_records=len(duplicates),
            rejection_reasons=json.dumps(report_data["rejection_reasons"]),
            missing_values_summary=json.dumps(report_data["missing_values_summary"]),
            source_counts=json.dumps(report_data["source_counts"])
        )
        db.add(prep)

        job.status = "COMPLETED"
        job.records_received = len(raw_records)
        job.records_processed = saved_count
        job.records_rejected = len(rejected)
        job.duplicate_records = len(duplicates)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()

        # Run harmonization
        harm_summary = HarmonizationEngine.run_harmonization(
            db=db,
            date_from=start_date,
            date_to=end_date,
            west=west,
            south=south,
            east=east,
            north=north
        )

        db.close()

        return jsonify({
            "status": "SUCCESS",
            "source": source,
            "start_date": start_date,
            "end_date": end_date,
            "records_received": len(raw_records),
            "records_saved": saved_count,
            "records_rejected": len(rejected),
            "duplicate_records": len(duplicates),
            "harmonization": harm_summary
        }), 200

    except Exception as e:
        logger.error(f"Historical ingestion failed: {e}")
        job.status = "FAILED"
        job.error_message = str(e)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.close()
        return jsonify({"error": str(e)}), 500

@data_bp.route("/data/import/archive", methods=["POST"])
def import_archive_csv():
    """
    Import NASA FIRMS Archive CSV file (e.g., downloaded from FIRMS Archive Download).
    Allows offline researchers to import validated historical datasets without API quota consumption.
    Preserves provenance and executes complete normalization and harmonization.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Please upload a NASA FIRMS CSV file."}), 400

    uploaded_file = request.files["file"]
    if uploaded_file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    source_hint = request.form.get("source_hint", "ARCHIVE_UPLOAD")

    try:
        content = uploaded_file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        raw_rows = [dict(row) for row in reader]

        if not raw_rows:
            return jsonify({"error": "Uploaded CSV file contains no data rows."}), 400

        # Normalization
        norm_res = NormalizationService.normalize_batch(
            records=raw_rows,
            source_id=source_hint,
            processing_type="ARCHIVE"
        )

        db = SessionLocal()
        accepted = norm_res["accepted_records"]
        rejected = norm_res["rejected_records"]
        duplicates = norm_res["duplicate_records"]
        report_data = norm_res["quality_report"]

        saved_count = 0
        for item in accepted:
            exists = db.query(Observation.id).filter_by(source_record_hash=item["source_record_hash"]).first()
            if not exists:
                obs = Observation(**item)
                db.add(obs)
                saved_count += 1
            else:
                duplicates.append(item)

        db.commit()

        prep = ProcessingReport(
            source=f"ARCHIVE_{uploaded_file.filename}",
            records_received=len(raw_rows),
            records_accepted=saved_count,
            records_rejected=len(rejected),
            duplicate_records=len(duplicates),
            rejection_reasons=json.dumps(report_data["rejection_reasons"]),
            missing_values_summary=json.dumps(report_data["missing_values_summary"]),
            source_counts=json.dumps(report_data["source_counts"])
        )
        db.add(prep)
        db.commit()

        # Run harmonization
        harm_summary = HarmonizationEngine.run_harmonization(db=db)
        db.close()

        return jsonify({
            "status": "SUCCESS",
            "filename": uploaded_file.filename,
            "records_received": len(raw_rows),
            "records_saved": saved_count,
            "records_rejected": len(rejected),
            "duplicate_records": len(duplicates),
            "harmonization": harm_summary,
            "quality_report": report_data
        }), 200

    except Exception as e:
        logger.error(f"Failed to process archive CSV: {e}")
        return jsonify({"error": f"Failed to parse CSV: {str(e)}"}), 500

@data_bp.route("/data-quality", methods=["GET"])
def get_data_quality():
    """Retrieve latest data quality reports and processing audits."""
    db = SessionLocal()
    reports = db.query(ProcessingReport).order_by(ProcessingReport.created_at.desc()).limit(15).all()
    jobs = db.query(IngestionJob).order_by(IngestionJob.started_at.desc()).limit(10).all()
    
    # Global observations tally
    modis_count = db.query(Observation).filter(Observation.sensor_family == "MODIS").count()
    viirs_count = db.query(Observation).filter(Observation.sensor_family == "VIIRS").count()
    total_grid_cells = db.query(DailyGridActivity).count()
    co_detected_cells = db.query(DailyGridActivity).filter(DailyGridActivity.cross_sensor_presence == True).count()

    db.close()

    return jsonify({
        "totals": {
            "modis_observations": modis_count,
            "viirs_observations": viirs_count,
            "active_grid_cell_days": total_grid_cells,
            "cross_sensor_cell_days": co_detected_cells
        },
        "recent_reports": [r.to_dict() for r in reports],
        "recent_jobs": [j.to_dict() for j in jobs]
    }), 200

