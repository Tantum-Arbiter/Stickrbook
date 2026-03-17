###############################################################################
# Stickrbook - Stop All Services (Windows PowerShell)
# 
# This script stops all running services.
# Run with: .\stop-all.ps1
###############################################################################

# Logging functions
function Log-Info {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor Blue
}

function Log-Success {
    param([string]$Message)
    Write-Host "SUCCESS: $Message" -ForegroundColor Green
}

function Log-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Log-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host "  $Message" -ForegroundColor Blue
    Write-Host "============================================================" -ForegroundColor Blue
    Write-Host ""
}

Log-Section "Stopping Stickrbook Services"

###############################################################################
# Stop Backend
###############################################################################

if (Test-Path "logs\backend.pid") {
    $backendPid = Get-Content "logs\backend.pid"
    try {
        $process = Get-Process -Id $backendPid -ErrorAction SilentlyContinue
        if ($process) {
            Log-Info "Stopping backend (PID: $backendPid)..."
            Stop-Process -Id $backendPid -Force
            Remove-Item "logs\backend.pid"
            Log-Success "Backend stopped"
        } else {
            Log-Warning "Backend process not found"
            Remove-Item "logs\backend.pid"
        }
    } catch {
        Log-Warning "Error stopping backend: $_"
    }
} else {
    # Try to find and kill by port
    $backendConnection = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
    if ($backendConnection) {
        $backendPid = $backendConnection.OwningProcess
        Log-Info "Stopping backend on port 8000..."
        Stop-Process -Id $backendPid -Force
        Log-Success "Backend stopped"
    } else {
        Log-Warning "Backend not running"
    }
}

###############################################################################
# Stop Frontend
###############################################################################

if (Test-Path "logs\frontend.pid") {
    $frontendPid = Get-Content "logs\frontend.pid"
    try {
        $process = Get-Process -Id $frontendPid -ErrorAction SilentlyContinue
        if ($process) {
            Log-Info "Stopping frontend (PID: $frontendPid)..."
            Stop-Process -Id $frontendPid -Force
            Remove-Item "logs\frontend.pid"
            Log-Success "Frontend stopped"
        } else {
            Log-Warning "Frontend process not found"
            Remove-Item "logs\frontend.pid"
        }
    } catch {
        Log-Warning "Error stopping frontend: $_"
    }
} else {
    # Try to find and kill by port
    $frontendConnection = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($frontendConnection) {
        $frontendPid = $frontendConnection.OwningProcess
        Log-Info "Stopping frontend on port 5173..."
        Stop-Process -Id $frontendPid -Force
        Log-Success "Frontend stopped"
    } else {
        Log-Warning "Frontend not running"
    }
}

###############################################################################
# Check ComfyUI
###############################################################################

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8188" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Log-Info "ComfyUI is still running on port 8188"
    Write-Host "  (Not stopping ComfyUI - stop manually if needed)"
} catch {
    # ComfyUI not running, that's fine
}

###############################################################################
# Summary
###############################################################################

Log-Section "Services Stopped"

Write-Host ""
Write-Host "All Stickrbook services have been stopped." -ForegroundColor Green
Write-Host ""
Write-Host "To start again: " -NoNewline
Write-Host ".\start-all.ps1" -ForegroundColor Yellow
Write-Host ""

