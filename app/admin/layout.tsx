/**
 * Admin Layout
 * 
 * @fileoverview Layout for admin pages with navigation and back button
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/signin');
  }

  // Check if user is super admin
  const isSuperAdmin = (session as any).user?.isSuperAdmin === true;
  if (!isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-bg">
      {/* Left Sidebar - Navigation */}
      <aside className="sidebar-left p-4 space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-semibold text-text-base">NoClick Admin</span>
          </div>
          <div className="text-xs text-text-muted">System Administrator</div>
        </div>
        
        <nav className="space-y-1">
          <Link 
            href="/dashboard" 
            className="nav-item"
          >
            ← Back to Dashboard
          </Link>
          <Link 
            href="/admin/organizations"
            className="nav-item"
          >
            Organizations
          </Link>
          <Link 
            href="/admin/users"
            className="nav-item"
          >
            User Management
          </Link>
          <Link 
            href="/admin/data-management"
            className="nav-item"
          >
            Data Management
          </Link>
          <a 
            href="/signout"
            className="nav-item"
          >
            Sign Out
          </a>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-bg p-4">
        {children}
      </main>
    </div>
  );
}
