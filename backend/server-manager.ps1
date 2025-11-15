# Server Manager Script for Dataverse Backend
# Usage: .\server-manager.ps1 [start|stop|restart|status]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status")]
    [string]$Action = "status"
)

$PORT = 3000

function Get-ProcessOnPort {
    param($Port)
    try {
        $result = netstat -ano | Select-String ":$Port\s" | Select-Object -First 1
        if ($result) {
            $pid = ($result.ToString() -split '\s+')[-1]
            return $pid
        }
    } catch {
        return $null
    }
    return $null
}

function Stop-ServerProcess {
    $pid = Get-ProcessOnPort -Port $PORT
    if ($pid) {
        Write-Host "🛑 Stopping server process (PID: $pid)..." -ForegroundColor Yellow
        try {
            taskkill /PID $pid /F | Out-Null
            Write-Host "✅ Server stopped successfully" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } catch {
            Write-Host "❌ Failed to stop server process" -ForegroundColor Red
        }
    } else {
        Write-Host "ℹ️  No server process found on port $PORT" -ForegroundColor Blue
    }
}

function Start-ServerProcess {
    $pid = Get-ProcessOnPort -Port $PORT
    if ($pid) {
        Write-Host "⚠️  Server already running on port $PORT (PID: $pid)" -ForegroundColor Yellow
        return
    }
    
    Write-Host "🚀 Starting server..." -ForegroundColor Green
    try {
        # Start the server in a new process
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        Start-Sleep -Seconds 3
        
        # Check if server started successfully
        $newPid = Get-ProcessOnPort -Port $PORT
        if ($newPid) {
            Write-Host "✅ Server started successfully (PID: $newPid)" -ForegroundColor Green
            Write-Host "🌐 Server running at: http://localhost:$PORT" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to start server" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error starting server: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Get-ServerStatus {
    $pid = Get-ProcessOnPort -Port $PORT
    if ($pid) {
        Write-Host "✅ Server is running on port $PORT (PID: $pid)" -ForegroundColor Green
        Write-Host "🌐 Health check: http://localhost:$PORT/health" -ForegroundColor Cyan
        Write-Host "👤 User API: http://localhost:$PORT/api/user" -ForegroundColor Cyan
        Write-Host "👷 Worker API: http://localhost:$PORT/api/worker" -ForegroundColor Cyan
        
        # Test health endpoint
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$PORT/health" -Method GET -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "💚 Health check: PASSED" -ForegroundColor Green
            }
        } catch {
            Write-Host "💔 Health check: FAILED" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Server is not running on port $PORT" -ForegroundColor Red
    }
}

function Restart-ServerProcess {
    Write-Host "🔄 Restarting server..." -ForegroundColor Yellow
    Stop-ServerProcess
    Start-Sleep -Seconds 2
    Start-ServerProcess
}

# Main execution
Write-Host "🖥️  Dataverse Backend Server Manager" -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta

switch ($Action) {
    "start" { Start-ServerProcess }
    "stop" { Stop-ServerProcess }
    "restart" { Restart-ServerProcess }
    "status" { Get-ServerStatus }
}

Write-Host ""
