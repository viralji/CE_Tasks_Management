'use client';

import { useState } from 'react';
import { ProjectEditModal } from './ProjectEditModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { AddChildProjectModal } from './AddChildProjectModal';

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

interface ProjectTreeNodeProps {
  project: Project;
  children: Project[];
  level: number;
  onUpdate: () => void;
}

export function ProjectTreeNode({ project, children, level, onUpdate }: ProjectTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);

  const hasChildren = children.length > 0;
  const indent = level * 20;

  const formatDateRange = () => {
    if (!project.start_at) return '';
    const start = new Date(project.start_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const end = project.end_at 
      ? new Date(project.end_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Ongoing';
    return `${start} - ${end}`;
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

  return (
    <div className="select-none">
      <div 
        className="flex items-center py-2 px-3 hover:bg-subtle rounded-lg group"
        style={{ paddingLeft: `${indent + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-4 h-4 flex items-center justify-center text-text-dim hover:text-text"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {/* Project Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-text truncate">{project.name}</div>
            <div className="text-xs text-text-dim flex items-center gap-2 mt-1">
              <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(project.status || 'ACTIVE')}`}>
                {project.status || 'ACTIVE'}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${getSeverityColor(project.severity || 'MEDIUM')}`}>
                {project.severity || 'MEDIUM'}
              </span>
              {project.start_at && (
                <span className="text-text-dim">📅 {formatDateRange()}</span>
              )}
            </div>
            {project.description && (
              <div className="text-xs text-text-dim mt-1 line-clamp-1">
                {project.description}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowEditModal(true)}
            className="px-2 py-1 text-xs text-text-dim hover:text-text hover:bg-subtle rounded"
            title="Edit Project"
          >
            Edit
          </button>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-2 py-1 text-xs text-text-dim hover:text-text hover:bg-subtle rounded"
            title="Project Settings"
          >
            Settings
          </button>
          <button
            onClick={() => setShowAddChildModal(true)}
            className="px-2 py-1 text-xs text-primary hover:text-primary/80 hover:bg-subtle rounded"
            title="Add Child Project"
          >
            + Child
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {children.map((child) => (
            <ProjectTreeNode
              key={child.id}
              project={child}
              children={[]} // This will be populated by the parent component
              level={level + 1}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectEditModal
        project={project}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onUpdate}
      />

      <ProjectSettingsModal
        projectId={project.id}
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSave={onUpdate}
      />

      <AddChildProjectModal
        parentProject={project}
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSave={onUpdate}
      />
    </div>
  );
}
