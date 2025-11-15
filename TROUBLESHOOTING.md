# Troubleshooting Guide - Dataverse Marketplace

## Quick Start

All three services must run together:

```bash
# From root directory, run:
npm run dev

# Or individually:
# Terminal 1: npm run backend:dev      (port 3000)
# Terminal 2: npm run user:dev          (port 3001)  
# Terminal 3: npm run worker:dev        (port 3002)
```

Then open:
- User: http://localhost:3001
- Worker: http://localhost:3002
- Backend: http://localhost:3000

---

## Common Issues & Solutions

### 1. "Failed to Fetch" Error

**Problem:** "Failed to fetch" appears in console when connecting wallet

**Solutions:**

1. **Check if backend is running**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return a response. If not:
   ```bash
   cd backend && npm run dev
   ```

2. **Check if on correct port**
   - Backend must be on: 3000
   - User-Frontend must be on: 3001
   - Worker-Frontend must be on: 3002

3. **Clear cache and retry**
   - Open DevTools → Application tab
   - Click "Clear site data"
   - Refresh page

4. **Check error message details**
   - The error now shows specifically what failed
   - Look for "Backend error: XXX" for HTTP error codes
   - Example: "Backend error: 502 Bad Gateway"

---

### 2. Wallet Not Connecting

**Problem:** "Connect Wallet" button doesn't work

**Solutions:**

1. **Check if Phantom wallet is installed**
   - https://phantom.app
   - Installed in browser extensions

2. **Check if on correct network**
   - Phantom should be on "Devnet"
   - Check: Phantom → Settings → Network

3. **Allow domain in Phantom**
   - Phantom may have blocked localhost:3001 or 3002
   - Remove from blocked sites and retry

4. **Try in incognito mode**
   - Sometimes extensions conflict
   - Open incognito window and test

---

### 3. Blank Page After "Successfully Signed In"

**Problem:** Page redirects but shows blank/loading

**Solutions:**

1. **Check browser console for errors**
   - Open DevTools → Console tab
   - Look for red error messages

2. **Check localStorage has JWT token**
   - Open DevTools → Application tab
   - Click "Local Storage"
   - Check for `userToken` or `workerToken`

3. **Check API responses in Network tab**
   - Open DevTools → Network tab
   - Connect wallet and sign in
   - Look for requests to `/wallet-nonce` and `/wallet-signin`
   - Both should return status 200

4. **Backend might not have user/worker in database**
   - First time signing in, backend creates the record
   - Check backend logs for errors

---

### 4. "Sign this message..." Popup Doesn't Appear

**Problem:** Phantom wallet doesn't show signature request

**Solutions:**

1. **Check Phantom is not locked**
   - Open Phantom wallet
   - If locked, unlock it and try again

2. **Check user has SOL for gas**
   - Phantom may hide signature for broke accounts
   - Get devnet SOL: https://faucet.solana.com

3. **Try different browser**
   - Sometimes extension issues in specific browsers
   - Try Firefox if using Chrome, etc.

---

### 5. Port Already in Use

**Problem:** "Error: listen EADDRINUSE :::3000" or similar

**Solutions:**

1. **Find process using port**
   ```powershell
   # Windows PowerShell
   netstat -ano | findstr :3000
   ```

2. **Kill process using port**
   ```powershell
   # Get the PID from above, then:
   taskkill /PID <PID> /F
   
   # Example:
   taskkill /PID 1234 /F
   ```

3. **Or use different port**
   ```bash
   # Backend on 3000
   PORT=3000 npm run backend:dev
   
   # Or worker on 3003
   npm run worker:dev -- -p 3003
   ```

---

### 6. Database Connection Error

**Problem:** "Client error: Connection refused" or "ECONNREFUSED"

**Solutions:**

1. **Check DATABASE_URL in .env**
   ```bash
   # backend/.env should have:
   DATABASE_URL="postgresql://user:password@host/database"
   ```

2. **Test database connection**
   ```bash
   cd backend
   npm run db:push
   ```

3. **Check Neon database is running**
   - Go to https://console.neon.tech
   - Check if project is active
   - Connection string is correct

4. **Reset database**
   ```bash
   cd backend
   npm run db:reset  # ⚠️ Deletes all data!
   npm run db:push
   ```

---

### 7. S3 Upload Fails

**Problem:** "Failed to upload file" when submitting task

**Solutions:**

1. **Check S3 credentials in backend/.env**
   ```bash
   AWS_ACCESS_KEY_ID=xxx
   AWS_SECRET_ACCESS_KEY=xxx
   AWS_S3_BUCKET=dataverse-bucket
   AWS_REGION=us-east-1
   ```

2. **Check bucket policy allows uploads**
   - AWS S3 Console → Bucket → Permissions
   - CORS should allow GET, PUT, POST

3. **Check file size**
   - Most S3 buckets limit to 5GB per file
   - Typical limit: 50MB per upload

4. **Check backend logs**
   ```
   📤 Generating presigned URL for: filename.txt
   ❌ S3 error: NoSuchBucket
   ```

---

### 8. Worker Pending Balance Shows 0 SOL

**Problem:** Worker dashboard shows "Pending Balance: 0.00 SOL"

**Possible Causes:**

1. **Worker has no completed tasks**
   - Complete tasks to earn rewards
   - User must approve task submission

2. **Reward calculation needs time**
   - Fresh task submissions take ~5 seconds
   - Refresh page after wait

3. **Check database directly**
   ```bash
   # backend terminal
   npm run db:studio
   # Open to http://localhost:5555
   # Check: Worker → pendingBalance column
   ```

4. **Display calculation issue**
   - Frontend should divide pendingBalance by 100
   - Check: `worker-frontend/app/dashboard/page.tsx`

---

### 9. Task Approval Not Visible in User Dashboard

**Problem:** User uploads task, but it doesn't show in "My Tasks"

**Solutions:**

1. **Check database has task**
   ```bash
   npm run db:studio
   # Open http://localhost:5555
   # Check: Task table for your userId
   ```

2. **Check user ID matches**
   - User profile should show wallet address
   - Task should have same userId

3. **Refresh page**
   - Sometimes frontend cache needs clearing
   - Ctrl+F5 to hard refresh

4. **Check API response**
   - Network tab → `/api/user/tasks`
   - Should return array of tasks
   - Each task should have: id, title, description, amount, etc.

---

### 10. Withdrawal Transaction Fails

**Problem:** "Error processing withdrawal" when worker clicks withdraw

**Solutions:**

1. **Check backend has parent wallet**
   ```bash
   # backend/.env must have:
   PARENT_WALLET_PRIVATE_KEY=xxx
   PARENT_WALLET_ADDRESS=xxx
   ```

2. **Check parent wallet has SOL**
   - Need SOL to send rewards
   - Get from: https://faucet.solana.com
   - Check on: https://explorer.solana.com (switch to Devnet)

3. **Check locked balance is sufficient**
   - Worker must have SOL in locked balance
   - Check amount to withdraw ≤ lockedBalance

4. **Check Solana RPC endpoint**
   - Default: https://api.devnet.solana.com
   - If slow, check Solana status: https://status.solana.com

5. **Check transaction logs**
   - Backend console should show transaction hash
   - Verify on: https://explorer.solana.com

---

## Network Tab Debugging

### 1. Check all requests succeed

Network tab should show:

| Endpoint | Method | Status | Expected Response |
|----------|--------|--------|------------------|
| `/wallet-nonce` | POST | 200 | `{success: true, message: "Sign..."}` |
| `/wallet-signin` | POST | 200 | `{success: true, token: "eyJ..."}` |
| `/user/profile` or `/worker/profile` | GET | 200 | `{id: "...", balance: 100, ...}` |
| `/upload-presigned-url` | POST | 200 | `{url: "https://...", key: "..."}` |

### 2. Check response times

- Wallet nonce: < 500ms
- Sign in: < 1000ms  
- Profile: < 500ms
- All should show 2xx status

### 3. Check CORS headers

Request headers should include:
```
Origin: http://localhost:3001
```

Response headers should include:
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
```

---

## Browser Console Debugging

### Check for errors

```javascript
// Look for messages starting with:
❌  // Red error icon = critical error
⚠️  // Warning icon = warning
✅  // Green checkmark = success
🔐  // Lock icon = authentication
```

### Clear all data

```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check JWT token

```javascript
// In browser console:
localStorage.getItem('userToken')
// Should output: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Performance Issues

### If page loads slowly:

1. **Check backend response time**
   - Network tab → API requests
   - Each should < 1 second

2. **Check for large files**
   - DevTools → Performance tab
   - Record page load
   - Look for slow JS/CSS parsing

3. **Check database queries**
   - Backend logs should show query times
   - Queries > 5 seconds are slow

4. **Check browser extensions**
   - Try incognito mode (no extensions)
   - Disable ad blockers

---

## Production Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Database uses production Postgres
- [ ] S3 bucket created and configured
- [ ] Parent wallet has sufficient SOL
- [ ] Backend CORS allows production domains
- [ ] Phantom wallet on Mainnet (not Devnet)
- [ ] API endpoints use HTTPS
- [ ] Error logging configured
- [ ] Database backups enabled
- [ ] Load testing completed

---

## Getting Help

If still stuck:

1. **Check error message carefully**
   - Read full error text, not just first part
   - Look for specific details (port, status code, etc.)

2. **Check all three services running**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3001
   curl http://localhost:3002
   ```

3. **Check logs**
   - Backend console: `npm run backend:dev`
   - Browser console: DevTools → Console tab
   - Network tab: DevTools → Network tab

4. **Try fresh start**
   ```bash
   # Stop all services (Ctrl+C)
   npm run clean        # if available
   npm install          # reinstall deps
   npm run dev          # restart all
   ```

5. **Restart everything**
   - Close all terminals
   - Close browser windows  
   - Start backend first, wait 10 seconds
   - Then start frontends
   - Then open browser

---

## Key Port Summary

| Service | Port | Command | URL |
|---------|------|---------|-----|
| Backend API | 3000 | `npm run backend:dev` | http://localhost:3000 |
| User Frontend | 3001 | `npm run user:dev` | http://localhost:3001 |
| Worker Frontend | 3002 | `npm run worker:dev` | http://localhost:3002 |

All three required for full functionality!
