/**
 * Example: My Tasks Page with Attachment Icons
 * 
 * This example shows how to integrate the S3 attachments plugin into a tasks list page.
 * 
 * Usage: Copy this example to your tasks page and customize as needed.
 */

'use client';

import React, { useState } from 'react';
import AttachmentIcon from '@/components/AttachmentIcon';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  // ... other task properties
}

interface MyTasksPageProps {
  tasks: Task[];
  orgId: string;
  projectName: string;
}

export default function MyTasksPage({ 
  tasks, 
  orgId, 
  projectName 
}: MyTasksPageProps) {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  const handleAttachmentClick = (taskId: string) => {
    setSelectedTask(taskId);
    // Open attachment modal or navigate to task detail page
    console.log('View attachments for task:', taskId);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600">Manage your tasks and their attachments</p>
      </div>

      {/* Tasks table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {task.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    task.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                    task.status === 'BLOCKED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <AttachmentIcon
                    taskId={task.id}
                    orgId={orgId}
                    projectName={projectName}
                    onClick={() => handleAttachmentClick(task.id)}
                    showCount={true}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attachment modal (if needed) */}
      {selectedTask && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Attachments for Task {selectedTask}
              </h3>
              <p className="text-sm text-gray-500">
                This is where you would show the AttachmentList component
                or navigate to the task detail page.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
