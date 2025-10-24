'use client';

import { useState, useEffect } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_at: string;
  created_at: string;
}

interface TaskDetailsSidebarProps {
  projectId?: string;
  taskId?: string;
}

export function TaskDetailsSidebar({ projectId, taskId }: TaskDetailsSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId]);

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        const allTasks = Object.values(data.data || {}).flat();
        setTasks(allTasks as Task[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'BLOCKED': return 'bg-red-100 text-red-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-80 border-l border-border bg-panel flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Task Details</h2>
        <p className="text-xs text-text-dim">Project tasks overview</p>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-center py-4 text-text-dim">
            <div className="text-xs">Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-4 text-text-dim">
            <div className="text-xs">No tasks found</div>
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-2 bg-subtle/50 hover:bg-subtle/80 rounded text-xs cursor-pointer group"
              >
                <div className="font-medium text-text truncate mb-1">
                  {task.title}
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                {task.due_at && (
                  <div className="text-text-dim text-xs">
                    Due: {new Date(task.due_at).toISOString().split('T')[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
