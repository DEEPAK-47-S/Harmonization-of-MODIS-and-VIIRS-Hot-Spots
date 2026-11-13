import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from .observation import Base

class IngestionJob(Base):
    """
    Ingestion Job tracking table.
    Tracks execution status, AOI bounding box, queried sources, dates, records received and processed.
    """
    __tablename__ = "ingestion_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(64), nullable=False, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    source = Column(String(64), nullable=False, index=True)
    aoi_name = Column(String(128), nullable=True)
    west = Column(Float, nullable=False)
    south = Column(Float, nullable=False)
    east = Column(Float, nullable=False)
    north = Column(Float, nullable=False)
    start_date = Column(String(10), nullable=False)
    end_date = Column(String(10), nullable=False)
    status = Column(String(32), nullable=False, default="PENDING")  # PENDING, RUNNING, COMPLETED, FAILED
    records_received = Column(Integer, nullable=False, default=0)
    records_processed = Column(Integer, nullable=False, default=0)
    records_rejected = Column(Integer, nullable=False, default=0)
    duplicate_records = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "source": self.source,
            "aoi_name": self.aoi_name,
            "bbox": {
                "west": self.west,
                "south": self.south,
                "east": self.east,
                "north": self.north,
            },
            "start_date": self.start_date,
            "end_date": self.end_date,
            "status": self.status,
            "records_received": self.records_received,
            "records_processed": self.records_processed,
            "records_rejected": self.records_rejected,
            "duplicate_records": self.duplicate_records,
            "error_message": self.error_message,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

