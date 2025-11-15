# Worker Reward System Update - 10% of Task Amount (in SOL)

## Overview
Updated the worker reward system to calculate 10% of the task amount (in SOL) as the reward for each successful submission, instead of a fixed $10 reward.

The system uses a consistent unit system where:
- **Storage Units**: Cents (for precision)
- **Display Units**: SOL (Solana blockchain)
- **Conversion**: 1 unit = 1 cent = 0.01 SOL equivalent on devnet

## Changes Made

### Backend (backend/src/worker.ts)

**File:** `POST /api/worker/submission-from-s3` endpoint

**Previous Logic:**
```typescript
// Fixed reward of $10 (1000 cents)
const updatedWorker = await tx.worker.update({
    where: { id: req.workerId! },
    data: {
        pendingBalance: {
            increment: 1000 // +10 dollars in cents
        }
    }
});
```

**New Logic:**
```typescript
// Calculate 10% reward from task amount (in SOL)
// task.amount is stored in cents (100 cents = 1 dollar equivalent)
// For reward calculation: 10% of task amount in SOL
const rewardAmountInCents = Math.floor(task.amount * 0.1); // 10% of task amount

// Update worker's pending balance with 10% of task amount
const updatedWorker = await tx.worker.update({
    where: { id: req.workerId! },
    data: {
        pendingBalance: {
            increment: rewardAmountInCents
        }
    }
});
```

## How It Works

1. **Task Created:** User creates a task with SOL amount (e.g., 100 cents = 1.00 SOL)
2. **Worker Submits:** Worker completes and submits the task
3. **Reward Calculated:** Backend calculates reward = `Math.floor(task.amount * 0.1)`
   - For a 1.00 SOL task: reward = 0.10 SOL (10%)
   - For a 5.00 SOL task: reward = 0.50 SOL (10%)
   - For a 0.75 SOL task: reward = Math.floor(75 * 0.1) = 7 cents = 0.07 SOL
4. **Balance Updated:** Worker's pending balance increases by the calculated reward amount

## Examples

| Task Amount (SOL) | Stored In Cents | Calculation | Worker Reward (SOL) |
|----------|------------|-------------|---------------|
| 0.10 SOL | 10 cents | 10 * 0.1 = 1 | 0.01 SOL |
| 0.50 SOL | 50 cents | 50 * 0.1 = 5 | 0.05 SOL |
| 1.00 SOL | 100 cents | 100 * 0.1 = 10 | 0.10 SOL |
| 2.00 SOL | 200 cents | 200 * 0.1 = 20 | 0.20 SOL |
| 0.75 SOL | 75 cents | Math.floor(75 * 0.1) = 7 | 0.07 SOL |

## Integration Points

### Worker Frontend
- Shows task amount when browsing tasks
- Workers can see task amount before submitting
- Reward will be calculated and reflected in profile after submission

### Database
- Worker's `pendingBalance` column updated with new reward amount
- No schema changes required
- Amount stored in cents (lamports equivalent for SOL)

### Withdrawal Feature
- Workers can withdraw pending balance (now based on 10% per submission)
- Locked balance accumulates from pending balance
- SOL transfer amount is now dynamic based on task amounts

## Testing Scenarios

### Scenario 1: Standard Task
1. User creates task with amount: $10
2. Worker submits task
3. Expected reward: $1 (10% of $10)
4. Worker's pending balance increases by 100 cents

### Scenario 2: Large Task
1. User creates task with amount: $100
2. Worker submits task
3. Expected reward: $10 (10% of $100)
4. Worker's pending balance increases by 1000 cents

### Scenario 3: Small Task
1. User creates task with amount: $0.50
2. Worker submits task
3. Expected reward: Math.floor(50 * 0.1) = 5 cents
4. Worker's pending balance increases by 5 cents

## API Response

### Submission Creation Response
```json
{
  "success": true,
  "message": "Submission created successfully with CloudFront URL",
  "submission": {
    "id": "submission-id",
    "fileUrl": "https://d3366az7wn2y7w.cloudfront.net/...",
    "taskId": "task-id",
    "createdAt": "2025-11-12T10:30:00Z"
  },
  "newPendingBalance": 1.50  // 10% of task amount
}
```

## Database Changes
None required - leverages existing `pendingBalance` column on Worker model.

## Security Considerations
- Reward calculation happens server-side only
- No client can manipulate reward amounts
- Task amount verified from database before calculation
- Atomic transaction ensures consistency

## Future Enhancements

1. **Configurable Reward Percentage**
   - Allow admin to set reward percentage (currently hardcoded at 10%)
   - Store percentage in configuration table

2. **Variable Rewards by Task Type**
   - Different reward percentages for different task categories
   - Premium tasks with higher reward rates

3. **Performance Bonuses**
   - Quality multiplier (e.g., workers with 5-star rating get 12%)
   - Speed multiplier (completed within timeframe)

4. **Tiered Rewards**
   - Increase reward percentage based on worker's total submissions
   - Level 1: 10%, Level 2: 12%, Level 3: 15%, etc.

## Rollback Instructions

If needed to revert to fixed $10 reward:
```typescript
// Change back to:
const rewardAmount = 1000; // Fixed $10

// Or remove calculation and use:
increment: 1000
```

## Files Modified
- `backend/src/worker.ts` - Updated submission creation reward calculation
