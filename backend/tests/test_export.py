import csv
import io
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, Observation, DailyGridActivity
from app.services.export_service import ExportService

@pytest.fixture
def in_memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_14_csv_export(in_memory_db):
    """Verify CSV export formats and column headers for observations and grid activity."""
    db = in_memory_db

    # Add observation
    obs = Observation(
        observation_id="test_exp_01",
        source_record_hash="hash_exp_01",
        sensor_family="MODIS",
        satellite="Terra",
        instrument="MODIS",
        source_id="MODIS_NRT",
        processing_type="NRT",
        latitude=11.0168,
        longitude=76.9558,
        grid_cell_id="cell_1km_123_456",
        proj_x=8500000.0,
        proj_y=1200000.0,
        acquisition_date_utc="2026-11-10",
        acquisition_datetime_utc=datetime(2026, 11, 10, 8, 30, tzinfo=timezone.utc),
        frp_mw=15.5,
        brightness_temperature_kelvin=320.0,
        confidence_raw="85",
        confidence_type="percentage"
    )
    db.add(obs)

    # Add grid activity
    grid = DailyGridActivity(
        grid_cell_id="cell_1km_123_456",
        activity_date_utc="2026-11-10",
        modis_detection_count=1,
        viirs_detection_count=0,
        active_grid_cell=True,
        sensors_present="MODIS",
        cross_sensor_presence=False,
        cell_center_lat=11.0168,
        cell_center_lon=76.9558
    )
    db.add(grid)
    db.commit()

    # 1. Observations CSV
    obs_csv = ExportService.export_observations_csv(db=db)
    reader = csv.reader(io.StringIO(obs_csv))
    rows = list(reader)
    assert len(rows) == 2  # header + 1 row
    assert rows[0][0] == "observation_id"
    assert rows[1][0] == "test_exp_01"
    assert rows[1][2] == "MODIS"
    assert rows[1][7] == "11.0168"

    # 2. Grid Activity CSV
    grid_csv = ExportService.export_grid_activity_csv(db=db)
    g_reader = csv.reader(io.StringIO(grid_csv))
    g_rows = list(g_reader)
    assert len(g_rows) == 2
    assert g_rows[0][0] == "grid_cell_id"
    assert g_rows[1][0] == "cell_1km_123_456"
    assert g_rows[1][1] == "2026-11-10"

