export default function Landing() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-2xl w-full bg-panel border border-border rounded-lg p-8 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NoClick
            </h1>
          </div>
          <p className="text-lg text-text-muted">
            The smarter alternative to ClickUp
          </p>
          <p className="text-text-muted text-sm max-w-md mx-auto">
            AI-powered project management that works the way you think. 
            No endless clicking, no complexity - just results.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">Lightning Fast</h3>
            <p className="text-xs text-text-muted">No more waiting, no more clicking</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">AI-Powered</h3>
            <p className="text-xs text-text-muted">Smart automation and insights</p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">Team Focused</h3>
            <p className="text-xs text-text-muted">Built for collaboration</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/signin" className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
            Get Started Free
          </a>
          <a href="/admin/organizations" className="px-6 py-3 rounded-lg border border-border text-text-base font-medium hover:bg-subtle transition-colors">
            Admin Access
          </a>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-border">
          <p className="text-xs text-text-muted">
            The future of project management is here. NoClick.
          </p>
        </div>
      </div>
    </main>
  );
}


