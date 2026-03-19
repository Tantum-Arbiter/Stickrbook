#!/bin/bash
# Stickrbook Story Generator - Shell Script
#
# Usage:
#   ./scripts/generate_story.sh watercolour 5
#   ./scripts/generate_story.sh all 5
#   ./scripts/generate_story.sh oil-painting 3 ocean-voyage

# Default values
STYLE="${1:-watercolour}"
COUNT="${2:-5}"
THEME="${3:-forest-adventure}"

echo "========================================"
echo "Stickrbook Story Generator"
echo "========================================"
echo ""
echo "Style: $STYLE"
echo "Count: $COUNT"
echo "Theme: $THEME"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "WARNING: Backend may not be running on http://localhost:8000"
    echo "Please start the backend before running this script"
    echo ""
    read -p "Press Enter to continue anyway or Ctrl+C to cancel..."
fi

# Install dependencies if needed
if [ ! -d "scripts/venv" ]; then
    echo "Installing dependencies..."
    python3 -m pip install -r scripts/requirements.txt
    echo ""
fi

# Run the generator
echo "Starting generation..."
echo ""
python3 scripts/story_generator.py --style "$STYLE" --count "$COUNT" --theme "$THEME"

echo ""
echo "========================================"
echo "Generation complete!"
echo "========================================"

