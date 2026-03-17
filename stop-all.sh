#!/bin/bash

###############################################################################
# Stickrbook - Stop All Services
# 
# This script stops all running services.
# Run with: ./stop-all.sh
###############################################################################

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

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_section "🛑 Stopping Stickrbook Services"

###############################################################################
# Stop Backend
###############################################################################

if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        log_info "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm logs/backend.pid
        log_success "Backend stopped"
    else
        log_warning "Backend process not found"
        rm logs/backend.pid
    fi
else
    # Try to find and kill by port
    BACKEND_PID=$(lsof -ti:8000)
    if [ ! -z "$BACKEND_PID" ]; then
        log_info "Stopping backend on port 8000..."
        kill $BACKEND_PID
        log_success "Backend stopped"
    else
        log_warning "Backend not running"
    fi
fi

###############################################################################
# Stop Frontend
###############################################################################

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        log_info "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm logs/frontend.pid
        log_success "Frontend stopped"
    else
        log_warning "Frontend process not found"
        rm logs/frontend.pid
    fi
else
    # Try to find and kill by port
    FRONTEND_PID=$(lsof -ti:5173)
    if [ ! -z "$FRONTEND_PID" ]; then
        log_info "Stopping frontend on port 5173..."
        kill $FRONTEND_PID
        log_success "Frontend stopped"
    else
        log_warning "Frontend not running"
    fi
fi

###############################################################################
# Check ComfyUI
###############################################################################

if curl -s http://localhost:8188 > /dev/null 2>&1; then
    log_info "ComfyUI is still running on port 8188"
    echo "  (Not stopping ComfyUI - stop manually if needed)"
fi

###############################################################################
# Summary
###############################################################################

log_section "✅ Services Stopped"

echo ""
echo -e "${GREEN}All Stickrbook services have been stopped.${NC}"
echo ""
echo -e "${YELLOW}To start again:${NC} ./start-all.sh"
echo ""

