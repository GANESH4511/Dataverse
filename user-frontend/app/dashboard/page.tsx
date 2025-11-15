'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
  amount: number;
  createdAt: string;
  submissionsCount: number;
}

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalPayments: number;
}

const DashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
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

        // Fetch profile for stats
        console.log('📡 Fetching profile data...');
        const profileRes = await fetch('http://localhost:3000/api/user/profile', {
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
          setStats(profileData.user.stats);
        }

        // Fetch tasks
        console.log('📡 Fetching tasks...');
        const tasksRes = await fetch('http://localhost:3000/api/user/task', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!tasksRes.ok) {
          console.error('❌ Tasks fetch failed:', tasksRes.status);
          throw new Error(`Tasks fetch failed: ${tasksRes.status}`);
        }

        const tasksData = await tasksRes.json();
        console.log('📦 Tasks data:', tasksData);

        if (tasksData.success && tasksData.tasks) {
          // Get only the 5 most recent tasks
          setRecentTasks(tasksData.tasks.slice(0, 5));
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Welcome back! Here's your activity overview</p>
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
            {/* Total Tasks Card */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-600/30 p-6 rounded-lg hover:border-blue-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Tasks</p>
                  <p className="text-4xl font-bold text-white">{stats.totalTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">all time</p>
                </div>
                <span className="text-5xl">📋</span>
              </div>
            </div>

            {/* Completed Tasks Card */}
            <div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-600/30 p-6 rounded-lg hover:border-green-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Completed</p>
                  <p className="text-4xl font-bold text-white">{stats.completedTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}% done
                  </p>
                </div>
                <span className="text-5xl">✅</span>
              </div>
            </div>

            {/* In Progress Card */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-600/30 p-6 rounded-lg hover:border-yellow-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">In Progress</p>
                  <p className="text-4xl font-bold text-white">{stats.inProgressTasks}</p>
                  <p className="text-xs text-gray-500 mt-2">waiting</p>
                </div>
                <span className="text-5xl">⏳</span>
              </div>
            </div>

            {/* Total Payments Card */}
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-600/30 p-6 rounded-lg hover:border-purple-500 transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Paid</p>
                  <p className="text-4xl font-bold text-white">{stats.totalPayments.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-2">SOL</p>
                </div>
                <span className="text-5xl">💰</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Tasks</h2>
              <Link href="/my-tasks" className="text-blue-400 hover:text-blue-300 text-sm">
                View all →
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No tasks yet</p>
                <Link
                  href="/upload-task"
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                >
                  Create Your First Task
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{task.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{task.submissionsCount} submissions</span>
                      <span className="font-mono">{(task.amount / 1000000000).toFixed(5)} SOL</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Created on {formatDate(task.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

            <div className="space-y-4">
              <Link
                href="/upload-task"
                className="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 p-4 rounded-lg transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition">➕</span>
                <div>
                  <p className="font-semibold">Create Task</p>
                  <p className="text-xs text-blue-200">Upload new task</p>
                </div>
              </Link>

              <Link
                href="/my-tasks"
                className="flex items-center gap-4 bg-purple-600 hover:bg-purple-700 p-4 rounded-lg transition group"
              >
                <span className="text-2xl group-hover:scale-110 transition">📋</span>
                <div>
                  <p className="font-semibold">My Tasks</p>
                  <p className="text-xs text-purple-200">View all tasks</p>
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

            {/* Progress Bar */}
            {stats && stats.totalTasks > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400 mb-3">Completion Rate</p>
                <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-full transition-all duration-500"
                    style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((stats.completedTasks / stats.totalTasks) * 100)}% of tasks completed
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">📢 About This Dashboard</h3>
          <p className="text-gray-400 text-sm mb-4">
            This dashboard shows your activity across the Dataverse platform. Upload tasks, track submissions, and manage your projects all in one place.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-white mb-1">🎯 Tasks</p>
              <p className="text-gray-400">Create and manage data annotation tasks</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">👥 Workers</p>
              <p className="text-gray-400">Track submissions from workers</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">💵 Payments</p>
              <p className="text-gray-400">Monitor your spending on the platform</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
