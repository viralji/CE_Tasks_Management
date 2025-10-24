import type { ReactNode } from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DynamicRightSidebar } from '@/components/DynamicRightSidebar';
import { ProjectLayoutClient } from '@/components/ProjectLayoutClient';
import { ProjectsLinkWithBadge } from '@/components/ProjectsLinkWithBadge';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  const orgId = session ? (session as any).org as string : '';
  
  // Fetch organization name and user name
  let orgName = 'Workspace';
  let userName = '';
  if (orgId && session) {
    try {
      const { pool } = await import('@/lib/db');
      const client = await pool.connect();
      try {
        // Get organization name
        const orgResult = await client.query('SELECT name FROM organization WHERE id = $1', [orgId]);
        if (orgResult.rows.length > 0) {
          orgName = orgResult.rows[0].name;
        }
        
        // Get user name (handle super admin case)
        const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
        if (isSuperAdmin) {
          userName = 'System Administrator';
        } else {
          const userResult = await client.query('SELECT name FROM app_user WHERE id = $1', [(session as any).user?.id]);
          if (userResult.rows.length > 0) {
            userName = userResult.rows[0].name;
          }
        }
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error fetching organization/user name:', error);
    }
  }

  return (
    <div className="flex h-screen bg-bg">
      {/* Left Sidebar - Navigation - Fixed Width */}
      <aside className="sidebar-left p-4 space-y-4 text-sm">
        <div className="space-y-2">
          <div className="font-semibold text-text-base text-lg">{orgName}</div>
          <OrganizationSwitcher />
        </div>
        {userName && (
          <div className="text-xs text-text-muted">{userName}</div>
        )}
               <nav className="space-y-1">
                 <Link className="nav-item" href="/tasks">
                   My Tasks
                 </Link>
                 <ProjectsLinkWithBadge />
                 <Link className="nav-item" href="/dashboard">
                   Overview
                 </Link>
                 <Link className="nav-item" href="/admin/organizations">
                   Admin
                 </Link>
                <a className="nav-item" href="/signout">
                  Sign Out
                </a>
               </nav>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-bg p-4">
        {children}
      </main>
      
      {/* Right Sidebar - Dynamic based on page - Fixed Width */}
      {orgId && <ProjectLayoutClient orgId={orgId} />}
    </div>
  );
}