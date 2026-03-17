@echo off
REM ###############################################################################
REM Stickrbook Stop Launcher for Windows
REM 
REM This batch file launches the PowerShell stop script.
REM Double-click this file or run: stop.bat
REM ###############################################################################

echo.
echo ========================================
echo   Stopping Stickrbook Services
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell and try again.
    pause
    exit /b 1
)

REM Run the PowerShell stop script
powershell -ExecutionPolicy Bypass -File "%~dp0stop-all.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to stop services! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo All services stopped.
pause

