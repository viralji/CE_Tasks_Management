# 🚀 NoClick Deployment Guide

## 📋 Overview
Complete deployment guide for NoClick application on DigitalOcean with Ubuntu 22.04, PostgreSQL, and Nginx.

---

## 🎯 Quick Start (For Experienced Users)

### One-Command Deployment
```bash
# On your DigitalOcean server, run:
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### Step-by-Step Deployment
```bash
# 1. Set up server
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh

# 2. Set up database
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/setup-database.sh
chmod +x setup-database.sh
./setup-database.sh

# 3. Deploy application
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/deploy-app.sh
chmod +x deploy-app.sh
./deploy-app.sh
```

---

## 📝 Step 1: DigitalOcean Setup

### 1.1 Create DigitalOcean Account
1. Go to [DigitalOcean.com](https://digitalocean.com)
2. Click "Sign Up" and create your account
3. Verify your email address

### 1.2 Create a Droplet (Server)
1. Login to DigitalOcean dashboard
2. Click "Create" → "Droplets"
3. Choose these settings:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: Basic Plan
   - **CPU**: Regular Intel (2 vCPUs, 2GB RAM, 50GB SSD) - $12/month
   - **Datacenter**: Choose closest to your customers
   - **Authentication**: SSH Key
   - **Hostname**: noclick-demo
   - **Tags**: noclick, demo, production

4. Click "Create Droplet"
5. **Save the IP address** - you'll need this!

### 1.3 Set Up SSH Access
1. Generate SSH key:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```
2. Copy your public key:
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
3. In DigitalOcean dashboard:
   - Go to "Account" → "Security" → "SSH Keys"
   - Click "Add SSH Key"
   - Paste your public key
   - Give it a name like "My Laptop"

4. Test SSH connection:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

---

## 📝 Step 2: Server Configuration

### 2.1 Update System
```bash
# Update package list
apt update

# Upgrade system
apt upgrade -y

# Install essential tools
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### 2.2 Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2.3 Install PostgreSQL
```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

### 2.4 Install PM2
```bash
# Install PM2 globally
npm install -g pm2
```

---

## 📝 Step 3: Database Setup

### 3.1 Create Database and User
```bash
# Switch to postgres user
sudo -u postgres psql
```

```sql
-- Create database and user
CREATE DATABASE noclick_db;
CREATE USER noclick_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE noclick_db TO noclick_user;
ALTER USER noclick_user CREATEDB;
\q
```

### 3.2 Set Up Schema
```bash
# Create application directory
mkdir -p /var/www/noclick
cd /var/www/noclick

# Upload your code here (see Step 4)
# Then run:
PGPASSWORD=postgres psql -h localhost -U postgres -f db/complete-schema.sql
```

---

## 📝 Step 4: Application Deployment

### 4.1 Upload Code
```bash
# Upload your code to server
scp -r CE_Tasks_Management/* root@YOUR_SERVER_IP:/var/www/noclick/
```

### 4.2 Install Dependencies
```bash
cd /var/www/noclick
npm install
```

### 4.3 Configure Environment Variables
```bash
# Create environment file
nano .env.local
```

Add this content:
```env
# Database
DATABASE_URL=postgresql://noclick_user:postgres@localhost:5432/noclick_db

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_super_secret_key_here

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name
```

### 4.4 Set Up Database
```bash
# Run database setup
PGPASSWORD=postgres psql -h localhost -U postgres -f db/complete-schema.sql

# Load demo data
npm run db:demo
```

### 4.5 Build Application
```bash
# Build for production
npm run build
```

---

## 📝 Step 5: Configure Nginx

### 5.1 Create Nginx Configuration
```bash
# Create configuration file
nano /etc/nginx/sites-available/noclick
```

Add this content:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 Enable Site
```bash
# Enable the site
ln -s /etc/nginx/sites-available/noclick /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## 📝 Step 6: Domain & SSL

### 6.1 Buy Domain (if needed)
1. Go to [Namecheap.com](https://namecheap.com) or [GoDaddy.com](https://godaddy.com)
2. Search for your desired domain (e.g., noclick-demo.com)
3. Purchase the domain

### 6.2 Point Domain to Server
1. In your domain registrar's control panel:
   - Go to DNS Management
   - Add A Record:
     - **Type**: A
     - **Host**: @
     - **Value**: YOUR_SERVER_IP
     - **TTL**: 300
   - Add CNAME Record:
     - **Type**: CNAME
     - **Host**: www
     - **Value**: yourdomain.com
     - **TTL**: 300

### 6.3 Get SSL Certificate
```bash
# Install SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose redirect option
```

---

## 📝 Step 7: Start Application

### 7.1 Start with PM2
```bash
# Start application
pm2 start npm --name "noclick" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

### 7.2 Verify Everything Works
1. Visit `https://yourdomain.com`
2. You should see NoClick login page
3. Test Google OAuth login
4. Check that demo data is loaded

---

## 📝 Step 8: Security & Monitoring

### 8.1 Configure Firewall
```bash
# Enable UFW firewall
ufw enable

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 'Nginx Full'

# Check status
ufw status
```

### 8.2 Set Up Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs noclick

# Monitor system
htop
```

---

## 🚨 Troubleshooting

### Common Issues:

**1. Application won't start:**
```bash
# Check logs
pm2 logs noclick

# Restart application
pm2 restart noclick
```

**2. Database connection issues:**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test database connection
psql -h localhost -U noclick_user -d noclick_db
# Password: postgres
```

**3. SSL certificate issues:**
```bash
# Renew certificate
certbot renew --dry-run
```

**4. Domain not working:**
- Wait 24-48 hours for DNS propagation
- Check DNS settings in domain registrar

---

## 📞 Support Commands

### Useful Commands:
```bash
# Check application status
pm2 status

# View application logs
pm2 logs noclick

# Restart application
pm2 restart noclick

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🎯 Final Checklist

- [ ] DigitalOcean droplet created
- [ ] SSH access working
- [ ] Node.js and PostgreSQL installed
- [ ] NoClick application deployed
- [ ] Database set up with demo data
- [ ] Nginx configured
- [ ] Domain pointing to server
- [ ] SSL certificate installed
- [ ] Application running with PM2
- [ ] Firewall configured
- [ ] Demo accessible at https://yourdomain.com

---

## 💰 Cost Breakdown

- **DigitalOcean Droplet**: $12/month
- **Domain**: $10-15/year
- **Total**: ~$13-14/month

---

## 🔐 Default Admin Access

- **Email**: admin@admin.com
- **Authentication**: Google OAuth
- **Role**: Super Admin
- **Access**: All features and data

## 📊 Demo Data Included

- 15 demo users
- 21 projects (5 parent + 16 child)
- 100+ tasks with varied statuses
- Complete organization structure
- Realistic project hierarchies

---

## 🆘 Need Help?

If you get stuck at any step:
1. Check the error messages carefully
2. Use the troubleshooting section
3. Take screenshots of any errors
4. Contact support with specific error details

**Remember**: This is a production deployment, so take your time and follow each step carefully!
