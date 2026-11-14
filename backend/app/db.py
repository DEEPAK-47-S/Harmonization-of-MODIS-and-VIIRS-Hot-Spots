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
            import glob, gzip, sqlite3, logging
            from pathlib import Path
            logger = logging.getLogger("firepulse")
            
            db_file = str(Config.DB_PATH)
            Path(db_file).parent.mkdir(parents=True, exist_ok=True)
            
            conn = sqlite3.connect(db_file)

            # Check for chunked seeds first (backend/seeds/seed_chunk_*.bin)
            seeds_dir = Config.BASE_DIR / "seeds"
            if not seeds_dir.exists():
                seeds_dir = Config.WORKSPACE_DIR / "backend" / "seeds"

            chunk_files = sorted(glob.glob(str(seeds_dir / "seed_chunk_*.bin")))
            if chunk_files:
                compressed_bytes = bytearray()
                for cf in chunk_files:
                    with open(cf, "rb") as f:
                        compressed_bytes.extend(f.read())
                sql_text = gzip.decompress(compressed_bytes).decode("utf-8")
                # Make all table & index creations safe if Base.metadata.create_all already created schema
                safe_sql = (
                    sql_text.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
                            .replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
                            .replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ")
                )
                conn.executescript(safe_sql)
                conn.close()
                logger.info(f"Auto-seeded database from {len(chunk_files)} seed chunks.")
                return

            # Fallback to single seed_dump.sql.gz
            seed_sql = Config.BASE_DIR / "seed_dump.sql.gz"
            if not seed_sql.exists():
                seed_sql = Config.WORKSPACE_DIR / "backend" / "seed_dump.sql.gz"
            if seed_sql.exists():
                with gzip.open(seed_sql, "rt", encoding="utf-8") as f:
                    raw_sql = f.read()
                safe_sql = (
                    raw_sql.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
                           .replace("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ")
                           .replace("CREATE UNIQUE INDEX ", "CREATE UNIQUE INDEX IF NOT EXISTS ")
                )
                conn.executescript(safe_sql)
                conn.close()
                logger.info("Auto-seeded production NASA observations & grid baselines from seed_dump.sql.gz.")
    except Exception as e:
        import logging
        logging.getLogger("firepulse").error(f"auto_seed error: {e}", exc_info=True)

def get_db():
    """Yield a database session context."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

