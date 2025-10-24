'use client';

import { ProjectCard } from './ProjectCard';
import { ChildProjectCard } from './ChildProjectCard';

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
  has_access?: boolean;
}

interface ProjectMention {
  projectId: string;
  projectName: string;
  mentionCount: number;
}

interface ProjectGridProps {
  projects: Project[];
  onUpdate: () => void;
  projectMentions?: ProjectMention[];
}

/**
 * Clean, modular project grid component with hierarchical display
 */
export function ProjectGrid({ projects, onUpdate, projectMentions = [] }: ProjectGridProps) {
  // Helper function to get mention count for a project
  const getMentionCount = (projectId: string): number => {
    const mention = projectMentions.find(m => m.projectId === projectId);
    return mention ? mention.mentionCount : 0;
  };

  // Organize projects into hierarchy
  const rootProjects: Project[] = [];
  const childrenMap = new Map<string, Project[]>();

  projects.forEach(project => {
    if (project.parent_id) {
      // This is a child project
      if (!childrenMap.has(project.parent_id)) {
        childrenMap.set(project.parent_id, []);
      }
      childrenMap.get(project.parent_id)!.push(project);
    } else {
      // This is a root project
      rootProjects.push(project);
    }
  });

  // Sort children by name
  childrenMap.forEach((children) => {
    children.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Sort root projects by name
  rootProjects.sort((a, b) => a.name.localeCompare(b.name));

  const renderProjectCard = (project: Project, level: number = 0) => {
    const children = childrenMap.get(project.id) || [];

    return (
      <div key={project.id} className="mb-2">
        {/* Parent Project Card with Children Container */}
        <div className="card-standard border-2 border-border hover:border-primary/30 hover:shadow-md smooth-transition">
          {/* Parent Project */}
          <ProjectCard 
            project={project} 
            level={level} 
            onUpdate={onUpdate} 
            mentionCount={getMentionCount(project.id)} 
          />

          {/* Children - Recursively render all levels */}
          {children.length > 0 && (
            <div className="bg-subtle/20">
              {children.map((child) => renderChildProject(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChildProject = (project: Project, level: number) => {
    const children = childrenMap.get(project.id) || [];

    return (
      <div key={project.id}>
        <ChildProjectCard 
          project={project} 
          level={level} 
          onUpdate={onUpdate} 
          mentionCount={getMentionCount(project.id)} 
        />
        
        {/* Recursively render children */}
        {children.length > 0 && (
          <div className="bg-subtle/10">
            {children.map((child) => renderChildProject(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (rootProjects.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        <div className="text-lg font-medium mb-2">No projects found</div>
        <div className="text-sm">Create your first project to get started</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {rootProjects.map(project => renderProjectCard(project, 0))}
    </div>
  );
}
