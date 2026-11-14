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

    # Detect serverless environment (Vercel / AWS Lambda)
    IS_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    
    if IS_SERVERLESS:
        _tmp_base = Path("/tmp/firepulse")
        try:
            _tmp_base.mkdir(parents=True, exist_ok=True)
        except Exception:
            _tmp_base = Path("/tmp")
        
        _default_db = _tmp_base / "firepulse.db"
        DATA_RAW_DIR = _tmp_base / "data" / "raw"
        DATA_PROCESSED_DIR = _tmp_base / "data" / "processed"
        DATA_EXPORTS_DIR = _tmp_base / "data" / "exports"
    else:
        _default_db = BASE_DIR / "firepulse.db"
        if not _default_db.exists() and (WORKSPACE_DIR / "firepulse.db").exists():
            _default_db = WORKSPACE_DIR / "firepulse.db"
        
        DATA_RAW_DIR = WORKSPACE_DIR / "data" / "raw"
        DATA_PROCESSED_DIR = WORKSPACE_DIR / "data" / "processed"
        DATA_EXPORTS_DIR = WORKSPACE_DIR / "data" / "exports"

    # Ensure storage directories exist
    try:
        DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
        DATA_PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        DATA_EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass

    # Synchronize DB_PATH and SQLALCHEMY_DATABASE_URI
    _db_url_env = os.getenv("DATABASE_URL")
    if _db_url_env and _db_url_env.startswith("sqlite:///"):
        DB_PATH = Path(_db_url_env.replace("sqlite:///", ""))
        SQLALCHEMY_DATABASE_URI = _db_url_env
    else:
        DB_PATH = _default_db
        SQLALCHEMY_DATABASE_URI = _db_url_env or f"sqlite:///{DB_PATH}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Operational constraints
    MAX_DAYS_PER_QUERY = int(os.getenv("MAX_DAYS_PER_QUERY", "5"))
    FIRMS_RATE_LIMIT_DELAY = float(os.getenv("FIRMS_RATE_LIMIT_DELAY_SECONDS", "0.5"))

