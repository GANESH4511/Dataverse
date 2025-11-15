# Quick Start: Setting Up Worker Withdrawals

## Step 1: Frontend is Ready ✅

The worker profile page (`worker-frontend/app/profile/page.tsx`) now includes:
- ✅ Withdraw button (visible when pending balance > 0)
- ✅ Loading state during withdrawal
- ✅ Success/error messages
- ✅ Automatic balance update after withdrawal

## Step 2: Backend Endpoint is Ready ✅

The payout endpoint (`POST /api/worker/payout`) is implemented with:
- ✅ Balance validation
- ✅ Optional Solana transaction support
- ✅ Database balance updates
- ✅ Error handling and logging

## Step 3: Configure Parent Wallet (Optional but Recommended)

### Option A: Using Phantom Wallet (Easiest)

1. Open Phantom wallet extension
2. Click wallet icon → Settings → Security & Privacy
3. Look for "Show Private Key"
4. Copy the private key (in base58 format)
5. Add to `backend/.env`:
   ```env
   PARENT_WALLET_PRIVATE_KEY="<paste-your-key-here>"
   ```

### Option B: Using Solana CLI

```bash
# If you have a keypair file
solana-keygen grind-validator
solana config set --keypair ~/.config/solana/id.json

# Convert to base58 (Node.js)
node -e "
const bs58 = require('bs58');
const fs = require('fs');
const keypair = JSON.parse(fs.readFileSync(process.env.HOME + '/.config/solana/id.json'));
const secretKey = new Uint8Array(keypair);
console.log(bs58.encode(secretKey));
"
```

### Option C: Generate New Keypair

```bash
npm install -g @solana/web3.js tweetnacl bs58

node -e "
const web3 = require('@solana/web3.js');
const bs58 = require('bs58');
const keypair = web3.Keypair.generate();
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('Private Key:', bs58.encode(keypair.secretKey));
"
```

## Step 4: Fund Parent Wallet (Devnet SOL)

Get free devnet SOL from the faucet:

```bash
# Using Solana CLI
solana airdrop 10 <your-parent-wallet-public-key> --url devnet

# Or visit: https://faucet.solana.com/
# Enter your public key and claim SOL
```

## Step 5: Verify Setup

1. **Backend running:**
   ```bash
   cd backend
   npm run dev
   # Should show: Server running on port 3000
   ```

2. **Frontend running:**
   ```bash
   cd worker-frontend
   npm run dev
   # Should show: ▲ Next.js ready on http://localhost:3173
   ```

3. **Test withdrawal:**
   - Login as worker
   - Create task submission to earn pending balance
   - Go to profile page
   - Click "Withdraw SOL" button
   - Verify success message

## What Happens During Withdrawal

### Without PARENT_WALLET_PRIVATE_KEY:
1. ✅ Pending balance → Locked balance (database only)
2. ℹ️ No blockchain transaction
3. ✅ Success message shows

### With PARENT_WALLET_PRIVATE_KEY:
1. ✅ Pending balance → Locked balance (database)
2. 🔗 SOL transferred to worker wallet (blockchain)
3. 📝 Transaction signature logged to console
4. ✅ Success message shows with transaction info

## Environment Variables

### Current Configuration:

**`backend/.env`**
```env
SOLANA_RPC_URL="https://api.devnet.solana.com"
PARENT_WALLET_PRIVATE_KEY=""  # Add your key here
```

### Important Notes:
- 🔐 Never commit `.env` file to git
- 🔒 Keep private key secret
- 🧪 Always use devnet wallet for testing
- 🔄 Rotate keys regularly

## Troubleshooting

### Error: "PARENT_WALLET_PRIVATE_KEY not configured"
**Status:** ℹ️ Informational - withdrawal still works
**Fix:** Add your private key to `.env` if you want blockchain transfers

### Error: "Failed to process payout"
**Check:**
1. Is backend running? `curl http://localhost:3000/api/worker`
2. Is worker authenticated? (Check auth token in localStorage)
3. Does worker have pending balance? (Check database)
4. Check backend console for errors

### Error: "SOL transfer failed"
**Check:**
1. Is PARENT_WALLET_PRIVATE_KEY valid? (Try regenerating)
2. Does parent wallet have SOL for fees? (Should have ~0.1 SOL)
3. Is Solana RPC accessible? (Check network)
4. Try again - network might be congested

## Testing Withdrawal Flow

### Complete Test Scenario:

1. **Setup:**
   - Backend running with `PARENT_WALLET_PRIVATE_KEY` set
   - Parent wallet has 1+ SOL on devnet
   - Frontend running

2. **Create Earnings:**
   - Login as user with task
   - Create task and assign reward
   - Switch to worker account
   - Find and submit task
   - Backend updates worker's pendingBalance

3. **Test Withdrawal:**
   - Login as worker
   - Go to profile page
   - Verify "Withdraw Earnings" section visible
   - See pending balance (e.g., "5.50 SOL")
   - Click "Withdraw SOL" button
   - Wait for "⏳ Processing..." state
   - See success message: "✅ Successfully withdrew X.XX SOL"
   - Verify locked balance increased
   - Check [Solana Explorer](https://explorer.solana.com/?cluster=devnet) for transaction

4. **Verify Results:**
   - Database: pendingBalance = 0, lockedBalance = original + pending
   - Blockchain: Transaction confirmed on devnet
   - Frontend: Balances updated, section hidden

## Next Steps

1. ✅ Frontend withdrawal UI is ready
2. ✅ Backend payout endpoint implemented
3. ⏳ Configure PARENT_WALLET_PRIVATE_KEY (optional)
4. ⏳ Test end-to-end withdrawal flow
5. ⏳ Monitor blockchain transactions

## Files Modified

- ✅ `worker-frontend/app/profile/page.tsx` - Added withdraw UI
- ✅ `backend/src/worker.ts` - Enhanced payout endpoint
- ✅ `backend/.env` - Added Solana config
- ✅ `backend/.env.example` - Added config template

## Support

For issues:
1. Check backend console logs: `npm run dev`
2. Check browser console: F12 → Console tab
3. Review detailed docs: `WITHDRAWAL_FEATURE.md`
4. Monitor Solana explorer: https://explorer.solana.com/?cluster=devnet

---

**Status:** Ready for testing! 🚀
