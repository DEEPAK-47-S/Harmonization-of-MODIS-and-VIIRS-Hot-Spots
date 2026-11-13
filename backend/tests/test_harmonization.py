import pytest
from app.utils.geo import coords_to_grid_cell, grid_cell_to_bounds_wgs84
from app.models import Observation, DailyGridActivity
from app.services.harmonization_engine import HarmonizationEngine
from app.services.normalization import NormalizationService
from datetime import datetime, timezone

def test_7_deterministic_grid_cell_assignment():
    """Verify PyProj transforms EPSG:4326 into EPSG:6933 and creates deterministic cell IDs."""
    lat = 11.0168
    lon = 76.9558
    
    info1 = coords_to_grid_cell(lat, lon)
    info2 = coords_to_grid_cell(lat, lon)
    
    assert info1["grid_cell_id"] == info2["grid_cell_id"]
    assert info1["grid_cell_id"].startswith("cell_1km_")
    assert info1["proj_x"] == info2["proj_x"]
    assert info1["proj_y"] == info2["proj_y"]

    # Bounds conversion
    bounds = grid_cell_to_bounds_wgs84(info1["cell_x"], info1["cell_y"])
    assert bounds["west"] <= bounds["center_lon"] <= bounds["east"]
    assert bounds["south"] <= bounds["center_lat"] <= bounds["north"]

def test_8_and_9_same_cell_aggregation_and_cross_sensor_presence():
    """
    CRITICAL TEST SUITE:
    If one MODIS record and one VIIRS record map to the same cell on the same UTC day:
    - Store both original observations.
    - Store their sensor identities separately.
    - Produce one active grid-cell-day.
    - Set cross_sensor_presence = true.
    - Do not report two independent fires.
    - Do not delete either observation.
    """
    # Pick a point in Tamil Nadu
    lat = 11.0168
    lon = 76.9558
    grid_info = coords_to_grid_cell(lat, lon)
    cell_id = grid_info["grid_cell_id"]
    date_str = "2026-11-10"

    # Synthetic MODIS observation
    modis_obs = Observation(
        observation_id="synth_modis_001",
        source_record_hash="hash_modis_001",
        sensor_family="MODIS",
        satellite="Terra",
        instrument="MODIS",
        source_id="MODIS_NRT",
        processing_type="NRT",
        latitude=lat,
        longitude=lon,
        grid_cell_id=cell_id,
        proj_x=grid_info["proj_x"],
        proj_y=grid_info["proj_y"],
        acquisition_date_utc=date_str,
        acquisition_datetime_utc=datetime(2026, 11, 10, 8, 30, tzinfo=timezone.utc),
        frp_mw=25.0,
        brightness_temperature_kelvin=320.0,
        brightness_channel="T21/T22",
        confidence_raw="80",
        confidence_type="percentage"
    )

    # Synthetic VIIRS observation (nearby within the exact same 1km cell)
    # Longitude shifted slightly (~100m)
    viirs_obs = Observation(
        observation_id="synth_viirs_001",
        source_record_hash="hash_viirs_001",
        sensor_family="VIIRS",
        satellite="NOAA-21",
        instrument="VIIRS",
        source_id="VIIRS_NOAA21_NRT",
        processing_type="NRT",
        latitude=lat,
        longitude=lon + 0.0005,
        grid_cell_id=cell_id,
        proj_x=grid_info["proj_x"] + 50.0,
        proj_y=grid_info["proj_y"] + 20.0,
        acquisition_date_utc=date_str,
        acquisition_datetime_utc=datetime(2026, 11, 10, 14, 15, tzinfo=timezone.utc),
        frp_mw=12.0,
        brightness_temperature_kelvin=335.0,
        brightness_channel="I4",
        confidence_raw="high",
        confidence_type="categorical"
    )

    # Both observations are preserved intact
    assert modis_obs.sensor_family == "MODIS"
    assert viirs_obs.sensor_family == "VIIRS"
    assert modis_obs.observation_id != viirs_obs.observation_id

    # Run Harmonization Aggregation
    harmonized = HarmonizationEngine.aggregate_observations([modis_obs, viirs_obs])

    # Assertions
    # 1. Exactly ONE active grid-cell-day is produced for this cell on this UTC day
    assert len(harmonized) == 1
    cell_day = harmonized[0]

    assert cell_day["grid_cell_id"] == cell_id
    assert cell_day["activity_date_utc"] == date_str

    # 2. Both observations are counted under their respective sensors
    assert cell_day["modis_detection_count"] == 1
    assert cell_day["viirs_detection_count"] == 1

    # 3. Cross-sensor co-detection flag is TRUE
    assert cell_day["cross_sensor_presence"] is True
    assert cell_day["sensors_present"] == "MODIS+VIIRS"

    # 4. Sensor-specific FRP metrics are preserved separately
    assert cell_day["modis_frp_mean"] == 25.0
    assert cell_day["modis_frp_max"] == 25.0
    assert cell_day["viirs_frp_mean"] == 12.0
    assert cell_day["viirs_frp_max"] == 12.0

    # 5. Cell is marked active
    assert cell_day["active_grid_cell"] is True

