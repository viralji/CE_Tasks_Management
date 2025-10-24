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

export default function ProjectEdit({ params }: { params: Promise<{ projectId: string }> }) {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    startAt: '',
    endAt: '',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    description: ''
  });

  useEffect(() => {
    params.then(({ projectId }) => {
      setProjectId(projectId);
      fetchProject(projectId);
    });
  }, [params]);

  const fetchProject = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        const projectData = data.data.project;
        setProject(projectData);
        setFormData({
          name: projectData.name || '',
          slug: projectData.slug || '',
          startAt: projectData.start_at ? new Date(projectData.start_at).toISOString().split('T')[0] : '',
          endAt: projectData.end_at ? new Date(projectData.end_at).toISOString().split('T')[0] : '',
          severity: projectData.severity || 'MEDIUM',
          status: projectData.status || 'ACTIVE',
          description: projectData.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-generate slug from name
    if (name === 'name' && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: slugify(value) }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          startAt: formData.startAt || null,
          endAt: formData.endAt || null,
          severity: formData.severity,
          status: formData.status,
          description: formData.description || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <BackButton href={`/projects/${projectId}`} />
        <div className="mt-4 text-center py-8 text-text-dim">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <BackButton href="/projects" />
        <div className="mt-4 text-center py-8 text-text-dim">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <BackButton href={`/projects/${projectId}`} />
          <h1 className="text-2xl font-bold text-text mt-2">Edit Project</h1>
          <p className="text-sm text-text-dim">Update project details and settings</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <div className="card">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Slug *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-subtle border border-border rounded px-3 py-2"
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
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-subtle border border-border rounded px-3 py-2"
                placeholder="Project description..."
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => router.push(`/projects/${projectId}`)}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-subtle"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !formData.name || !formData.slug}
          className="px-4 py-2 text-sm bg-primary text-primary-fg rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
