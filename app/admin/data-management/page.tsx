'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function DataManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');

  // Check if user is super admin
  if (!session || !(session as any).user?.isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need super admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleDeleteAll = async () => {
    if (!deleteConfirm) {
      setMessage('Please type "DELETE ALL DATA" to confirm deletion');
      return;
    }

    setIsDeleting(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ All data deleted successfully! Admin user and organization preserved.');
        // Refresh the page after successful deletion
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
            <p className="text-gray-600">Manage and delete all application data</p>
          </div>

          <div className="space-y-6">
            {/* Delete All Data Section */}
            <div className="border border-red-200 rounded-lg p-6 bg-red-50">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Delete All Data</h3>
                  <p className="text-sm text-red-600">
                    This will permanently delete all users, projects, tasks, and related data.
                    <strong> Admin user and organization will be preserved.</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-gray-700 mb-2">
                  Type "DELETE ALL DATA" to confirm:
                </label>
                <input
                  type="text"
                  id="delete-confirm"
                  value={deleteConfirm ? 'DELETE ALL DATA' : ''}
                  onChange={(e) => setDeleteConfirm(e.target.value === 'DELETE ALL DATA')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Type DELETE ALL DATA to confirm"
                />
              </div>

              <div className="mt-4 flex space-x-4">
                <button
                  onClick={handleDeleteAll}
                  disabled={!deleteConfirm || isDeleting}
                  className={`px-4 py-2 rounded-md font-medium ${
                    !deleteConfirm || isDeleting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete All Data'}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            {/* Navigation */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
