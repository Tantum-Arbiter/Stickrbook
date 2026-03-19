@echo off
REM ========================================
REM Stickrbook - Docker Stop Script
REM ========================================

echo.
echo ========================================
echo   Stopping Stickrbook Services
echo ========================================
echo.

docker-compose down

echo.
echo ========================================
echo   Services Stopped!
echo ========================================
echo.
pause

