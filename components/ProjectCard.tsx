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

interface ProjectCardProps {
  project: Project;
  level?: number;
  onUpdate: () => void;
  mentionCount?: number;
}

/**
 * Individual project card component with access control styling
 */
export function ProjectCard({ project, level = 0, onUpdate, mentionCount = 0 }: ProjectCardProps) {
  const router = useRouter();

  const handleProjectClick = () => {
    if (!project.has_access) {
      return; // Do nothing for inaccessible projects
    }
    router.push(`/projects/${project.id}`);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const userId = e.dataTransfer.getData('userId');
    if (!userId) return;

    try {
      const response = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        console.log('Member added successfully');
        onUpdate();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add member');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  return (
    <div 
      className={`border-b smooth-transition group ${
        project.has_access 
          ? 'bg-panel hover:bg-hover hover:border-primary/30 cursor-pointer border-border' 
          : 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
      }`}
      onClick={handleProjectClick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="px-3 py-2 h-8 flex items-center relative">
        <h3 className={`text-sm font-semibold truncate project-name ${
          project.has_access 
            ? 'text-text-base group-hover:text-primary' 
            : 'text-gray-500'
        }`}>
          {project.name}
        </h3>
        {mentionCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {mentionCount > 99 ? '99+' : mentionCount}
          </span>
        )}
      </div>
    </div>
  );
}
