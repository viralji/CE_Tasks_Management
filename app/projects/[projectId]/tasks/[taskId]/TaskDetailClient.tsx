'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AttachmentList } from '@/components/AttachmentList';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
}

interface User {
  id: string;
  name: string;
  primary_email: string;
}

interface StatusHistoryItem {
  from_status: string;
  to_status: string;
  changed_at: string;
  changed_by_name?: string;
}

interface Attachment {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
  download_url?: string;
}

interface TaskDetailClientProps {
  task: Task;
  project: Project;
  comments: Comment[];
  assignedUsers: User[];
  availableUsers: User[];
  statusHistory: StatusHistoryItem[];
  projectId: string;
  taskId: string;
}

export function TaskDetailClient({ 
  task, 
  project, 
  comments: initialComments, 
  assignedUsers: initialAssignedUsers, 
  availableUsers, 
  statusHistory,
  projectId, 
  taskId 
}: TaskDetailClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [assignedUsers, setAssignedUsers] = useState(initialAssignedUsers);
  const [newComment, setNewComment] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>(
    initialAssignedUsers.map(u => u.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskStatus, setTaskStatus] = useState(task.status);
  const [taskPriority, setTaskPriority] = useState(task.priority);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch attachments on component mount
  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const fetchAttachments = async () => {
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data.data.attachments || []);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      await fetchAttachments(); // Refresh attachments list
    } else {
      const error = await response.json();
      const errorMessage = error.error || error.message || 'Failed to upload attachment';
      const details = error.details ? ` | Details: ${error.details}` : '';
      throw new Error(`${errorMessage}${details}`);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      await fetchAttachments(); // Refresh attachments list
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete attachment');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.data, ...prev]);
        setNewComment('');
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignUsers = async (userIds: string[]) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: userIds,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedUsers(data.data || []);
        setSelectedUsers(userIds);
      } else {
        console.error('Failed to assign users');
      }
    } catch (error) {
      console.error('Error assigning users:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        setTaskStatus(newStatus);
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priority: newPriority,
        }),
      });

      if (response.ok) {
        setTaskPriority(newPriority);
      } else {
        console.error('Failed to update priority');
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push(`/projects/${projectId}/tasks`);
      } else {
        const errorData = await response.json();
        alert(`Error deleting task: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error deleting task');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'URGENT': return 'priority-critical';
      default: return 'priority-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'status-active';
      case 'IN_PROGRESS': return 'status-planning';
      case 'BLOCKED': return 'status-at-risk';
      case 'DONE': return 'status-completed';
      case 'CANCELED': return 'status-canceled';
      default: return 'status-active';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <a 
            href={`/projects/${projectId}/tasks`}
            className="text-text-muted hover:text-text-base smooth-transition"
          >
            ← Back
          </a>
          <h1 className="page-title">{task.title}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            Request Closure
          </button>
          <button className="btn-primary">
            Edit Task
          </button>
          {(session as any)?.user?.isSuperAdmin && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Task Details - Single Section with 3 Columns */}
        <div className="card-standard space-y-3">
          <h2 className="section-header">Task Details</h2>
          
          {/* 3 Column Layout */}
          <div className="grid grid-cols-3 gap-4">
            {/* Column 1: Basic Info */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-muted mb-2">Basic Information</h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Due Date:</span>
                  <span className="text-text-base">{formatDate(task.due_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Created:</span>
                  <span className="text-text-base">{formatDate(task.created_at)}</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-text-muted">Description:</span>
                  <span className="text-text-base">{task.description || 'No description provided'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Created By:</span>
                  <span className="text-text-base">{task.created_by_user_name || task.created_by_user_email || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-text-muted">Project:</span>
                  <span className="text-text-base">{project?.name || 'Unknown Project'}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Status History */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-muted mb-2">Status History</h3>
              <div className="space-y-1 text-xs">
                <div className="text-text-muted">
                  <span className="font-medium">Created:</span> {new Date(task.created_at).toISOString().split('T')[0]}
                </div>
                <div className="text-text-muted">
                  <span className="font-medium">Last Updated:</span> {new Date(task.updated_at).toISOString().split('T')[0]}
                </div>
                <div className="text-text-muted">
                  <span className="font-medium">Current:</span> 
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-1 ${getStatusColor(taskStatus)}`}>
                    {taskStatus}
                  </span>
                </div>
                {/* Status change history - showing actual changes (latest first) */}
                <div className="space-y-1">
                  <div className="text-text-muted font-medium">Changes:</div>
                  {statusHistory.length > 0 ? (
                    [...statusHistory].reverse().map((change, index) => (
                      <div key={index} className="text-text-muted text-xs">
                        {new Date(change.changed_at).toISOString().split('T')[0]} - {change.from_status} → {change.to_status}
                        {change.changed_by_name && (
                          <span className="text-text-muted ml-1">({change.changed_by_name})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-text-muted text-xs">
                      {new Date(task.created_at).toISOString().split('T')[0]} - Created as {taskStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: Status & Priority */}
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-text-muted mb-2">Status & Priority</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted whitespace-nowrap">Status:</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={isSubmitting}
                    className="form-select text-xs w-24"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="DONE">Closed</option>
                    <option value="CANCELED">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted whitespace-nowrap">Priority:</label>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(taskPriority)}`}>
                    {taskPriority}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignees Section - Compact */}
        <div className="card-standard space-y-2">
          <h3 className="section-header">Assignees</h3>
          
          {/* Compact checkbox grid */}
          <div className="grid grid-cols-4 gap-1">
            {availableUsers.map((user) => (
              <label key={user.id} className="flex items-center gap-1 p-1 hover:bg-panel rounded cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selectedUsers, user.id]
                      : selectedUsers.filter(id => id !== user.id);
                    setSelectedUsers(newSelected);
                    handleAssignUsers(newSelected);
                  }}
                  disabled={isSubmitting}
                  className="rounded"
                />
                <div className="w-4 h-4 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="truncate">{user.name}</span>
              </label>
            ))}
          </div>
          {availableUsers.length === 0 && (
            <div className="text-xs text-text-muted">No project members available</div>
          )}
        </div>

        {/* Attachments Section */}
        <div className="card-standard space-y-3">
          <h3 className="section-header">Attachments</h3>
          <AttachmentList
            taskId={taskId}
            attachments={attachments}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
            onRefresh={fetchAttachments}
          />
        </div>

        {/* Comments Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="section-header">Comments</h3>
          
          {/* Comments List - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-64">
            {comments.length === 0 ? (
              <div className="text-xs text-text-muted">No comments yet</div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-2 bg-panel rounded border border-border">
                  <div className="text-xs text-text-muted mb-1">
                    {comment.created_by_user_name || comment.created_by_user_email || 'Unknown'} • {new Date(comment.created_at).toISOString().split('T')[0]}
                  </div>
                  <div className="text-xs text-text-base">{comment.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="form-input flex-1"
              disabled={isSubmitting}
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </form>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{task.title}"? This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
