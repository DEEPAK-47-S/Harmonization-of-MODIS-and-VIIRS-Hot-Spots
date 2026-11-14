import sys
import os
from pathlib import Path

# Set up paths for Vercel serverless environment
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
backend_dir = project_root / "backend"

for p in [str(backend_dir), str(project_root)]:
    if p not in sys.path:
        sys.path.insert(0, p)

# Handle Vercel serverless read-only filesystem by using /tmp for SQLite
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_db = Path("/tmp/firepulse.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(port=5000, debug=True)
