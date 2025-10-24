# Google OAuth Setup Guide for NoClick

This guide will help you set up Google OAuth authentication for NoClick - the smarter alternative to ClickUp.

## Prerequisites

- Google account
- Access to Google Cloud Console (free)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `CE Tasks Management` (or your preferred name)
4. Click "Create"
5. Wait for project creation (usually takes 1-2 minutes)

## Step 2: Enable Google OAuth API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google+ API" or "Google Identity"
3. Click on "Google+ API" and click "Enable"
4. Also enable "Google OAuth2 API" if available

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields:
     - App name: `CE Tasks Management`
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip scopes for now, click "Save and Continue"
   - Add test users if needed, click "Save and Continue"
   - Review and click "Back to Dashboard"

4. Now create OAuth client ID:
   - Application type: "Web application"
   - Name: `CE Tasks Web Client`
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"

## Step 4: Get Your Credentials

1. After creation, you'll see a popup with your credentials
2. Copy the **Client ID** and **Client Secret**
3. Keep these secure - never commit them to version control

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to your app

## Production Setup

For production deployment:

1. Update the OAuth consent screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Add your production domain
   - Submit for verification if needed

2. Add production redirect URI:
   - Go to "APIs & Services" → "Credentials"
   - Edit your OAuth client
   - Add: `https://yourdomain.com/api/auth/callback/google`

3. Update environment variables in production:
   ```env
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   ```

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Check that your redirect URI exactly matches what's configured in Google Console
   - Ensure no trailing slashes or extra characters

2. **"access_denied" error**
   - User denied permission - this is normal
   - Check OAuth consent screen configuration

3. **"invalid_client" error**
   - Check that Client ID and Secret are correct
   - Ensure environment variables are loaded properly

4. **"unauthorized_client" error**
   - Check that the OAuth client is configured for web application type
   - Verify redirect URIs are properly set

### Getting Help

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google Cloud Console Help](https://cloud.google.com/docs)

## Security Notes

- Never commit OAuth credentials to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
- Set up proper CORS policies for production

## Cost Information

- Google OAuth is completely free
- No usage limits for standard OAuth flows
- No charges for authentication requests
- Only pay for Google Cloud services you explicitly enable (OAuth is not one of them)
