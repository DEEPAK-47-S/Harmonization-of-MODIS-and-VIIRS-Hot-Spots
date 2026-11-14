# FirePulse: Local & Cloud Deployment Guide (Phase 16)

**Project Name**: FirePulse  
**Team**: Virtual Warriors  
**Challenge**: NASA Space Apps Challenge 2026 — Harmonization of MODIS and VIIRS Hot Spots  

---

## 1. Quick Start (Windows 1-Click Launch)

To start both the Backend (Flask REST API on port 5000) and the Frontend (Vite Dev Server on port 3000), double-click:
```cmd
start_servers.bat
```
or run from PowerShell:
```powershell
.\start_servers.bat
```
This automatically launches both processes and opens your default browser at `http://localhost:3000/`.

---

## 2. Manual Step-by-Step Installation

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm
- Valid NASA FIRMS MAP_KEY (free registration at [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/map_key/))

### Step 1: Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Environment Configuration
Create or edit `backend/.env`:
```env
FIRMS_MAP_KEY=c9627b162889328b6590b1035edf4935
DATABASE_URL=sqlite:///firepulse.db
FLASK_ENV=development
FLASK_DEBUG=1
```

### Step 3: Run Backend Server
```bash
python run.py
```
Backend will start on `http://127.0.0.1:5000`.

### Step 4: Frontend Setup & Run
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will start on `http://localhost:3000`.

---

## 3. Running Automated Tests

```bash
# Run all backend unit & integration tests
backend\.venv\Scripts\pytest backend\tests -v

# Run frontend type-check & production build
npm --prefix frontend run build
```

---

## 4. Production Deployment

### Docker / Containerized
A multi-stage Docker build can serve the built frontend via Nginx and the Flask API via Gunicorn/Uvicorn:
- Gunicorn command: `gunicorn -w 4 -b 0.0.0.0:5000 "backend.app:create_app()"`
- Nginx reverse-proxies `/api` to port 5000 and serves `frontend/dist` statically.
