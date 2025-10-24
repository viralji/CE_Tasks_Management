'use client';

import { useState, useEffect } from 'react';
import { errorHandler } from '@/lib/utils/errorHandler';
import { TASK_STATUS } from '@/lib/constants';

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
}

export function TaskFiltersSidebar() {
  const [statusFilter, setStatusFilter] = useState<string[]>([
    TASK_STATUS.OPEN, 
    TASK_STATUS.IN_PROGRESS, 
    TASK_STATUS.BLOCKED, 
    TASK_STATUS.CANCELED
  ]);
  const [projectFilter, setProjectFilter] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Fetch tasks to get unique projects
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks/my-tasks');
        if (response.ok) {
          const data = await response.json();
          const tasksData = data.data || [];
          setTasks(tasksData);
          
          // Set all unique projects as selected by default
          const uniqueProjects = Array.from(new Set(tasksData.map(task => task.project_name).filter(Boolean))).sort();
          setProjectFilter(uniqueProjects);
          setInitialized(true);
        }
      } catch (error) {
        errorHandler.handleError(error as Error, { context: 'TaskFiltersSidebar.fetchTasks' });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Get unique projects for filter dropdown
  const getUniqueProjects = () => {
    const projects = tasks.map(task => task.project_name).filter(Boolean);
    return Array.from(new Set(projects)).sort();
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

  // Update the main page filters when these change
  useEffect(() => {
    // Only dispatch events after initialization
    if (initialized) {
      window.dispatchEvent(new CustomEvent('taskFiltersChanged', {
        detail: { statusFilter, projectFilter }
      }));
    }
  }, [statusFilter, projectFilter, initialized]);

  if (loading) {
    return (
      <div className="sidebar-right flex flex-col">
        <div className="p-3 border-b border-border">
          <h2 className="section-header">Filters</h2>
        </div>
        <div className="flex-1 p-3 text-center text-text-muted">
          <div className="text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-right flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="section-header">Filters</h2>
      </div>
      
      <div className="flex-1 p-3 space-y-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">Status</h4>
          <div className="space-y-1">
            {[
              { value: 'OPEN', label: 'Open' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'DONE', label: 'Closed' },
              { value: 'CANCELED', label: 'Cancelled' }
            ].map(status => (
              <label key={status.value} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setStatusFilter([...statusFilter, status.value]);
                    } else {
                      setStatusFilter(statusFilter.filter(s => s !== status.value));
                    }
                  }}
                  className="rounded"
                />
                <span>{status.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Project Filter */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-text-muted">Project</h4>
          <div className="space-y-1">
            {getUniqueProjects().map(project => (
              <label key={project} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={projectFilter.includes(project)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setProjectFilter([...projectFilter, project]);
                    } else {
                      setProjectFilter(projectFilter.filter(p => p !== project));
                    }
                  }}
                  className="rounded"
                />
                <span className="truncate">{project}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Results Count */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-text-muted">
            Showing {getFilteredAndSortedTasks().length} of {tasks.length} tasks
          </div>
        </div>
      </div>
    </div>
  );
}
