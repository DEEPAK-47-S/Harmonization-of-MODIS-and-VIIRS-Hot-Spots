import hashlib
import json
import math
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple, Optional
from ..utils.geo import validate_coordinates, coords_to_grid_cell

def parse_utc_datetime(acq_date_str: str, acq_time_str: Any) -> Tuple[Optional[datetime], Optional[str], Optional[str]]:
    """
    Parse acquisition date and acquisition time into UTC datetime.
    NASA FIRMS formats acq_time as integer or string HHMM (e.g. 830 -> 0830 -> 08:30).
    Returns (datetime_utc, date_str, time_str) or (None, None, error_message).
    """
    if not acq_date_str:
        return None, None, "Missing acquisition date"
        
    date_cleaned = str(acq_date_str).strip()
    try:
        # Standard FIRMS format is YYYY-MM-DD
        parsed_date = datetime.strptime(date_cleaned, "%Y-%m-%d").date()
    except ValueError:
        return None, None, f"Invalid date format '{date_cleaned}', expected YYYY-MM-DD"
        
    # Process acq_time
    if acq_time_str is None or str(acq_time_str).strip() == "":
        hour, minute = 0, 0
        time_formatted = "00:00"
    else:
        # Strip decimal if present (e.g. from float conversion)
        time_clean = str(acq_time_str).strip().split(".")[0]
        # Zero-pad up to 4 digits (e.g. '45' -> '0045', '830' -> '0830')
        time_clean = time_clean.zfill(4)
        if len(time_clean) > 4:
            time_clean = time_clean[-4:]
            
        try:
            hour = int(time_clean[:2])
            minute = int(time_clean[2:])
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                return None, None, f"Invalid time digits '{time_clean}'"
            time_formatted = f"{hour:02d}:{minute:02d}"
        except ValueError:
            return None, None, f"Non-numeric time value '{acq_time_str}'"
            
    dt_utc = datetime(
        parsed_date.year, parsed_date.month, parsed_date.day,
        hour, minute, 0, tzinfo=timezone.utc
    )
    return dt_utc, date_cleaned, None

def generate_record_hash(source_id: str, satellite: str, date_str: str, time_str: str, lat: float, lon: float, frp: float) -> str:
    """
    Deterministic hash for idempotent ingestion and raw duplicate detection.
    Rounds lat/lon to 5 decimals (~1.1 meter) and FRP to 2 decimals.
    """
    payload = f"{source_id}|{satellite}|{date_str}|{time_str}|{lat:.5f}|{lon:.5f}|{frp:.2f}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

class NormalizationService:
    """
    Normalization Service for MODIS and VIIRS satellite active fire records.
    Normalizes divergent schemas into a common internal observation structure
    while strictly preserving sensor integrity, original confidence metrics, and provenance.
    """

    @staticmethod
    def identify_sensor_family(source_id: str, row: Dict[str, Any]) -> Tuple[str, str]:
        """
        Determine sensor_family ('MODIS' or 'VIIRS') and instrument.
        """
        src = (source_id or "").upper()
        if "MODIS" in src:
            return "MODIS", "MODIS"
        if "VIIRS" in src:
            return "VIIRS", "VIIRS"
            
        # Inspect columns if source_id is ambiguous (e.g. generic upload)
        keys = {k.lower(): k for k in row.keys()}
        if "bright_ti4" in keys or "bright_ti5" in keys:
            return "VIIRS", "VIIRS"
        if "brightness" in keys or "bright_t31" in keys:
            return "MODIS", "MODIS"
            
        return "UNKNOWN", "UNKNOWN"

    @classmethod
    def normalize_row(cls, row: Dict[str, Any], source_id: str, processing_type: str = "NRT") -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Normalize a single MODIS or VIIRS record.
        Returns (normalized_dict, None) or (None, rejection_reason).
        """
        # Case-insensitive column map
        c = {k.strip().lower(): v for k, v in row.items()}
        
        # 1. Validate coordinates
        raw_lat = c.get("latitude")
        raw_lon = c.get("longitude")
        valid, err = validate_coordinates(raw_lat, raw_lon)
        if not valid:
            return None, err
        lat = float(raw_lat)
        lon = float(raw_lon)

        # 2. Parse temporal attributes (UTC)
        acq_date = c.get("acq_date")
        acq_time = c.get("acq_time")
        dt_utc, date_str, dt_err = parse_utc_datetime(acq_date, acq_time)
        if dt_err:
            return None, dt_err

        # 3. Sensor identification
        sensor_family, instrument = cls.identify_sensor_family(source_id, c)
        if sensor_family == "UNKNOWN":
            return None, "Unable to determine sensor family (neither MODIS nor VIIRS columns found)"

        # 4. Satellite identification
        sat_val = c.get("satellite")
        if sat_val:
            satellite = str(sat_val).strip()
            # Normalize common satellite shorthand
            if satellite in ("T", "Terra"):
                satellite = "Terra"
            elif satellite in ("A", "Aqua"):
                satellite = "Aqua"
            elif satellite in ("N", "N20", "NOAA-20", "JPSS-1"):
                satellite = "NOAA-20"
            elif satellite in ("N21", "NOAA-21", "JPSS-2"):
                satellite = "NOAA-21"
            elif satellite in ("S-NPP", "SNPP", "NPP"):
                satellite = "Suomi-NPP"
        else:
            if "NOAA20" in source_id.upper():
                satellite = "NOAA-20"
            elif "NOAA21" in source_id.upper():
                satellite = "NOAA-21"
            elif "SNPP" in source_id.upper():
                satellite = "Suomi-NPP"
            elif "MODIS" in source_id.upper():
                satellite = "Terra/Aqua"
            else:
                satellite = "Unknown"

        # 5. Thermal measurements (Brightness & FRP)
        frp_raw = c.get("frp")
        try:
            frp = float(frp_raw) if frp_raw not in (None, "", "NA", "null") else 0.0
            if math.isnan(frp) or math.isinf(frp):
                frp = 0.0
            elif frp < 0.0:
                return None, f"Invalid negative FRP value ({frp})"
        except (ValueError, TypeError):
            frp = 0.0

        brightness_temp = None
        brightness_channel = None
        if sensor_family == "MODIS":
            b_val = c.get("brightness") or c.get("bright_t31")
            brightness_channel = "T21/T22"
            if b_val not in (None, "", "NA", "null"):
                try:
                    brightness_temp = float(b_val)
                except ValueError:
                    brightness_temp = None
        elif sensor_family == "VIIRS":
            b_val = c.get("bright_ti4") or c.get("bright_ti5")
            brightness_channel = "I4"
            if b_val not in (None, "", "NA", "null"):
                try:
                    brightness_temp = float(b_val)
                except ValueError:
                    brightness_temp = None

        # 6. Confidence handling (preserve original value and scale type)
        raw_conf = c.get("confidence")
        if sensor_family == "MODIS":
            # MODIS confidence is typically an integer 0-100 (percentage)
            confidence_type = "percentage"
            confidence_raw = str(raw_conf).strip() if raw_conf not in (None, "", "NA") else "0"
        else:
            # VIIRS confidence is typically categorical: 'l' (low), 'n' (nominal), 'h' (high)
            confidence_type = "categorical"
            confidence_raw = str(raw_conf).strip().lower() if raw_conf not in (None, "", "NA") else "nominal"

        # 7. Scan and track pixel dimensions (km)
        scan_km = None
        track_km = None
        try:
            if c.get("scan") not in (None, ""):
                scan_km = float(c.get("scan"))
            if c.get("track") not in (None, ""):
                track_km = float(c.get("track"))
        except (ValueError, TypeError):
            pass

        # 8. Spatial grid assignment (EPSG:6933 1km analytical cell)
        grid_info = coords_to_grid_cell(lat, lon)

        # 9. Day/Night flag
        daynight = c.get("daynight")
        if daynight:
            daynight = str(daynight).strip().upper()[:1]
            if daynight not in ("D", "N"):
                daynight = None

        version = c.get("version")
        if version:
            version = str(version).strip()

        # 10. Deterministic ID and idempotency hash
        record_hash = generate_record_hash(source_id, satellite, date_str, dt_utc.strftime("%H:%M"), lat, lon, frp)
        obs_id = f"obs_{record_hash[:16]}_{uuid.uuid4().hex[:8]}"

        normalized = {
            "observation_id": obs_id,
            "source_record_hash": record_hash,
            "sensor_family": sensor_family,
            "satellite": satellite,
            "instrument": instrument,
            "source_id": source_id,
            "processing_type": processing_type,
            "version": version,
            "latitude": lat,
            "longitude": lon,
            "grid_cell_id": grid_info["grid_cell_id"],
            "proj_x": grid_info["proj_x"],
            "proj_y": grid_info["proj_y"],
            "scan_km": scan_km,
            "track_km": track_km,
            "acquisition_date_utc": date_str,
            "acquisition_datetime_utc": dt_utc,
            "daynight": daynight,
            "brightness_temperature_kelvin": brightness_temp,
            "brightness_channel": brightness_channel,
            "frp_mw": frp,
            "confidence_raw": confidence_raw,
            "confidence_type": confidence_type,
            "ingested_at": datetime.now(timezone.utc),
        }
        return normalized, None

    @classmethod
    def normalize_batch(cls, records: List[Dict[str, Any]], source_id: str, processing_type: str = "NRT") -> Dict[str, Any]:
        """
        Normalize a list of raw records.
        Returns dictionary containing:
        - accepted_records: List[Dict[str, Any]]
        - rejected_records: List[Dict[str, Any]]
        - duplicate_records: List[Dict[str, Any]]
        - quality_report: Dict[str, Any]
        """
        accepted = []
        rejected = []
        duplicates = []
        seen_hashes = set()
        
        rejection_reasons: Dict[str, int] = {}
        missing_values: Dict[str, int] = {
            "confidence": 0,
            "brightness": 0,
            "frp": 0,
            "scan": 0,
            "track": 0
        }
        source_counts: Dict[str, int] = {}

        for row in records:
            norm, err = cls.normalize_row(row, source_id, processing_type)
            if err:
                rejected.append({"row": row, "reason": err})
                rejection_reasons[err] = rejection_reasons.get(err, 0) + 1
                continue
                
            h = norm["source_record_hash"]
            if h in seen_hashes:
                duplicates.append(norm)
                continue
            seen_hashes.add(h)

            # Audit missing optional fields
            if norm["confidence_raw"] in ("0", "nominal", "unknown"):
                missing_values["confidence"] += 1
            if norm["brightness_temperature_kelvin"] is None:
                missing_values["brightness"] += 1
            if norm["frp_mw"] == 0.0:
                missing_values["frp"] += 1
            if norm["scan_km"] is None:
                missing_values["scan"] += 1
            if norm["track_km"] is None:
                missing_values["track"] += 1

            fam = norm["sensor_family"]
            source_counts[fam] = source_counts.get(fam, 0) + 1
            accepted.append(norm)

        quality_report = {
            "records_received": len(records),
            "records_accepted": len(accepted),
            "records_rejected": len(rejected),
            "duplicate_records": len(duplicates),
            "rejection_reasons": rejection_reasons,
            "missing_values_summary": missing_values,
            "source_counts": source_counts,
        }

        return {
            "accepted_records": accepted,
            "rejected_records": rejected,
            "duplicate_records": duplicates,
            "quality_report": quality_report
        }

