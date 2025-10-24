'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface OrganizationSwitcherProps {
  className?: string;
}

export default function OrganizationSwitcher({ className = '' }: OrganizationSwitcherProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const organizations = (session as any)?.organizations || [];
  const currentOrgId = (session as any)?.org;
  const currentOrg = organizations.find((org: Organization) => org.id === currentOrgId);

  // Don't show switcher if user has only one organization or no organizations
  if (organizations.length <= 1) {
    return null;
  }

  const handleOrgSwitch = async (orgId: string) => {
    setLoading(true);
    try {
      // Update session with new organization
      await update({
        ...session,
        org: orgId
      });
      
      // Reload the page to update all components
      router.refresh();
    } catch (error) {
      console.error('Error switching organization:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-text-base bg-subtle border border-border rounded-md hover:bg-border focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <span className="truncate max-w-32">
          {currentOrg?.name || 'Select Organization'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-1 w-64 bg-panel border border-border rounded-md shadow-lg z-20">
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                Switch Organization
              </div>
              
              {organizations.map((org: Organization) => (
                <button
                  key={org.id}
                  onClick={() => handleOrgSwitch(org.id)}
                  disabled={loading}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-subtle focus:outline-none focus:bg-subtle disabled:opacity-50 ${
                    org.id === currentOrgId ? 'bg-primary/10 text-primary' : 'text-text-base'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-text-muted capitalize">{org.role.toLowerCase()}</div>
                    </div>
                    {org.id === currentOrgId && (
                      <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
