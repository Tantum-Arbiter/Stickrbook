#!/bin/bash

###############################################################################
# Stickrbook Local Setup Script
# 
# This script sets up the entire Stickrbook application locally.
# Run with: ./setup-local.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

###############################################################################
# Step 1: Check Prerequisites
###############################################################################

log_section "Step 1: Checking Prerequisites"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    log_success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version | cut -d' ' -f2)
    log_success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    log_error "Python not found. Please install Python 3.10+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_success "Node.js found: $NODE_VERSION"
else
    log_error "Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_success "npm found: v$NPM_VERSION"
else
    log_error "npm not found. Please install npm"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    log_success "Git found: $GIT_VERSION"
else
    log_warning "Git not found (optional)"
fi

# Check for GPU
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader | head -n1)
    log_success "GPU found: $GPU_INFO"
    HAS_GPU=true
else
    log_warning "No NVIDIA GPU detected. Magic Merge will use CPU (slower)"
    HAS_GPU=false
fi

###############################################################################
# Step 2: Frontend Setup
###############################################################################

log_section "Step 2: Setting Up Frontend"

log_info "Installing frontend dependencies..."
npm install

if [ ! -f .env ]; then
    log_info "Creating .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:8000
EOF
    log_success ".env file created"
else
    log_warning ".env file already exists, skipping"
fi

log_success "Frontend setup complete"

###############################################################################
# Step 3: Backend Setup
###############################################################################

log_section "Step 3: Setting Up Backend"

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    log_info "Creating Python virtual environment..."
    $PYTHON_CMD -m venv venv
    log_success "Virtual environment created"
else
    log_warning "Virtual environment already exists, skipping"
fi

# Activate virtual environment
log_info "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
log_info "Upgrading pip..."
pip install --upgrade pip --quiet

# Install base dependencies
log_info "Installing backend dependencies..."
pip install -r requirements.txt --quiet
log_success "Backend dependencies installed"

# Create .env file
if [ ! -f .env ]; then
    log_info "Creating backend .env file..."
    cat > .env << EOF
# ComfyUI Connection
COMFYUI_URL=http://localhost:8188

# Database
DATABASE_URL=sqlite:///./stickrbook.db

# Storage
STORAGE_ROOT=./storage
OUTPUT_DIR=./outputs

# Magic Merge
MAGIC_MERGE_DEVICE=$([ "$HAS_GPU" = true ] && echo "cuda" || echo "cpu")
TRANSFORMERS_CACHE=./models

# Logging
LOG_LEVEL=INFO
EOF
    log_success "Backend .env file created"
else
    log_warning "Backend .env file already exists, skipping"
fi

# Initialize database
log_info "Initializing database..."
if [ -f "stickrbook.db" ]; then
    log_warning "Database already exists, skipping initialization"
else
    alembic upgrade head
    log_success "Database initialized"
fi

# Create necessary directories
log_info "Creating storage directories..."
mkdir -p storage outputs models logs
log_success "Directories created"

cd ..

log_success "Backend setup complete"

###############################################################################
# Step 4: AI Dependencies (Optional)
###############################################################################

log_section "Step 4: AI Dependencies (Optional)"

echo ""
read -p "Install AI dependencies for Magic Merge? (y/n) [y]: " INSTALL_AI
INSTALL_AI=${INSTALL_AI:-y}

if [[ $INSTALL_AI =~ ^[Yy]$ ]]; then
    cd backend
    source venv/bin/activate
    
    log_info "Installing AI dependencies (this may take 5-10 minutes)..."
    pip install -r requirements-ai.txt --quiet
    
    if [ "$HAS_GPU" = true ]; then
        log_info "Installing PyTorch with CUDA support..."
        pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118 --quiet
    fi
    
    log_success "AI dependencies installed"
    cd ..
else
    log_warning "Skipping AI dependencies. Magic Merge will not be available."
fi

###############################################################################
# Step 5: Verify ComfyUI
###############################################################################

log_section "Step 5: Verifying ComfyUI Connection"

log_info "Checking if ComfyUI is running..."
if curl -s http://localhost:8188 > /dev/null 2>&1; then
    log_success "ComfyUI is running at http://localhost:8188"
else
    log_warning "ComfyUI is not running at http://localhost:8188"
    log_info "Please start ComfyUI before running the application"
    log_info "Typical command: cd /path/to/ComfyUI && python main.py"
fi

###############################################################################
# Step 6: Summary
###############################################################################

log_section "Setup Complete! 🎉"

echo ""
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo -e "${GREEN}✓ Database initialized${NC}"
echo -e "${GREEN}✓ Environment configured${NC}"
if [[ $INSTALL_AI =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}✓ AI dependencies installed${NC}"
fi
echo ""

log_section "Next Steps"

echo ""
echo "To start the application, run:"
echo ""
echo -e "  ${BLUE}./start-all.sh${NC}"
echo ""
echo "Or start services manually:"
echo ""
echo -e "  ${YELLOW}Terminal 1 (Backend):${NC}"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo -e "  ${YELLOW}Terminal 2 (Frontend):${NC}"
echo "    npm run dev"
echo ""
echo -e "  ${YELLOW}Terminal 3 (ComfyUI):${NC}"
echo "    cd /path/to/ComfyUI"
echo "    python main.py"
echo ""
echo "Then open: ${BLUE}http://localhost:5173${NC}"
echo ""

log_info "For troubleshooting, see RUNBOOK.md"
echo ""

