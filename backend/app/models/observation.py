from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, Float, String, DateTime, Index, UniqueConstraint
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Observation(Base):
    """
    Normalized Satellite Hotspot Observation.
    Stores raw observations from MODIS (Terra/Aqua) and VIIRS (NOAA-20, NOAA-21, S-NPP)
    in a standardized scientific structure while preserving all sensor-specific attributes.
    """
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    observation_id = Column(String(64), nullable=False, unique=True, index=True)
    source_record_hash = Column(String(64), nullable=False, unique=True, index=True)
    
    # Sensor provenance
    sensor_family = Column(String(16), nullable=False, index=True)  # 'MODIS' or 'VIIRS'
    satellite = Column(String(32), nullable=False, index=True)      # 'Terra', 'Aqua', 'NOAA-20', etc.
    instrument = Column(String(16), nullable=False)                 # 'MODIS', 'VIIRS'
    source_id = Column(String(32), nullable=False, index=True)      # 'MODIS_NRT', 'VIIRS_NOAA20_NRT', etc.
    processing_type = Column(String(16), nullable=False)            # 'NRT', 'SP', 'ARCHIVE'
    version = Column(String(32), nullable=True)                     # Sensor processing version
    
    # Spatial coordinates
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    grid_cell_id = Column(String(64), nullable=False, index=True)   # Equal-area 1km cell
    proj_x = Column(Float, nullable=False)                          # Projected EPSG:6933 X
    proj_y = Column(Float, nullable=False)                          # Projected EPSG:6933 Y
    scan_km = Column(Float, nullable=True)                          # Pixel scan dimension (km)
    track_km = Column(Float, nullable=True)                         # Pixel track dimension (km)
    
    # Temporal attributes (always UTC)
    acquisition_date_utc = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    acquisition_datetime_utc = Column(DateTime, nullable=False, index=True)
    daynight = Column(String(1), nullable=True)                     # 'D' (day) or 'N' (night)
    
    # Thermal measurements
    brightness_temperature_kelvin = Column(Float, nullable=True)    # Brightness (K)
    brightness_channel = Column(String(16), nullable=True)          # 'T21/T22' or 'I4'
    frp_mw = Column(Float, nullable=False, default=0.0)             # Fire Radiative Power (MW)
    
    # Sensor-specific confidence
    confidence_raw = Column(String(32), nullable=False)             # '85', 'nominal', 'high', etc.
    confidence_type = Column(String(16), nullable=False)            # 'percentage' or 'categorical'
    
    # Audit & ingestion metadata
    ingested_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("idx_obs_sensor_date", "sensor_family", "acquisition_date_utc"),
        Index("idx_obs_grid_date", "grid_cell_id", "acquisition_date_utc"),
        Index("idx_obs_lat_lon", "latitude", "longitude"),
    )

    def to_dict(self):
        """Serialize observation for API responses."""
        return {
            "id": self.id,
            "observation_id": self.observation_id,
            "sensor_family": self.sensor_family,
            "satellite": self.satellite,
            "instrument": self.instrument,
            "source_id": self.source_id,
            "processing_type": self.processing_type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "grid_cell_id": self.grid_cell_id,
            "acquisition_date_utc": self.acquisition_date_utc,
            "acquisition_datetime_utc": self.acquisition_datetime_utc.isoformat() if self.acquisition_datetime_utc else None,
            "daynight": self.daynight,
            "brightness_temperature_kelvin": self.brightness_temperature_kelvin,
            "brightness_channel": self.brightness_channel,
            "frp_mw": self.frp_mw,
            "confidence_raw": self.confidence_raw,
            "confidence_type": self.confidence_type,
            "scan_km": self.scan_km,
            "track_km": self.track_km,
            "version": self.version,
            "ingested_at": self.ingested_at.isoformat() if self.ingested_at else None,
        }

