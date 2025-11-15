# CloudFront-Enabled API Guide

## Overview

The Dataverse backend now uses **CloudFront URLs** for all file storage, providing:
- ✅ **Faster global delivery** via AWS CloudFront CDN
- ✅ **Private S3 bucket support** via CloudFront OAI
- ✅ **Production-ready** file serving
- ✅ **Clean, maintainable** codebase

## Configuration

### Environment Variables
```env
CLOUDFRONT_DOMAIN="https://d3366az7wn2y7w.cloudfront.net"
```

## Updated API Flow

### 🔄 **New Streamlined Flow:**
1. **Get Pre-signed URL** → Upload to S3 → **Create Task/Submission with CloudFront URL**
2. **Removed:** Direct upload endpoints (`/task`, `/submission`)

## API Endpoints

### 👤 **User Endpoints**

#### 1. Get Pre-signed URL for Task Upload
```http
POST /api/user/upload-presigned-url
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "fileName": "my-dataset.zip",
  "contentType": "application/zip"
}
```

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://dataverse-up.s3.us-east-1.amazonaws.com/uploads/uuid.zip?...",
  "key": "uploads/uuid.zip",
  "message": "Pre-signed URL generated successfully"
}
```

#### 2. Create Task with CloudFront URL
```http
POST /api/user/task-from-s3
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "title": "My Dataset Task",
  "description": "Task description",
  "amount": 100,
  "fileUrl": "uploads/uuid.zip"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully with CloudFront URL",
  "task": {
    "id": "task-uuid",
    "title": "My Dataset Task",
    "description": "Task description",
    "fileUrl": "https://d3366az7wn2y7w.cloudfront.net/uploads/uuid.zip",
    "status": "OPEN",
    "amount": 100,
    "createdAt": "2025-10-05T14:27:34.000Z"
  }
}
```

### 👷 **Worker Endpoints**

#### 1. Get Pre-signed URL for Submission Upload
```http
POST /api/worker/submission-presigned-url
Authorization: Bearer <WORKER_JWT_TOKEN>
Content-Type: application/json

{
  "fileName": "my-submission.zip",
  "contentType": "application/zip"
}
```

#### 2. Create Submission with CloudFront URL
```http
POST /api/worker/submission-from-s3
Authorization: Bearer <WORKER_JWT_TOKEN>
Content-Type: application/json

{
  "taskId": "task-uuid",
  "fileUrl": "submissions/uuid.zip"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Submission created successfully with CloudFront URL",
  "submission": {
    "id": "submission-uuid",
    "fileUrl": "https://d3366az7wn2y7w.cloudfront.net/submissions/uuid.zip",
    "taskId": "task-uuid",
    "createdAt": "2025-10-05T14:27:34.000Z"
  },
  "newPendingBalance": 10.00
}
```

## Key Features

### 🔄 **Automatic URL Conversion**
The API automatically converts various input formats to CloudFront URLs:

**Input formats accepted:**
- S3 key: `uploads/file.zip`
- S3 URL: `https://bucket.s3.amazonaws.com/uploads/file.zip`
- CloudFront URL: `https://d3366az7wn2y7w.cloudfront.net/uploads/file.zip`

**Output:** Always CloudFront URL in database

### ✅ **Enhanced Validation**
- **File type validation:** Only ZIP files accepted
- **Folder validation:** Tasks must be in `uploads/`, submissions in `submissions/`
- **Input sanitization:** All inputs trimmed and validated
- **Amount validation:** Must be positive numbers

### 🛡️ **Error Handling**
- **CloudFront configuration errors** handled gracefully
- **Invalid file URLs** rejected with clear messages
- **Missing environment variables** detected and reported

### 🏗️ **Production Ready**
- **Clean separation** of concerns with utility functions
- **Maintainable code** with proper error handling
- **Type safety** with TypeScript
- **Transaction support** for data consistency

## Utility Functions

### CloudFront Utilities (`src/cloudfront.ts`)
```typescript
// Convert S3 key to CloudFront URL
convertS3KeyToCloudFrontUrl(s3Key: string): string

// Extract S3 key from any URL format
extractS3KeyFromUrl(fileUrl: string): string

// Validate S3 key format
validateS3Key(s3Key: string): boolean

// Get CloudFront domain from environment
getCloudFrontDomain(): string
```

## Migration Notes

### ⚠️ **Breaking Changes**
- **Removed endpoints:** `/api/user/task`, `/api/worker/submission`
- **Changed parameter:** `s3Key` → `fileUrl` in task/submission creation
- **New requirement:** `CLOUDFRONT_DOMAIN` environment variable

### 🔄 **Migration Steps**
1. Update frontend to use new parameter names
2. Set `CLOUDFRONT_DOMAIN` environment variable
3. Update any existing integrations to use new flow

## Testing

### ✅ **Verified Working:**
- Pre-signed URL generation for both users and workers
- CloudFront URL conversion and storage
- Task and submission creation with CloudFront URLs
- Input validation and error handling
- Environment variable configuration

### 🧪 **Test Commands:**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test user endpoints
curl http://localhost:3000/api/user

# Test worker endpoints  
curl http://localhost:3000/api/worker
```

## Benefits

### 🚀 **Performance**
- **Global CDN delivery** via CloudFront
- **Reduced server load** with direct S3 uploads
- **Faster file access** for end users

### 🔒 **Security**
- **Private S3 buckets** supported via CloudFront OAI
- **No AWS credentials** exposed to frontend
- **Secure pre-signed URLs** with expiration

### 🛠️ **Maintainability**
- **Clean code architecture** with utility functions
- **Consistent URL handling** across all endpoints
- **Easy to extend** for additional file types or folders
