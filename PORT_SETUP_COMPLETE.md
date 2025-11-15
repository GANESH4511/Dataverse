# Port Configuration - Complete Setup

## Summary

All three services are now configured to run on dedicated ports:

| Service | Port | Command |
|---------|------|---------|
| Backend | 3000 | `npm run dev` from root |
| User Frontend | 3001 | Runs automatically |
| Worker Frontend | 3002 | Runs automatically |

## Quick Start

### Method 1: From Root Directory (Recommended)

```bash
cd c:\SNIX\9th sem\project\dataverse-v2
npm run dev
```

This starts all three services automatically on the correct ports.

### Method 2: Using PowerShell Script

```powershell
cd c:\SNIX\9th sem\project\dataverse-v2
.\start-all.ps1
```

### Method 3: Using Batch Script

```cmd
cd c:\SNIX\9th sem\project\dataverse-v2
start-all.bat
```

### Method 4: Individual Services

**Terminal 1:**
```bash
cd backend && npm run dev
```

**Terminal 2:**
```bash
cd user-frontend && npm run dev
```

**Terminal 3:**
```bash
cd worker-frontend && npm run dev
```

## Configuration Details

### Backend (Port 3000)

**File:** `backend/.env`
```env
PORT=3000
```

**How:** Reads from .env file

### User Frontend (Port 3001)

**File:** `user-frontend/package.json`
```json
"dev": "next dev -p 3001"
```

**How:** Next.js `-p` flag specifies port

### Worker Frontend (Port 3002)

**File:** `worker-frontend/package.json`
```json
"dev": "next dev -p 3002"
```

**How:** Next.js `-p` flag specifies port

## Root Package.json

**File:** `package.json` (at root level)

Enables running all services with one command:

```json
"scripts": {
  "dev": "npm-run-all --parallel backend:dev user-frontend:dev worker-frontend:dev"
}
```

Uses `npm-run-all` package to:
- Run all commands in parallel
- Show colored output from each service
- Stop all when Ctrl+C is pressed

## First Time Setup

```bash
# 1. Navigate to root
cd c:\SNIX\9th sem\project\dataverse-v2

# 2. Install root dependencies (includes npm-run-all)
npm install

# 3. Run all services
npm run dev
```

## Expected Output

When running `npm run dev` from root, you'll see:

```
[backend] 🚀 Server running on port 3000
[backend] 📊 Health check: http://localhost:3000/health
[backend] 👤 User API: http://localhost:3000/api/user
[backend] 👷 Worker API: http://localhost:3000/api/worker

[user-frontend] ▲ Next.js 16.0.1
[user-frontend] - Local: http://localhost:3001

[worker-frontend] ▲ Next.js 16.0.1
[worker-frontend] - Local: http://localhost:3002
```

## Access Points

After all services are running:

1. **User Dashboard** → http://localhost:3001
2. **Worker Dashboard** → http://localhost:3002
3. **Backend API** → http://localhost:3000
4. **Health Check** → http://localhost:3000/health

## Troubleshooting

### npm-run-all not found

Install globally:
```bash
npm install -g npm-run-all
```

### Port already in use

Kill the process using the port:

**PowerShell:**
```powershell
# Find and kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**CMD:**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Services won't start

1. Check Node.js is installed: `node --version`
2. Check npm is installed: `npm --version`
3. Install dependencies: `npm install`
4. Try starting services individually to see specific errors

## Files Created/Modified

✅ **Created:**
- `package.json` (root) - Enables concurrent startup
- `SETUP_PORTS.md` - Comprehensive setup guide
- `start-all.ps1` - PowerShell startup script
- `start-all.bat` - Batch file startup script

✅ **Modified:**
- `backend/.env` - Already has PORT=3000
- `user-frontend/package.json` - Updated dev script to use -p 3001
- `worker-frontend/package.json` - Updated dev script to use -p 3002

## Production

For production build and start:

```bash
# Build all services
npm run build

# Start in production mode
npm start
```

This will start all services on their designated ports in production mode.

## Development Workflow

1. **Make changes** to any service
2. **Save file** → Changes auto-reload (Next.js HMR)
3. **View changes** in browser
4. **Check backend logs** for any API errors

## Architecture

```
Dataverse V2 (Port orchestration)
├── Backend (Port 3000)
│   ├── User API endpoints
│   ├── Worker API endpoints
│   └── Database connection
├── User Frontend (Port 3001)
│   ├── Calls Backend on port 3000
│   └── Task management UI
└── Worker Frontend (Port 3002)
    ├── Calls Backend on port 3000
    └── Task submission UI
```

## Next Steps

1. Run `npm run dev` from root directory
2. Open http://localhost:3001 for user dashboard
3. Open http://localhost:3002 for worker dashboard
4. Test wallet connection and task flow

Everything is now ready to run on the correct ports!
