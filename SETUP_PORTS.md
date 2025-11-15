# Dataverse V2 - Multi-Service Startup Guide

## Port Configuration

The entire Dataverse V2 application now runs on dedicated ports:

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000 |
| User Frontend | 3001 | http://localhost:3001 |
| Worker Frontend | 3002 | http://localhost:3002 |

## Quick Start (All Services at Once)

### Option 1: From Root Directory (Easiest)

```bash
# Navigate to root directory
cd c:\SNIX\9th sem\project\dataverse-v2

# Install dependencies (first time only)
npm install

# Run all three services concurrently
npm run dev
```

This will start:
- ✅ Backend on port 3000
- ✅ User Frontend on port 3001
- ✅ Worker Frontend on port 3002

### Option 2: Individual Services from Root

Start backend only:
```bash
npm run backend:dev
```

Start user-frontend only:
```bash
npm run user-frontend:dev
```

Start worker-frontend only:
```bash
npm run worker-frontend:dev
```

### Option 3: Manual - Each Service Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm install  # First time only
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - User Frontend:**
```bash
cd user-frontend
npm install  # First time only
npm run dev
# Runs on http://localhost:3001
```

**Terminal 3 - Worker Frontend:**
```bash
cd worker-frontend
npm install  # First time only
npm run dev
# Runs on http://localhost:3002
```

## Production Build

Build all services:
```bash
npm run build
```

Start production version:
```bash
npm start
```

## Port Configuration Details

### Backend (Port 3000)

**Configuration file:** `backend/.env`

```env
PORT=3000
```

**How it works:**
```typescript
// backend/src/index.ts
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

### User Frontend (Port 3001)

**Configuration:** `user-frontend/package.json`

```json
"scripts": {
  "dev": "next dev -p 3001"
}
```

All API calls point to `http://localhost:3000`

### Worker Frontend (Port 3002)

**Configuration:** `worker-frontend/package.json`

```json
"scripts": {
  "dev": "next dev -p 3002"
}
```

All API calls point to `http://localhost:3000`

## Accessing Services

### After Starting with `npm run dev` from root:

1. **User Dashboard**
   - URL: http://localhost:3001
   - Purpose: Create tasks, manage submissions

2. **Worker Dashboard**
   - URL: http://localhost:3002
   - Purpose: Browse tasks, submit work, track earnings

3. **Backend API Health Check**
   - URL: http://localhost:3000/health
   - Purpose: Verify backend is running

4. **User API Documentation**
   - URL: http://localhost:3000/api/user
   - Purpose: View user endpoints

5. **Worker API Documentation**
   - URL: http://localhost:3000/api/worker
   - Purpose: View worker endpoints

## Troubleshooting

### Port Already in Use

If you get an error like "Port 3000 is already in use":

**Find and kill the process:**

Windows PowerShell:
```powershell
# Find process on port 3000
Get-Process | Where-Object {$_.Handles -like "*3000*"} | Stop-Process -Force

# Or use netstat
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Windows CMD:
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Linux/Mac:
```bash
lsof -i :3000
kill -9 <PID>
```

### npm-run-all Not Installed

If `npm run dev` fails with "npm-run-all not found":

```bash
cd dataverse-v2  # Root directory
npm install
npm run dev
```

### Dependencies Not Installed

If any service fails to start:

```bash
# Install dependencies in root (if needed)
npm install

# Install in specific service
cd backend
npm install

cd ../user-frontend
npm install

cd ../worker-frontend
npm install
```

### Backend Connection Issues

If frontends can't connect to backend:

1. Verify backend is running on port 3000
2. Check `.env` files in frontends (should reference `http://localhost:3000`)
3. Check browser console for CORS errors
4. Verify `CORS` is enabled in backend

## Verification Checklist

- [ ] Backend runs on port 3000
- [ ] User Frontend runs on port 3001
- [ ] Worker Frontend runs on port 3002
- [ ] All three run concurrently with `npm run dev`
- [ ] Can access http://localhost:3001 (User Frontend)
- [ ] Can access http://localhost:3002 (Worker Frontend)
- [ ] Can access http://localhost:3000/health (Backend health check)
- [ ] Can see "Successfully connected to database" in backend logs

## Scripts Reference

### Root Level Commands

```bash
npm run dev                    # Start all services (dev mode)
npm run backend:dev           # Start only backend
npm run user-frontend:dev     # Start only user frontend
npm run worker-frontend:dev   # Start only worker frontend
npm run build                 # Build all services
npm run start                 # Start all services (production)
npm run setup                 # Install all dependencies and run migrations
```

### Individual Service Commands

```bash
# Backend
cd backend
npm run dev          # Development mode
npm run build        # Production build
npm start            # Production mode
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio

# User Frontend
cd user-frontend
npm run dev          # Development mode
npm run build        # Production build
npm start            # Production mode

# Worker Frontend
cd worker-frontend
npm run dev          # Development mode
npm run build        # Production build
npm start            # Production mode
```

## Environment Variables

### Backend (backend/.env)

```env
PORT=3000
DATABASE_URL=...
JWT_SECRET=...
WORKER_JWT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET_NAME=...
CLOUDFRONT_DOMAIN=...
SOLANA_RPC_URL=...
PARENT_WALLET_PRIVATE_KEY=...
```

### Frontend (.env not needed for ports)

Ports are configured in `package.json` scripts directly.

## First Time Setup

1. **Clone and navigate to project:**
```bash
cd c:\SNIX\9th sem\project\dataverse-v2
```

2. **Install all dependencies:**
```bash
npm install
```

3. **Setup backend database:**
```bash
npm run backend:setup
```

4. **Start all services:**
```bash
npm run dev
```

5. **Open browsers:**
   - User Frontend: http://localhost:3001
   - Worker Frontend: http://localhost:3002

## Performance Notes

- Running all three services concurrently uses ~500MB RAM
- Backend is CPU-intensive (Node.js + database)
- Frontends are lighter (Next.js with React)
- Monitor terminal output for errors
- Press `Ctrl+C` to stop all services

## Next Steps

After starting all services:

1. **Test User Flow:**
   - Open http://localhost:3001
   - Connect wallet
   - Create a task

2. **Test Worker Flow:**
   - Open http://localhost:3002
   - Connect wallet (different account)
   - Browse and submit tasks

3. **Verify Backend:**
   - Check http://localhost:3000/health
   - Check http://localhost:3000/api/user
   - Check http://localhost:3000/api/worker

## Logs

When running `npm run dev` from root, you'll see logs from all three services:

```
[Backend]   🚀 Server running on port 3000
[Backend]   📊 Health check: http://localhost:3000/health
[User-FE]   ▲ Next.js 16.0.1
[User-FE]   - Local: http://localhost:3001
[Worker-FE] ▲ Next.js 16.0.1
[Worker-FE] - Local: http://localhost:3002
```

Color-coded output helps distinguish between services.

## Docker Support (Future)

For production deployment, Docker support can be added:

```bash
docker-compose up
```

This would start all three services in containers with proper networking.
