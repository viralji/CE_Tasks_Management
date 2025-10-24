#!/bin/bash

# S3 Attachments Plugin - Setup Script
# 
# This script helps you set up the S3 attachments plugin in your Next.js project.
# 
# Usage: ./setup.sh

set -e

echo "🚀 S3 Attachments Plugin Setup"
echo "================================"

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in a Next.js project directory"
    echo "Please run this script from your Next.js project root"
    exit 1
fi

# Check if required dependencies are installed
echo "📦 Checking dependencies..."

if ! npm list @aws-sdk/client-s3 > /dev/null 2>&1; then
    echo "Installing AWS SDK dependencies..."
    npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
else
    echo "✅ AWS SDK already installed"
fi

# Check if pg is installed
if ! npm list pg > /dev/null 2>&1; then
    echo "Installing PostgreSQL client..."
    npm install pg
    npm install --save-dev @types/pg
else
    echo "✅ PostgreSQL client already installed"
fi

# Create plugins directory if it doesn't exist
if [ ! -d "plugins" ]; then
    mkdir -p plugins
    echo "📁 Created plugins directory"
fi

# Copy plugin files
echo "📋 Copying plugin files..."

# Copy S3AttachmentManager
cp S3AttachmentManager.ts plugins/s3-attachments/

# Copy API routes
mkdir -p app/api/tasks/[taskId]/attachments
mkdir -p app/api/tasks/[taskId]/attachments/[attachmentId]
cp api/tasks/[taskId]/attachments/route.ts app/api/tasks/[taskId]/attachments/
cp api/tasks/[taskId]/attachments/[attachmentId]/route.ts app/api/tasks/[taskId]/attachments/[attachmentId]/

# Copy components
cp components/AttachmentList.tsx components/
cp components/AttachmentIcon.tsx components/

# Copy database migrations
mkdir -p database/migrations
cp database/migrations.sql database/migrations/s3-attachments.sql

# Copy examples
mkdir -p examples
cp examples/TaskDetailPage.tsx examples/
cp examples/MyTasksPage.tsx examples/

echo "✅ Plugin files copied successfully"

# Check environment variables
echo "🔧 Checking environment variables..."

if [ -f ".env.local" ]; then
    if ! grep -q "ENCRYPTION_KEY" .env.local; then
        echo "⚠️  ENCRYPTION_KEY not found in .env.local"
        echo "Please add the following to your .env.local:"
        echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
    else
        echo "✅ ENCRYPTION_KEY found"
    fi
else
    echo "⚠️  .env.local not found"
    echo "Please create .env.local and add:"
    echo "ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fi

# Check database connection
echo "🗄️  Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL not set"
    echo "Please set DATABASE_URL in your environment variables"
else
    echo "✅ DATABASE_URL found"
fi

# Generate encryption key if needed
if [ ! -f ".env.local" ] || ! grep -q "ENCRYPTION_KEY" .env.local; then
    echo "🔑 Generating encryption key..."
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
    echo "✅ Encryption key generated and added to .env.local"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run the database migrations:"
echo "   psql -d your_database -f database/migrations/s3-attachments.sql"
echo ""
echo "2. Configure your organization settings:"
echo "   - Go to your admin panel"
echo "   - Add AWS credentials for each organization"
echo ""
echo "3. Use the plugin in your components:"
echo "   - Import AttachmentList and AttachmentIcon"
echo "   - See examples/ for usage examples"
echo ""
echo "4. Test the functionality:"
echo "   - Upload a file to a task"
echo "   - Download the file"
echo "   - Delete the file"
echo ""
echo "📚 Documentation: plugins/s3-attachments/README.md"
echo "🔧 Examples: plugins/s3-attachments/examples/"
echo ""
echo "Happy coding! 🚀"
