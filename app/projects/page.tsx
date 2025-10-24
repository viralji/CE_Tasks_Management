'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectGrid } from '@/components/ProjectGrid';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  has_access?: boolean;
  status?: string;
  start_at?: string;
  end_at?: string;
  severity?: string;
  description?: string;
}

interface ProjectMention {
  projectId: string;
  projectName: string;
  mentionCount: number;
}

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMentions, setProjectMentions] = useState<ProjectMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const statusParam = (searchParams.get('status') || 'open') as 'open'|'closed'|'all';

  const fetchProjects = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      // Fetch projects
      const projectsResponse = await fetch(`/api/projects?status=${statusParam}`);
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
      }

      // Fetch mention data
      const mentionsResponse = await fetch('/api/chat/mentions/by-project');
      if (mentionsResponse.ok) {
        const mentionsData = await mentionsResponse.json();
        setProjectMentions(mentionsData.data.projectMentions || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
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
    fetchProjects();
  }, [session, status, statusParam]);

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
    fetchProjects();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="text-sm text-text-muted">Manage your projects and their hierarchy</p>
          </div>
        </div>
        <div className="card-standard">
          <div className="text-center py-8 text-text-muted">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="card-standard text-sm">You are not signed in. <a className="underline text-primary hover:text-primary/80" href="/signin">Sign in</a></div>
    );
  }

  const orgId = (session as any).org as string;
  
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-sm text-text-muted">Manage your projects and their hierarchy</p>
        </div>
        <Link
          href="/projects/new"
          className="btn-primary"
        >
          + New Project
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <form className="flex items-center gap-1" action="/projects" method="get">
          <select 
            name="status" 
            defaultValue={statusParam} 
            className="form-select w-auto"
          >
            <option value="open">Open Projects</option>
            <option value="closed">Closed Projects</option>
            <option value="all">All Projects</option>
          </select>
          <button 
            type="submit" 
            className="btn-primary"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Project Grid */}
      <ProjectGrid key={refreshKey} projects={projects} onUpdate={handleUpdate} projectMentions={projectMentions} />
    </div>
  );
}




