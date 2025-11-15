'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';

const UploadTaskPage = () => {
  const { publicKey, sendTransaction, connected } = useWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountSOL, setAmountSOL] = useState('0.1'); // User inputs SOL amount
  const [file, setFile] = useState<File | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const PARENT_WALLET = new PublicKey('65m8Pc89Jjfpt7K2rScWK1SzeMz8cihN5vK7rjBZucrV');
  const connection = new Connection('https://api.devnet.solana.com');

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

  const handlePayment = async () => {
    if (!publicKey) {
      alert('Connect your wallet first');
      return;
    }
    setIsPaying(true);
    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: PARENT_WALLET,
          lamports: 0.01 * LAMPORTS_PER_SOL,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      setMessage('⏳ Confirming transaction...');
      await connection.confirmTransaction(signature, 'confirmed');

      const txInfo = await connection.getTransaction(signature, { commitment: 'confirmed' });
      if (!txInfo) throw new Error('Transaction not found');
      const paid = txInfo.transaction.message.accountKeys
        .some(acc => acc.toBase58() === PARENT_WALLET.toBase58());
      if (!paid) throw new Error('Payment not verified');

      // Record payment in database
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log('📝 Recording payment in database...');
        const paymentRes = await fetch('http://localhost:3000/api/user/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: 0.01 // 0.01 SOL in lamports will be converted to cents in backend
          }),
        });

        const paymentData = await paymentRes.json();
        if (paymentData.success) {
          console.log('✅ Payment recorded:', paymentData.payment);
        } else {
          console.warn('⚠️ Payment recorded on-chain but database record failed:', paymentData.message);
        }
      }

      setHasPaid(true);
      setMessage('✅ Payment verified. You can now submit your task.');
    } catch (err) {
      console.error(err);
      setMessage('❌ Payment failed or cancelled.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Title and file are required.');
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

      const presignRes = await fetch('http://localhost:3000/api/user/upload-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignData.success) throw new Error('Failed to get presigned URL');

      setMessage('⬆️ Uploading file to S3...');
      setUploadProgress(50);
      await fetch(presignData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      setUploadProgress(100);
      setMessage('🗂 Creating task...');

      const taskRes = await fetch('http://localhost:3000/api/user/task-from-s3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          amount: Math.floor(parseFloat(amountSOL) * LAMPORTS_PER_SOL), // Convert SOL to lamports
          fileUrl: presignData.key,
        }),
      });

      const taskData = await taskRes.json();
      if (!taskData.success) throw new Error(taskData.message);

      setMessage('✅ Task created successfully.');
      setTitle('');
      setDescription('');
      setFile(null);
      setHasPaid(false);
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Upload Task</h1>

      <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl shadow-lg space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white min-h-[100px]"
        />

        <div>
          <label className="block text-sm font-medium mb-2">Task Amount (SOL)</label>
          <input
            type="number"
            step="0.00001"
            min="0.00001"
            value={amountSOL}
            onChange={e => setAmountSOL(e.target.value)}
            placeholder="0.1"
            className="w-full p-2 rounded bg-gray-800 text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Worker will earn 10% ({(parseFloat(amountSOL) * 0.1).toFixed(5)} SOL)</p>
        </div>

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
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-gray-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <p>Upload a ZIP file or drag and drop here</p>
          )}
        </div>

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

        {!hasPaid ? (
          <button
            onClick={handlePayment}
            disabled={isPaying || !connected}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded disabled:opacity-50"
          >
            {isPaying ? 'Processing...' : 'Pay 0.01 SOL'}
          </button>
        ) : (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Submit Task'}
          </button>
        )}

        {message && <p className="text-sm text-gray-400 text-center mt-2">{message}</p>}
      </div>
    </main>
  );    
};

export default UploadTaskPage;
