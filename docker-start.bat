@echo off
REM ========================================
REM Stickrbook - Docker Startup Script
REM ========================================

echo.
echo ========================================
echo   Starting Stickrbook with Docker
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking for ComfyUI...
echo.
echo ComfyUI should be running on http://localhost:8188
echo If it's not running, start it now in a separate terminal:
echo   cd C:\path\to\ComfyUI
echo   python main.py
echo.
pause

echo.
echo [2/3] Building Docker containers (first time only)...
docker-compose build

echo.
echo [3/3] Starting services...
docker-compose up -d

echo.
echo ========================================
echo   Waiting for services to start...
echo ========================================
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo ComfyUI:  http://localhost:8188
echo.
echo Opening frontend in browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo Services are running in Docker
echo ========================================
echo.
echo To view logs:    docker-compose logs -f
echo To stop:         docker-compose down
echo To restart:      docker-compose restart
echo.
pause

