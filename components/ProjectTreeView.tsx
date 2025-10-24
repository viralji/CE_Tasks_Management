'use client';

import { useState, useEffect } from 'react';
import { ProjectTreeNode } from './ProjectTreeNode';

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

interface ProjectTreeViewProps {
  projects: Project[];
  onUpdate: () => void;
}

export function ProjectTreeView({ projects, onUpdate }: ProjectTreeViewProps) {
  const [projectMap, setProjectMap] = useState<Map<string, Project>>(new Map());
  const [childrenMap, setChildrenMap] = useState<Map<string, Project[]>>(new Map());
  const [rootProjects, setRootProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Build project map and children map
    const newProjectMap = new Map<string, Project>();
    const newChildrenMap = new Map<string, Project[]>();
    const newRootProjects: Project[] = [];

    // First pass: create project map
    projects.forEach(project => {
      newProjectMap.set(project.id, project);
    });

    // Second pass: build children map and find roots
    projects.forEach(project => {
      if (project.parent_id) {
        // This is a child project
        if (!newChildrenMap.has(project.parent_id)) {
          newChildrenMap.set(project.parent_id, []);
        }
        newChildrenMap.get(project.parent_id)!.push(project);
      } else {
        // This is a root project
        newRootProjects.push(project);
      }
    });

    // Sort children by name
    newChildrenMap.forEach((children, parentId) => {
      children.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Sort root projects by name
    newRootProjects.sort((a, b) => a.name.localeCompare(b.name));

    setProjectMap(newProjectMap);
    setChildrenMap(newChildrenMap);
    setRootProjects(newRootProjects);
  }, [projects]);

  const getChildrenForProject = (projectId: string): Project[] => {
    return childrenMap.get(projectId) || [];
  };

  const renderProjectWithChildren = (project: Project, level: number = 0): JSX.Element => {
    const children = getChildrenForProject(project.id);
    
    return (
      <ProjectTreeNode
        key={project.id}
        project={project}
        children={children}
        level={level}
        onUpdate={onUpdate}
      />
    );
  };

  if (rootProjects.length === 0) {
    return (
      <div className="text-center py-12 text-text-dim">
        <div className="text-lg font-medium mb-2">No projects found</div>
        <div className="text-sm">Create your first project to get started</div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootProjects.map(project => renderProjectWithChildren(project, 0))}
    </div>
  );
}
