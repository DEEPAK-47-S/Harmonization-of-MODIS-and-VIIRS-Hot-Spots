import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Prevent self-referential shadowing of the 'app' package
current_file = str(Path(__file__).resolve())
if 'app' in sys.modules and getattr(sys.modules['app'], '__file__', None) == current_file:
    del sys.modules['app']

# Configure database for Vercel serverless /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    tmp_db = Path("/tmp/firepulse.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp_db}"

import app as _pkg
app = _pkg.create_app()

if __name__ == "__main__":
    app.run()
