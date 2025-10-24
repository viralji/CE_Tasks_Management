import NextAuth from 'next-auth';

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
