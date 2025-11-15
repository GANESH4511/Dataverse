# Worker Withdrawal Feature Documentation

## Overview

The withdrawal feature allows workers to convert their pending earnings into locked balance and receive SOL transfers to their Solana wallet. The feature integrates with the Solana blockchain for actual fund transfers on the devnet.

## Architecture

### Frontend (worker-frontend)

**File:** `worker-frontend/app/profile/page.tsx`

#### Components:
1. **Withdrawal Section** - Displayed only when `pendingBalance > 0`
2. **Withdraw Button** - Triggers the withdrawal process
3. **Status Messages** - Shows success/error feedback

#### State Management:
```typescript
const [isWithdrawing, setIsWithdrawing] = useState(false);      // Loading state
const [withdrawMessage, setWithdrawMessage] = useState('');     // Success message
const [withdrawError, setWithdrawError] = useState('');         // Error message
```

#### Handler Function: `handleWithdraw()`
```typescript
async function handleWithdraw() {
  // 1. Validate authentication (check for auth token)
  // 2. Send POST request to /api/worker/payout
  // 3. Handle response:
  //    - On success: Update profile balance state, show success message
  //    - On error: Display error message
  // 4. Clear loading state
}
```

**Flow Diagram:**
```
User clicks "Withdraw SOL" button
           ↓
Get auth token from localStorage
           ↓
POST /api/worker/payout with token
           ↓
Backend processes withdrawal
           ↓
Response with new balance
           ↓
Update frontend state & show success
```

### Backend (backend/src/worker.ts)

**Endpoint:** `POST /api/worker/payout`

**Authentication:** WorkerMiddleware (JWT token required)

#### Process Flow:

1. **Validation**
   - Verify worker exists
   - Check pendingBalance > 0

2. **Solana Transaction (if configured)**
   - Read `PARENT_WALLET_PRIVATE_KEY` from environment
   - Connect to Solana RPC (devnet)
   - Create SystemProgram transfer instruction
   - Sign transaction with parent wallet
   - Send and confirm transaction
   - Get transaction signature

3. **Database Update**
   - Move pendingBalance → lockedBalance
   - Reset pendingBalance to 0

4. **Response**
   - Return updated balances
   - Include transaction status and note

#### Error Handling:
- If Solana transaction fails, database update still proceeds (non-blocking)
- Warning logged to console but endpoint still succeeds
- Requires `PARENT_WALLET_PRIVATE_KEY` to be configured for actual transfers

## Environment Configuration

### Backend .env Setup

Add these variables to `backend/.env`:

```env
# Solana Configuration (Devnet)
SOLANA_RPC_URL="https://api.devnet.solana.com"
PARENT_WALLET_PRIVATE_KEY="<your-parent-wallet-private-key-in-base58>"
```

### How to Get Parent Wallet Private Key:

1. **Using Phantom/Solflare Wallet:**
   - Open wallet settings
   - Export private key
   - Convert to base58 encoding if needed

2. **Using Solana CLI:**
   ```bash
   solana config set --keypair /path/to/keypair.json
   cat /path/to/keypair.json | jq '.[0:32]' | base58encode
   ```

3. **Using Web3.js in Node:**
   ```javascript
   const bs58 = require('bs58');
   const keypair = require('@solana/web3.js').Keypair.fromSecretKey(Buffer.from([...]));
   console.log(bs58.encode(keypair.secretKey));
   ```

### Important Security Notes:
- ⚠️ **NEVER commit the private key to git**
- ⚠️ Keep `.env` in `.gitignore`
- ⚠️ Use separate devnet/testnet wallets for development
- ⚠️ Rotate keys regularly in production

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Payout processed successfully",
  "balance": {
    "pending": 0.00,
    "locked": 5.50
  },
  "payoutAmount": 5.50,
  "transactionNote": "SOL transferred to wallet"
}
```

### No Pending Balance
```json
{
  "success": false,
  "message": "No pending balance to payout"
}
```

### Without Parent Wallet Configured
```json
{
  "success": true,
  "message": "Payout processed successfully",
  "balance": {
    "pending": 0.00,
    "locked": 5.50
  },
  "payoutAmount": 5.50,
  "transactionNote": "Note: Configure PARENT_WALLET_PRIVATE_KEY to enable automatic SOL transfers"
}
```

## Database Changes

### Prisma Schema (worker model)
The existing fields support withdrawal:
- `pendingBalance: Int` (in cents/lamports)
- `lockedBalance: Int` (in cents/lamports)

### Transaction Flow:
```
Before Withdrawal:
  pendingBalance: 550     (5.50 SOL in cents)
  lockedBalance: 0

After Withdrawal:
  pendingBalance: 0
  lockedBalance: 550      (5.50 SOL moved to locked)
```

## UI/UX Features

### Withdrawal Section (Conditional Render)
- **Visible when:** `profile.stats.pendingBalance > 0`
- **Hidden when:** `pendingBalance === 0`

### Visual Components:
1. **Balance Display Card** (Yellow gradient)
   - Shows pending amount in SOL
   - Displays large currency amount (e.g., "5.50 SOL")
   - Shows money bag emoji (💰)

2. **Withdraw Button**
   - Yellow theme matching balance card
   - Disabled state when:
     - `isWithdrawing === true` (shows "⏳ Processing...")
     - `pendingBalance === 0`
   - Shows loading state with spinner emoji

3. **Status Messages** (Temporary, 3-second display)
   - Success: Green background, checkmark emoji (✅)
   - Error: Red background, alert

## Testing Guide

### Prerequisites
1. Backend running on `http://localhost:3000`
2. Worker authenticated with valid JWT token
3. Worker has pending balance > 0

### Test Scenarios

#### Scenario 1: Successful Withdrawal with SOL Transfer
```bash
1. Configure PARENT_WALLET_PRIVATE_KEY in .env
2. Login as worker
3. Verify pending balance shows > 0
4. Click "Withdraw SOL" button
5. Expected: 
   - Pending balance → 0
   - Locked balance increases
   - Success message displays
   - Check Solana explorer for transaction
```

#### Scenario 2: Withdrawal Without SOL Transfer
```bash
1. Leave PARENT_WALLET_PRIVATE_KEY empty in .env
2. Login as worker with pending balance
3. Click "Withdraw SOL" button
4. Expected:
   - Balance updates in database
   - Success message with note about configuration
   - No blockchain transaction
```

#### Scenario 3: Error Handling
```bash
1. Try withdrawal with network issues
2. Expected:
   - Error message displays
   - Pending balance unchanged
   - Can retry withdrawal
```

#### Scenario 4: No Pending Balance
```bash
1. Login as worker with 0 pending balance
2. Expected:
   - Withdrawal section NOT displayed
   - No withdraw button visible
```

## Security Considerations

### Frontend Security:
- JWT token stored in localStorage (same as current auth)
- No sensitive data exposed in UI
- CORS requests validated by backend

### Backend Security:
- WorkerMiddleware validates JWT token
- Requires authenticated session
- Private key stored only in .env (not committed)
- Transaction signing happens server-side only

### Blockchain Security:
- Uses devnet for testing (not mainnet)
- Parent wallet keypair isolated from user data
- Transactions signed and confirmed on-chain
- Atomic database operations ensure consistency

## Monitoring and Logging

### Console Logs Added:
```typescript
console.log(`💸 Processing SOL transfer: ${payoutAmountSOL} SOL to ${worker.walletAddress}`);
console.log(`✅ Transaction confirmed: ${txSignature}`);
console.log('⚠️ PARENT_WALLET_PRIVATE_KEY not configured, skipping SOL transfer');
console.error('⚠️ Transaction error (will still update balance in DB):', txError);
console.error('Payout error:', error);
```

### Monitoring Checklist:
- [ ] Check backend logs for transaction confirmations
- [ ] Monitor Solana explorer for test transactions
- [ ] Track successful vs failed withdrawals
- [ ] Alert on transaction errors
- [ ] Monitor private key usage

## Troubleshooting

### Issue: "Failed to process payout"
**Solutions:**
- Verify auth token is valid
- Check backend is running on port 3000
- Ensure worker exists in database
- Check server logs for detailed error

### Issue: "No pending balance to payout"
**Solutions:**
- Worker needs completed task submissions
- Check if submissions were properly recorded
- Verify pendingBalance is > 0 in database

### Issue: SOL not transferred to wallet
**Solutions:**
- Verify PARENT_WALLET_PRIVATE_KEY is set in .env
- Check private key format is valid base58
- Ensure parent wallet has enough SOL for fees
- Check Solana RPC URL is accessible
- Review server logs for transaction errors

### Issue: Transaction signature not confirmed
**Solutions:**
- Network might be congested, retry withdrawal
- Check Solana devnet status
- Verify recent blockhash availability
- Check parent wallet's SOL balance

## Future Enhancements

1. **Webhook Notifications**
   - Email/SMS when withdrawal succeeds
   - Alert on failed transactions

2. **Withdrawal History**
   - Track all withdrawals with timestamps
   - Show transaction signatures
   - Display confirmation status

3. **Batch Withdrawals**
   - Process multiple worker withdrawals in one transaction
   - Reduce fees for platform

4. **Advanced Settings**
   - Automatic withdrawal on reaching threshold
   - Manual vs auto withdrawal modes
   - Withdrawal pause/resume

5. **Mainnet Support**
   - Switch from devnet to mainnet
   - Real SOL transfers to workers

6. **Token Support**
   - Support SPL tokens in addition to SOL
   - Multi-token reward system

## References

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Solana SystemProgram](https://solana-labs.github.io/solana-web3.js/classes/SystemProgram.html)
- [BS58 Encoding](https://github.com/bitcoin/base58/blob/master/base58.c)
- [Solana Devnet Faucet](https://faucet.solana.com/)

## Summary

The withdrawal feature provides workers with a secure, verified way to convert pending earnings into locked balance with optional blockchain-verified SOL transfers. It combines:

- **Frontend UX:** Clean, intuitive withdrawal interface
- **Backend Logic:** Secure transaction processing with error handling
- **Blockchain Integration:** Optional Solana devnet transfers
- **Database Consistency:** Atomic operations for reliable balance updates
