Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🔥 FirePulse Full-Stack Launcher" -ForegroundColor Yellow
Write-Host " NASA Space Apps Challenge 2026 - Virtual Warriors" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Check Python environment
if (!(Test-Path ".\backend\.venv\Scripts\python.exe")) {
    Write-Host "Creating Python virtual environment in backend\.venv..." -ForegroundColor Yellow
    & python -m venv ".\backend\.venv"
    & ".\backend\.venv\Scripts\pip.exe" install -r ".\backend\requirements.txt"
}

# Start backend server
Write-Host "`nStarting FirePulse Unified Server at http://127.0.0.1:5000/..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the server.`n" -ForegroundColor Gray

# Open browser after a brief delay
Start-Process "http://127.0.0.1:5000/"

# Run Flask backend (which serves both REST API and built React SPA)
$env:PYTHONPATH = "backend"
& ".\backend\.venv\Scripts\python.exe" "backend\run.py"

