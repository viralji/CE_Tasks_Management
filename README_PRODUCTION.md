# 🚀 NoClick - Production Deployment Guide

## 📋 Overview
NoClick is a modern, AI-powered project management platform built with Next.js 15, PostgreSQL, and TypeScript. This guide covers production deployment on DigitalOcean.

## 🏗️ Architecture
- **Frontend/Backend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: NextAuth.js with Google OAuth
- **File Storage**: AWS S3 (optional)
- **Process Management**: PM2
- **Web Server**: Nginx with SSL
- **Deployment**: DigitalOcean Ubuntu 22.04

## 🚀 Quick Deployment

### Option 1: Automated Deployment
```bash
# On your DigitalOcean server
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/production-deploy.sh
chmod +x production-deploy.sh
./production-deploy.sh
```

### Option 2: Manual Deployment
Follow the step-by-step guide in `DEPLOYMENT_GUIDE.md`

## 📁 Project Structure
```
noclick/
├── app/                    # Next.js 15 app directory
├── components/             # Reusable React components
├── lib/                    # Utility functions and database
├── db/                     # Database schema and demo data
├── deploy/                 # Deployment scripts
├── docs/                   # Documentation
├── middleware.ts           # Next.js middleware
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://noclick_user:postgres@localhost:5432/noclick

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_super_secret_key_here

# Google OAuth (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

## 🗄️ Database Schema

### Core Tables
- `organization` - Multi-tenant organizations
- `app_user` - User accounts
- `project` - Projects with parent-child relationships
- `task` - Tasks with status, priority, and assignments
- `task_comment` - Task comments and discussions
- `task_attachment` - File attachments
- `task_status_log` - Status change history

### Key Features
- **Row Level Security (RLS)** for multi-tenancy
- **Optimized indexes** for performance
- **Foreign key constraints** for data integrity
- **Soft deletes** with `deleted_at` timestamps
- **Audit trails** for all changes

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2
```

### 2. Database Setup
```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE noclick;
CREATE USER noclick_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE noclick TO noclick_user;
ALTER USER noclick_user CREATEDB;
\q
```

### 3. Application Deployment
```bash
# Create directory
mkdir -p /var/www/noclick
cd /var/www/noclick

# Upload application files
# (Use SCP, Git clone, or manual upload)

# Install dependencies
npm install

# Set up database
npm run db:setup

# Load demo data
npm run db:demo

# Build application
npm run build
```

### 4. Web Server Configuration
```bash
# Configure Nginx
# (Use the provided nginx.conf template)

# Enable site
ln -s /etc/nginx/sites-available/noclick /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart
nginx -t
systemctl restart nginx
```

### 5. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. SSL Certificate
```bash
# Install SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔒 Security Features

### Application Security
- **Row Level Security (RLS)** for data isolation
- **JWT tokens** for authentication
- **CSRF protection** via NextAuth.js
- **Rate limiting** on API endpoints
- **Input validation** with Zod
- **SQL injection protection** with parameterized queries

### Server Security
- **Firewall configuration** with UFW
- **SSL/TLS encryption** with Let's Encrypt
- **Security headers** in Nginx
- **Process isolation** with PM2
- **Regular security updates**

## 📊 Performance Optimizations

### Database
- **Optimized indexes** on frequently queried columns
- **Connection pooling** with PostgreSQL
- **Query optimization** with proper joins
- **Row Level Security** for efficient filtering

### Application
- **Next.js 15** with App Router
- **Server-side rendering** for SEO
- **Static generation** where possible
- **Image optimization** with Next.js
- **Code splitting** and lazy loading

### Infrastructure
- **Nginx caching** for static assets
- **Gzip compression** for responses
- **PM2 clustering** for scalability
- **CDN integration** (optional)

## 🔧 Maintenance

### Database Backups
```bash
# Create backup
npm run db:backup

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart application
pm2 restart noclick
```

### Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs noclick

# Monitor system resources
htop
df -h
free -h
```

## 🚨 Troubleshooting

### Common Issues
1. **Application won't start**: Check PM2 logs
2. **Database connection failed**: Verify PostgreSQL status
3. **SSL certificate issues**: Renew with certbot
4. **Domain not resolving**: Check DNS settings

### Support Commands
```bash
# Check services
systemctl status nginx
systemctl status postgresql
pm2 status

# View logs
pm2 logs noclick
tail -f /var/log/nginx/error.log
tail -f /var/log/postgresql/postgresql-*.log
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the deployment guide
3. Check application logs
4. Contact support with specific error details

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Application loads at https://yourdomain.com
- ✅ Google OAuth login works
- ✅ Demo data is visible
- ✅ All features function properly
- ✅ SSL certificate is valid
- ✅ Performance is acceptable

---

**NoClick - The smarter alternative to ClickUp** 🚀
