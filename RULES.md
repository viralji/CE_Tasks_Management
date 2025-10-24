# AI Assistant Rules - NoClick Project

## 🚨 CRITICAL RULES

### **Error Handling:**
- ALWAYS read complete error messages first
- Check database schema before coding
- Fix simple issues with simple solutions
- Don't overcomplicate error handling

### **Database Issues:**
- Check table structure first
- Look for missing columns in INSERT statements
- Verify NOT NULL constraints
- Don't assume schema - check it
- Use `db/complete-schema.sql` as the source of truth

### **Authentication Issues:**
- Check session status first
- Verify user exists in database
- Don't create complex auth flows without checking basics
- Check RLS functions if auth fails

### **File Upload Issues:**
- Check file type restrictions in database
- Verify database columns match INSERT statements
- Test with simple files first
- Check AWS credentials configuration

## 🎯 **Problem-Solving Process:**

1. **Read the error message completely**
2. **Identify the root cause**
3. **Check the obvious (database, schema, constraints)**
4. **Fix with simplest solution**
5. **Don't add complexity unless needed**

## 🚫 **What NOT to Do:**

- Don't overcomplicate simple fixes
- Don't create complex error handling for simple issues
- Don't assume - check the actual problem
- Don't go down rabbit holes
- Don't waste user's time with unnecessary complexity

## ✅ **When User Says:**
- "STOP - just fix the simple issue" → Focus only on core problem
- "You're overcomplicating" → Use simplest solution
- "Read the error message" → Read it completely and fix directly
- "Don't waste my time" → Get straight to the point

## 📁 **Always Check These Files:**
- `db/complete-schema.sql` - Database schema
- Error logs in terminal
- API endpoint code
- Database constraints
- `.env.local` for configuration

## 🎯 **Success Criteria:**
- Problem solved with minimal code changes
- No unnecessary complexity added
- User's time not wasted
- Direct solution to the actual problem

## 🔧 **Project-Specific Rules:**

### **Database:**
- Always use `db/complete-schema.sql` as source of truth
- Check `task_attachment` table structure for uploads
- Verify all NOT NULL columns are included in INSERT statements

### **Upload Functionality:**
- Check `organization_settings` table for AWS config
- Verify file type restrictions
- Test with real AWS credentials

### **Authentication:**
- Check `app_user` table for user existence
- Verify `user_organization` relationships
- Check RLS function in schema

## 🚨 **Emergency Rules:**
- If user is frustrated, focus ONLY on the core issue
- Don't add features or complexity
- Fix the immediate problem first
- Ask for the exact error message if not provided

---

## 🚨 MANDATORY DATABASE RULES

**WHENEVER FIXING DATABASE ISSUES, YOU MUST:**

1. **ALWAYS** add the fix to `db/complete-schema.sql` 
2. **NEVER** run separate SQL commands
3. **ALWAYS** drop and recreate the entire database
4. **ALWAYS** run the complete schema file
5. **ALWAYS** load demo data
6. **ALWAYS** restart the server

## The ONE COMMAND Solution

```bash
# Stop server
pkill -f "next dev"

# Drop and recreate database
PGPASSWORD=postgres psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS noclick_db;"

# Run complete schema (includes database creation, user creation, permissions, everything)
PGPASSWORD=postgres psql -h localhost -U postgres -f db/complete-schema.sql

# Load demo data
npm run db:demo

# Start server
npm run dev
```

## Why This Rule Exists

- User has repeatedly asked for ONE SQL file solution
- User gets frustrated when AI runs separate commands
- User wants deployment-ready schema file
- User needs everything in `db/complete-schema.sql`

## What Goes in `db/complete-schema.sql`

1. Database creation (`noclick_db`)
2. User creation (`noclick_user` with password `postgres`)
3. All table definitions with ALL columns
4. All indexes and constraints
5. All RLS policies and functions
6. All permissions grants
7. Admin user setup
8. Organization settings
9. Everything needed for deployment

## NEVER DO THIS AGAIN

- ❌ Running separate `GRANT` commands
- ❌ Running separate `ALTER TABLE` commands  
- ❌ Running separate permission commands
- ❌ Forgetting to add columns to schema file
- ❌ Running multiple SQL files

## ALWAYS DO THIS

- ✅ Add everything to `db/complete-schema.sql`
- ✅ Drop and recreate database
- ✅ Run single schema file
- ✅ Load demo data
- ✅ Restart server

## User's Exact Words

> "no sepearate .sql.. u add this to main .sql and run full again.. do this everytime you miss. thats your punishment. How can I stoe this in your permanend memory ?"

---

## 🚀 DEPLOYMENT RULES

### **Database Setup:**
- Use `postgresql://noclick_user:postgres@localhost:5432/noclick_db`
- Always run `db/complete-schema.sql` first
- Then run `db/demo-data.sql` for demo data
- Use PM2 for process management

### **Environment Variables:**
- `DATABASE_URL=postgresql://noclick_user:postgres@localhost:5432/noclick_db`
- `NEXTAUTH_URL=https://yourdomain.com`
- `NEXTAUTH_SECRET=your_super_secret_key_here`
- `GOOGLE_CLIENT_ID=your_google_client_id`
- `GOOGLE_CLIENT_SECRET=your_google_client_secret`

### **Production Commands:**
```bash
# Build application
npm run build

# Start with PM2
pm2 start npm --name "noclick" -- start

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

---

## 📞 **How to Use This File:**

### **For Future Conversations:**
Start every conversation with:
```
Before helping me, read AI_ASSISTANT_RULES.md and follow those rules exactly.
```

### **When I'm Being Stupid:**
Just say: **"Read the rules file"** and I'll follow them.

### **The Rules Include:**
- ✅ Always read error messages completely first
- ✅ Check database schema before coding  
- ✅ Fix simple issues with simple solutions
- ✅ Don't overcomplicate
- ✅ Focus on the actual problem
- ✅ Don't waste your time
- ✅ Use ONE SQL file for everything
- ✅ Drop and recreate database for fixes
- ✅ Follow deployment checklist

**REFERENCE THIS FILE EVERY TIME YOU WORK ON ANY ISSUES!**
