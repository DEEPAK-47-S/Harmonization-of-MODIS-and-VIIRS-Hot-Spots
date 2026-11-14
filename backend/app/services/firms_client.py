import csv
import io
import time
import logging
import hashlib
from datetime import datetime, date, timedelta
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional
import requests
from ..config import Config
from ..utils.geo import validate_aoi

logger = logging.getLogger(__name__)

class FirmsAPIError(Exception):
    """Base exception for NASA FIRMS API operations."""
    def __init__(self, message: str, status_code: Optional[int] = None, error_type: str = "GENERIC_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type

class MissingMapKeyError(FirmsAPIError):
    def __init__(self):
        super().__init__(
            "NASA FIRMS MAP_KEY is not configured. Please register a free key at https://firms.modaps.eosdis.nasa.gov/api/map_key/ and add it to backend/.env",
            status_code=401,
            error_type="MISSING_MAP_KEY"
        )

class InvalidMapKeyError(FirmsAPIError):
    def __init__(self):
        super().__init__(
            "The configured NASA FIRMS MAP_KEY was rejected by NASA as invalid. Please verify your key.",
            status_code=403,
            error_type="INVALID_MAP_KEY"
        )

class RateLimitExceededError(FirmsAPIError):
    def __init__(self):
        super().__init__(
            "NASA FIRMS API rate limit reached (5,000 transactions per 10-minute window). Please wait before retrying.",
            status_code=429,
            error_type="RATE_LIMIT_EXCEEDED"
        )

class FirmsClient:
    """
    Client for the official NASA FIRMS Area API.
    Endpoint specification:
    /api/area/csv/{MAP_KEY}/{SOURCE}/{AREA}/{DAY_RANGE}/{DATE}
    """

    def __init__(self, map_key: Optional[str] = None):
        self.map_key = map_key if map_key is not None else Config.FIRMS_MAP_KEY
        self.cache_dir = Config.DATA_RAW_DIR
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def validate_key(self) -> None:
        """Ensure MAP_KEY is present."""
        if not self.map_key or self.map_key == "YOUR_NASA_MAP_KEY":
            raise MissingMapKeyError()

    def _get_cache_path(self, source: str, area_str: str, day_range: int, date_str: str) -> Path:
        """Generate deterministic cache file path for raw CSV."""
        cache_key = f"{source}_{area_str}_{day_range}_{date_str}"
        file_hash = hashlib.md5(cache_key.encode("utf-8")).hexdigest()
        return self.cache_dir / f"firms_{source}_{date_str}_{file_hash[:10]}.csv"

    def fetch_area_chunk(
        self,
        source: str,
        west: float,
        south: float,
        east: float,
        north: float,
        day_range: int,
        date_str: str,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Fetch a single chunk (1-5 days) from the NASA FIRMS Area CSV API.
        Respects caching, validates parameters, and handles rate limits.
        """
        self.validate_key()

        # Parameter validation
        valid_aoi, aoi_err = validate_aoi(west, south, east, north)
        if not valid_aoi:
            raise FirmsAPIError(f"Invalid AOI coordinates: {aoi_err}", status_code=400, error_type="INVALID_AOI")

        if source not in Config.SUPPORTED_SOURCES:
            raise FirmsAPIError(
                f"Unsupported FIRMS source '{source}'. Supported sources: {list(Config.SUPPORTED_SOURCES.keys())}",
                status_code=400,
                error_type="UNSUPPORTED_SOURCE"
            )

        if not (1 <= day_range <= 5):
            raise FirmsAPIError(f"DAY_RANGE must be between 1 and 5, got {day_range}", status_code=400, error_type="INVALID_DAY_RANGE")

        # Determine if this is global worldwide coverage or regional bounding box
        is_world = (west <= -179.0 and south <= -89.0 and east >= 179.0 and north >= 89.0)
        area_str = "world" if is_world else f"{west:.4f},{south:.4f},{east:.4f},{north:.4f}"
        cache_file = self._get_cache_path(source, area_str, day_range, date_str)

        # Check raw cache
        if use_cache and cache_file.exists():
            logger.info(f"Loading cached NASA FIRMS data: {cache_file.name}")
            with open(cache_file, "r", encoding="utf-8") as f:
                content = f.read()
                return self._parse_csv_content(content, source)

        # Build request URL: /api/area/csv/{MAP_KEY}/{SOURCE}/{AREA}/{DAY_RANGE}/{DATE}
        url = f"{Config.FIRMS_BASE_URL}/api/area/csv/{self.map_key}/{source}/{area_str}/{day_range}/{date_str}"

        headers = {
            "User-Agent": "FirePulse-NASA-Space-Apps-2026/1.0"
        }

        # Bounded retry with exponential backoff (max 2 attempts in serverless)
        max_retries = 2
        backoff = 0.5

        for attempt in range(max_retries):
            try:
                # Inter-request delay to honor rate limits
                time.sleep(Config.FIRMS_RATE_LIMIT_DELAY)
                
                response = requests.get(url, headers=headers, timeout=12)
                
                # Check HTTP status
                if response.status_code == 429:
                    raise RateLimitExceededError()
                elif response.status_code == 403:
                    raise InvalidMapKeyError()
                elif response.status_code != 200:
                    raise FirmsAPIError(
                        f"NASA FIRMS API returned HTTP {response.status_code}: {response.text[:200]}",
                        status_code=response.status_code,
                        error_type="API_HTTP_ERROR"
                    )

                text = response.text
                # Inspect for NASA text error flags
                if "Invalid MAP_KEY" in text:
                    raise InvalidMapKeyError()
                if "Error: Transaction limit" in text or "Rate limit" in text:
                    raise RateLimitExceededError()

                # Cache raw CSV response
                with open(cache_file, "w", encoding="utf-8") as f:
                    f.write(text)

                return self._parse_csv_content(text, source)

            except (requests.Timeout, requests.ConnectionError) as net_err:
                if attempt == max_retries - 1:
                    raise FirmsAPIError(f"Network error connecting to NASA FIRMS: {net_err}", status_code=503, error_type="NETWORK_ERROR")
                time.sleep(backoff)
                backoff *= 2.0

        return []

    def _parse_csv_content(self, csv_text: str, source: str) -> List[Dict[str, Any]]:
        """Parse FIRMS CSV string into row dictionaries."""
        if not csv_text or not csv_text.strip():
            return []
            
        # Clean lines and check for "no data" messages
        lines = [line.strip() for line in csv_text.strip().splitlines() if line.strip()]
        if not lines:
            return []
            
        first_line = lines[0].lower()
        if "no data" in first_line or "no active fires" in first_line:
            return []
            
        reader = csv.DictReader(io.StringIO(csv_text))
        rows = []
        for r in reader:
            if r:
                rows.append(dict(r))
        return rows

    def fetch_date_range(
        self,
        source: str,
        west: float,
        south: float,
        east: float,
        north: float,
        start_date: str,
        end_date: str,
        use_cache: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Automatically chunk requests into <= 5-day windows as required by NASA FIRMS Area API.
        Aggregates results across all chunks.
        """
        d_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        d_end = datetime.strptime(end_date, "%Y-%m-%d").date()

        if d_start > d_end:
            raise FirmsAPIError(f"start_date ({start_date}) cannot be after end_date ({end_date})", status_code=400, error_type="INVALID_DATE_RANGE")

        all_records = []
        curr = d_start
        
        while curr <= d_end:
            remaining_days = (d_end - curr).days + 1
            chunk_days = min(5, remaining_days)
            date_str = curr.strftime("%Y-%m-%d")

            logger.info(f"Querying FIRMS chunk: source={source}, date={date_str}, day_range={chunk_days}")
            chunk_records = self.fetch_area_chunk(
                source=source,
                west=west,
                south=south,
                east=east,
                north=north,
                day_range=chunk_days,
                date_str=date_str,
                use_cache=use_cache
            )
            all_records.extend(chunk_records)
            curr += timedelta(days=chunk_days)

        return all_records

