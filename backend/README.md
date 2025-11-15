# Dataverse Backend

A clean and straightforward backend for the Dataverse Web2 project built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Backend:** Node.js with Express
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Storage:** AWS S3
- **Authentication:** JWT

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Main server file
│   ├── middleware.ts     # Authentication middleware
│   ├── user.ts          # User routes
│   ├── worker.ts        # Worker routes
│   └── s3.ts            # AWS S3 utilities
├── prisma/
│   └── schema.prisma    # Database schema
├── package.json
├── tsconfig.json
└── .env                 # Environment variables
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Update the `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dataverse?schema=public"

# JWT Secrets (generate strong secrets)
JWT_SECRET="your-super-secret-jwt-key-for-users"
WORKER_JWT_SECRET="your-super-secret-jwt-key-for-workers"

# AWS Configuration
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-s3-bucket-name"

# CloudFront Configuration
CLOUDFRONT_DOMAIN="https://d3366az7wn2y7w.cloudfront.net"

# Server Configuration
PORT=3000
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## API Endpoints

### User Routes (`/api/user`)

- **POST `/api/user/wallet-signin`** - Sign in users with wallet address (auto-creates if not found)
- **POST `/api/user/upload-presigned-url`** - Get pre-signed URL for S3 upload (requires auth)
- **POST `/api/user/task-from-s3`** - Create task with CloudFront URL (requires auth)
- **GET `/api/user/task`** - Get user's tasks (requires auth)
- **POST `/api/user/payments`** - Record payment (requires auth)

### Worker Routes (`/api/worker`)

- **POST `/api/worker/wallet-signin`** - Sign in workers with wallet address (auto-creates if not found)
- **GET `/api/worker/alltask`** - Get all tasks (requires auth)
- **POST `/api/worker/submission-presigned-url`** - Get pre-signed URL for submission upload (requires auth)
- **POST `/api/worker/submission-from-s3`** - Submit work with CloudFront URL (requires auth)
- **GET `/api/worker/balance`** - Get balance (requires auth)
- **POST `/api/worker/payout`** - Process payout (requires auth)

## Authentication

- **User routes** use `autMiddleware` with `JWT_SECRET`
- **Worker routes** use `WorkerMiddleware` with `WORKER_JWT_SECRET`
- Include JWT token in Authorization header: `Bearer <token>`
 - Legacy `POST /api/*/wallet-signup` endpoints are deprecated and return 410 Gone

## File Upload & CloudFront

- **CloudFront CDN:** All files served via CloudFront for global delivery
- **Pre-signed URLs:** Secure direct-to-S3 uploads without exposing credentials
- **File Types:** Only ZIP files are accepted
- **File Size:** Maximum 50MB per file
- **Storage Structure:**
  - User uploads: `uploads/` folder in S3
  - Worker submissions: `submissions/` folder in S3
- **URL Format:** All database URLs use CloudFront domain for production-ready delivery

### Upload Flow:
1. Get pre-signed URL from API
2. Upload file directly to S3 using pre-signed URL
3. Create task/submission record with CloudFront URL

## Database Schema

- **Users:** Store user accounts
- **Workers:** Store worker accounts with balance tracking
- **Tasks:** Store uploaded tasks with file URLs
- **Submissions:** Store worker submissions
- **Payments:** Store payment records

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run test         # Test server endpoints
npm run setup        # Generate Prisma client and push schema
npm run clean        # Clean build files and node_modules
```

## Health Check

Visit `http://localhost:3000/health` to check if the server is running.
