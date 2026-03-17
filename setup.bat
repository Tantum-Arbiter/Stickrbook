@echo off
REM ###############################################################################
REM Stickrbook Setup Launcher for Windows
REM 
REM This batch file launches the PowerShell setup script.
REM Double-click this file or run: setup.bat
REM ###############################################################################

echo.
echo ========================================
echo   Stickrbook Setup (Windows)
echo ========================================
echo.
echo Starting PowerShell setup script...
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell not found!
    echo Please install PowerShell and try again.
    pause
    exit /b 1
)

REM Run the PowerShell setup script
powershell -ExecutionPolicy Bypass -File "%~dp0setup-local.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup failed! Check the error messages above.
    pause
    exit /b 1
)

echo.
echo Setup complete!
pause

