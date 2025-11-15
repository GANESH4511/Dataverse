'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  fileUrl: string;
  createdAt: string;
  reward: number;
}

const TaskHistoryPage = () => {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/');
          return;
        }

        console.log('📡 Fetching submission history...');
        const res = await fetch('http://localhost:3000/api/worker/submissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch submissions: ${res.status}`);
        }

        const data = await res.json();
        console.log('📦 Submissions data:', data);

        if (data.success && data.submissions) {
          setSubmissions(data.submissions);
        }
      } catch (err: any) {
        console.error('❌ Error fetching submissions:', err);
        setError(err.message || 'Error loading submission history');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
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

  const calculateTotalEarnings = () => {
    return submissions.reduce((sum, sub) => sum + sub.reward, 0) / 1000000000;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading submission history...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Task History</h1>
            <p className="text-gray-400 text-sm mt-2">
              Total Earned: <span className="text-green-400 font-bold">{calculateTotalEarnings().toFixed(2)} SOL</span>
            </p>
          </div>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Total Submissions</p>
            <p className="text-4xl font-bold text-white">{submissions.length}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Total Earned</p>
            <p className="text-4xl font-bold text-green-400">{calculateTotalEarnings().toFixed(2)} SOL</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-lg">
            <p className="text-gray-400 text-sm mb-2">Average per Task</p>
            <p className="text-4xl font-bold text-white">
              {submissions.length > 0 ? (calculateTotalEarnings() / submissions.length).toFixed(2) : '0.00'} SOL
            </p>
          </div>
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg mb-4">No submissions yet</p>
            <Link
              href="/tasks"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
            >
              Browse Available Tasks
            </Link>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Task Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Submitted</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Reward</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {submission.taskTitle}
                        <p className="text-xs text-gray-500 font-mono mt-1">{submission.taskId.slice(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(submission.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-green-400 font-semibold">
                        {(submission.reward / 1000000000).toFixed(5)} SOL
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => downloadFile(submission.fileUrl, `submission-${submission.id.slice(0, 8)}.zip`)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition text-xs"
                        >
                          📥 Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {submissions.length > 0 && (
          <div className="mt-8 bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">First Submission</p>
                <p className="text-white font-semibold">
                  {formatDate(submissions[submissions.length - 1].createdAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Latest Submission</p>
                <p className="text-white font-semibold">
                  {formatDate(submissions[0].createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default TaskHistoryPage;
