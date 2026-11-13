"""
SYNTHETIC TEST FIXTURES FOR AUTOMATED TESTING ONLY.
===================================================
NOTICE:
These fixtures are strictly synthetic mock records created for automated unit and regression testing.
They must NEVER be mixed into the production NASA FIRMS dataset or database.
"""

SYNTHETIC_MODIS_RAW_RECORD = {
    "latitude": "11.0168",
    "longitude": "76.9558",
    "brightness": "325.4",
    "scan": "1.1",
    "track": "1.0",
    "acq_date": "2026-11-10",
    "acq_time": "830",       # Needs padding to 0830 -> 08:30 UTC
    "satellite": "Terra",
    "instrument": "MODIS",
    "confidence": "85",       # Percentage scale
    "version": "6.1NRT",
    "bright_t31": "298.2",
    "frp": "18.5",
    "daynight": "D"
}

SYNTHETIC_VIIRS_RAW_RECORD = {
    "latitude": "11.0195",
    "longitude": "76.9580",
    "bright_ti4": "342.8",
    "scan": "0.38",
    "track": "0.37",
    "acq_date": "2026-11-10",
    "acq_time": "1425",      # 14:25 UTC
    "satellite": "NOAA-21",
    "instrument": "VIIRS",
    "confidence": "nominal", # Categorical scale: 'nominal' or 'n'
    "version": "2.0NRT",
    "bright_ti5": "295.4",
    "frp": "7.2",
    "daynight": "D"
}

SYNTHETIC_MODIS_MISSING_OPTIONAL = {
    "latitude": "11.0500",
    "longitude": "76.9800",
    "acq_date": "2026-11-10",
    "acq_time": "45",        # Needs padding to 0045 -> 00:45 UTC
    "satellite": "Aqua",
    "confidence": "",        # Missing
    "frp": "",               # Missing
    "brightness": "310.0"
}

SYNTHETIC_INVALID_LATITUDE = {
    "latitude": "95.5000",   # Invalid: > 90
    "longitude": "76.9500",
    "acq_date": "2026-11-10",
    "acq_time": "1200",
    "satellite": "Terra",
    "confidence": "50",
    "brightness": "315.0"
}

SYNTHETIC_INVALID_LONGITUDE = {
    "latitude": "11.0000",
    "longitude": "195.0000", # Invalid: > 180
    "acq_date": "2026-11-10",
    "acq_time": "1200",
    "satellite": "Terra",
    "confidence": "50",
    "brightness": "315.0"
}

SYNTHETIC_NEGATIVE_FRP = {
    "latitude": "11.0000",
    "longitude": "76.9500",
    "acq_date": "2026-11-10",
    "acq_time": "1200",
    "satellite": "Terra",
    "confidence": "50",
    "frp": "-12.5",          # Invalid negative FRP
    "brightness": "315.0"
}

