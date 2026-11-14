import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure database for Vercel serverless /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_db = Path("/tmp/firepulse.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()
