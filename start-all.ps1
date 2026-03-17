###############################################################################
# Stickrbook - Start All Services (Windows PowerShell)
# 
# This script starts all required services for local development.
# Run with: .\start-all.ps1
###############################################################################

$ErrorActionPreference = "Stop"

# Logging functions
function Log-Info {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "SUCCESS: $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Log-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host ""
}

###############################################################################
# Check if services are already running
###############################################################################

Log-Section "Starting Stickrbook Services"

# Check if backend is already running
$backendRunning = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($backendRunning) {
    Log-Error "Backend already running on port 8000"
    Write-Host "  Run '.\stop-all.ps1' first to stop existing services"
    exit 1
}

# Check if frontend is already running
$frontendRunning = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
if ($frontendRunning) {
    Log-Error "Frontend already running on port 5173"
    Write-Host "  Run '.\stop-all.ps1' first to stop existing services"
    exit 1
}

# Check if ComfyUI is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8188" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch {
    Log-Error "ComfyUI is not running on port 8188"
    Write-Host ""
    Write-Host "  Please start ComfyUI first:"
    Write-Host "    cd \path\to\ComfyUI"
    Write-Host "    python main.py"
    Write-Host ""
    Read-Host "Press Enter when ComfyUI is running, or Ctrl+C to exit"
}

###############################################################################
# Start Backend
###############################################################################

Log-Info "Starting backend server..."

# Create logs directory if it doesn't exist
New-Item -ItemType Directory -Force -Path logs | Out-Null

# Start backend in new window
$backendScript = @"
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
"@

$backendScriptPath = "logs\start-backend.ps1"
$backendScript | Out-File -FilePath $backendScriptPath -Encoding UTF8

$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-File", $backendScriptPath -PassThru
$backendProcess.Id | Out-File -FilePath "logs\backend.pid" -Encoding UTF8

Log-Success "Backend started (PID: $($backendProcess.Id))"

# Wait for backend to be ready
Log-Info "Waiting for backend to be ready..."
$maxAttempts = 30
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        Log-Success "Backend is ready!"
        $backendReady = $true
        break
    } catch {
        Start-Sleep -Seconds 1
        $attempt++
    }
}

if (-not $backendReady) {
    Log-Error "Backend failed to start. Check logs\backend.log"
    exit 1
}

###############################################################################
# Start Frontend
###############################################################################

Log-Info "Starting frontend server..."

# Start frontend in new window
$frontendScript = @"
npm run dev
"@

$frontendScriptPath = "logs\start-frontend.ps1"
$frontendScript | Out-File -FilePath $frontendScriptPath -Encoding UTF8

$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-File", $frontendScriptPath -PassThru
$frontendProcess.Id | Out-File -FilePath "logs\frontend.pid" -Encoding UTF8

Log-Success "Frontend started (PID: $($frontendProcess.Id))"

# Wait for frontend to be ready
Log-Info "Waiting for frontend to be ready..."
$attempt = 0
$frontendReady = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
        Log-Success "Frontend is ready!"
        $frontendReady = $true
        break
    } catch {
        Start-Sleep -Seconds 1
        $attempt++
    }
}

if (-not $frontendReady) {
    Log-Error "Frontend failed to start. Check logs\frontend.log"
    exit 1
}

###############################################################################
# Summary
###############################################################################

Log-Section "All Services Running!"

Write-Host ""
Write-Host "SUCCESS: ComfyUI:  http://localhost:8188" -ForegroundColor Green
Write-Host "SUCCESS: Backend:   http://localhost:8000" -ForegroundColor Green
Write-Host "SUCCESS: Frontend:  http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Open your browser to: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop all services: .\stop-all.ps1" -ForegroundColor Yellow
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"

