'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Organization {
  id: string;
  name: string;
  role: string;
}

export default function SelectOrganizationPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<string>('');

  const organizations = (session as any)?.organizations || [];

  useEffect(() => {
    // If user has no organizations or only one, redirect appropriately
    if (organizations.length === 0) {
      router.push('/pending-access');
    } else if (organizations.length === 1) {
      // Auto-select the only organization
      handleOrgSelect(organizations[0].id);
    }
  }, [organizations, router]);

  const handleOrgSelect = async (orgId: string) => {
    setLoading(true);
    try {
      // Update session with selected organization
      await update({
        ...session,
        org: orgId
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error selecting organization:', error);
    } finally {
      setLoading(false);
    }
  };

  if (organizations.length === 0) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-sm w-full bg-panel border border-border rounded-lg p-5 space-y-4">
          <div className="text-center">
            <h1 className="text-lg font-semibold">No Organizations</h1>
            <p className="text-sm text-text-muted">Redirecting...</p>
          </div>
        </div>
      </main>
    );
  }

  if (organizations.length === 1) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-sm w-full bg-panel border border-border rounded-lg p-5 space-y-4">
          <div className="text-center">
            <h1 className="text-lg font-semibold">Setting up your account</h1>
            <p className="text-sm text-text-muted">Please wait...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-panel border border-border rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Select Organization</h1>
          <p className="text-sm text-text-muted mt-1">
            You have access to multiple organizations. Please choose which one to work with.
          </p>
        </div>

        <div className="space-y-3">
          {organizations.map((org: Organization) => (
            <button
              key={org.id}
              onClick={() => handleOrgSelect(org.id)}
              disabled={loading}
              className="w-full p-4 text-left border border-border rounded-md hover:bg-subtle focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text-base">{org.name}</h3>
                  <p className="text-sm text-text-muted capitalize">{org.role.toLowerCase()}</p>
                </div>
                <div className="text-primary">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-text-muted">
            You can switch organizations later from the main menu.
          </p>
        </div>
      </div>
    </main>
  );
}
