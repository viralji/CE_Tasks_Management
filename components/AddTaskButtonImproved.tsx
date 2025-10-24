'use client';

import { useState, useEffect } from 'react';

interface ProjectSettings {
  defaultTaskDueDays?: number;
  defaultTaskPriority?: string;
  autoAssignEnabled?: boolean;
  autoAssignUserId?: string;
}

interface User {
  id: string;
  name: string;
  primary_email: string;
}

interface AddTaskButtonProps {
  projectId: string;
}

/**
 * Improved AddTaskButton Component with project settings integration
 * 
 * Features:
 * - Auto-populates due date based on project settings
 * - Default status set to "new"
 * - Mandatory user assignment
 * - Fixed modal transparency
 * - Project settings integration
 */
export function AddTaskButton({ projectId }: AddTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch project settings and users when modal opens
  useEffect(() => {
    if (isModalOpen) {
      fetchProjectData();
    }
  }, [isModalOpen, projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/settings`),
        fetch(`/api/projects/${projectId}/members`)
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setProjectSettings(settingsData.data);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDueDate = (dueDays: number): string => {
    const now = new Date();
    const dueDate = new Date(now.getTime() + (dueDays * 24 * 60 * 60 * 1000));
    return dueDate.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    try {
      const assignedTo = formData.get('assignedTo');
      if (!assignedTo) {
        alert('Please assign a user to the task');
        return;
      }

      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          priority: formData.get('priority'),
          status: 'new', // Default status
          dueAt: formData.get('dueAt'),
          assignedTo: assignedTo
        })
      });

      if (response.ok) {
        setIsModalOpen(false);
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Task</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Task</h3>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="text-gray-600">Loading...</div>
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    name="title"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign User *</label>
                  <select
                    name="assignedTo"
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a user</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.primary_email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      name="priority"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      defaultValue={projectSettings?.defaultTaskPriority || "MEDIUM"}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      name="dueAt"
                      type="datetime-local"
                      defaultValue={projectSettings?.defaultTaskDueDays ? 
                        calculateDueDate(projectSettings.defaultTaskDueDays) : ''}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
