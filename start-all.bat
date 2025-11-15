@echo off
REM Dataverse V2 - Quick Start Script for Windows CMD
REM This script starts all three services concurrently

cls
echo ================================
echo Dataverse V2 - All Services
echo ================================
echo.
echo Starting services on designated ports:
echo   Backend:        http://localhost:3000
echo   User Frontend:  http://localhost:3001
echo   Worker Frontend: http://localhost:3002
echo.
echo.

REM Check if npm-run-all is installed
npm list -g npm-run-all >nul 2>&1
if errorlevel 1 (
    echo Installing npm-run-all...
    call npm install -g npm-run-all
)

REM Check if root node_modules exists
if not exist node_modules (
    echo Installing root dependencies...
    call npm install
)

echo.
echo Starting all services...
echo Press Ctrl+C to stop all services
echo.

call npm run dev
pause
