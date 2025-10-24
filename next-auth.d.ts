import NextAuth from 'next-auth/next';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      isSuperAdmin?: boolean;
    };
    org?: string;
    organizations?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    needsOrgAssignment?: boolean;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    isSuperAdmin?: boolean;
  }

  interface JWT {
    org?: string;
    organizations?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    needsOrgAssignment?: boolean;
    isSuperAdmin?: boolean;
  }
}
