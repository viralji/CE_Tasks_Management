'use client';

import { useState, useEffect } from 'react';
import { ProjectEditModal } from './ProjectEditModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { AddChildProjectModal } from './AddChildProjectModal';
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

interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ProjectDetailModal({ project, isOpen, onClose, onUpdate }: ProjectDetailModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setProjectData(project);
      fetchProjectDetails();
    }
  }, [isOpen, project]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const [membersRes, settingsRes] = await Promise.all([
        fetch(`/api/projects/${project.id}/members`),
        fetch(`/api/projects/${project.id}/settings`)
      ]);

      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.data || []);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.data || {});
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isOpen || !projectData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/50">
          <div>
            <h2 className="text-2xl font-bold text-text">{projectData.name}</h2>
            <p className="text-sm text-text-dim">Project Details & Management</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3 py-1.5 text-sm bg-subtle hover:bg-subtle/80 text-text rounded-lg border border-border/50"
            >
              Edit
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 text-sm bg-subtle hover:bg-subtle/80 text-text rounded-lg border border-border/50"
            >
              Settings
            </button>
            <button
              onClick={() => setShowAddChildModal(true)}
              className="px-3 py-1.5 text-sm bg-primary text-primary-fg rounded-lg hover:bg-primary/90"
            >
              + Child
            </button>
            <button
              onClick={onClose}
              className="p-2 text-text-dim hover:text-text hover:bg-subtle rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8 text-text-dim">Loading project details...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Project Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="bg-subtle/30 rounded-lg p-4 border border-border/30">
                  <h3 className="text-lg font-semibold mb-4 text-text">Project Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-dim">Status</label>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(projectData.status || 'ACTIVE')}`}>
                            {projectData.status || 'ACTIVE'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-dim">Severity</label>
                        <div className="mt-1">
                          <span className={`px-2 py-1 rounded text-sm ${getSeverityColor(projectData.severity || 'MEDIUM')}`}>
                            {projectData.severity || 'MEDIUM'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-dim">Start Date</label>
                        <div className="mt-1 text-sm text-text">{formatDate(projectData.start_at || null)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-dim">End Date</label>
                        <div className="mt-1 text-sm text-text">{formatDate(projectData.end_at || null)}</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-text-dim">Description</label>
                      <div className="mt-1 text-sm text-text">
                        {projectData.description || 'No description provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Settings */}
                {settings && (
                  <div className="bg-subtle/30 rounded-lg p-4 border border-border/30">
                    <h3 className="text-lg font-semibold mb-4 text-text">Project Settings</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-text-dim">Default Task Due Days</label>
                          <div className="mt-1 text-sm text-text">{settings.defaultTaskDueDays} days</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-text-dim">Default Task Priority</label>
                          <div className="mt-1 text-sm text-text">{settings.defaultTaskPriority}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-text-dim">Auto Assignment</label>
                          <div className="mt-1 text-sm text-text">
                            {settings.autoAssignEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-text-dim">Notifications</label>
                          <div className="mt-1 text-sm text-text">
                            {settings.notificationEnabled ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Project Members & Actions */}
              <div className="space-y-6">
                <div className="bg-subtle/30 rounded-lg p-4 border border-border/30">
                  <h3 className="text-lg font-semibold mb-4 text-text">Project Members</h3>
                  <div className="space-y-2">
                    {members.length > 0 ? (
                      members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 py-2">
                          <div className="w-8 h-8 bg-primary text-primary-fg rounded-full flex items-center justify-center text-sm font-medium">
                            {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-text">
                              {member.name || 'Unknown User'}
                            </div>
                            <div className="text-xs text-text-dim truncate">
                              {member.email}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-text-dim">No members assigned</div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-subtle/30 rounded-lg p-4 border border-border/30">
                  <h3 className="text-lg font-semibold mb-4 text-text">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link
                      href={`/projects/${projectData.id}/tasks`}
                      className="block w-full px-4 py-2 text-sm bg-primary text-primary-fg rounded-lg hover:bg-primary/90 text-center"
                    >
                      View Tasks
                    </Link>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="w-full px-4 py-2 text-sm bg-subtle hover:bg-subtle/80 text-text rounded-lg border border-border/50"
                    >
                      Edit Project
                    </button>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      className="w-full px-4 py-2 text-sm bg-subtle hover:bg-subtle/80 text-text rounded-lg border border-border/50"
                    >
                      Project Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProjectEditModal
        project={projectData}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          setShowEditModal(false);
          onUpdate();
        }}
      />

      <ProjectSettingsModal
        projectId={projectData.id}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={() => {
          setShowSettingsModal(false);
          fetchProjectDetails();
        }}
      />

      <AddChildProjectModal
        parentProject={projectData}
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSave={() => {
          setShowAddChildModal(false);
          onUpdate();
        }}
      />
    </div>
  );
}
