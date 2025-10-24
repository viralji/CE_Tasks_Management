'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';

function SignInPageContent() {
  const sp = useSearchParams();
  const org = sp.get('org') ?? '';
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignIn = async () => {
    setLoading(true);
    try {
      await signIn('admin-credentials', { 
        email: 'admin', 
        password: 'admin',
        callbackUrl: '/' 
      });
    } catch (error) {
      console.error('Admin sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-sm w-full bg-panel border border-border rounded-lg p-5 space-y-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NoClick
            </h1>
          </div>
          <p className="text-sm text-text-muted">
            {org ? `Organization: ${org}` : 'Sign in to your account'}
          </p>
        </div>
        
        <div className="space-y-3">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Admin Access */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-panel px-2 text-text-muted">Admin Access</span>
            </div>
          </div>
          
          <button
            onClick={handleAdminSignIn}
            disabled={loading}
            className="w-full bg-subtle border border-border rounded-md px-4 py-2 text-sm font-medium text-text-base hover:bg-border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Admin Access'}
          </button>
        </div>
        
        <p className="text-xs text-text-muted text-center">
          New users will need administrator approval to access the system.
        </p>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen grid place-items-center p-6">
        <div className="max-w-sm w-full bg-panel border border-border rounded-lg p-5 space-y-3">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <div className="text-center py-4 text-text-muted text-xs">Loading...</div>
        </div>
      </main>
    }>
      <SignInPageContent />
    </Suspense>
  );
}


