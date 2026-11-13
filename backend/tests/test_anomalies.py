import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, DailyGridActivity
from app.services.anomaly_service import AnomalyService

@pytest.fixture
def in_memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_13_insufficient_history_safeguard(in_memory_db):
    """
    CRITICAL SAFEGUARD TEST:
    If less than 3 distinct years of observations exist, anomaly detection
    must strictly report INSUFFICIENT_HISTORY and refuse to generate ungrounded anomaly flags.
    """
    db = in_memory_db
    
    # Only 1 year of data present
    for day in range(1, 5):
        cell = DailyGridActivity(
            grid_cell_id=f"cell_1km_50_{day}",
            activity_date_utc=f"2026-11-{day:02d}",
            modis_detection_count=2,
            viirs_detection_count=5,
            active_grid_cell=True,
            sensors_present="MODIS+VIIRS",
            cross_sensor_presence=True,
            cell_center_lat=11.0,
            cell_center_lon=77.0
        )
        db.add(cell)
    db.commit()

    res = AnomalyService.detect_anomalies_for_period(db=db, date_from="2026-11-01", date_to="2026-11-04")
    
    assert res["status"] == "INSUFFICIENT_HISTORY"
    assert res["safeguards"]["sufficient_history"] is False
    assert res["safeguards"]["distinct_years_count"] == 1
    assert "Insufficient historical data" in res["message"]
    # All evaluated days must carry the safeguard explanation
    for d in res["all_evaluated_days"]:
        assert d["status"] == "INSUFFICIENT_HISTORY"
        assert d["is_anomaly"] is False

def test_12_historical_baseline_calculations(in_memory_db):
    """Verify statistical baseline calculation when sufficient multi-year data exists."""
    db = in_memory_db

    # Seed 3 distinct years (2023, 2024, 2025) with historical observations in November
    years = [2023, 2024, 2025]
    for yr in years:
        for day in range(1, 20):
            # Normal baseline activity: 2 cells per day
            for c in range(2):
                cell = DailyGridActivity(
                    grid_cell_id=f"cell_{yr}_{day}_{c}",
                    activity_date_utc=f"{yr}-11-{day:02d}",
                    modis_detection_count=1,
                    viirs_detection_count=1,
                    active_grid_cell=True,
                    sensors_present="MODIS+VIIRS",
                    cross_sensor_presence=True,
                    cell_center_lat=11.0,
                    cell_center_lon=77.0
                )
                db.add(cell)

    # Seed a high-activity observation on 2026-11-10 (e.g. 50 active cells)
    for c in range(50):
        cell = DailyGridActivity(
            grid_cell_id=f"cell_2026_10_{c}",
            activity_date_utc="2026-11-10",
            modis_detection_count=2,
            viirs_detection_count=3,
            active_grid_cell=True,
            sensors_present="MODIS+VIIRS",
            cross_sensor_presence=True,
            cell_center_lat=11.0,
            cell_center_lon=77.0
        )
        db.add(cell)
    db.commit()

    res = AnomalyService.detect_anomalies_for_period(db=db, date_from="2026-11-10", date_to="2026-11-10")

    assert res["status"] == "SUCCESS"
    assert res["safeguards"]["sufficient_history"] is True
    assert res["anomaly_count"] >= 1
    anom = res["anomalies"][0]
    assert anom["date_utc"] == "2026-11-10"
    assert anom["observed_active_cells"] == 50
    assert anom["historical_median"] <= 5.0
    assert anom["robust_z_score"] >= 2.0
    assert anom["historical_percentile"] >= 95.0
    assert anom["is_anomaly"] is True

