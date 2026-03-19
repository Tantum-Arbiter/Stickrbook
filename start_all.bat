@echo off
REM ========================================
REM Stickrbook - Start All Services
REM ========================================

echo.
echo ========================================
echo Starting Stickrbook Services
echo ========================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo [1/3] Starting ComfyUI...
start "ComfyUI" cmd /k "cd ComfyUI && run_nvidia_gpu.bat"
timeout /t 5 /nobreak >nul

echo [2/3] Starting Backend (FastAPI)...
start "Backend" cmd /k "cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend (React)...
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo All Services Started!
echo ========================================
echo.
echo ComfyUI:  http://127.0.0.1:8188
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the frontend in your browser...
pause >nul

start http://localhost:3000

echo.
echo ========================================
echo Services are running in separate windows
echo Close those windows to stop the services
echo ========================================
echo.
pause

