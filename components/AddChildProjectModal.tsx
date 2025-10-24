'use client';

import { useState, useEffect } from 'react';
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

interface AddChildProjectModalProps {
  parentProject: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function AddChildProjectModal({ parentProject, isOpen, onClose, onSave }: AddChildProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    startAt: '',
    endAt: '',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    description: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Pre-fill with parent's dates if available
      setFormData({
        name: '',
        slug: '',
        startAt: parentProject.start_at ? new Date(parentProject.start_at).toISOString().split('T')[0] : '',
        endAt: parentProject.end_at ? new Date(parentProject.end_at).toISOString().split('T')[0] : '',
        severity: parentProject.severity || 'MEDIUM',
        status: 'ACTIVE',
        description: ''
      });
    }
  }, [isOpen, parentProject]);

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
          parentId: parentProject.id,
          startAt: formData.startAt || null,
          endAt: formData.endAt || null,
          severity: formData.severity,
          status: formData.status,
          description: formData.description || null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create child project');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error creating child project:', error);
      alert(`Failed to create child project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDateRange = () => {
    if (!parentProject.start_at) return 'No parent dates set';
    const start = new Date(parentProject.start_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = parentProject.end_at 
      ? new Date(parentProject.end_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Ongoing';
    return `${start} - ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">Add Child Project</h2>
            <p className="text-sm text-text-dim">Parent: {parentProject.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Parent Date Constraints */}
          {parentProject.start_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-800 mb-1">Parent Date Constraints</div>
              <div className="text-sm text-blue-700">
                Child project dates must be within: {formatDateRange()}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-subtle border border-border rounded px-3 py-2"
                placeholder="Child project name"
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
                placeholder="child-project-slug"
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
                min={parentProject.start_at ? new Date(parentProject.start_at).toISOString().split('T')[0] : undefined}
                max={parentProject.end_at ? new Date(parentProject.end_at).toISOString().split('T')[0] : undefined}
                className="w-full bg-subtle border border-border rounded px-3 py-2"
              />
              {parentProject.start_at && (
                <div className="text-xs text-text-dim mt-1">
                  Must be after {new Date(parentProject.start_at).toLocaleDateString()}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                min={parentProject.start_at ? new Date(parentProject.start_at).toISOString().split('T')[0] : undefined}
                max={parentProject.end_at ? new Date(parentProject.end_at).toISOString().split('T')[0] : undefined}
                className="w-full bg-subtle border border-border rounded px-3 py-2"
              />
              {parentProject.end_at && (
                <div className="text-xs text-text-dim mt-1">
                  Must be before {new Date(parentProject.end_at).toLocaleDateString()}
                </div>
              )}
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
              rows={3}
              className="w-full bg-subtle border border-border rounded px-3 py-2"
              placeholder="Child project description..."
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded hover:bg-subtle"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.slug}
            className="px-4 py-2 text-sm bg-primary text-primary-fg rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Child Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
