'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BackButton } from '@/components/BackButton';

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
  autoAssignUserId: string | null;
  notificationEnabled: boolean;
}

interface Member {
  id: string;
  name: string;
  primary_email: string;
  role: string;
}

interface User {
  id: string;
  name: string;
  primary_email: string;
}

export default function ProjectSettings({ params }: { params: { projectId: string } }) {
  const [projectId, setProjectId] = useState<string>('');
  const [project, setProject] = useState<Project | null>(null);
  const [settings, setSettings] = useState<Settings>({
    defaultTaskDueDays: 7,
    defaultTaskPriority: 'MEDIUM',
    autoAssignEnabled: false,
    autoAssignUserId: null,
    notificationEnabled: true
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('VIEWER');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (params.projectId) {
      setProjectId(params.projectId);
      fetchProjectData(params.projectId);
    }
  }, [params.projectId]);

  const fetchProjectData = async (id: string) => {
    if (!session) return;
    
    setLoading(true);
    try {
      const [projectRes, settingsRes, membersRes, usersRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/settings`),
        fetch(`/api/projects/${id}/members`),
        fetch(`/api/projects/${id}/members?available=true`)
      ]);

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        setProject(projectData.data.project);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.data || settings);
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setAvailableUsers(usersData.data || []);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        router.push(`/projects/${projectId}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole })
      });

      if (response.ok) {
        // Refresh members list
        const membersRes = await fetch(`/api/projects/${projectId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.data || []);
        }
        setSelectedUserId('');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh members list
        const membersRes = await fetch(`/api/projects/${projectId}/members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.data || []);
        }
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
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
        <div className="mt-3 text-center py-8 text-text-dim">Loading settings...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-3">
        <BackButton href="/projects" />
        <div className="mt-3 text-center py-8 text-text-dim">Project not found</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <BackButton href={`/projects/${projectId}`} />
      
      <div className="mt-3 max-w-2xl">
        <div className="card p-3">
          <h1 className="text-lg font-bold text-text mb-3">Project Settings</h1>
          <p className="text-xs text-text-dim mb-4">
            Configure default settings for: <span className="font-medium">{project.name}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Defaults */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text">Task Defaults</h2>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-dim">Default Task Due Days</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.defaultTaskDueDays}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      defaultTaskDueDays: parseInt(e.target.value) || 7 
                    }))}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                  />
                  <div className="text-xs text-text-dim mt-1">Days after task creation</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-dim">Default Task Priority</label>
                  <select
                    value={settings.defaultTaskPriority}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultTaskPriority: e.target.value }))}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
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
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text">Auto Assignment</h2>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoAssignEnabled"
                  checked={settings.autoAssignEnabled}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    autoAssignEnabled: e.target.checked 
                  }))}
                  className="w-4 h-4 text-primary bg-background border-border rounded"
                />
                <label htmlFor="autoAssignEnabled" className="text-xs text-text">
                  Enable automatic task assignment
                </label>
              </div>

              {settings.autoAssignEnabled && (
                <div>
                  <label className="text-xs font-medium text-text-dim">Auto-assign to User</label>
                  <input
                    type="text"
                    placeholder="User ID or email"
                    value={settings.autoAssignUserId || ''}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      autoAssignUserId: e.target.value || null 
                    }))}
                    className="w-full px-2 py-1 text-xs border border-border rounded bg-background text-text"
                  />
                  <div className="text-xs text-text-dim mt-1">
                    Leave empty to disable auto-assignment
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text">Notifications</h2>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notificationEnabled"
                  checked={settings.notificationEnabled}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    notificationEnabled: e.target.checked 
                  }))}
                  className="w-4 h-4 text-primary bg-background border-border rounded"
                />
                <label htmlFor="notificationEnabled" className="text-xs text-text">
                  Enable project notifications
                </label>
              </div>
            </div>

            {/* Member Management */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-text">Project Members</h2>
              
              {/* Current Members */}
              <div className="space-y-2">
                <div className="text-xs text-text-dim">Current members ({members.length})</div>
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 bg-panel rounded border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-fg flex items-center justify-center text-xs font-medium">
                        {member.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-text">{member.name}</div>
                        <div className="text-xs text-text-dim">{member.primary_email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-dim capitalize">{member.role.toLowerCase()}</span>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Member */}
              <div className="border-t border-border pt-3">
                <div className="text-xs text-text-dim mb-2">Add new member</div>
                <div className="flex gap-2">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-text"
                  >
                    <option value="">Select user...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.primary_email})
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-2 py-1 text-xs border border-border rounded bg-background text-text"
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddMember}
                    disabled={!selectedUserId}
                    className="px-3 py-1 text-xs bg-primary text-primary-fg rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-1 bg-primary text-primary-fg rounded hover:bg-primary/90 text-xs font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
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
