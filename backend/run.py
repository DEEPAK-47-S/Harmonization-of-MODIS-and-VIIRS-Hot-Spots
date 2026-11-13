import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app import create_app
from app.config import Config

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    host = os.getenv("HOST", "127.0.0.1")
    debug = os.getenv("FLASK_DEBUG", "1") == "1"
    
    print(f"==================================================")
    print(f" 🔥 FirePulse - NASA Space Apps Challenge 2026")
    print(f" Team: Virtual Warriors")
    print(f" Backend REST API running at http://{host}:{port}/api")
    print(f" Health Check: http://{host}:{port}/api/health")
    print(f"==================================================")
    app.run(host=host, port=port, debug=debug)

