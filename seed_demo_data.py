"""
FirePulse Seed Demo Data Script
===============================
Loads validated NASA FIRMS observations from data/sample_firms_archive_tamil_nadu.csv
into firepulse.db so the dashboard, map, calendar, comparison, and trends modules
have rich interactive data immediately upon launch.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import csv
import json
from app import create_app
from app.db import SessionLocal
from app.models import Observation, ProcessingReport
from app.services.normalization import NormalizationService
from app.services.harmonization_engine import HarmonizationEngine

def seed_data():
    sample_csv = Path(__file__).resolve().parent / "data" / "sample_firms_archive_tamil_nadu.csv"
    if not sample_csv.exists():
        print(f"Error: {sample_csv} not found.")
        return False

    print(f"Reading sample NASA FIRMS archive dataset from: {sample_csv.name}")
    with open(sample_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        raw_rows = [dict(row) for row in reader]

    print(f"Loaded {len(raw_rows)} raw records. Running Normalization Pipeline...")
    norm_res = NormalizationService.normalize_batch(
        records=raw_rows,
        source_id="SAMPLE_TAMIL_NADU_SEED",
        processing_type="ARCHIVE"
    )

    accepted = norm_res["accepted_records"]
    rejected = norm_res["rejected_records"]
    duplicates = norm_res["duplicate_records"]
    report_data = norm_res["quality_report"]

    print(f"Accepted: {len(accepted)}, Rejected: {len(rejected)}, Duplicates: {len(duplicates)}")

    app = create_app()
    with app.app_context():
        db = SessionLocal()
        saved_count = 0
        for item in accepted:
            exists = db.query(Observation.id).filter_by(source_record_hash=item["source_record_hash"]).first()
            if not exists:
                obs = Observation(**item)
                db.add(obs)
                saved_count += 1

        db.commit()

        prep = ProcessingReport(
            source=f"SEED_{sample_csv.name}",
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

        print(f"Saved {saved_count} new observations to firepulse.db.")
        print("Running Harmonization Engine (EPSG:6933 1km analytical grid)...")
        harm_summary = HarmonizationEngine.run_harmonization(db=db)
        print(f"Harmonization complete:")
        print(f" - Active 1km grid cell-days created: {harm_summary.get('active_grid_cells_created')}")
        print(f" - Cross-sensor co-detected cell-days: {harm_summary.get('cross_sensor_cell_days')}")
        db.close()

    print("\n✅ Seed data successfully loaded! FirePulse is now ready with interactive observations.")
    return True

if __name__ == "__main__":
    seed_data()

