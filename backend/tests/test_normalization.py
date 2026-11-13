import pytest
from app.services.normalization import NormalizationService, parse_utc_datetime, generate_record_hash
from tests.synthetic_fixtures import (
    SYNTHETIC_MODIS_RAW_RECORD,
    SYNTHETIC_VIIRS_RAW_RECORD,
    SYNTHETIC_MODIS_MISSING_OPTIONAL,
    SYNTHETIC_INVALID_LATITUDE,
    SYNTHETIC_INVALID_LONGITUDE,
    SYNTHETIC_NEGATIVE_FRP
)

def test_1_modis_column_normalization():
    """Verify MODIS record is accurately normalized to common structure."""
    norm, err = NormalizationService.normalize_row(SYNTHETIC_MODIS_RAW_RECORD, source_id="MODIS_NRT")
    assert err is None
    assert norm is not None
    assert norm["sensor_family"] == "MODIS"
    assert norm["satellite"] == "Terra"
    assert norm["instrument"] == "MODIS"
    assert norm["latitude"] == 11.0168
    assert norm["longitude"] == 76.9558
    assert norm["acquisition_date_utc"] == "2026-11-10"
    assert norm["acquisition_datetime_utc"].strftime("%H:%M") == "08:30"
    assert norm["brightness_temperature_kelvin"] == 325.4
    assert norm["brightness_channel"] == "T21/T22"
    assert norm["frp_mw"] == 18.5
    assert norm["confidence_raw"] == "85"
    assert norm["confidence_type"] == "percentage"
    assert norm["daynight"] == "D"
    assert "grid_cell_id" in norm

def test_2_viirs_column_normalization():
    """Verify VIIRS record is accurately normalized to common structure."""
    norm, err = NormalizationService.normalize_row(SYNTHETIC_VIIRS_RAW_RECORD, source_id="VIIRS_NOAA21_NRT")
    assert err is None
    assert norm is not None
    assert norm["sensor_family"] == "VIIRS"
    assert norm["satellite"] == "NOAA-21"
    assert norm["instrument"] == "VIIRS"
    assert norm["latitude"] == 11.0195
    assert norm["longitude"] == 76.9580
    assert norm["acquisition_date_utc"] == "2026-11-10"
    assert norm["acquisition_datetime_utc"].strftime("%H:%M") == "14:25"
    assert norm["brightness_temperature_kelvin"] == 342.8
    assert norm["brightness_channel"] == "I4"
    assert norm["frp_mw"] == 7.2
    assert norm["confidence_raw"] == "nominal"
    assert norm["confidence_type"] == "categorical"
    assert "grid_cell_id" in norm

def test_3_utc_date_and_time_parsing():
    """Verify zero-padding and UTC parsing for heterogeneous acq_time values."""
    # 830 -> 08:30
    dt1, d_str1, err1 = parse_utc_datetime("2026-11-10", "830")
    assert err1 is None
    assert dt1.strftime("%Y-%m-%d %H:%M") == "2026-11-10 08:30"

    # 45 -> 00:45
    dt2, d_str2, err2 = parse_utc_datetime("2026-11-10", "45")
    assert err2 is None
    assert dt2.strftime("%Y-%m-%d %H:%M") == "2026-11-10 00:45"

    # 1425 -> 14:25
    dt3, d_str3, err3 = parse_utc_datetime("2026-11-10", 1425)
    assert err3 is None
    assert dt3.strftime("%Y-%m-%d %H:%M") == "2026-11-10 14:25"

    # Float representation e.g. 1425.0
    dt4, d_str4, err4 = parse_utc_datetime("2026-11-10", 1425.0)
    assert err4 is None
    assert dt4.strftime("%Y-%m-%d %H:%M") == "2026-11-10 14:25"

def test_4_missing_field_handling():
    """Verify that optional missing fields (confidence, FRP, scan) do not crash normalization."""
    norm, err = NormalizationService.normalize_row(SYNTHETIC_MODIS_MISSING_OPTIONAL, source_id="MODIS_NRT")
    assert err is None
    assert norm is not None
    assert norm["frp_mw"] == 0.0
    assert norm["confidence_raw"] == "0"
    assert norm["scan_km"] is None
    assert norm["acquisition_datetime_utc"].strftime("%H:%M") == "00:45"

def test_5_invalid_latitude_longitude_rejection():
    """Verify that out-of-range coordinates are rejected with descriptive reasons."""
    norm1, err1 = NormalizationService.normalize_row(SYNTHETIC_INVALID_LATITUDE, source_id="MODIS_NRT")
    assert norm1 is None
    assert "Latitude 95.5 out of range" in err1

    norm2, err2 = NormalizationService.normalize_row(SYNTHETIC_INVALID_LONGITUDE, source_id="MODIS_NRT")
    assert norm2 is None
    assert "Longitude 195.0 out of range" in err2

def test_6_frp_validation():
    """Verify negative FRP values are rejected as scientifically invalid."""
    norm, err = NormalizationService.normalize_row(SYNTHETIC_NEGATIVE_FRP, source_id="MODIS_NRT")
    assert norm is None
    assert "Invalid negative FRP" in err

def test_10_raw_record_duplicate_prevention():
    """Verify exact repeated records produce identical hashes and are filtered in batch normalization."""
    batch = [SYNTHETIC_MODIS_RAW_RECORD, SYNTHETIC_MODIS_RAW_RECORD]
    res = NormalizationService.normalize_batch(batch, source_id="MODIS_NRT")
    assert len(res["accepted_records"]) == 1
    assert len(res["duplicate_records"]) == 1
    assert res["quality_report"]["duplicate_records"] == 1

