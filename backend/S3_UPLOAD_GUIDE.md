# S3 Upload Guide - Pre-signed URLs

## Overview

The backend now supports two methods for file uploads:
1. **Direct Upload** - Traditional multipart/form-data upload
2. **Pre-signed URL Upload** - Secure direct-to-S3 upload (Recommended)

## Method 1: Pre-signed URL Upload (Recommended)

### Step 1: Get Pre-signed URL

**For Users (Task Upload):**
```javascript
// Request pre-signed URL
const response = await fetch('/api/user/upload-presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    fileName: 'my-dataset.zip',
    contentType: 'application/zip'
  })
});

const data = await response.json();
const { signedUrl, key } = data;
```

**For Workers (Submission Upload):**
```javascript
// Request pre-signed URL
const response = await fetch('/api/worker/submission-presigned-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_WORKER_JWT_TOKEN'
  },
  body: JSON.stringify({
    fileName: 'my-submission.zip',
    contentType: 'application/zip'
  })
});

const data = await response.json();
const { signedUrl, key } = data;
```

### Step 2: Upload File to S3

```javascript
// Upload file directly to S3 using pre-signed URL
const uploadResponse = await fetch(signedUrl, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/zip'
  },
  body: file // The actual File object
});

if (uploadResponse.ok) {
  console.log('File uploaded successfully to S3!');
}
```

### Step 3: Create Task/Submission Record

**For Users:**
```javascript
// Create task record after successful upload
const taskResponse = await fetch('/api/user/task-from-s3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    title: 'My Dataset Task',
    description: 'Description of the task',
    amount: 100,
    s3Key: key // The key returned from pre-signed URL request
  })
});
```

**For Workers:**
```javascript
// Create submission record after successful upload
const submissionResponse = await fetch('/api/worker/submission-from-s3', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_WORKER_JWT_TOKEN'
  },
  body: JSON.stringify({
    taskId: 'TASK_ID',
    s3Key: key // The key returned from pre-signed URL request
  })
});
```

## Method 2: Direct Upload

**For Users:**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('title', 'My Task');
formData.append('description', 'Task description');
formData.append('amount', '100');

const response = await fetch('/api/user/task', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: formData
});
```

**For Workers:**
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('taskId', 'TASK_ID');

const response = await fetch('/api/worker/submission', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_WORKER_JWT_TOKEN'
  },
  body: formData
});
```

## Complete Frontend Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>S3 Upload Example</title>
</head>
<body>
    <input type="file" id="fileInput" accept=".zip">
    <button onclick="uploadFile()">Upload</button>

    <script>
    async function uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a file');
            return;
        }

        try {
            // Step 1: Get pre-signed URL
            const urlResponse = await fetch('/api/user/upload-presigned-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_JWT_TOKEN'
                },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type
                })
            });
            
            const urlData = await urlResponse.json();
            
            // Step 2: Upload to S3
            await fetch(urlData.signedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });
            
            // Step 3: Create task record
            const taskResponse = await fetch('/api/user/task-from-s3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_JWT_TOKEN'
                },
                body: JSON.stringify({
                    title: 'My Task',
                    description: 'Task description',
                    amount: 100,
                    s3Key: urlData.key
                })
            });
            
            const taskData = await taskResponse.json();
            console.log('Task created:', taskData);
            
        } catch (error) {
            console.error('Upload failed:', error);
        }
    }
    </script>
</body>
</html>
```

## Benefits of Pre-signed URLs

1. **Security** - No AWS credentials exposed to frontend
2. **Performance** - Direct upload to S3, no server bottleneck
3. **Scalability** - Server doesn't handle file data
4. **Cost** - Reduced server bandwidth usage

## Error Handling

- Pre-signed URLs expire in 1 hour
- Only ZIP files are accepted
- Proper authentication required for all endpoints
- S3 upload failures should be handled gracefully
