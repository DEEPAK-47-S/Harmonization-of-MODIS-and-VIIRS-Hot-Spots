import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_DIR = BASE_DIR.parent

# Load .env if present
load_dotenv(BASE_DIR / ".env")

class Config:
    """Application configuration for FirePulse."""
    
    BASE_DIR = BASE_DIR
    WORKSPACE_DIR = WORKSPACE_DIR
    
    # NASA FIRMS API
    FIRMS_MAP_KEY = os.getenv("FIRMS_MAP_KEY", "").strip()
    FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov"
    FIRMS_AREA_API = f"{FIRMS_BASE_URL}/api/area/csv"
    FIRMS_DATA_AVAILABILITY_API = f"{FIRMS_BASE_URL}/api/data_availability"
    
    # Supported sources
    SUPPORTED_SOURCES = {
        "MODIS_NRT": {"family": "MODIS", "type": "NRT", "nominal_res_m": 1000},
        "MODIS_SP": {"family": "MODIS", "type": "SP", "nominal_res_m": 1000},
        "VIIRS_NOAA20_NRT": {"family": "VIIRS", "type": "NRT", "nominal_res_m": 375},
        "VIIRS_NOAA20_SP": {"family": "VIIRS", "type": "SP", "nominal_res_m": 375},
        "VIIRS_NOAA21_NRT": {"family": "VIIRS", "type": "NRT", "nominal_res_m": 375},
        "VIIRS_NOAA21_SP": {"family": "VIIRS", "type": "SP", "nominal_res_m": 375},
        "VIIRS_SNPP_SP": {"family": "VIIRS", "type": "SP", "nominal_res_m": 375, "historical_only": True},
    }

    # Default AOI: Tamil Nadu, India
    DEFAULT_AOI = {
        "name": "Tamil Nadu, India",
        "west": float(os.getenv("DEFAULT_AOI_WEST", "76.2")),
        "south": float(os.getenv("DEFAULT_AOI_SOUTH", "8.0")),
        "east": float(os.getenv("DEFAULT_AOI_EAST", "80.4")),
        "north": float(os.getenv("DEFAULT_AOI_NORTH", "13.6")),
    }
    
    # Preset AOIs
    AOI_PRESETS = [
        {
            "id": "tamil-nadu",
            "name": "Tamil Nadu, India",
            "west": 76.2,
            "south": 8.0,
            "east": 80.4,
            "north": 13.6,
            "description": "Southern India Western Ghats and agricultural plains"
        },
        {
            "id": "california",
            "name": "California, USA",
            "west": -124.4,
            "south": 32.5,
            "east": -114.1,
            "north": 42.0,
            "description": "Western United States Mediterranean and forest wildfire zone"
        }
    ]

    # Database setup
    _default_db = BASE_DIR / "firepulse.db"
    if not _default_db.exists() and (WORKSPACE_DIR / "firepulse.db").exists():
        _default_db = WORKSPACE_DIR / "firepulse.db"

    _gz_db = BASE_DIR / "firepulse.db.gz"
    if not _gz_db.exists() and (WORKSPACE_DIR / "backend" / "firepulse.db.gz").exists():
        _gz_db = WORKSPACE_DIR / "backend" / "firepulse.db.gz"

    # Serverless runtime (Vercel / AWS Lambda) writable path support
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        _tmp_db = Path("/tmp/firepulse.db")
        if not _tmp_db.exists():
            if _gz_db.exists():
                import gzip
                import shutil
                try:
                    with gzip.open(_gz_db, "rb") as f_in, open(_tmp_db, "wb") as f_out:
                        shutil.copyfileobj(f_in, f_out)
                except Exception:
                    pass
            elif _default_db.exists():
                import shutil
                try:
                    shutil.copyfile(_default_db, _tmp_db)
                except Exception:
                    pass
        if _tmp_db.exists():
            _default_db = _tmp_db
    else:
        # Local environment auto-decompress if needed
        if not _default_db.exists() and _gz_db.exists():
            import gzip
            import shutil
            try:
                with gzip.open(_gz_db, "rb") as f_in, open(_default_db, "wb") as f_out:
                    shutil.copyfileobj(f_in, f_out)
            except Exception:
                pass

    DB_PATH = _default_db
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Operational constraints
    MAX_DAYS_PER_QUERY = int(os.getenv("MAX_DAYS_PER_QUERY", "5"))
    FIRMS_RATE_LIMIT_DELAY = float(os.getenv("FIRMS_RATE_LIMIT_DELAY_SECONDS", "0.5"))
    
    # Storage paths
    DATA_RAW_DIR = WORKSPACE_DIR / "data" / "raw"
    DATA_PROCESSED_DIR = WORKSPACE_DIR / "data" / "processed"
    DATA_EXPORTS_DIR = WORKSPACE_DIR / "data" / "exports"

