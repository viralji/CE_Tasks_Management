'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SignOutConfirmationProps {
  onCancel?: () => void;
  className?: string;
}

export default function SignOutConfirmation({ onCancel, className = '' }: SignOutConfirmationProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className={`bg-panel border border-border rounded-lg p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text-base">Sign Out</h2>
        <p className="text-sm text-text-muted">
          Are you sure you want to sign out of your account?
        </p>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="bg-subtle border border-border rounded-md p-4 space-y-2">
          <div className="flex items-center space-x-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {(session.user.name || session.user.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-base truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-text-muted truncate">
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Organization Info */}
      {(session as any)?.org && (
        <div className="bg-subtle border border-border rounded-md p-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span className="text-sm text-text-muted">
              Currently in: <span className="font-medium text-text-base">{(session as any).organizations?.find((org: any) => org.id === (session as any).org)?.name || 'Organization'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2.5 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
        >
          {isSigningOut ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Signing out...</span>
            </div>
          ) : (
            'Sign Out'
          )}
        </button>
        
        <button
          onClick={handleCancel}
          disabled={isSigningOut}
          className="w-full bg-subtle hover:bg-border text-text-base font-medium py-2.5 px-4 rounded-md border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-text-muted">
            You can sign back in anytime to continue using NoClick.
          </p>
        </div>
    </div>
  );
}
