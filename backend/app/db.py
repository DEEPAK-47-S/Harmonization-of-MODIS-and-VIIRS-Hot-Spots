from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from .config import Config
from .models import Base

# Database engine and thread-safe session factory
engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False} if "sqlite" in Config.SQLALCHEMY_DATABASE_URI else {},
    echo=False
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

def init_db():
    """Create tables if they don't exist and auto-seed if empty."""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        import logging
        logging.getLogger("firepulse").warning(f"init_db note: {e}")

    # Auto-seed verified NASA observations and historical baselines if empty
    try:
        from .models import Observation
        db = SessionLocal()
        count = db.query(Observation.id).first()
        db.close()

        if count is None:
            seed_sql = Config.BASE_DIR / "seed_dump.sql.gz"
            if not seed_sql.exists():
                seed_sql = Config.WORKSPACE_DIR / "backend" / "seed_dump.sql.gz"
            if seed_sql.exists():
                import gzip
                import sqlite3
                # Extract directly into SQLite database file
                db_file = str(Config.DB_PATH)
                conn = sqlite3.connect(db_file)
                with gzip.open(seed_sql, "rt", encoding="utf-8") as f:
                    conn.executescript(f.read())
                conn.close()
                import logging
                logging.getLogger("firepulse").info("Auto-seeded production NASA observations & grid baselines from seed_dump.sql.gz.")
    except Exception as e:
        import logging
        logging.getLogger("firepulse").warning(f"auto_seed note: {e}")

def get_db():
    """Yield a database session context."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

