from .health import health_bp
from .data import data_bp
from .dashboard import dashboard_bp
from .hotspots import hotspots_bp
from .calendar import calendar_bp
from .comparison import comparison_bp
from .trends import trends_bp
from .anomalies import anomalies_bp
from .export import export_bp

__all__ = [
    "health_bp",
    "data_bp",
    "dashboard_bp",
    "hotspots_bp",
    "calendar_bp",
    "comparison_bp",
    "trends_bp",
    "anomalies_bp",
    "export_bp"
]

