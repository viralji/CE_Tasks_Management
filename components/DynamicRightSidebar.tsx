'use client';

import { usePathname } from 'next/navigation';
import { ProjectMembersSidebar } from './ProjectMembersSidebar';
import { TaskFiltersSidebar } from './TaskFiltersSidebar';

interface DynamicRightSidebarProps {
  orgId: string;
  projectId?: string;
  taskId?: string;
}

export function DynamicRightSidebar({ orgId, projectId, taskId }: DynamicRightSidebarProps) {
  const pathname = usePathname();

  // Always show project members when we have a project
  if (projectId) {
    return <ProjectMembersSidebar projectId={projectId} />;
  }

  // Show task filters when on /tasks page
  if (pathname === '/tasks') {
    return <TaskFiltersSidebar />;
  }

  // Default - show minimal info
  return <div className="sidebar-right flex flex-col">
    <div className="p-3 border-b border-border">
      <h2 className="section-header">Navigation</h2>
      <p className="text-xs text-text-muted">Select a project to view members</p>
    </div>
    <div className="flex-1 p-3 text-center text-text-muted">
      <div className="text-xs">No project selected</div>
    </div>
  </div>;
}
