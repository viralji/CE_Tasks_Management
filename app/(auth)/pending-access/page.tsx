'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PendingAccessPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleContactAdmin = () => {
    // You can customize this to open email client or show contact info
    window.location.href = 'mailto:admin@noclick.com?subject=NoClick Access Request&body=Please grant me access to the NoClick project management system.';
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md w-full bg-panel border border-border rounded-lg p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NoClick
            </span>
          </div>
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">Access Pending</h1>
          <p className="text-sm text-text-muted">
            Your NoClick account is waiting for administrator approval.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-subtle border border-border rounded-md p-4">
            <h3 className="font-medium text-text-base mb-2">Account Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="text-text-muted">Name:</span> {session?.user?.name}</p>
              <p><span className="text-text-muted">Email:</span> {session?.user?.email}</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• An administrator will review your account</li>
              <li>• You'll be assigned to one or more organizations</li>
              <li>• You'll receive access to the system features</li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleContactAdmin}
            className="w-full bg-primary text-primary-fg rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Contact Administrator
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-subtle border border-border text-text-base rounded-md px-4 py-2 text-sm font-medium hover:bg-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-text-muted">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
