###############################################################################
# Stickrbook Local Setup Script (Windows PowerShell)
# 
# This script sets up the entire Stickrbook application locally on Windows.
# Run with: .\setup-local.ps1
###############################################################################

# Enable strict mode
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

function Log-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
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
# Step 1: Check Prerequisites
###############################################################################

Log-Section "Step 1: Checking Prerequisites"

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Log-Success "Python found: $pythonVersion"
    $pythonCmd = "python"
} catch {
    try {
        $pythonVersion = python3 --version 2>&1
        Log-Success "Python found: $pythonVersion"
        $pythonCmd = "python3"
    } catch {
        Log-Error "Python not found. Please install Python 3.10+"
        exit 1
    }
}

# Check Node.js
try {
    $nodeVersion = node --version
    Log-Success "Node.js found: $nodeVersion"
} catch {
    Log-Error "Node.js not found. Please install Node.js 18+"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Log-Success "npm found: v$npmVersion"
} catch {
    Log-Error "npm not found. Please install npm"
    exit 1
}

# Check Git
try {
    $gitVersion = git --version
    Log-Success "Git found: $gitVersion"
} catch {
    Log-Warning "Git not found (optional)"
}

# Check for GPU
try {
    $gpuInfo = nvidia-smi --query-gpu=name --format=csv,noheader 2>&1 | Select-Object -First 1
    Log-Success "GPU found: $gpuInfo"
    $hasGpu = $true
} catch {
    Log-Warning "No NVIDIA GPU detected. Magic Merge will use CPU (slower)"
    $hasGpu = $false
}

###############################################################################
# Step 2: Frontend Setup
###############################################################################

Log-Section "Step 2: Setting Up Frontend"

Log-Info "Installing frontend dependencies..."
npm install

if (-not (Test-Path ".env")) {
    Log-Info "Creating .env file..."
    @"
VITE_API_URL=http://localhost:8000
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Log-Success ".env file created"
} else {
    Log-Warning ".env file already exists, skipping"
}

Log-Success "Frontend setup complete"

###############################################################################
# Step 3: Backend Setup
###############################################################################

Log-Section "Step 3: Setting Up Backend"

Set-Location backend

# Create virtual environment
if (-not (Test-Path "venv")) {
    Log-Info "Creating Python virtual environment..."
    & $pythonCmd -m venv venv
    Log-Success "Virtual environment created"
} else {
    Log-Warning "Virtual environment already exists, skipping"
}

# Activate virtual environment
Log-Info "Activating virtual environment..."
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Log-Info "Upgrading pip..."
& python -m pip install --upgrade pip --quiet

# Install base dependencies
Log-Info "Installing backend dependencies..."
pip install -r requirements.txt --quiet
Log-Success "Backend dependencies installed"

# Create .env file
if (-not (Test-Path ".env")) {
    Log-Info "Creating backend .env file..."
    $magicMergeDevice = if ($hasGpu) { "cuda" } else { "cpu" }
    @"
# ComfyUI Connection
COMFYUI_URL=http://localhost:8188

# Database
DATABASE_URL=sqlite:///./stickrbook.db

# Storage
STORAGE_ROOT=./storage
OUTPUT_DIR=./outputs

# Magic Merge
MAGIC_MERGE_DEVICE=$magicMergeDevice
TRANSFORMERS_CACHE=./models

# Logging
LOG_LEVEL=INFO
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Log-Success "Backend .env file created"
} else {
    Log-Warning "Backend .env file already exists, skipping"
}

# Initialize database
Log-Info "Initializing database..."
if (Test-Path "stickrbook.db") {
    Log-Warning "Database already exists, skipping initialization"
} else {
    alembic upgrade head
    Log-Success "Database initialized"
}

# Create necessary directories
Log-Info "Creating storage directories..."
New-Item -ItemType Directory -Force -Path storage, outputs, models, logs | Out-Null
Log-Success "Directories created"

Set-Location ..

Log-Success "Backend setup complete"

###############################################################################
# Step 4: AI Dependencies (Optional)
###############################################################################

Log-Section "Step 4: AI Dependencies (Optional)"

Write-Host ""
$installAi = Read-Host "Install AI dependencies for Magic Merge? (y/n) [y]"
if ([string]::IsNullOrEmpty($installAi)) { $installAi = "y" }

if ($installAi -match "^[Yy]") {
    Set-Location backend
    & .\venv\Scripts\Activate.ps1
    
    Log-Info "Installing AI dependencies (this may take 5-10 minutes)..."
    pip install -r requirements-ai.txt --quiet
    
    if ($hasGpu) {
        Log-Info "Installing PyTorch with CUDA support..."
        pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118 --quiet
    }
    
    Log-Success "AI dependencies installed"
    Set-Location ..
} else {
    Log-Warning "Skipping AI dependencies. Magic Merge will not be available."
}

###############################################################################
# Step 5: Verify ComfyUI
###############################################################################

Log-Section "Step 5: Verifying ComfyUI Connection"

Log-Info "Checking if ComfyUI is running..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8188" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Log-Success "ComfyUI is running at http://localhost:8188"
} catch {
    Log-Warning "ComfyUI is not running at http://localhost:8188"
    Log-Info "Please start ComfyUI before running the application"
    Log-Info "Typical command: cd \path\to\ComfyUI; python main.py"
}

###############################################################################
# Step 6: Summary
###############################################################################

Log-Section "Setup Complete!"

Write-Host ""
Write-Host "SUCCESS: Frontend dependencies installed" -ForegroundColor Green
Write-Host "SUCCESS: Backend dependencies installed" -ForegroundColor Green
Write-Host "SUCCESS: Database initialized" -ForegroundColor Green
Write-Host "SUCCESS: Environment configured" -ForegroundColor Green
if ($installAi -match "^[Yy]") {
    Write-Host "SUCCESS: AI dependencies installed" -ForegroundColor Green
}
Write-Host ""

Log-Section "Next Steps"

Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor White
Write-Host ""
Write-Host "  .\start-all.ps1" -ForegroundColor Blue
Write-Host ""
Write-Host "Or start services manually:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "    cd backend"
Write-Host "    .\venv\Scripts\Activate.ps1"
Write-Host "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
Write-Host ""
Write-Host "  Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "    npm run dev"
Write-Host ""
Write-Host "  Terminal 3 (ComfyUI):" -ForegroundColor Yellow
Write-Host "    cd \path\to\ComfyUI"
Write-Host "    python main.py"
Write-Host ""
Write-Host "Then open: " -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Blue
Write-Host ""

Log-Info "For troubleshooting, see RUNBOOK.md"
Write-Host ""

