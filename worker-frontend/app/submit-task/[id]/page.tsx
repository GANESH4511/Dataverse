'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const SubmitTaskPage = () => {
  const router = useRouter();
  const params = useParams();
  const taskId = params?.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB.');
      return false;
    }

    const allowedTypes = ['application/zip', 'application/x-zip-compressed'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only ZIP files are allowed.');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    if (validateFile(selected)) {
      setFile(selected);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleSubmit = async () => {
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    if (!taskId) {
      alert('Task ID is missing.');
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Not authenticated.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setMessage('⏳ Getting pre-signed URL...');

      // Step 1: Get presigned URL for submission upload
      const presignRes = await fetch('http://localhost:3000/api/worker/submission-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error('Failed to get presigned URL');

      console.log('✅ Got presigned URL:', presignData.key);

      // Step 2: Upload file to S3
      setMessage('⬆️ Uploading submission to S3...');
      setUploadProgress(50);
      
      const uploadRes = await fetch(presignData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload to S3');

      console.log('✅ File uploaded to S3');
      setUploadProgress(100);
      setMessage('📝 Submitting to task...');

      // Step 3: Create submission record
      const submitRes = await fetch('http://localhost:3000/api/worker/submission-from-s3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          fileUrl: presignData.key,
        }),
      });

      const submitData = await submitRes.json();
      if (!submitData.success) throw new Error(submitData.message || 'Failed to create submission');

      const rewardAmount = typeof submitData.rewardEarned === 'number' ? submitData.rewardEarned : parseFloat(submitData.rewardEarned || '0');
      setMessage('✅ Submission successful! You earned ' + rewardAmount.toFixed(2) + ' SOL');
      setFile(null);
      setUploadProgress(0);

      // Redirect to tasks after 2 seconds
      setTimeout(() => {
        router.push('/tasks');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Submission error:', err);
      setMessage('❌ Submission failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <Link href="/tasks" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to Tasks
          </Link>
          <h1 className="text-3xl font-bold mt-4">Submit Task</h1>
          <p className="text-gray-400 text-sm mt-2">
            Task ID: <span className="font-mono">{taskId?.slice(0, 12)}...</span>
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-gray-900 p-6 rounded-xl shadow-lg space-y-4 border border-gray-700">
          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
            <p className="text-sm text-blue-200">
              📋 <strong>Instructions:</strong> Download the task file, complete the work, and upload your submission as a ZIP file.
            </p>
          </div>

          {/* File Upload */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver
                ? 'border-blue-400 bg-blue-50 text-black'
                : 'border-gray-600 hover:border-blue-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileInputChange}
              className="hidden"
            />
            {file ? (
              <div>
                <p className="font-medium">✅ {file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">📁</p>
                <p>Upload a ZIP file or drag and drop here</p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-4">
              <div className="bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('✅')
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : message.includes('❌')
                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isUploading || !file}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded font-semibold transition"
          >
            {isUploading ? '⏳ Submitting...' : '📤 Submit Submission'}
          </button>

          {/* Cancel Button */}
          <Link
            href="/tasks"
            className="block text-center bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition"
          >
            Cancel
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-400">
          <p className="mb-2">💡 <strong>Tips:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure your ZIP file contains all required files</li>
            <li>Maximum file size is 50MB</li>
            <li>You'll earn SOL upon successful submission</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default SubmitTaskPage;
