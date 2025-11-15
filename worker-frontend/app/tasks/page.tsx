'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  description?: string;
  amount: number;
  fileUrl: string;
  status: string;
  submissionsCount: number;
  createdAt: string;
}

const TasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/');
          return;
        }

        console.log('📡 Fetching available tasks...');
        const res = await fetch('http://localhost:3000/api/worker/tasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch tasks: ${res.status}`);
        }

        const data = await res.json();
        console.log('📦 Tasks data:', data);

        if (data.success && data.tasks) {
          setTasks(data.tasks);
        }
      } catch (err: any) {
        console.error('❌ Error fetching tasks:', err);
        setError(err.message || 'Error loading tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const downloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Available Tasks</h1>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('IN_PROGRESS')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'IN_PROGRESS'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-4 py-2 rounded-lg transition ${
              filterStatus === 'COMPLETED'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">
              {tasks.length === 0 ? 'No tasks available' : 'No tasks match the selected filter'}
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition"
              >
                {/* Task Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4 ${
                    task.status === 'COMPLETED'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {task.status}
                  </span>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reward</p>
                    <p className="text-white font-semibold">{(task.amount / 1000000000).toFixed(5)} SOL</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Posted</p>
                    <p className="text-white text-xs">{formatDate(task.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submissions</p>
                    <p className="text-white font-semibold">{task.submissionsCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Task ID</p>
                    <p className="text-white text-xs font-mono truncate">{task.id.slice(0, 8)}...</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadFile(task.fileUrl, `${task.title}.zip`)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition text-sm"
                  >
                    📥 Download Task
                  </button>
                  {task.status === 'IN_PROGRESS' && (
                    <Link
                      href={`/submit-task/${task.id}`}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition text-sm"
                    >
                      📤 Submit Work
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default TasksPage;
