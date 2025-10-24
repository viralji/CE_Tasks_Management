# NoClick Authentication System Documentation

## Overview

NoClick uses a modular authentication system built on NextAuth.js with support for:

- **Google OAuth** (Primary authentication method)
- **Admin Credentials** (Backdoor access for administrators)
- **Azure AD** (Optional enterprise integration)
- **Multi-tenant Organization Management**

## Architecture

### Core Components

```
lib/
├── auth.ts                    # Main NextAuth configuration
├── auth/
│   └── providers.ts           # Modular provider configurations
└── utils/
    ├── auth-helpers.ts         # Authentication utilities
    ├── validation.ts          # Input validation and sanitization
    ├── api-wrapper.ts         # API route wrappers
    ├── db-helpers.ts          # Database query helpers
    └── performance.ts         # Performance monitoring
```

### Authentication Flow

```mermaid
graph TD
    A[User visits app] --> B{Authenticated?}
    B -->|No| C[Redirect to /signin]
    B -->|Yes| D{Has organizations?}
    C --> E[Google OAuth]
    E --> F[Create/Update user in DB]
    F --> G[Check organization membership]
    G --> D
    D -->|No| H[Redirect to /pending-access]
    D -->|One| I[Auto-select organization]
    D -->|Multiple| J[Redirect to /select-organization]
    I --> K[Dashboard]
    J --> L[User selects organization]
    L --> K
    H --> M[Admin assigns to organization]
    M --> K
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Azure AD (Optional)
AZURE_AD_CLIENT_ID=your-azure-client-id
AZURE_AD_CLIENT_SECRET=your-azure-client-secret
AZURE_AD_TENANT_ID=your-azure-tenant-id
```

### Google OAuth Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Google+ API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`

4. **Copy Credentials**
   - Copy Client ID and Client Secret
   - Add to your `.env.local` file

## API Endpoints

### Authentication Endpoints

- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin` - Sign in with provider
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/switch-organization` - Switch active organization

### Admin Endpoints

- `GET /api/admin/users` - List all users
- `POST /api/admin/users/[userId]/organizations` - Assign user to organizations
- `DELETE /api/admin/users/[userId]/organizations` - Remove user from all organizations
- `GET /api/organizations` - List all organizations

## Database Schema

### Users Table (`app_user`)

```sql
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  primary_email VARCHAR(255) UNIQUE NOT NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Organizations Table (`organization`)

```sql
CREATE TABLE organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Organization Membership (`organization_membership`)

```sql
CREATE TABLE organization_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organization(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'MEMBER',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);
```

## Security Features

### Input Validation

- **Email validation** using Zod schemas
- **UUID validation** for all ID parameters
- **SQL injection protection** via parameterized queries
- **XSS protection** via input sanitization

### Rate Limiting

- **API rate limiting** (100 requests per 15 minutes)
- **Per-IP tracking** for abuse prevention
- **Configurable limits** for different endpoints

### Authentication Security

- **JWT tokens** with 30-day expiration
- **Secure session management** via NextAuth.js
- **CSRF protection** built into NextAuth.js
- **Admin-only endpoints** with role-based access

## Performance Optimizations

### Database Optimizations

- **Connection pooling** via pg-pool
- **Query caching** for frequently accessed data
- **Optimized queries** with proper indexing
- **Transaction management** for data consistency

### Application Optimizations

- **Performance monitoring** for all database queries
- **Caching layer** for organization data
- **Lazy loading** of user data
- **Efficient session management**

## Error Handling

### Authentication Errors

```typescript
// User not authenticated
{ error: 'Unauthorized', status: 401 }

// Insufficient permissions
{ error: 'Forbidden', status: 403 }

// Invalid input data
{ error: 'Invalid request data', status: 400, details: [...] }
```

### Database Errors

- **Connection errors** are retried automatically
- **Transaction rollbacks** on failures
- **Graceful degradation** when services are unavailable

## Monitoring and Logging

### Performance Metrics

- **Query execution times** tracked automatically
- **Slow query detection** (queries > 500ms)
- **API response times** monitored
- **Error rates** tracked per endpoint

### Logging

- **Authentication events** logged with user context
- **Database operations** logged with performance metrics
- **Error tracking** with stack traces
- **Security events** logged for audit trail

## Deployment Considerations

### Production Setup

1. **Environment Variables**
   - Use secure, randomly generated secrets
   - Configure production database URLs
   - Set up proper CORS origins

2. **Database**
   - Use connection pooling
   - Set up read replicas for scaling
   - Configure backup strategies

3. **Security**
   - Enable HTTPS in production
   - Configure proper CORS policies
   - Set up monitoring and alerting

### Scaling

- **Horizontal scaling** supported via stateless JWT
- **Database connection pooling** for high concurrency
- **Caching layer** for improved performance
- **CDN integration** for static assets

## Troubleshooting

### Common Issues

1. **Google OAuth not working**
   - Check redirect URIs in Google Console
   - Verify environment variables
   - Check browser console for errors

2. **Database connection issues**
   - Verify DATABASE_URL format
   - Check PostgreSQL is running
   - Verify user permissions

3. **Session not persisting**
   - Check NEXTAUTH_SECRET is set
   - Verify cookie settings
   - Check browser security settings

### Debug Mode

Enable debug logging by setting:

```env
NEXTAUTH_DEBUG=true
```

This will provide detailed logs for authentication flow debugging.

## Migration Guide

### From Credentials to OAuth

1. **Backup existing data**
2. **Update authentication configuration**
3. **Migrate user accounts** (if needed)
4. **Test authentication flow**
5. **Update documentation**

### Database Migrations

Use the provided schema.sql for initial setup:

```bash
psql -d postgres -f schema.sql
```

For updates, create migration scripts following the existing pattern.

## Contributing

### Adding New Providers

1. **Create provider configuration** in `lib/auth/providers.ts`
2. **Add environment variables** to `.env.example`
3. **Update documentation** with setup instructions
4. **Add tests** for new provider functionality

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- **JSDoc** for documentation
- **Error handling** for all async operations
