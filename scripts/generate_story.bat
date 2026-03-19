@echo off
REM Stickrbook Story Generator - Windows Batch Script
REM
REM Usage:
REM   generate_story.bat watercolour 5
REM   generate_story.bat all 5
REM   generate_story.bat oil-painting 3 ocean-voyage

setlocal

REM Default values
set STYLE=watercolour
set COUNT=5
set THEME=forest-adventure

REM Parse arguments
if not "%1"=="" set STYLE=%1
if not "%2"=="" set COUNT=%2
if not "%3"=="" set THEME=%3

echo ========================================
echo Stickrbook Story Generator
echo ========================================
echo.
echo Style: %STYLE%
echo Count: %COUNT%
echo Theme: %THEME%
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    exit /b 1
)

REM Check if backend is running
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: Backend may not be running on http://localhost:8000
    echo Please start the backend before running this script
    echo.
    pause
)

REM Install dependencies if needed
if not exist "scripts\venv\" (
    echo Installing dependencies...
    python -m pip install -r scripts\requirements.txt
    echo.
)

REM Run the generator
echo Starting generation...
echo.
python scripts\story_generator.py --style %STYLE% --count %COUNT% --theme %THEME%

echo.
echo ========================================
echo Generation complete!
echo ========================================
pause

