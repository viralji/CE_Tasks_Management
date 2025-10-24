'use client';

import { usePathname } from 'next/navigation';
import { DynamicRightSidebar } from './DynamicRightSidebar';

interface ProjectLayoutClientProps {
  orgId: string;
}

export function ProjectLayoutClient({ orgId }: ProjectLayoutClientProps) {
  const pathname = usePathname();
  
  // Extract projectId and taskId from pathname
  const pathParts = pathname.split('/');
  const projectIndex = pathParts.indexOf('projects');
  const projectId = projectIndex !== -1 && pathParts[projectIndex + 1] ? pathParts[projectIndex + 1] : undefined;
  
  const taskIndex = pathParts.indexOf('tasks');
  const taskId = taskIndex !== -1 && pathParts[taskIndex + 1] ? pathParts[taskIndex + 1] : undefined;

  return (
    <DynamicRightSidebar 
      orgId={orgId} 
      projectId={projectId} 
      taskId={taskId} 
    />
  );
}
