/**
 * TaskCard Component
 * 
 * A compact, clickable card component for displaying tasks in the kanban board.
 * Shows only the task title for a clean, minimal interface.
 * 
 * @fileoverview Compact task card for kanban board
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

'use client';

/**
 * Task interface definition
 */
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

/**
 * Props for TaskCard component
 */
interface TaskCardProps {
  /** Task data to display */
  task: Task;
  /** Click handler for task selection */
  onClick: () => void;
  /** Current user ID (for future use) */
  currentUserId: string;
}

/**
 * TaskCard Component
 * 
 * Renders a compact task card that displays only the task title.
 * Designed for the kanban board where space is at a premium.
 * 
 * @param props - Component props
 * @returns JSX element representing the task card
 */
export function TaskCard({ task, onClick, currentUserId }: TaskCardProps) {
  return (
    <div
      className="card-standard cursor-pointer hover:border-primary/50 smooth-transition p-2"
      onClick={() => {
        console.log('Task card clicked:', task.title);
        onClick();
      }}
    >
      <h4 className="text-sm font-medium text-text-base">{task.title}</h4>
    </div>
  );
}
