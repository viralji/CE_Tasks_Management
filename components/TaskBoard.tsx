'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskCard } from './TaskCard';

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

interface TasksByStatus {
  OPEN: Task[];
  IN_PROGRESS: Task[];
  BLOCKED: Task[];
  DONE: Task[];
  CANCELED: Task[];
}

interface TaskBoardProps {
  projectId: string;
  tasksByStatus: TasksByStatus;
  currentUserId: string;
}

const STATUS_COLORS = {
  OPEN: 'status-active',
  IN_PROGRESS: 'status-planning',
  BLOCKED: 'status-at-risk',
  DONE: 'status-completed',
  CANCELED: 'status-canceled'
};

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Closed',
  CANCELED: 'Cancelled'
};

export function TaskBoard({ projectId, tasksByStatus, currentUserId }: TaskBoardProps) {
  const router = useRouter();

  const handleTaskClick = (task: Task) => {
    console.log('TaskBoard: Task clicked:', task.title);
    // Navigate to task detail page instead of opening modal
    router.push(`/projects/${projectId}/tasks/${task.id}`);
  };

  const handleTaskUpdate = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  // Ensure tasksByStatus is defined and has the expected structure
  const safeTasksByStatus = tasksByStatus || {
    OPEN: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: [],
    CANCELED: []
  };

  return (
    <>
      <div className="flex gap-6 h-full">
        {Object.entries(safeTasksByStatus).map(([status, tasks]) => (
          <div key={status} className="flex-1 min-w-0">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-text-muted mb-1">
                {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
              </h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
                {tasks.length} tasks
              </div>
            </div>
            
            <div className="space-y-2 min-h-96">
              {tasks.map((task: Task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => handleTaskClick(task)}
                  currentUserId={currentUserId}
                />
              ))}
              
            </div>
          </div>
        ))}
      </div>

    </>
  );
}
