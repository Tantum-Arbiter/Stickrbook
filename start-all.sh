#!/bin/bash

###############################################################################
# Stickrbook - Start All Services
# 
# This script starts all required services for local development.
# Run with: ./start-all.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
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
# Check if services are already running
###############################################################################

log_section "🚀 Starting Stickrbook Services"

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_error "Backend already running on port 8000"
    echo "  Run './stop-all.sh' first to stop existing services"
    exit 1
fi

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_error "Frontend already running on port 5173"
    echo "  Run './stop-all.sh' first to stop existing services"
    exit 1
fi

# Check if ComfyUI is running
if ! curl -s http://localhost:8188 > /dev/null 2>&1; then
    log_error "ComfyUI is not running on port 8188"
    echo ""
    echo "  Please start ComfyUI first:"
    echo "    cd /path/to/ComfyUI"
    echo "    python main.py"
    echo ""
    read -p "Press Enter when ComfyUI is running, or Ctrl+C to exit..."
fi

###############################################################################
# Start Backend
###############################################################################

log_info "Starting backend server..."

cd backend

# Activate virtual environment and start backend in background
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    nohup uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    log_success "Backend started (PID: $BACKEND_PID)"
else
    log_error "Virtual environment not found. Run './setup-local.sh' first"
    exit 1
fi

cd ..

# Wait for backend to be ready
log_info "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        log_error "Backend failed to start. Check logs/backend.log"
        exit 1
    fi
done

###############################################################################
# Start Frontend
###############################################################################

log_info "Starting frontend server..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Start frontend in background
nohup npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > logs/frontend.pid
log_success "Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
log_info "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        log_success "Frontend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        log_error "Frontend failed to start. Check logs/frontend.log"
        exit 1
    fi
done

###############################################################################
# Summary
###############################################################################

log_section "✅ All Services Running!"

echo ""
echo -e "${GREEN}✓ ComfyUI:${NC}  http://localhost:8188"
echo -e "${GREEN}✓ Backend:${NC}   http://localhost:8000"
echo -e "${GREEN}✓ Frontend:${NC}  http://localhost:5173"
echo ""
echo -e "${BLUE}📖 Open your browser to:${NC} ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}📋 Logs:${NC}"
echo "  Backend:  tail -f logs/backend.log"
echo "  Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC} ./stop-all.sh"
echo ""

# Open browser (optional)
if command -v open &> /dev/null; then
    # macOS
    sleep 2
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    sleep 2
    xdg-open http://localhost:5173
fi

