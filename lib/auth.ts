/**
 * NextAuth.js Configuration
 * 
 * Modular authentication system supporting:
 * - Google OAuth (primary)
 * - Admin credentials (backdoor)
 * - Azure AD (optional)
 * - Multi-tenant organization management
 */

import { NextAuthOptions } from 'next-auth';
import { getEnabledProviders } from './auth/providers';
import { measureQuery } from './utils/performance';
export const authOptions: NextAuthOptions = {
  providers: getEnabledProviders(),
  // Use JWT strategy for stateless authentication
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // JWT configuration
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Session and JWT callbacks for organization context
  callbacks: {
    /**
     * Sign in callback - runs when a user signs in
     * 
     * Handles user creation and organization assignment for OAuth providers.
     * For Google OAuth users, creates user record and checks organization membership.
     * 
     * @param user - User object from OAuth provider
     * @param account - Account information from OAuth provider
     * @returns true if sign in should proceed, false to deny access
     */
    async signIn({ user, account }) {
      console.log('🔐 Sign in callback:', { user: user?.email, account: account?.provider });
      
      // Handle OAuth providers (Google, Azure AD)
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        try {
          const { pool } = await import('./db');
          
          // Check if user exists
          const existingUser = await pool.query(
            'SELECT id FROM app_user WHERE primary_email = $1',
            [user.email]
          );
          
          if (existingUser.rows.length === 0) {
            // Create new user
            console.log('👤 Creating new OAuth user:', user.email);
            const newUserResult = await pool.query(`
              INSERT INTO app_user (id, name, primary_email, image, created_at, updated_at)
              VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
              RETURNING id
            `, [user.name, user.email, user.image]);
            
            // Update the user object with the database UUID
            user.id = newUserResult.rows[0].id;
            console.log('✅ New OAuth user created:', newUserResult.rows[0].id);
          } else {
            // Update user object with existing database UUID
            user.id = existingUser.rows[0].id;
            console.log('✅ Existing OAuth user found:', existingUser.rows[0].id);
          }
          
          return true;
        } catch (error) {
          console.error('❌ Error in OAuth sign in:', error);
          return false;
        }
      }
      
      // Handle admin credentials
      if (account?.provider === 'admin-credentials') {
        return true;
      }
      
      return true;
    },

    /**
     * JWT callback - runs when a JWT is created or updated
     * 
     * Adds organization context to the JWT token for multi-tenant support.
     * This ensures all subsequent requests have access to the user's organization.
     * 
     * @param token - JWT token object
     * @param user - User object from authentication
     * @param account - Account information from OAuth provider
     * @returns Updated JWT token with organization context
     */
    async jwt({ token, user, account }) {
      if (user) {
        try {
          const { pool } = await import('./db');
          
          // Ensure we have the correct user ID (database UUID)
          if (!user.id || (typeof user.id === 'string' && user.id.length > 20)) {
            const userResult = await pool.query(
              'SELECT id FROM app_user WHERE primary_email = $1',
              [user.email]
            );
            if (userResult.rows.length > 0) {
              user.id = userResult.rows[0].id;
            }
          }
          
          // Get user's organization memberships in a single query
          const userOrgsResult = await measureQuery(
            'get-user-organizations',
            () => pool.query(`
              SELECT o.id, o.name, om.role
              FROM app_user u
              JOIN organization_membership om ON u.id = om.user_id
              JOIN organization o ON om.org_id = o.id
              WHERE u.primary_email = $1
            `, [user.email])
          );
          
          const organizations = userOrgsResult.rows;
          
          // Set organization context
          if (organizations.length === 0) {
            token.needsOrgAssignment = true;
            token.organizations = [];
          } else if (organizations.length === 1) {
            token.org = organizations[0].id;
            token.organizations = organizations;
            token.needsOrgAssignment = false;
          } else {
            token.organizations = organizations;
            token.needsOrgAssignment = false;
          }
          
          // Set user context
          token.sub = user.id;
          token.isSuperAdmin = user.id === '00000000-0000-0000-0000-000000000001';
          
        } catch (error) {
          console.error('❌ Error in JWT callback:', error);
          token.needsOrgAssignment = true;
        }
      }
      
      return token;
    },
    
    /**
     * Session callback - runs when a session is checked
     * 
     * Transfers organization context from JWT token to session object.
     * This makes the organization ID available in all server-side operations.
     * 
     * @param session - Session object
     * @param token - JWT token with organization context
     * @returns Updated session with organization and user ID
     */
    async session({ session, token }) {
      if (token) {
        (session as any).org = token.org;
        (session as any).organizations = token.organizations;
        (session as any).needsOrgAssignment = token.needsOrgAssignment;
        (session as any).user.id = token.sub;
        (session as any).user.isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    signOut: '/signout',
  },
};
