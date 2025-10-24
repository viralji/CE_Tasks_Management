'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BackButton } from '@/components/BackButton';
import { slugify } from '@/lib/slug';

export default function NewProject() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parentId: '',
    startAt: '',
    endAt: '',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    description: ''
  });

  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Fetch available projects for parent selection
    fetch('/api/projects?status=all')
      .then(res => res.json())
      .then(data => setProjects(data.data || []))
      .catch(console.error);
  }, []);

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
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          parentId: formData.parentId || null,
          startAt: formData.startAt || null,
          endAt: formData.endAt || null,
          severity: formData.severity,
          status: formData.status,
          description: formData.description || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const data = await response.json();
      router.push(`/projects/${data.data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <BackButton href="/projects" />
          <h1 className="text-2xl font-bold text-text mt-2">Create New Project</h1>
          <p className="text-sm text-text-dim">Set up a new project with its details and settings</p>
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
                  placeholder="Enter project name"
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
                  placeholder="project-slug"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Parent Project (Optional)</label>
              <select
                name="parentId"
                value={formData.parentId}
                onChange={handleChange}
                className="w-full bg-subtle border border-border rounded px-3 py-2"
              >
                <option value="">No parent project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-dim mt-1">
                Select a parent project to inherit members and create a hierarchical structure
              </p>
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
          onClick={() => router.push('/projects')}
          className="px-4 py-2 text-sm border border-border rounded hover:bg-subtle"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !formData.name || !formData.slug}
          className="px-4 py-2 text-sm bg-primary text-primary-fg rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  );
}
