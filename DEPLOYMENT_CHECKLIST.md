# ✅ NoClick Deployment Checklist

## 🎯 Quick Start (For Experienced Users)

### Option 1: One-Command Deployment
```bash
# On your DigitalOcean server, run:
wget https://raw.githubusercontent.com/yourusername/noclick/main/deploy/quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh
```

### Option 2: Step-by-Step Deployment
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

## 📋 Manual Deployment Checklist

### Phase 1: DigitalOcean Setup
- [ ] Create DigitalOcean account
- [ ] Create Ubuntu 22.04 droplet (2GB RAM, 50GB SSD)
- [ ] Save server IP address
- [ ] Set up SSH key access
- [ ] Test SSH connection

### Phase 2: Server Configuration
- [ ] Update system packages
- [ ] Install Node.js 18
- [ ] Install PostgreSQL
- [ ] Install Nginx
- [ ] Install PM2
- [ ] Configure firewall

### Phase 3: Database Setup
- [ ] Create noclick database
- [ ] Create noclick_user with password 'postgres'
- [ ] Grant permissions
- [ ] Test database connection (password: postgres)

### Phase 4: Application Deployment
- [ ] Create /var/www/noclick directory
- [ ] Upload application files
- [ ] Create .env.local with credentials
- [ ] Install npm dependencies
- [ ] Set up database schema
- [ ] Load demo data
- [ ] Build application

### Phase 5: Web Server Configuration
- [ ] Configure Nginx virtual host
- [ ] Enable site
- [ ] Test Nginx configuration
- [ ] Restart Nginx

### Phase 6: Domain & SSL
- [ ] Buy domain (if needed)
- [ ] Point domain to server IP
- [ ] Wait for DNS propagation
- [ ] Install SSL certificate
- [ ] Test HTTPS access

### Phase 7: Application Launch
- [ ] Start application with PM2
- [ ] Save PM2 configuration
- [ ] Set up auto-start
- [ ] Test application functionality
- [ ] Verify demo data is loaded

### Phase 8: Final Testing
- [ ] Test login functionality
- [ ] Test Google OAuth
- [ ] Verify all features work
- [ ] Check performance
- [ ] Test on mobile devices

---

## 🚨 Common Issues & Solutions

### Issue: Application won't start
**Solution:**
```bash
pm2 logs noclick
pm2 restart noclick
```

### Issue: Database connection failed
**Solution:**
```bash
systemctl status postgresql
psql -h localhost -U noclick_user -d noclick
# Password: postgres
```

### Issue: SSL certificate not working
**Solution:**
```bash
certbot renew --dry-run
certbot --nginx -d yourdomain.com
```

### Issue: Domain not resolving
**Solution:**
- Wait 24-48 hours for DNS propagation
- Check DNS settings in domain registrar
- Use `nslookup yourdomain.com` to test

---

## 📞 Support Commands

### Check Application Status
```bash
pm2 status
pm2 logs noclick
pm2 restart noclick
```

### Check System Resources
```bash
htop
df -h
free -h
```

### Check Services
```bash
systemctl status nginx
systemctl status postgresql
systemctl status pm2-root
```

### Check Logs
```bash
pm2 logs noclick
tail -f /var/log/nginx/error.log
tail -f /var/log/postgresql/postgresql-*.log
```

---

## 💰 Cost Breakdown

- **DigitalOcean Droplet**: $12/month (2GB RAM, 50GB SSD)
- **Domain**: $10-15/year
- **Total Monthly**: ~$13-14

---

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Application loads at https://yourdomain.com
- [ ] Google OAuth login works
- [ ] Demo data is visible
- [ ] All features function properly
- [ ] Performance is acceptable
- [ ] SSL certificate is valid

---

## 🆘 Emergency Contacts

If you need help:
1. Check the troubleshooting section
2. Review the deployment guide
3. Take screenshots of any errors
4. Contact support with specific details

**Remember**: Take your time, follow each step carefully, and don't hesitate to ask for help!
