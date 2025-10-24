# 🚀 NoClick DigitalOcean Deployment Guide

## 📋 Overview
This guide will help you deploy NoClick to DigitalOcean for your customer demo. We'll use Ubuntu 22.04 LTS and set up everything step-by-step.

## 🎯 What We'll Deploy
- **NoClick Application** (Next.js + PostgreSQL)
- **Domain & SSL** (HTTPS)
- **Production Database**
- **Demo Data**

---

## 📝 Step 1: Create DigitalOcean Account & Droplet

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
   - **Datacenter**: Choose closest to your customers (e.g., New York, San Francisco)
   - **Authentication**: SSH Key (we'll set this up)
   - **Hostname**: noclick-demo
   - **Tags**: noclick, demo, production

4. Click "Create Droplet"
5. **Save the IP address** - you'll need this!

---

## 📝 Step 2: Set Up SSH Access

### 2.1 Generate SSH Key (Windows/Mac)
1. Open Terminal/Command Prompt
2. Run this command:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
   ```
3. Press Enter for default location
4. Enter a passphrase (remember this!)
5. This creates two files:
   - `~/.ssh/id_rsa` (private key)
   - `~/.ssh/id_rsa.pub` (public key)

### 2.2 Add SSH Key to DigitalOcean
1. Copy your public key:
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
2. In DigitalOcean dashboard:
   - Go to "Account" → "Security" → "SSH Keys"
   - Click "Add SSH Key"
   - Paste your public key
   - Give it a name like "My Laptop"

### 2.3 Test SSH Connection
1. Open Terminal/Command Prompt
2. Connect to your server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
3. Type "yes" when prompted
4. You should see a welcome message!

---

## 📝 Step 3: Server Setup

### 3.1 Update System
```bash
# Update package list
apt update

# Upgrade system
apt upgrade -y

# Install essential tools
apt install -y curl wget git nginx certbot python3-certbot-nginx
```

### 3.2 Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3.3 Install PostgreSQL
```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Switch to postgres user
sudo -u postgres psql
```

### 3.4 Configure PostgreSQL
```sql
-- Create database and user
CREATE DATABASE noclick;
CREATE USER noclick_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE noclick TO noclick_user;
ALTER USER noclick_user CREATEDB;
\q
```

---

## 📝 Step 4: Deploy NoClick Application

### 4.1 Create Application Directory
```bash
# Create directory
mkdir -p /var/www/noclick
cd /var/www/noclick

# Clone your repository (replace with your GitHub repo)
git clone https://github.com/yourusername/noclick.git .

# Or upload files manually if no GitHub repo
```

### 4.2 Install Dependencies
```bash
# Install npm dependencies
npm install

# Install PM2 for process management
npm install -g pm2
```

### 4.3 Configure Environment Variables
```bash
# Create environment file
nano .env.local
```

Add this content:
```env
# Database
DATABASE_URL=postgresql://noclick_user:postgres@localhost:5432/noclick

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
npm run db:setup

# Load demo data
npm run db:demo
```

### 4.5 Build Application
```bash
# Build for production
npm run build
```

---

## 📝 Step 5: Configure Nginx (Web Server)

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

## 📝 Step 6: Set Up Domain & SSL

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
psql -h localhost -U noclick_user -d noclick
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

## 🆘 Need Help?

If you get stuck at any step:
1. Check the error messages carefully
2. Use the troubleshooting section
3. Take screenshots of any errors
4. Contact support with specific error details

**Remember**: This is a production deployment, so take your time and follow each step carefully!