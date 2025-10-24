'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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


interface Settings {
  defaultTaskDueDays: number;
  defaultTaskPriority: string;
  autoAssignEnabled: boolean;
  notificationEnabled: boolean;
}

export default function ProjectDetail({ params }: { params: Promise<{ projectId: string }> }) {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    params.then(({ projectId }) => {
      setProjectId(projectId);
      if (session) {
        fetchProjectData(projectId);
      }
    });
  }, [params, session]);

  const fetchProjectData = async (id: string) => {
    if (!session) return;
    
    setLoading(true);
    try {
      const [projectRes, settingsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/settings`)
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData.data.project);
      } else if (projectRes.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.data || {});
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/projects');
      } else {
        const errorData = await response.json();
        alert(`Error deleting project: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <BackButton href="/projects" />
        <div className="mt-4 text-center py-8 text-text-muted">Loading session...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <div className="card-standard text-sm">You are not signed in. <a className="underline text-primary hover:text-primary/80" href="/signin">Sign in</a></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <BackButton href="/projects" />
        <div className="mt-4 text-center py-8 text-text-muted">Loading project...</div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="p-6">
        <BackButton href="/projects" />
        <div className="mt-4 card-standard text-center py-8">
          <h2 className="text-lg font-semibold text-text-base mb-2">Access Denied</h2>
          <p className="text-text-muted">You don't have permission to view this project.</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <BackButton href="/projects" />
        <div className="mt-4 text-center py-8 text-text-muted">Project not found</div>
      </div>
    );
  }
  
  const formatDate = (date: string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'PLANNING': return 'status-planning';
      case 'AT_RISK': return 'status-at-risk';
      case 'ON_HOLD': return 'status-on-hold';
      case 'COMPLETED': return 'status-completed';
      case 'CANCELED': return 'status-canceled';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'priority-critical';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <BackButton href="/projects" />
          <h1 className="page-title mt-1">{project.name}</h1>
          <p className="text-sm text-text-muted">Project Details</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/projects/${projectId}/edit`}
            className="btn-secondary"
          >
            Edit
          </Link>
          <Link
            href={`/projects/${projectId}/settings`}
            className="btn-secondary"
          >
            Settings
          </Link>
          <Link
            href={`/projects/${projectId}/add-child`}
            className="btn-primary"
          >
            +Child
          </Link>
          <Link
            href={`/projects/${projectId}/tasks`}
            className="btn-primary"
          >
            Tasks
          </Link>
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

      <div className="space-y-3">
        {/* Project Information */}
        <div className="space-y-3">
          {/* Basic Info */}
          <div className="card-standard">
            <h2 className="section-header">Project Information</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Status:</span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getStatusColor(project.status || 'ACTIVE')}`}>
                    {project.status || 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Severity:</span>
                  <span className={`px-1 py-0.5 rounded text-xs ${getSeverityColor(project.severity || 'MEDIUM')}`}>
                    {project.severity || 'MEDIUM'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Start:</span>
                  <span className="text-xs text-text-base">{formatDate(project.start_at || null)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">End:</span>
                  <span className="text-xs text-text-base">{formatDate(project.end_at || null)}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-1">
                <span className="text-xs text-text-muted">Desc:</span>
                <span className="text-xs text-text-base">
                  {project.description || 'No description provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Project Settings */}
          <div className="card-standard">
            <h2 className="section-header">Project Settings</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Due Days:</span>
                  <span className="text-xs text-text-base">{settings?.defaultTaskDueDays || 'N/A'} days</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Priority:</span>
                  <span className="text-xs text-text-base">{settings?.defaultTaskPriority || 'N/A'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Auto Assign:</span>
                  <span className="text-xs text-text-base">{settings?.autoAssignEnabled ? 'On' : 'Off'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-text-muted">Notifications:</span>
                  <span className="text-xs text-text-base">{settings?.notificationEnabled ? 'On' : 'Off'}</span>
                </div>
              </div>
            </div>
          </div>
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
                <h3 className="text-lg font-medium text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete "{project.name}"? This action cannot be undone.
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
                onClick={handleDeleteProject}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


