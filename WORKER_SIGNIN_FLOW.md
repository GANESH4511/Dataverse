# Worker Frontend Sign-In Flow - FIXED

## Overview

The worker-frontend sign-in flow has been fixed to work manually instead of auto-triggering. This prevents the "Failed to fetch" error when the backend isn't ready.

## How It Works Now

### Step-by-Step Flow

1. **User opens Worker Frontend** (http://localhost:3002)
   - Landing page displays welcome message
   - "Connect Wallet" button is visible

2. **User clicks "Connect Wallet"**
   - Phantom wallet popup appears
   - User selects their wallet
   - Wallet connects
   - `connected` state becomes `true`

3. **Blue "Sign In with Wallet" button appears**
   - This button only shows after wallet is connected
   - User clicks this button

4. **Backend Sign-In Process Triggers**
   - Step 1: Get nonce from backend (`/api/worker/wallet-nonce`)
   - Step 2: User signs message in Phantom popup
   - Step 3: Send signature to backend (`/api/worker/wallet-signin`)
   - Step 4: Receive JWT token

5. **Success Message**
   - "✅ Successfully signed in!" message appears
   - After 1.5 seconds, redirects to dashboard

## Flow Diagram

```
User Opens Page
    ↓
"Connect Wallet" button visible
    ↓
User clicks "Connect Wallet"
    ↓
Phantom popup → User selects wallet
    ↓
Wallet connected (connected = true)
    ↓
"Sign In with Wallet" button appears
    ↓
User clicks "Sign In with Wallet"
    ↓
Show: "🔐 Signing in with your wallet..."
    ↓
Get nonce from backend
    ↓
Show Phantom signature popup
    ↓
User signs message
    ↓
Send signature to backend
    ↓
Receive JWT token
    ↓
Show: "✅ Successfully signed in!"
    ↓
(After 1.5s) Redirect to /dashboard
```

## Key Changes

### 1. Removed Auto Sign-In
- Previously: Tried to auto-sign-in when wallet connected
- Now: Wait for user to click "Sign In with Wallet" button
- Reason: Backend might not be running yet

### 2. Manual Sign-In Handler
```typescript
const handleManualSignIn = async () => {
  if (!connected) {
    setSignInError('❌ Please connect your wallet first');
    return;
  }

  setIsManualSigningIn(true);
  setSignInMessage('🔐 Signing in with your wallet...');
  setSignInError('');

  try {
    const result = await signInWithWallet();
    // ... success handling
  } catch (err) {
    // ... error handling
  }
};
```

### 3. Conditional Button Display
```typescript
{connected && !signInMessage && !signInError && (
  <button onClick={handleManualSignIn} disabled={isManualSigningIn}>
    {isManualSigningIn ? 'Signing in...' : 'Sign In with Wallet'}
  </button>
)}
```

## Files Modified

1. **`worker-frontend/app/page.tsx`**
   - Changed from auto sign-in to manual sign-in
   - Added `handleManualSignIn` function
   - Added "Sign In with Wallet" button
   - Updated state variable names (isAutoSigningIn → isManualSigningIn)

2. **`worker-frontend/app/utils/walletAuth.ts`**
   - Simplified fetch without complex timeout logic
   - Clean error handling

## How to Use

### Prerequisites
- Backend running on http://localhost:3000
- User-Frontend running on http://localhost:3001
- Worker-Frontend running on http://localhost:3002

### Start All Services

```bash
# From root directory
npm run dev

# Or manually in separate terminals:
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd user-frontend && npm run dev

# Terminal 3
cd worker-frontend && npm run dev
```

### Test the Sign-In Flow

1. Open http://localhost:3002 in browser
2. Click "Connect Wallet" button
3. Select Phantom wallet (or other wallet)
4. Approve connection in Phantom
5. Click "Sign In with Wallet" button
6. Approve message signature in Phantom
7. See "✅ Successfully signed in!" message
8. Redirect to dashboard after 1.5 seconds

## Error Handling

### Error: "Failed to fetch"
- **Cause**: Backend not running
- **Fix**: Start backend with `npm run backend:dev`

### Error: "Please connect your wallet first"
- **Cause**: Clicked sign-in before connecting wallet
- **Fix**: Click "Connect Wallet" button first

### Error: "Sign-in failed: [specific error]"
- **Cause**: Various auth issues
- **Fix**: Check backend logs and error message

## Differences from User-Frontend

| Feature | Worker-Frontend | User-Frontend |
|---------|-----------------|---------------|
| Sign-in | Manual button | Manual button |
| Trigger | User clicks button | User clicks button |
| Flow | Same | Same |
| Error handling | Same | Same |

Both frontends now use the same manual sign-in pattern for consistency.

## Success Indicators

✅ Backend running on port 3000
✅ Worker-Frontend running on port 3002
✅ "Connect Wallet" button works
✅ "Sign In with Wallet" button appears after connection
✅ Phantom signature popup appears on sign-in
✅ Success message shows and redirects to dashboard
✅ Token stored in localStorage
✅ Dashboard accessible

## Debugging

### Check Browser Console
```javascript
// Look for these success messages:
✅ Token stored in localStorage
✅ Wallet address stored

// Look for error messages starting with:
❌ Wallet sign-in failed
❌ Sign-in error
```

### Check Backend Logs
```
🟢 wallet-signin triggered
✅ Found worker
✅ Signature valid
✅ Returning login response
```

### Check Network Tab
- Request to `/api/worker/wallet-nonce` should return 200
- Request to `/api/worker/wallet-signin` should return 200
- Both responses should contain success: true and token

## Common Issues

### Issue: Button doesn't appear after connecting wallet
- **Solution**: Refresh page, then connect wallet again

### Issue: Phantom doesn't show signature popup
- **Solution**: Check Phantom wallet is unlocked and not locked

### Issue: Redirect doesn't happen
- **Solution**: Check browser console for errors, check dashboard page loads

### Issue: Can sign in but dashboard is blank
- **Solution**: Backend might not have worker profile data, check backend logs

## Next Steps

1. Test the complete flow end-to-end
2. Verify success messages appear
3. Verify redirect to dashboard works
4. Check that completed tasks earn rewards
5. Verify withdrawal feature works

## Questions or Issues?

1. Check that all 3 services are running
2. Check browser console for error messages
3. Check backend logs for API errors
4. Verify backend can reach database
5. Check network tab for failed requests
