'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';

interface WorkerProfile {
  id: string;
  walletAddress: string;
  createdAt: string;
  stats: {
    totalSubmissions: number;
    pendingBalance: number;
    lockedBalance: number;
    completedTasks: number;
  };
}

const ProfilePage = () => {
  const router = useRouter();
  const { disconnect } = useWallet();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawMessage, setWithdrawMessage] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        console.log('🔐 Token from localStorage:', token ? 'Found' : 'Not found');
        
        if (!token) {
          console.error('❌ No auth token found');
          setError('Not authenticated. Please sign in first.');
          router.push('/');
          return;
        }

        console.log('📡 Fetching profile from http://localhost:3000/api/worker/profile');
        const res = await fetch('http://localhost:3000/api/worker/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('📊 Response status:', res.status);
        const data = await res.json();
        console.log('📦 Response data:', data);

        if (!data.success) {
          console.error('❌ API error:', data.message);
          setError(data.message || 'Failed to load profile');
          return;
        }

        setProfile(data.worker);
      } catch (err: any) {
        console.error('💥 Error fetching profile:', err);
        setError(err.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

    const handleDisconnect = () => {
    disconnect();
    localStorage.removeItem('authToken');
    localStorage.removeItem('publicKey');
    router.push('/');
  };

  const handleWithdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawError('');
    setWithdrawMessage('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setWithdrawError('Not authenticated. Please sign in first.');
        setIsWithdrawing(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/worker/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setWithdrawError(data.message || 'Failed to process withdrawal');
        setIsWithdrawing(false);
        return;
      }

      // Update profile with new balances
      setProfile(prev => 
        prev ? {
          ...prev,
          stats: {
            ...prev.stats,
            pendingBalance: data.balance.pending * 100,
            lockedBalance: data.balance.locked * 100
          }
        } : null
      );

      setWithdrawMessage(
        `✅ Successfully withdrew ${data.payoutAmount} SOL to locked balance`
      );

      // Clear message after 3 seconds
      setTimeout(() => setWithdrawMessage(''), 3000);
    } catch (err) {
      console.error('Withdraw error:', err);
      setWithdrawError('An error occurred during withdrawal');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Profile not found'}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Worker Profile</h1>
          <button
            onClick={handleDisconnect}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition"
          >
            Disconnect Wallet
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Wallet Information</h2>
              <p className="text-gray-400">Your Solana wallet details</p>
            </div>
            <div className="text-5xl">👷</div>
          </div>

          {/* Wallet Address */}
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <label className="text-gray-400 text-sm block mb-2">Wallet Address</label>
            <div className="flex items-center justify-between">
              <p className="text-lg font-mono text-white">{formatWalletAddress(profile.walletAddress)}</p>
              <button
                onClick={() => copyToClipboard(profile.walletAddress)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition text-sm"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-mono break-all">{profile.walletAddress}</p>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <label className="text-gray-400 text-sm block mb-1">Member Since</label>
              <p className="text-white font-semibold">{formatDate(profile.createdAt)}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <label className="text-gray-400 text-sm block mb-1">Worker ID</label>
              <p className="text-white font-semibold font-mono">{profile.id.slice(0, 12)}...</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Work Statistics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Submissions */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Submissions</p>
                  <p className="text-3xl font-bold text-white">{profile.stats.totalSubmissions}</p>
                </div>
                <span className="text-4xl">📤</span>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Completed Tasks</p>
                  <p className="text-3xl font-bold text-white">{profile.stats.completedTasks}</p>
                </div>
                <span className="text-4xl">✅</span>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pending Balance</p>
                  <p className="text-3xl font-bold text-white">{typeof profile.stats.pendingBalance === 'number' ? (profile.stats.pendingBalance).toFixed(5) : '0.00000'}</p>
                  <p className="text-xs text-gray-500 mt-1">SOL</p>
                  <p className="text-xs text-gray-400 mt-2">{profile.stats.pendingBalance} cents</p>
                </div>
                <span className="text-4xl">⏳</span>
              </div>
            </div>

            {/* Locked Balance */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 p-6 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Locked Balance</p>
                  <p className="text-3xl font-bold text-white">{typeof profile.stats.lockedBalance === 'number' ? (profile.stats.lockedBalance).toFixed(5) : '0.00000'}</p>
                  <p className="text-xs text-gray-500 mt-1">SOL</p>
                  <p className="text-xs text-gray-400 mt-2">{profile.stats.lockedBalance} cents</p>
                </div>
                <span className="text-4xl">🔒</span>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        {profile.stats.pendingBalance > 0 && (
          <div className="bg-gray-900 border border-yellow-600/30 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Withdraw Earnings</h2>
            
            {withdrawError && (
              <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
                <p className="text-red-400">{withdrawError}</p>
              </div>
            )}

            {withdrawMessage && (
              <div className="bg-green-500/20 border border-green-500 p-4 rounded-lg mb-6">
                <p className="text-green-400">{withdrawMessage}</p>
              </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Ready to Withdraw</p>
                  <p className="text-4xl font-bold text-yellow-400">{typeof profile.stats.pendingBalance === 'number' ? (profile.stats.pendingBalance).toFixed(5) : '0.00000'} SOL</p>
                </div>
                <span className="text-5xl">💰</span>
              </div>
              <p className="text-gray-500 text-sm mb-6">Click below to move your pending balance to locked balance, and we'll send the SOL to your wallet.</p>
              
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing || profile.stats.pendingBalance === 0}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-3 rounded-lg transition font-semibold text-white"
              >
                {isWithdrawing ? '⏳ Processing...' : '🚀 Withdraw SOL'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/tasks"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition text-center font-semibold"
            >
              📋 Browse Tasks
            </Link>
            <Link
              href="/task-history"
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg transition text-center font-semibold"
            >
              📜 View History
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
