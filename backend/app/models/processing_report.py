import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from .observation import Base

class ProcessingReport(Base):
    """
    Data Quality & Processing Report.
    Audits every ingestion batch: records received, accepted, rejected, duplicates,
    missing values, rejection reasons, and source counts.
    """
    __tablename__ = "processing_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(String(64), nullable=False, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(64), nullable=True, index=True)
    source = Column(String(64), nullable=False, index=True)
    records_received = Column(Integer, nullable=False, default=0)
    records_accepted = Column(Integer, nullable=False, default=0)
    records_rejected = Column(Integer, nullable=False, default=0)
    duplicate_records = Column(Integer, nullable=False, default=0)
    rejection_reasons = Column(Text, nullable=True)     # JSON: {"reason": count}
    missing_values_summary = Column(Text, nullable=True) # JSON: {"column": count}
    source_counts = Column(Text, nullable=True)          # JSON: {"sensor": count}
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "job_id": self.job_id,
            "source": self.source,
            "records_received": self.records_received,
            "records_accepted": self.records_accepted,
            "records_rejected": self.records_rejected,
            "duplicate_records": self.duplicate_records,
            "rejection_reasons": json.loads(self.rejection_reasons) if self.rejection_reasons else {},
            "missing_values_summary": json.loads(self.missing_values_summary) if self.missing_values_summary else {},
            "source_counts": json.loads(self.source_counts) if self.source_counts else {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

