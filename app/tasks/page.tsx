'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils/date';
import { getStatusColor, getPriorityColor } from '@/lib/utils/status';
import { errorHandler } from '@/lib/utils/errorHandler';
import { AttachmentIcon } from '@/components/AttachmentIcon';

interface Task {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description?: string;
  due_at?: string;
  created_at: string;
  updated_at: string;
  project_id: string;
  project_name?: string;
  assignees?: string[];
  attachment_count?: number;
}

function MyTasksPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'CANCELED']);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);

  const fetchMyTasks = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/my-tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'fetchMyTasks' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/signin');
      return;
    }
    fetchMyTasks();
  }, [session, status]);

  // Listen for filter changes from the sidebar
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { statusFilter: newStatusFilter, projectFilter: newProjectFilter } = event.detail;
      setStatusFilter(newStatusFilter);
      setProjectFilter(newProjectFilter);
    };

    window.addEventListener('taskFiltersChanged', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('taskFiltersChanged', handleFilterChange as EventListener);
    };
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus as any } : task
        ));
      }
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'handleStatusChange', taskId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (taskId: string) => {
    if (!editingComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingComment })
      });
      
      if (response.ok) {
        setEditingComment('');
        setEditingTask(null);
        // Refresh tasks to get updated comments
        fetchMyTasks();
      }
    } catch (error) {
      errorHandler.handleError(error as Error, { context: 'handleCommentSubmit', taskId });
    } finally {
      setIsSubmitting(false);
    }
  };


  // Get filtered and sorted tasks
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks;

    // Apply status filter (if any statuses selected)
    if (statusFilter.length > 0) {
      filteredTasks = filteredTasks.filter(task => statusFilter.includes(task.status));
    }

    // Apply project filter (if any projects selected)
    if (projectFilter.length > 0) {
      filteredTasks = filteredTasks.filter(task => projectFilter.includes(task.project_name || ''));
    }

    // Sort by due date (ascending) then by project name
    return filteredTasks.sort((a, b) => {
      // First sort by due date (ascending)
      const dateA = a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER;
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // Then sort by project name
      const projectA = a.project_name || '';
      const projectB = b.project_name || '';
      return projectA.localeCompare(projectB);
    });
  };

  // Get unique projects for filter dropdown
  const getUniqueProjects = () => {
    const projects = tasks.map(task => task.project_name).filter(Boolean);
    return Array.from(new Set(projects)).sort();
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="p-3">
        <div className="text-center py-8 text-text-muted">Loading tasks...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-3">
        <div className="card text-sm">You are not signed in. <a className="underline" href="/signin">Sign in</a></div>
      </div>
    );
  }
  
  return (
    <div className="p-3">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-text">My Tasks</h1>
        <p className="text-xs text-text-muted">Manage all your assigned tasks</p>
      </div>

      <div className="card-standard overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2 font-medium text-text-muted">Task</th>
              <th className="text-left p-2 font-medium text-text-muted">Project</th>
              <th className="text-left p-2 font-medium text-text-muted">Status</th>
              <th className="text-left p-2 font-medium text-text-muted">Priority</th>
              <th className="text-left p-2 font-medium text-text-muted">Due Date</th>
              <th className="text-left p-2 font-medium text-text-muted">Attachments</th>
              <th className="text-left p-2 font-medium text-text-muted">Comments</th>
              <th className="text-left p-2 font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedTasks().length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-text-muted">
                  {tasks.length === 0 ? 'No tasks assigned' : 'No tasks match the current filters'}
                </td>
              </tr>
            ) : (
              getFilteredAndSortedTasks().map((task) => (
                <tr key={task.id} className="border-b border-border hover:bg-panel">
                  <td className="p-2">
                    <div className="font-medium text-text-base">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-text-muted mt-1 line-clamp-2">{task.description}</div>
                    )}
                  </td>
                  <td className="p-2 text-text-muted">{task.project_name || '-'}</td>
                  <td className="p-2">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      disabled={isSubmitting}
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} border-0`}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="BLOCKED">Blocked</option>
                      <option value="DONE">Closed</option>
                      <option value="CANCELED">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="p-2 text-text-muted">{formatDate(task.due_at)}</td>
                  <td className="p-2">
                    <AttachmentIcon
                      taskId={task.id}
                      attachmentCount={task.attachment_count || 0}
                      onClick={() => router.push(`/projects/${task.project_id}/tasks/${task.id}`)}
                    />
                  </td>
                  <td className="p-2">
                    {editingTask === task.id ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          placeholder="Add comment..."
                          className="flex-1 px-2 py-1 text-xs border border-border rounded"
                          onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit(task.id)}
                        />
                        <button
                          onClick={() => handleCommentSubmit(task.id)}
                          disabled={isSubmitting}
                          className="btn-primary text-xs px-2 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(null);
                            setEditingComment('');
                          }}
                          className="btn-secondary text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingTask(task.id)}
                        className="btn-secondary text-xs px-2 py-1"
                      >
                        Add Comment
                      </button>
                    )}
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => router.push(`/projects/${task.project_id}/tasks/${task.id}`)}
                      className="btn-primary text-xs px-2 py-1"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="p-3">
        <div className="text-center py-8 text-text-muted">Loading...</div>
      </div>
    }>
      <MyTasksPageContent />
    </Suspense>
  );
}