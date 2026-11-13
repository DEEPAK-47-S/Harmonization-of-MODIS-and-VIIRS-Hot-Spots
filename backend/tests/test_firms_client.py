import pytest
from unittest.mock import patch, MagicMock
from app.services.firms_client import (
    FirmsClient, MissingMapKeyError, FirmsAPIError
)

def test_missing_map_key_error():
    """Verify missing MAP_KEY triggers proper error and instructions."""
    client = FirmsClient(map_key="")
    with pytest.raises(MissingMapKeyError):
        client.validate_key()

def test_invalid_aoi_handling():
    """Verify invalid bounding box coordinates are rejected before making network requests."""
    client = FirmsClient(map_key="test_key_123")
    # south > north
    with pytest.raises(FirmsAPIError) as exc_info:
        client.fetch_area_chunk("MODIS_NRT", 76.0, 15.0, 80.0, 10.0, day_range=1, date_str="2026-11-10")
    assert "South latitude" in str(exc_info.value)

def test_invalid_day_range_handling():
    """Verify day_range > 5 is rejected."""
    client = FirmsClient(map_key="test_key_123")
    with pytest.raises(FirmsAPIError) as exc_info:
        client.fetch_area_chunk("MODIS_NRT", 76.0, 8.0, 80.0, 13.0, day_range=7, date_str="2026-11-10")
    assert "DAY_RANGE must be between 1 and 5" in str(exc_info.value)

def test_date_range_chunking():
    """Verify date ranges > 5 days are accurately chunked into <= 5-day requests."""
    client = FirmsClient(map_key="test_key_123")
    
    mock_calls = []
    def fake_fetch_area_chunk(source, west, south, east, north, day_range, date_str, use_cache=True):
        mock_calls.append({"day_range": day_range, "date_str": date_str})
        return []

    with patch.object(client, "fetch_area_chunk", side_effect=fake_fetch_area_chunk):
        # 12-day span: Nov 01 to Nov 12 -> chunks: (5 days: Nov 1), (5 days: Nov 6), (2 days: Nov 11)
        client.fetch_date_range("MODIS_NRT", 76.0, 8.0, 80.0, 13.0, "2026-11-01", "2026-11-12")

    assert len(mock_calls) == 3
    assert mock_calls[0] == {"day_range": 5, "date_str": "2026-11-01"}
    assert mock_calls[1] == {"day_range": 5, "date_str": "2026-11-06"}
    assert mock_calls[2] == {"day_range": 2, "date_str": "2026-11-11"}

def test_csv_parser_empty_and_no_data():
    """Verify empty and 'No data available' NASA responses return an empty list without crashing."""
    client = FirmsClient(map_key="test_key_123")
    assert client._parse_csv_content("", "MODIS_NRT") == []
    assert client._parse_csv_content("No data available\n", "MODIS_NRT") == []
    assert client._parse_csv_content("No active fires detected in this area\n", "MODIS_NRT") == []

