'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  status?: string;
  start_at?: string;
  end_at?: string;
  severity?: string;
  description?: string;
}

interface TaskCounts {
  OPEN: number;
  IN_PROGRESS: number;
  BLOCKED: number;
  DONE: number;
  CANCELED: number;
}

interface TasksProjectListProps {
  projects: Project[];
}

export function TasksProjectList({ projects }: TasksProjectListProps) {
  const [projectTaskCounts, setProjectTaskCounts] = useState<Map<string, TaskCounts>>(new Map());

  useEffect(() => {
    // Fetch task counts for each project
    const fetchTaskCounts = async () => {
      const counts = new Map<string, TaskCounts>();
      
      for (const project of projects) {
        try {
          const response = await fetch(`/api/projects/${project.id}/tasks`);
          if (response.ok) {
            const data = await response.json();
            const tasks = data.data || {};
            counts.set(project.id, {
              OPEN: tasks.OPEN?.length || 0,
              IN_PROGRESS: tasks.IN_PROGRESS?.length || 0,
              BLOCKED: tasks.BLOCKED?.length || 0,
              DONE: tasks.DONE?.length || 0,
              CANCELED: tasks.CANCELED?.length || 0
            });
          }
        } catch (error) {
          console.error(`Error fetching task counts for project ${project.id}:`, error);
          counts.set(project.id, {
            OPEN: 0,
            IN_PROGRESS: 0,
            BLOCKED: 0,
            DONE: 0,
            CANCELED: 0
          });
        }
      }
      
      setProjectTaskCounts(counts);
    };

    fetchTaskCounts();
  }, [projects]);

  const getTotalTasks = (projectId: string): number => {
    const counts = projectTaskCounts.get(projectId);
    if (!counts) return 0;
    return counts.OPEN + counts.IN_PROGRESS + counts.BLOCKED + counts.DONE + counts.CANCELED;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PLANNING': return 'bg-blue-100 text-blue-800';
      case 'AT_RISK': return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-4 text-text-dim">
        <div className="text-sm font-medium mb-1">No projects found</div>
        <div className="text-xs">Create projects first to manage tasks</div>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {projects.map((project) => {
        const counts = projectTaskCounts.get(project.id);
        const totalTasks = getTotalTasks(project.id);
        
        return (
          <div key={project.id} className="card p-2 hover:shadow-lg transition-shadow">
            {/* Project Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-text truncate">{project.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(project.status || 'ACTIVE')}`}>
                    {project.status || 'ACTIVE'}
                  </span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getSeverityColor(project.severity || 'MEDIUM')}`}>
                    {project.severity || 'MEDIUM'}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Description */}
            {project.description && (
              <p className="text-xs text-text-dim mb-2 line-clamp-1">
                {project.description}
              </p>
            )}

            {/* Task Counts */}
            <div className="space-y-1 mb-2">
              <div className="text-xs font-medium text-text">Tasks</div>
              {counts ? (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-dim">Open:</span>
                    <span className="font-medium">{counts.OPEN}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Progress:</span>
                    <span className="font-medium">{counts.IN_PROGRESS}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Blocked:</span>
                    <span className="font-medium">{counts.BLOCKED}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Done:</span>
                    <span className="font-medium">{counts.DONE}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-text-dim">Loading...</div>
              )}
            </div>

              {/* Total Tasks */}
              <div className="text-xs text-text-dim mb-2">
                Total: <span className="font-medium text-text">{totalTasks}</span>
              </div>

              {/* Action Button */}
              <Link
                href={`/projects/${project.id}/tasks`}
                className="w-full btn btn-sm bg-primary text-primary-fg hover:bg-primary/90 text-center block"
              >
                View Tasks
              </Link>
          </div>
        );
      })}
    </div>
  );
}
