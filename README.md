# 🌐 Dataverse - Decentralized Solana Task Marketplace

A full-stack Web3 marketplace platform built on Solana blockchain that enables users to create and post tasks while workers can discover, complete, and earn SOL rewards instantly.

## ✨ Features

### 👥 Dual-Role Platform
- **Users**: Upload tasks with custom SOL rewards and track submissions
- **Workers**: Browse available tasks, submit work, and earn instant SOL rewards

### 🔐 Wallet Authentication
- Phantom wallet integration with message signing
- Secure JWT-based session management
- Nonce-based authentication flow for enhanced security
- Auto sign-in with wallet connection

### 💰 Smart Reward System
- **10% automatic reward calculation** - Workers earn 10% of task value
- **Lamports precision** - Support for micro-SOL (0.00001 SOL minimum)
- **Pending balance tracking** - Instant balance updates
- **One-click withdrawal** - Transfer earnings to locked balance

### 📦 File Management
- S3 integration for secure file uploads
- CloudFront CDN for optimized content delivery
- ZIP file support for task submissions
- Pre-signed URLs for secure uploads

### 📊 Advanced Features
- Real-time balance updates
- Task history and analytics
- Payment recording and tracking
- CORS-enabled multi-frontend support
- Comprehensive console logging system
- Responsive design with Tailwind CSS

## 🏗️ Tech Stack

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Solana message signing
- **Storage**: AWS S3 + CloudFront CDN

### Frontend
- **Framework**: Next.js 16 with Turbopack
- **UI Library**: React 19 + Tailwind CSS
- **Blockchain**: Solana Web3.js + Phantom Wallet Adapter
- **HTTP**: Fetch API with error handling

### Blockchain
- **Network**: Solana devnet
- **Wallet**: Phantom
- **Libraries**: @solana/web3.js, tweetnacl

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Phantom wallet (browser extension)
- AWS S3 credentials (for file uploads)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/GANESH4511/Dataverse.git
cd Dataverse
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env

# Configure .env with:
# DATABASE_URL=your_postgresql_url
# JWT_SECRET=your_secret_key
# WORKER_JWT_SECRET=your_secret_key
# AWS S3 credentials
# CloudFront domain

npm run dev
# Runs on http://localhost:3000
```

3. **Setup User Frontend**
```bash
cd user-frontend
npm install
npm run dev
# Runs on http://localhost:3001
```

4. **Setup Worker Frontend**
```bash
cd worker-frontend
npm install
npm run dev
# Runs on http://localhost:3002
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:password@localhost:5432/dataverse
JWT_SECRET=your_jwt_secret_key
WORKER_JWT_SECRET=your_worker_jwt_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1
CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net
PORT=3000
```

## 📖 API Documentation

### User Routes
- `POST /api/user/wallet-nonce` - Get nonce for signing
- `POST /api/user/wallet-signin` - Authenticate with signed message
- `POST /api/user/task-from-s3` - Create task from S3 file
- `GET /api/user/profile` - Get user profile and stats
- `POST /api/user/payments` - Record task payment

### Worker Routes
- `POST /api/worker/wallet-nonce` - Get nonce for signing
- `POST /api/worker/wallet-signin` - Authenticate with signed message
- `GET /api/worker/alltask` - Get all available tasks
- `POST /api/worker/submission-from-s3` - Submit task work
- `GET /api/worker/balance` - Get pending and locked balance
- `POST /api/worker/payout` - Withdraw earnings
- `GET /api/worker/profile` - Get worker profile and stats

## 💾 Database Schema

### Users Table
- id (UUID)
- walletAddress (String, unique)
- nonce (String)
- createdAt, updatedAt

### Workers Table
- id (UUID)
- walletAddress (String, unique)
- nonce (String)
- pendingBalance (Int - in lamports)
- lockedBalance (Int - in lamports)
- createdAt, updatedAt

### Tasks Table
- id (UUID)
- title (String)
- description (String)
- fileUrl (String - CloudFront URL)
- amount (Int - in lamports)
- status (IN_PROGRESS, COMPLETED)
- userId (Foreign Key)
- createdAt, updatedAt

### Submissions Table
- id (UUID)
- fileUrl (String - CloudFront URL)
- taskId (Foreign Key)
- workerId (Foreign Key)
- createdAt, updatedAt

## 🔄 User Flow

### For Task Posters (Users)
1. Connect Phantom wallet
2. Sign message to authenticate
3. Upload task ZIP file
4. Pay 0.01 SOL platform fee
5. Set custom SOL reward
6. Task goes live for workers
7. Monitor submissions
8. Track payment history

### For Task Workers
1. Connect Phantom wallet
2. Sign message to authenticate
3. Browse available tasks
4. Submit completed work (ZIP file)
5. **Earn 10% of task value instantly**
6. Balance updates in real-time
7. Withdraw to locked balance
8. View task history

## 🔐 Security Features

- Message signing authentication (no passwords)
- JWT token-based sessions
- CORS configuration for multiple frontends
- Environment variable protection
- S3 pre-signed URLs for secure uploads
- Nonce validation for replay attack prevention

## 📊 Key Metrics

- **Reward System**: 10% of task amount → Worker balance
- **Minimum Task Amount**: 0.00001 SOL (1 lamport)
- **Precision**: 5 decimal places (0.00001 SOL)
- **Platform Fee**: 0.01 SOL per task upload
- **Supported Networks**: Solana devnet

## 🛠️ Development

### Project Structure
```
Dataverse/
├── backend/
│   ├── src/
│   │   ├── index.ts (Main server)
│   │   ├── user.ts (User routes)
│   │   ├── worker.ts (Worker routes)
│   │   ├── auth.ts (Auth utilities)
│   │   ├── s3.ts (S3 integration)
│   │   ├── cloudfront.ts (CloudFront URLs)
│   │   └── middleware.ts (Auth middleware)
│   ├── prisma/
│   │   ├── schema.prisma (Database schema)
│   │   └── migrations/
│   └── package.json
├── user-frontend/
│   ├── app/
│   │   ├── page.tsx (Sign in)
│   │   ├── dashboard/
│   │   ├── upload-task/
│   │   ├── my-tasks/
│   │   └── profile/
│   └── package.json
├── worker-frontend/
│   ├── app/
│   │   ├── page.tsx (Sign in)
│   │   ├── dashboard/
│   │   ├── tasks/
│   │   ├── submit-task/
│   │   ├── task-history/
│   │   └── profile/
│   └── package.json
└── README.md
```

### Testing with Phantom
1. Install Phantom wallet extension
2. Set network to Solana Devnet
3. Request airdrop for devnet SOL
4. Connect wallet to frontends
5. Test task creation and submission

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running on port 3000
- Check that both frontends are in CORS allowlist
- Restart backend if frontends added after startup

### Wallet Connection Issues
- Ensure Phantom is installed and unlocked
- Verify you're on Solana devnet
- Try disconnecting and reconnecting

### File Upload Errors
- Ensure file is in ZIP format
- Check S3 bucket permissions
- Verify AWS credentials in .env

### Balance Not Updating
- Refresh the page to fetch latest data
- Check backend logs for errors
- Verify database connection

## 📝 License

MIT License - Built for the Solana ecosystem

## 👨‍💻 Author

**Ganesh** - Web3 Developer  
Email: infernogane@gmail.com  
GitHub: [@GANESH4511](https://github.com/GANESH4511)

## 🤝 Contributing

Contributions are welcome! Feel free to fork, create a feature branch, and submit a pull request.

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the author.

---

**Built with ❤️ for the Solana Community**
