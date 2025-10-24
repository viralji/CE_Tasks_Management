#!/bin/bash

# NoClick Production Deployment Script
# This script deploys NoClick to production with all optimizations

set -e  # Exit on any error

echo "🚀 Starting NoClick Production Deployment..."

# Configuration
APP_DIR="/var/www/noclick"
DOMAIN=""
DB_PASSWORD="postgres"

# Get domain from user
read -p "Enter your domain (e.g., noclick-demo.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Domain is required!"
    exit 1
fi

echo "📦 Updating system packages..."
apt update && apt upgrade -y

echo "🔧 Installing dependencies..."
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib

echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

echo "⚡ Installing PM2..."
npm install -g pm2

echo "🗄️ Setting up PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE noclick;
CREATE USER noclick_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE noclick TO noclick_user;
ALTER USER noclick_user CREATEDB;
\q
EOF

echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

echo "⚙️ Creating environment configuration..."
cat > .env.local << EOF
DATABASE_URL=postgresql://noclick_user:$DB_PASSWORD@localhost:5432/noclick
NEXTAUTH_URL=https://$DOMAIN
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name_here
NODE_ENV=production
EOF

echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/noclick << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Auth rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/noclick /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx

echo "🔥 Configuring firewall..."
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

echo "📊 Creating log directories..."
mkdir -p /var/log/pm2

echo "✅ Production deployment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your application files to $APP_DIR"
echo "2. Run: cd $APP_DIR && npm install"
echo "3. Run: npm run db:setup"
echo "4. Run: npm run db:demo"
echo "5. Run: npm run build"
echo "6. Run: pm2 start ecosystem.config.js"
echo "7. Run: pm2 save && pm2 startup"
echo "8. Point your domain to this server's IP"
echo "9. Run: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "🎯 Your application will be available at: https://$DOMAIN"
