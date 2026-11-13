import json
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, Float, String, Boolean, DateTime, Index, UniqueConstraint, Text
)
from .observation import Base

class DailyGridActivity(Base):
    """
    Spatially and Temporally Harmonized Daily Grid Activity.
    Aggregates MODIS and VIIRS detections across fixed 1km x 1km analytical equal-area cells (EPSG:6933).
    Identifies cross-sensor co-detections without conflating observations into single 'fires'.
    """
    __tablename__ = "daily_grid_activity"

    id = Column(Integer, primary_key=True, autoincrement=True)
    grid_cell_id = Column(String(64), nullable=False, index=True)
    activity_date_utc = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    
    # Aggregated detection counts
    modis_detection_count = Column(Integer, nullable=False, default=0)
    viirs_detection_count = Column(Integer, nullable=False, default=0)
    active_grid_cell = Column(Boolean, nullable=False, default=True)
    
    # Harmonized sensor classifications
    # 'MODIS', 'VIIRS', or 'MODIS+VIIRS'
    sensors_present = Column(String(32), nullable=False)
    
    # True if both MODIS and VIIRS observed this cell on this UTC date
    cross_sensor_presence = Column(Boolean, nullable=False, default=False)
    
    # Separate sensor FRP metrics
    modis_frp_mean = Column(Float, nullable=True)
    modis_frp_max = Column(Float, nullable=True)
    viirs_frp_mean = Column(Float, nullable=True)
    viirs_frp_max = Column(Float, nullable=True)
    
    # Confidence distributions as JSON strings
    # e.g., MODIS: {"low": 0, "nominal": 2, "high": 1}
    # e.g., VIIRS: {"l": 0, "n": 3, "h": 2}
    modis_confidence_distribution = Column(Text, nullable=True)
    viirs_confidence_distribution = Column(Text, nullable=True)
    
    # Geometry center and boundaries in WGS84 for direct frontend mapping
    cell_center_lat = Column(Float, nullable=False)
    cell_center_lon = Column(Float, nullable=False)
    cell_bounds_wgs84 = Column(Text, nullable=True)  # JSON {west, south, east, north}
    
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("grid_cell_id", "activity_date_utc", name="uq_grid_date"),
        Index("idx_grid_date", "activity_date_utc"),
        Index("idx_grid_cross_sensor", "cross_sensor_presence"),
    )

    def to_dict(self):
        """Serialize grid activity for API responses."""
        return {
            "id": self.id,
            "grid_cell_id": self.grid_cell_id,
            "activity_date_utc": self.activity_date_utc,
            "modis_detection_count": self.modis_detection_count,
            "viirs_detection_count": self.viirs_detection_count,
            "total_detections": self.modis_detection_count + self.viirs_detection_count,
            "active_grid_cell": self.active_grid_cell,
            "sensors_present": self.sensors_present,
            "cross_sensor_presence": self.cross_sensor_presence,
            "modis_frp_mean": self.modis_frp_mean,
            "modis_frp_max": self.modis_frp_max,
            "viirs_frp_mean": self.viirs_frp_mean,
            "viirs_frp_max": self.viirs_frp_max,
            "modis_confidence_distribution": json.loads(self.modis_confidence_distribution) if self.modis_confidence_distribution else {},
            "viirs_confidence_distribution": json.loads(self.viirs_confidence_distribution) if self.viirs_confidence_distribution else {},
            "cell_center_lat": self.cell_center_lat,
            "cell_center_lon": self.cell_center_lon,
            "cell_bounds_wgs84": json.loads(self.cell_bounds_wgs84) if self.cell_bounds_wgs84 else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

