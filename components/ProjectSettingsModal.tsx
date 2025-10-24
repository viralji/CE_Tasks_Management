'use client';

import { useState, useEffect } from 'react';
import { ProjectSettings } from '@/lib/data/projects';

interface ProjectSettingsModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Partial<ProjectSettings>) => void;
}

export function ProjectSettingsModal({ projectId, isOpen, onClose, onSave }: ProjectSettingsModalProps) {
  const [settings, setSettings] = useState<ProjectSettings>({
    defaultTaskDueDays: 2,
    defaultTaskPriority: 'MEDIUM',
    autoAssignEnabled: false,
    notificationEnabled: true,
    notificationOnTaskCreate: true,
    notificationOnTaskComplete: true,
    notificationOnComment: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchSettings();
    }
  }, [isOpen, projectId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching project settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Error saving project settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProjectSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Project Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">Loading settings...</div>
          ) : (
            <>
              {/* Task Defaults */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Task Defaults</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Task Due Days</label>
                    <input
                      type="number"
                      min="0"
                      value={settings.defaultTaskDueDays}
                      onChange={(e) => handleChange('defaultTaskDueDays', parseInt(e.target.value) || 0)}
                      className="w-full bg-subtle border border-border rounded px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Default Task Priority</label>
                    <select
                      value={settings.defaultTaskPriority}
                      onChange={(e) => handleChange('defaultTaskPriority', e.target.value)}
                      className="w-full bg-subtle border border-border rounded px-3 py-2"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Auto Assignment */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Auto Assignment</h3>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoAssignEnabled"
                    checked={settings.autoAssignEnabled}
                    onChange={(e) => handleChange('autoAssignEnabled', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoAssignEnabled" className="text-sm">
                    Enable auto-assignment for new tasks
                  </label>
                </div>
                
                {settings.autoAssignEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Auto-assign to User</label>
                    <input
                      type="text"
                      placeholder="User ID or email"
                      value={settings.autoAssignUserId || ''}
                      onChange={(e) => handleChange('autoAssignUserId', e.target.value)}
                      className="w-full bg-subtle border border-border rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <h3 className="text-md font-medium">Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="notificationEnabled"
                      checked={settings.notificationEnabled}
                      onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="notificationEnabled" className="text-sm">
                      Enable notifications
                    </label>
                  </div>
                  
                  {settings.notificationEnabled && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="notificationOnTaskCreate"
                          checked={settings.notificationOnTaskCreate}
                          onChange={(e) => handleChange('notificationOnTaskCreate', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="notificationOnTaskCreate" className="text-sm">
                          Notify on task creation
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="notificationOnTaskComplete"
                          checked={settings.notificationOnTaskComplete}
                          onChange={(e) => handleChange('notificationOnTaskComplete', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="notificationOnTaskComplete" className="text-sm">
                          Notify on task completion
                        </label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="notificationOnComment"
                          checked={settings.notificationOnComment}
                          onChange={(e) => handleChange('notificationOnComment', e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="notificationOnComment" className="text-sm">
                          Notify on comments
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
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
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary text-primary-fg rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
