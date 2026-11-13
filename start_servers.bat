@echo off
setlocal
cd /d "%~dp0"
title FirePulse Launcher - NASA Space Apps 2026

echo ===================================================================
echo  🔥 FirePulse: MODIS and VIIRS Hot Spot Harmonization
echo  NASA Space Apps Challenge 2026 - Team: Virtual Warriors
echo ===================================================================
echo.
echo [1/3] Starting Backend Server (Flask REST API on http://127.0.0.1:5000)...
start "FirePulse Backend (Port 5000)" cmd /k "cd /d ""%~dp0backend"" && call .\.venv\Scripts\activate.bat && python run.py"

echo [2/3] Starting Frontend Dev Server (Vite on http://localhost:3000)...
start "FirePulse Frontend (Port 3000)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000/ ...
start http://localhost:3000/

echo.
echo ===================================================================
echo  Both servers are running in separate terminal windows!
echo   * Frontend Web UI:  http://localhost:3000
echo   * Backend REST API: http://127.0.0.1:5000/api
echo   * Health Check:     http://127.0.0.1:5000/api/health
echo ===================================================================
echo.
echo (You can close this window now. Keep the Backend and Frontend windows open.)
pause
