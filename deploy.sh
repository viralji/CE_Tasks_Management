#!/bin/bash

# NoClick Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting NoClick Production Deployment..."

# Check if we're on the server
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18 if not installed
if ! command -v node &> /dev/null || [[ $(node --version | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Create application directory
APP_DIR="/var/www/noclick"
echo "📁 Creating application directory: $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

# Set up database
echo "🗄️ Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE noclick;
CREATE USER noclick_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE noclick TO noclick_user;
ALTER USER noclick_user CREATEDB;
\q
EOF

# Create production environment file
echo "⚙️ Creating production environment file..."
cat > .env.production << EOF
# Database
DATABASE_URL=postgresql://noclick_user:postgres@localhost:5432/noclick

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-32-characters-minimum

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Environment
NODE_ENV=production
EOF

echo "✅ Deployment script ready!"
echo ""
echo "📋 Next steps:"
echo "1. Copy your application files to $APP_DIR"
echo "2. Update .env.production with your actual values"
echo "3. Run: npm install"
echo "4. Run: npm run db:setup"
echo "5. Run: npm run build"
echo "6. Run: pm2 start ecosystem.config.js"
echo "7. Configure Nginx with the provided nginx.conf"
echo ""
echo "🎯 Your application will be available at your domain!"
