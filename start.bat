@echo off
REM ###############################################################################
REM Stickrbook Start Launcher for Windows
REM 
REM This batch file launches the PowerShell start script.
REM Double-click this file or run: start.bat
REM ###############################################################################

echo.
echo ========================================
echo   Starting Stickrbook Services
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

REM Run the PowerShell start script
powershell -ExecutionPolicy Bypass -File "%~dp0start-all.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to start services! Check the error messages above.
    pause
    exit /b 1
)

pause

