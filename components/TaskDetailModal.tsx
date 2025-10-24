'use client';
import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  description?: string;
  due_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

interface TaskDetailModalProps {
  task: Task;
  projectId: string;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700'
};

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Closed' },
  { value: 'CANCELED', label: 'Cancelled' }
];

export function TaskDetailModal({ task, projectId, currentUserId, onClose, onUpdate }: TaskDetailModalProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [statusLog, setStatusLog] = useState<any[]>([]);
  const [closureRequests, setClosureRequests] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueAt: task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : ''
  });

  const isCreator = task.created_by === currentUserId;

  useEffect(() => {
    // Fetch task details
    Promise.all([
      fetch(`/api/tasks/${task.id}/assign`).then(res => res.json()),
      fetch(`/api/tasks/${task.id}/log`).then(res => res.json()),
      fetch(`/api/tasks/${task.id}/close`).then(res => res.json()),
      fetch(`/api/tasks/${task.id}/comments`).then(res => res.json()).catch(() => ({ data: [] }))
    ]).then(([assignRes, logRes, closeRes, commentsRes]) => {
      setAssignments(assignRes.data || []);
      setStatusLog(logRes.data || []);
      setClosureRequests(closeRes.data || []);
      setComments(commentsRes.data || []);
    }).catch(console.error);
  }, [task.id]);

  const handleStatusChange = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        alert('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onUpdate();
        setIsEditing(false);
      } else {
        alert('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClosure = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' })
      });

      if (response.ok) {
        alert('Closure request submitted');
        onUpdate();
      } else {
        alert('Failed to request closure');
      }
    } catch (error) {
      console.error('Error requesting closure:', error);
      alert('Error requesting closure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTask = async (status: 'DONE' | 'CANCELED') => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', status })
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        alert('Failed to close task');
      }
    } catch (error) {
      console.error('Error closing task:', error);
      alert('Error closing task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        setNewComment('');
        // Refresh comments
        const commentsRes = await fetch(`/api/tasks/${task.id}/comments`).then(res => res.json());
        setComments(commentsRes.data || []);
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    // Use UTC methods to avoid timezone issues and ensure consistent formatting
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[98vh] overflow-hidden shadow-2xl">
        {/* Header - Reduced to 25% height */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-gray-700 bg-gray-800">
          <h2 className="text-lg font-semibold text-white">Task Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(98vh-120px)]">
          {/* Main content area - NOT scrollable */}
          <div className="flex-1 p-4 bg-gray-900">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column - Task details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20">Title:</label>
                  {isEditing ? (
                    <input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    />
                  ) : (
                    <span className="text-white text-sm">{task.title}</span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20 mt-1">Description:</label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm flex-1">{task.description || 'No description'}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20">Priority:</label>
                  {isEditing ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20">Due Date:</label>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={formData.dueAt}
                      onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                      className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-sm"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">{task.due_at ? formatDate(task.due_at) : 'No due date'}</span>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <label className="text-sm font-medium text-gray-300 w-20 mt-1">Assignees:</label>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs"
                      >
                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">
                          {assignment.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-white text-xs">{assignment.name}</span>
                      </div>
                    ))}
                    {assignments.length === 0 && (
                      <span className="text-gray-400 text-xs">No assignees</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Status log and actions */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Status History</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {statusLog.map((log, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <span className="text-white">
                            {log.from_status ? `${log.from_status} → ${log.to_status}` : `Created as ${log.to_status}`}
                          </span>
                          <div className="text-xs text-gray-400">
                            by {log.changed_by_name || 'System'} • {formatDate(log.changed_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {statusLog.length === 0 && (
                      <p className="text-gray-400 text-xs">No status changes</p>
                    )}
                  </div>
                </div>

                {closureRequests.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Closure Requests</label>
                    <div className="space-y-1">
                      {closureRequests.map((request, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs p-2 bg-yellow-900/30 rounded">
                          <div className="w-4 h-4 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-medium">
                            {request.requested_by_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <span className="text-white">Requested by {request.requested_by_name}</span>
                            <div className="text-xs text-gray-400">{formatDate(request.requested_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Comments and History Section - ONLY scrollable area */}
          <div className="border-t border-gray-700 bg-gray-800 flex-1 flex flex-col min-h-0">
            <div className="p-3 flex-shrink-0">
              <h3 className="text-sm font-medium text-white mb-2">Comments & History</h3>
              
              {/* Add Comment */}
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-white text-xs placeholder-gray-400"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-xs"
                  >
                    {isSubmitting ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Scrollable History - Takes remaining space */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2 min-h-0">
                {/* Comments */}
                {comments.map((comment, index) => (
                  <div key={`comment-${index}`} className="flex gap-2 p-2 bg-gray-700 rounded text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {comment.author_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">{comment.author_name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-200">{comment.content}</p>
                    </div>
                  </div>
                ))}
                
                {/* Status Changes */}
                {statusLog.map((log, index) => (
                  <div key={`log-${index}`} className="flex gap-2 p-2 bg-blue-900/30 rounded text-xs">
                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">
                          Status changed from {log.from_status || 'New'} to {log.to_status}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(log.changed_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400">by {log.changed_by_name || 'System'}</p>
                    </div>
                  </div>
                ))}
                
                {/* Closure Requests */}
                {closureRequests.map((request, index) => (
                  <div key={`request-${index}`} className="flex gap-2 p-2 bg-yellow-900/30 rounded text-xs">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-white">
                          Closure requested by {request.requested_by_name}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(request.requested_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {comments.length === 0 && statusLog.length === 0 && closureRequests.length === 0 && (
                  <div className="text-center text-gray-400 text-xs py-4">
                    No comments or activity yet
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Footer - Reduced to 25% height */}
        <div className="flex items-center justify-between px-6 py-2 border-t border-gray-700 bg-gray-800">
          <div className="flex gap-2">
            {isCreator ? (
              <>
                <button
                  onClick={() => handleCloseTask('DONE')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Mark Closed
                </button>
                <button
                  onClick={() => handleCloseTask('CANCELED')}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Cancel Task
                </button>
              </>
            ) : (
              <button
                onClick={handleRequestClosure}
                disabled={isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                Request Closure
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-fg rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-subtle transition-colors"
                >
                  Edit
                </button>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isSubmitting}
                  className="px-3 py-2 bg-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
