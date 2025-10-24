'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TaskBoard } from '@/components/TaskBoard';
import { ProjectMembersSidebar } from '@/components/ProjectMembersSidebar';
import { ChatButton } from '@/components/ChatButton';
import { AddTaskButton } from '@/components/AddTaskButton';
import { DragDropProvider } from '@/components/DragDropProvider';
import { BackButton } from '@/components/BackButton';
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

interface Member {
  id: string;
  name: string | null;
  email: string;
}

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

export default function ProjectTasks({ params }: { params: { projectId: string } }) {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({});
  const [loading, setLoading] = useState(true);
  const { data: session, status: sessionStatus } = useSession();

  useEffect(() => {
    if (params.projectId) {
      setProjectId(params.projectId);
    }
  }, [params.projectId]);

  // Fetch data when session becomes available
  useEffect(() => {
    if (session && projectId) {
      fetchProjectData(projectId);
    }
  }, [session, projectId]);

  const fetchProjectData = async (id: string) => {
    if (!session) {
      console.log('No session available, waiting...');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching project data for:', id);
      const [projectRes, membersRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/members`),
        fetch(`/api/projects/${id}/tasks`)
      ]);

      console.log('API responses:', { 
        project: projectRes.status, 
        members: membersRes.status, 
        tasks: tasksRes.status 
      });

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData.data.project);
      } else {
        console.error('Project API error:', await projectRes.text());
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      } else {
        console.error('Members API error:', await membersRes.text());
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        console.log('Tasks data received:', tasksData);
        setTasks(tasksData.data || {});
      } else {
        console.error('Tasks API error:', await tasksRes.text());
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
      <div className="p-3">
        <BackButton href={`/projects/${projectId}`} />
        <div className="mt-3 text-center py-8 text-text-muted">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-3">
        <div className="card-standard text-sm">You are not signed in. <a className="underline text-primary hover:text-primary/80" href="/signin">Sign in</a></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3">
        <BackButton href={`/projects/${projectId}`} />
        <div className="mt-3 text-center py-8 text-text-muted">Loading tasks...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-3">
        <BackButton href="/projects" />
        <div className="mt-3 text-center py-8 text-text-muted">Project not found</div>
      </div>
    );
  }
  
  // Group tasks by status - ensure we have a proper structure
  console.log('Tasks data:', tasks);
  const tasksByStatus = {
    OPEN: Array.isArray(tasks.OPEN) ? tasks.OPEN : [],
    IN_PROGRESS: Array.isArray(tasks.IN_PROGRESS) ? tasks.IN_PROGRESS : [],
    BLOCKED: Array.isArray(tasks.BLOCKED) ? tasks.BLOCKED : [],
    DONE: Array.isArray(tasks.DONE) ? tasks.DONE : [],
    CANCELED: Array.isArray(tasks.CANCELED) ? tasks.CANCELED : []
  };
  console.log('Tasks by status:', tasksByStatus);
  
  return (
    <div className="p-3">
      <BackButton href={`/projects/${projectId}`} />
      
      <div className="mt-3">
        <DragDropProvider>
          <div className="flex h-full">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-panel mb-3">
                <div>
                  <h1 className="page-title">{project.name}</h1>
                  <p className="text-sm text-text-muted">Task Management</p>
                </div>
                <div className="flex items-center gap-2">
                  <AddTaskButton projectId={projectId} />
                  <ChatButton projectId={projectId} unreadCount={0} />
                </div>
              </div>
              
              {/* Task Board */}
              <div className="flex-1">
                {Object.values(tasksByStatus).every(statusTasks => statusTasks.length === 0) ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-lg font-medium text-text-base mb-2">No tasks yet</div>
                      <div className="text-sm text-text-muted mb-4">Create your first task to get started</div>
                      <AddTaskButton projectId={projectId} />
                    </div>
                  </div>
                ) : (
                  <TaskBoard 
                    projectId={projectId}
                    tasksByStatus={tasksByStatus}
                    currentUserId={(session as any).user?.id || ''}
                  />
                )}
              </div>
            </div>
            
            {/* Right Sidebar - Hidden in task kanban view */}
            {/* Project members are handled by the dynamic sidebar */}
          </div>
        </DragDropProvider>
      </div>
    </div>
  );
}