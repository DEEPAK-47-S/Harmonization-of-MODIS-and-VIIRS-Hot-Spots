Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " 🔥 FirePulse Test Suite Runner" -ForegroundColor Yellow
Write-Host " NASA Space Apps Challenge 2026 - Virtual Warriors" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "backend"
& ".\backend\.venv\Scripts\pytest.exe" backend\tests -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All 18 automated scientific and integration unit tests passed!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Please inspect the log above." -ForegroundColor Red
}

