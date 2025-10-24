'use client';

import { useRouter } from 'next/navigation';

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

interface ChildProjectCardProps {
  project: Project;
  level: number;
  onUpdate: () => void;
  mentionCount?: number;
}

/**
 * Child project card component with hierarchical styling and access control
 */
export function ChildProjectCard({ project, level, onUpdate, mentionCount = 0 }: ChildProjectCardProps) {
  const router = useRouter();
  const indent = level * 8;
  const opacity = Math.max(0.4, 1 - (level - 1) * 0.2);

  const handleProjectClick = () => {
    if (!project.has_access) {
      return; // Do nothing for inaccessible projects
    }
    router.push(`/projects/${project.id}`);
  };

  return (
    <div 
      className={`smooth-transition group border-b border-border/20 last:border-b-0 ${
        project.has_access 
          ? 'hover:bg-hover cursor-pointer' 
          : 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
      }`}
      onClick={handleProjectClick}
      style={{ marginLeft: `${indent}px` }}
    >
      <div className="px-3 py-1 h-8 flex items-center">
        <h4 
          className={`text-sm truncate ${
            project.has_access 
              ? 'group-hover:text-primary' 
              : 'text-gray-500'
          }`}
          style={{ opacity }}
        >
          {project.name}
        </h4>
        {mentionCount > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
            {mentionCount > 99 ? '99+' : mentionCount}
          </span>
        )}
      </div>
    </div>
  );
}
