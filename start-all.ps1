# Dataverse V2 - Quick Start Script for PowerShell
# This script starts all three services concurrently

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Dataverse V2 - All Services" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting services on designated ports:" -ForegroundColor Green
Write-Host "  Backend:        http://localhost:3000" -ForegroundColor Yellow
Write-Host "  User Frontend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "  Worker Frontend: http://localhost:3002" -ForegroundColor Yellow
Write-Host ""

# Get the root directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if npm-run-all is installed
try {
    $npmRunAll = npm list -g npm-run-all 2>$null | Select-String "npm-run-all"
    if ($null -eq $npmRunAll) {
        Write-Host "Installing npm-run-all..." -ForegroundColor Cyan
        npm install -g npm-run-all
    }
} catch {
    Write-Host "npm-run-all not found, installing..." -ForegroundColor Yellow
    npm install -g npm-run-all
}

# Check if root node_modules exists
if (!(Test-Path "$rootDir\node_modules")) {
    Write-Host "Installing root dependencies..." -ForegroundColor Cyan
    cd $rootDir
    npm install
}

Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Magenta
Write-Host ""

cd $rootDir
npm run dev
