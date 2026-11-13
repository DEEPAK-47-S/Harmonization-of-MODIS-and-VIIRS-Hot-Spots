import logging
import requests
from typing import Dict, Any, Optional
from ..config import Config

logger = logging.getLogger(__name__)

class DataAvailabilityService:
    """
    Checks data availability across official NASA FIRMS sources.
    NASA FIRMS availability endpoint:
    https://firms.modaps.eosdis.nasa.gov/api/data_availability/
    """

    @classmethod
    def get_source_availability(cls, map_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Check data availability from NASA FIRMS. If MAP_KEY is not configured,
        returns static sensor operational documentation and availability bounds.
        """
        key = map_key or Config.FIRMS_MAP_KEY
        
        # Sensor status specifications (including Nov 2, 2026 Suomi-NPP cessation notice)
        sensor_metadata = {
            "MODIS_NRT": {
                "name": "MODIS Near Real-Time (Terra/Aqua)",
                "family": "MODIS",
                "instrument": "MODIS",
                "satellites": ["Terra", "Aqua"],
                "resolution": "1 km nominal",
                "latency": "Within ~3 hours of observation",
                "status": "OPERATIONAL",
                "historical_cutoff": "Rolling ~7 days to present",
                "notes": "Terra (10:30 AM/PM equatorial crossing), Aqua (01:30 AM/PM)"
            },
            "MODIS_SP": {
                "name": "MODIS Standard Processing (MCD14ML)",
                "family": "MODIS",
                "instrument": "MODIS",
                "satellites": ["Terra", "Aqua"],
                "resolution": "1 km nominal",
                "latency": "Science quality (lag ~2-3 months)",
                "status": "OPERATIONAL",
                "historical_cutoff": "Nov 2000 to science cutoff",
                "notes": "Optimal for historical baselines and climate studies"
            },
            "VIIRS_NOAA20_NRT": {
                "name": "VIIRS Near Real-Time (NOAA-20 / JPSS-1)",
                "family": "VIIRS",
                "instrument": "VIIRS",
                "satellites": ["NOAA-20"],
                "resolution": "375 m nominal (I-bands)",
                "latency": "Within ~3 hours of observation",
                "status": "OPERATIONAL",
                "historical_cutoff": "Rolling ~7 days to present",
                "notes": "Equatorial crossing ~01:30 PM (half an orbit offset from Suomi-NPP/NOAA-21)"
            },
            "VIIRS_NOAA20_SP": {
                "name": "VIIRS Standard Processing (NOAA-20)",
                "family": "VIIRS",
                "instrument": "VIIRS",
                "satellites": ["NOAA-20"],
                "resolution": "375 m nominal",
                "latency": "Science quality",
                "status": "OPERATIONAL",
                "historical_cutoff": "Jan 2018 to science cutoff",
                "notes": "Calibrated historical standard processing"
            },
            "VIIRS_NOAA21_NRT": {
                "name": "VIIRS Near Real-Time (NOAA-21 / JPSS-2)",
                "family": "VIIRS",
                "instrument": "VIIRS",
                "satellites": ["NOAA-21"],
                "resolution": "375 m nominal (I-bands)",
                "latency": "Within ~3 hours of observation",
                "status": "OPERATIONAL",
                "historical_cutoff": "Rolling ~7 days to present",
                "notes": "Launched Nov 2022; operational active fire data delivery"
            },
            "VIIRS_NOAA21_SP": {
                "name": "VIIRS Standard Processing (NOAA-21)",
                "family": "VIIRS",
                "instrument": "VIIRS",
                "satellites": ["NOAA-21"],
                "resolution": "375 m nominal",
                "latency": "Science quality",
                "status": "OPERATIONAL",
                "historical_cutoff": "2023 to science cutoff",
                "notes": "Calibrated standard processing for JPSS-2"
            },
            "VIIRS_SNPP_SP": {
                "name": "VIIRS Suomi-NPP (Historical Standard Processing)",
                "family": "VIIRS",
                "instrument": "VIIRS",
                "satellites": ["Suomi-NPP"],
                "resolution": "375 m nominal",
                "latency": "Historical Archive",
                "status": "CEASED_DELIVERY",
                "historical_cutoff": "Jan 2012 to Nov 2, 2026",
                "notes": "CRITICAL CONDITION: Suomi-NPP data delivery ceased on Nov 2, 2026. Useful for historical benchmarks only."
            }
        }

        if not key or key == "YOUR_NASA_MAP_KEY":
            return {
                "api_configured": False,
                "message": "NASA FIRMS MAP_KEY is not configured. Real NASA API queries require registering a free MAP_KEY.",
                "sources": sensor_metadata
            }

        # Query NASA FIRMS live availability endpoint
        try:
            url = f"{Config.FIRMS_BASE_URL}/api/data_availability/csv/{key}/all"
            response = requests.get(url, timeout=10)
            if response.status_code == 200 and "Invalid MAP_KEY" not in response.text:
                return {
                    "api_configured": True,
                    "live_check": "SUCCESS",
                    "sources": sensor_metadata,
                    "raw_availability": response.text[:500]
                }
            elif "Invalid MAP_KEY" in response.text:
                return {
                    "api_configured": False,
                    "live_check": "INVALID_MAP_KEY",
                    "message": "Provided FIRMS_MAP_KEY was rejected by NASA as invalid.",
                    "sources": sensor_metadata
                }
            else:
                return {
                    "api_configured": True,
                    "live_check": "REMOTE_ERROR",
                    "status_code": response.status_code,
                    "sources": sensor_metadata
                }
        except Exception as e:
            logger.warning(f"Failed to query FIRMS data availability: {e}")
            return {
                "api_configured": True,
                "live_check": "NETWORK_UNREACHABLE",
                "error": str(e),
                "sources": sensor_metadata
            }

