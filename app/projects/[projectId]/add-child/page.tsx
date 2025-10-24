'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BackButton } from '@/components/BackButton';
import { slugify } from '@/lib/slug';

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

export default function AddChildProject({ params }: { params: { projectId: string } }) {
  const [projectId, setProjectId] = useState<string>('');
  const [parentProject, setParentProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (params.projectId) {
      setProjectId(params.projectId);
      fetchParentProject(params.projectId);
    }
  }, [params.projectId]);

  const fetchParentProject = async (id: string) => {
    if (!session) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setParentProject(data.data.project);
      }
    } catch (error) {
      console.error('Error fetching parent project:', error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    startAt: '',
    endAt: '',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !parentProject) return;

    setSaving(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: projectId,
          // Ensure child dates are within parent dates
          startAt: formData.startAt || parentProject.start_at,
          endAt: formData.endAt || parentProject.end_at
        }),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create child project');
      }
    } catch (error) {
      console.error('Error creating child project:', error);
      alert('Failed to create child project');
    } finally {
      setSaving(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name)
    }));
  };

  if (!session) {
    return (
      <div className="p-3">
        <div className="card text-sm">You are not signed in. <a className="underline" href="/signin">Sign in</a></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-3">
        <BackButton href={`/projects/${projectId}`} />
        <div className="mt-3 text-center py-8 text-text-dim">Loading parent project...</div>
      </div>
    );
  }

  if (!parentProject) {
    return (
      <div className="p-3">
        <BackButton href="/projects" />
        <div className="mt-3 text-center py-8 text-text-dim">Parent project not found</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <BackButton href={`/projects/${projectId}`} />
      
      <div className="mt-3 max-w-2xl">
        <div className="card p-3">
          <h1 className="text-lg font-bold text-text mb-3">Add Child Project</h1>
          <p className="text-xs text-text-dim mb-4">
            Adding child project under: <span className="font-medium">{parentProject.name}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-dim">Project Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-dim">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-dim">Start Date</label>
                <input
                  type="date"
                  value={formData.startAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startAt: e.target.value }))}
                  min={parentProject.start_at || undefined}
                  max={parentProject.end_at || undefined}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                />
                <div className="text-xs text-text-dim mt-1">
                  Parent: {parentProject.start_at ? new Date(parentProject.start_at).toLocaleDateString() : 'Not set'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-text-dim">End Date</label>
                <input
                  type="date"
                  value={formData.endAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, endAt: e.target.value }))}
                  min={parentProject.start_at || undefined}
                  max={parentProject.end_at || undefined}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                />
                <div className="text-xs text-text-dim mt-1">
                  Parent: {parentProject.end_at ? new Date(parentProject.end_at).toLocaleDateString() : 'Not set'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-dim">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-dim">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                >
                  <option value="PLANNING">Planning</option>
                  <option value="ACTIVE">Active</option>
                  <option value="AT_RISK">At Risk</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-dim">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
              />
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1 bg-primary text-primary-fg rounded hover:bg-primary/90 text-xs font-medium disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Child Project'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/projects/${projectId}`)}
                className="px-3 py-1 bg-subtle text-text rounded hover:bg-subtle/80 text-xs font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
