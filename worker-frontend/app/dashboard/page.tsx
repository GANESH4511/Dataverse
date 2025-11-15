'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalSubmissions: number;
  pendingBalance: number;
  lockedBalance: number;
  completedTasks: number;
}

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const wallet = localStorage.getItem('walletAddress');

        if (!token) {
          router.push('/');
          return;
        }

        setWalletAddress(wallet || '');

        // Fetch worker profile for stats
        console.log('📡 Fetching worker profile data...');
        const profileRes = await fetch('http://localhost:3000/api/worker/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileRes.ok) {
          console.error('❌ Profile fetch failed:', profileRes.status);
          throw new Error(`Profile fetch failed: ${profileRes.status}`);
        }

        const profileData = await profileRes.json();
        console.log('📊 Profile data:', profileData);

        if (profileData.success) {
          setStats(profileData.worker.stats);
        }
      } catch (err: any) {
        console.error('💥 Error fetching dashboard data:', err);
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const formatWalletAddress = (address: string) => {
    if (!address) return 'Not connected';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Worker Dashboard</h1>
          <p className="text-gray-400">Track your submissions and earnings</p>
          {walletAddress && (
            <p className="text-gray-500 text-sm mt-2">
              Wallet: <span className="text-gray-300 font-mono">{formatWalletAddress(walletAddress)}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Submissions */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 p-6 rounded-lg hover:border-blue-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Submissions</p>
                  <p className="text-4xl font-bold text-white">{stats.totalSubmissions}</p>
                </div>
                <span className="text-5xl">📤</span>
              </div>
            </div>

            {/* Pending Balance */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 p-6 rounded-lg hover:border-yellow-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Pending Balance</p>
                  <p className="text-4xl font-bold text-white">{typeof stats.pendingBalance === 'number' ? stats.pendingBalance.toFixed(5) : '0.00000'}</p>
                  <p className="text-xs text-gray-500 mt-2">SOL</p>
                </div>
                <span className="text-5xl">⏳</span>
              </div>
            </div>

            {/* Locked Balance */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 p-6 rounded-lg hover:border-purple-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Locked Balance</p>
                  <p className="text-4xl font-bold text-white">{typeof stats.lockedBalance === 'number' ? stats.lockedBalance.toFixed(5) : '0.00000'}</p>
                  <p className="text-xs text-gray-500 mt-2">SOL</p>
                </div>
                <span className="text-5xl">🔒</span>
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 p-6 rounded-lg hover:border-green-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Completed Tasks</p>
                  <p className="text-4xl font-bold text-white">{stats.completedTasks}</p>
                </div>
                <span className="text-5xl">✅</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Your Earnings</h2>
            
            {stats && (
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-400">Total Available</p>
                    <p className="text-2xl font-bold text-green-400">
                      {typeof stats.pendingBalance === 'number' && typeof stats.lockedBalance === 'number' ? ((stats.pendingBalance + stats.lockedBalance)).toFixed(5) : '0.00000'} SOL
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Pending: {typeof stats.pendingBalance === 'number' ? (stats.pendingBalance).toFixed(5) : '0.00000'} SOL | Locked: {typeof stats.lockedBalance === 'number' ? (stats.lockedBalance).toFixed(5) : '0.00000'} SOL
                  </p>
                </div>
                
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <p className="text-gray-400 mb-2">Average per Task</p>
                  <p className="text-2xl font-bold text-white">
                    {stats.completedTasks > 0 && typeof stats.pendingBalance === 'number' && typeof stats.lockedBalance === 'number'
                      ? (((stats.pendingBalance + stats.lockedBalance)) / stats.completedTasks).toFixed(5)
                      : '0.00000'
                    } SOL
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

            <div className="space-y-4">
              <Link
                href="/tasks"
                className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition">📋</span>
                <div>
                  <p className="font-semibold">Browse Tasks</p>
                  <p className="text-xs text-blue-200">Find new work</p>
                </div>
              </Link>

              <Link
                href="/task-history"
                className="flex items-center gap-4 bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition">📜</span>
                <div>
                  <p className="font-semibold">Task History</p>
                  <p className="text-xs text-purple-200">View submissions</p>
                </div>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-4 bg-green-600 hover:bg-green-700 p-4 rounded-lg transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition">👤</span>
                <div>
                  <p className="font-semibold">Profile</p>
                  <p className="text-xs text-green-200">View details</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
