import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, DailyGridActivity
from app.services.calendar_service import CalendarService

@pytest.fixture
def in_memory_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_11_calendar_calculations(in_memory_db):
    """Verify Burning Activity Calendar calculates daily aggregations and dynamic activity levels."""
    db = in_memory_db

    # Seed 3 synthetic days with varying active cell counts
    for i, date_str in enumerate(["2026-11-01", "2026-11-02", "2026-11-03"]):
        for cell_idx in range((i + 1) * 5):
            cell = DailyGridActivity(
                grid_cell_id=f"cell_1km_100_{cell_idx}",
                activity_date_utc=date_str,
                modis_detection_count=1,
                viirs_detection_count=2,
                active_grid_cell=True,
                sensors_present="MODIS+VIIRS",
                cross_sensor_presence=True,
                modis_frp_mean=15.0,
                viirs_frp_mean=10.0,
                cell_center_lat=11.0,
                cell_center_lon=77.0
            )
            db.add(cell)
    db.commit()

    # Query calendar heatmap
    result = CalendarService.get_calendar_heatmap(db=db, year=2026, month=11, metric="active_grid_cells")

    assert result["total_active_days"] == 3
    days = result["days"]
    assert len(days) == 3
    assert days[0]["date"] == "2026-11-01"
    assert days[0]["active_grid_cells"] == 5
    assert days[1]["active_grid_cells"] == 10
    assert days[2]["active_grid_cells"] == 15

    # Check activity level assignments
    assert days[0]["activity_level"] <= days[2]["activity_level"]
    assert "thresholds" in result

