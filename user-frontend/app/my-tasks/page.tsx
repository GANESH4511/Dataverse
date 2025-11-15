'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Submission {
  id: string;
  fileUrl: string;
  createdAt: string;
  worker: {
    id: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  status: string;
  amount: number;
  createdAt: string;
  submissionsCount: number;
  submissions: Submission[];
}

const MyTasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/');
          return;
        }

        const res = await fetch('http://localhost:3000/api/user/task', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!data.success) {
          setError('Failed to fetch tasks');
          return;
        }

        setTasks(data.tasks || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Error loading tasks');
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
      hour: '2-digit',
      minute: '2-digit',
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
          <h1 className="text-4xl font-bold">My Tasks</h1>
          <Link
            href="/upload-task"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
          >
            + Create New Task
          </Link>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 p-4 rounded-lg mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No tasks yet</p>
            <Link
              href="/upload-task"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
            >
              Create Your First Task
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition"
              >
                {/* Task Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{task.title}</h2>
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-3">{task.description}</p>
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
                    <p className="text-gray-500">Amount</p>
                    <p className="text-white font-semibold">{(task.amount / 1000000000).toFixed(5)} SOL</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
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

                {/* Download File Button */}
                <div className="mb-4">
                  <button
                    onClick={() => downloadFile(task.fileUrl, `${task.title}.zip`)}
                    className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded transition text-sm"
                  >
                    📥 Download File
                  </button>
                </div>

                {/* Submissions Section */}
                {task.submissionsCount > 0 && (
                  <div className="border-t border-gray-700 pt-4">
                    <h3 className="font-semibold mb-3 text-gray-300">
                      Submissions ({task.submissionsCount})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {task.submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="bg-gray-800 p-3 rounded flex justify-between items-center text-sm"
                        >
                          <div>
                            <p className="text-gray-400">
                              Worker: <span className="text-white font-mono">{submission.worker.id.slice(0, 8)}...</span>
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatDate(submission.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadFile(submission.fileUrl, `submission-${submission.id.slice(0, 8)}.zip`)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs transition"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default MyTasksPage;
