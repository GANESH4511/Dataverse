# Worker Frontend Setup

## Project Structure

The worker-frontend has been created with the following pages:

### Pages Created:
1. **`/` (Landing Page)** - Welcome page with features and wallet connection
   - Features overview
   - How it works section
   - Wallet connection button

2. **`/dashboard`** - Worker dashboard
   - Total submissions count
   - Pending balance (SOL)
   - Locked balance (SOL)
   - Completed tasks count
   - Average earnings per task
   - Quick action links

3. **`/tasks`** - Browse available tasks
   - List of all available tasks
   - Filter by status (All, In Progress, Completed)
   - Download task files
   - Submit work button for active tasks
   - Task details (reward, submissions count, date posted)

4. **`/task-history`** - Submission history
   - All past submissions
   - Total earnings summary
   - Average earnings per task
   - Download submission files
   - Table view with submission details

5. **`/profile`** - Worker profile
   - Wallet address with copy button
   - Member since date
   - Work statistics (submissions, completed tasks, balances)
   - Disconnect wallet button

6. **`/component/Navbar.tsx`** - Navigation bar
   - Links to all pages
   - Wallet connection button
   - Same styling as user-frontend

### Utilities:
- **`/utils/walletAuth.ts`** - Wallet authentication hook
  - Same implementation as user-frontend
  - Uses worker API endpoints (`/api/worker/*`)
  - Message signing for authentication
  - Token persistence in localStorage

### Authentication Features:
- Solana wallet adapter integration
- Phantom and Solflare wallet support
- Message signing for authentication
- JWT token management
- Automatic wallet reconnection

### Styling:
- Tailwind CSS (consistent with user-frontend)
- Dark theme (black background)
- Blue/gradient color scheme
- Responsive design

## Required Backend Endpoints

The worker-frontend expects the following backend endpoints:

- `POST /api/worker/wallet-nonce` - Get nonce for signing
- `POST /api/worker/wallet-signin` - Verify signature and get JWT
- `GET /api/worker/profile` - Get worker profile and stats
- `GET /api/worker/tasks` - Get all available tasks
- `GET /api/worker/submissions` - Get worker's submissions

These endpoints need to be implemented in the backend `worker.ts` file.

## Installation

The project is already set up. To start the development server:

```bash
cd worker-frontend
npm run dev
```

The application will run on `http://localhost:3001` (or another available port).

## Notes

- The frontend is identical in structure to user-frontend for consistency
- All API calls use `Bearer ${token}` authentication
- Token is stored in localStorage as `authToken`
- Wallet address is stored in localStorage as `walletAddress`
- The Navbar is automatically included in all pages via the root layout
