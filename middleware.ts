import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // If no token, allow access to public pages only
    if (!token) {
      if (pathname === '/' || pathname.startsWith('/signin') || pathname.startsWith('/api/auth')) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/signin', req.url));
    }

    // For authenticated users, redirect root path to dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // For authenticated users, check their organization status
    // Check if user needs organization assignment
    if (token.needsOrgAssignment) {
      if (pathname !== '/pending-access') {
        return NextResponse.redirect(new URL('/pending-access', req.url));
      }
      return NextResponse.next();
    }

    // Check if user needs to select organization
    if (token.organizations && token.organizations.length > 1 && !token.org) {
      if (pathname !== '/select-organization') {
        return NextResponse.redirect(new URL('/select-organization', req.url));
      }
      return NextResponse.next();
    }

    // Check if user has no organizations and is not on pending page
    if (token.organizations && token.organizations.length === 0) {
      if (pathname !== '/pending-access') {
        return NextResponse.redirect(new URL('/pending-access', req.url));
      }
      return NextResponse.next();
    }

    // Allow access to admin pages only for super admins
    if (pathname.startsWith('/admin')) {
      if (!token.isSuperAdmin) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public pages for unauthenticated users
        if (pathname === '/' || pathname.startsWith('/signin') || pathname.startsWith('/api/auth')) {
          return true;
        }
        
        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};