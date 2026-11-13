import csv
import io
from typing import Optional
from sqlalchemy.orm import Session
from ..models import Observation, DailyGridActivity

class ExportService:
    """
    CSV Export Service for NASA FIRMS Harmonized FirePulse Data.
    Generates standardized CSV streams for researchers and environmental managers.
    """

    @classmethod
    def export_observations_csv(
        cls,
        db: Session,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        sensor: Optional[str] = None,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
        limit: int = 50000
    ) -> str:
        """Export normalized satellite hotspot observations to CSV."""
        query = db.query(Observation)
        if date_from:
            query = query.filter(Observation.acquisition_date_utc >= date_from)
        if date_to:
            query = query.filter(Observation.acquisition_date_utc <= date_to)
        if sensor:
            query = query.filter(Observation.sensor_family == sensor.upper())
        if west is not None:
            query = query.filter(Observation.longitude >= west)
        if east is not None:
            query = query.filter(Observation.longitude <= east)
        if south is not None:
            query = query.filter(Observation.latitude >= south)
        if north is not None:
            query = query.filter(Observation.latitude <= north)

        records = query.order_by(Observation.acquisition_datetime_utc).limit(limit).all()

        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "observation_id",
            "source_record_hash",
            "sensor_family",
            "satellite",
            "instrument",
            "source_id",
            "processing_type",
            "latitude",
            "longitude",
            "grid_cell_id",
            "acquisition_date_utc",
            "acquisition_datetime_utc",
            "daynight",
            "brightness_temperature_kelvin",
            "brightness_channel",
            "frp_mw",
            "confidence_raw",
            "confidence_type",
            "scan_km",
            "track_km",
            "version",
            "ingested_at_utc"
        ]
        writer.writerow(headers)

        for r in records:
            writer.writerow([
                r.observation_id,
                r.source_record_hash,
                r.sensor_family,
                r.satellite,
                r.instrument,
                r.source_id,
                r.processing_type,
                r.latitude,
                r.longitude,
                r.grid_cell_id,
                r.acquisition_date_utc,
                r.acquisition_datetime_utc.isoformat() if r.acquisition_datetime_utc else "",
                r.daynight or "",
                r.brightness_temperature_kelvin if r.brightness_temperature_kelvin is not None else "",
                r.brightness_channel or "",
                r.frp_mw,
                r.confidence_raw,
                r.confidence_type,
                r.scan_km if r.scan_km is not None else "",
                r.track_km if r.track_km is not None else "",
                r.version or "",
                r.ingested_at.isoformat() if r.ingested_at else ""
            ])

        return output.getvalue()

    @classmethod
    def export_grid_activity_csv(
        cls,
        db: Session,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        west: Optional[float] = None,
        south: Optional[float] = None,
        east: Optional[float] = None,
        north: Optional[float] = None,
        limit: int = 50000
    ) -> str:
        """Export harmonized daily 1km grid activity cells to CSV."""
        query = db.query(DailyGridActivity)
        if date_from:
            query = query.filter(DailyGridActivity.activity_date_utc >= date_from)
        if date_to:
            query = query.filter(DailyGridActivity.activity_date_utc <= date_to)
        if west is not None:
            query = query.filter(DailyGridActivity.cell_center_lon >= west)
        if east is not None:
            query = query.filter(DailyGridActivity.cell_center_lon <= east)
        if south is not None:
            query = query.filter(DailyGridActivity.cell_center_lat >= south)
        if north is not None:
            query = query.filter(DailyGridActivity.cell_center_lat <= north)

        records = query.order_by(DailyGridActivity.activity_date_utc).limit(limit).all()

        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "grid_cell_id",
            "activity_date_utc",
            "modis_detection_count",
            "viirs_detection_count",
            "total_detections",
            "active_grid_cell",
            "sensors_present",
            "cross_sensor_presence",
            "modis_frp_mean",
            "modis_frp_max",
            "viirs_frp_mean",
            "viirs_frp_max",
            "cell_center_lat",
            "cell_center_lon"
        ]
        writer.writerow(headers)

        for r in records:
            writer.writerow([
                r.grid_cell_id,
                r.activity_date_utc,
                r.modis_detection_count,
                r.viirs_detection_count,
                r.modis_detection_count + r.viirs_detection_count,
                1 if r.active_grid_cell else 0,
                r.sensors_present,
                1 if r.cross_sensor_presence else 0,
                r.modis_frp_mean if r.modis_frp_mean is not None else "",
                r.modis_frp_max if r.modis_frp_max is not None else "",
                r.viirs_frp_mean if r.viirs_frp_mean is not None else "",
                r.viirs_frp_max if r.viirs_frp_max is not None else "",
                r.cell_center_lat,
                r.cell_center_lon
            ])

        return output.getvalue()

