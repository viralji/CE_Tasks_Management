# NoClick - The Smarter Alternative to ClickUp

**NoClick** is a revolutionary AI-powered project management platform that works the way you think. Built as a direct competitor to ClickUp, NoClick eliminates endless clicking and complexity, delivering lightning-fast results through intelligent automation.

## 🚀 **Why NoClick?**

- **⚡ Lightning Fast**: No more waiting, no more clicking
- **🤖 AI-Powered**: Smart automation and insights that actually help
- **👥 Team Focused**: Built for seamless collaboration
- **🎯 Results-Driven**: Focus on what matters, not how to get there

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login with NextAuth.js
- **Organization Management**: Multi-tenant organization support
- **Project Management**: Create and manage projects with settings
- **Task Management**: Full CRUD operations for tasks
- **User Assignment**: Assign users to projects and tasks
- **Status Tracking**: Track task status changes with history
- **Comments System**: Add comments to tasks
- **Real-time Updates**: Live status and comment updates

### User Interface
- **My Tasks View**: Tabular Excel-like interface for quick task management
- **Project Kanban**: Visual task board with drag-and-drop
- **Task Details**: Comprehensive task view with inline editing
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, professional interface with consistent styling

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: NextAuth.js with Credentials Provider
- **Database**: PostgreSQL with connection pooling
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks and context

### Project Structure
```
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API routes
│   ├── dashboard/                # Dashboard pages
│   ├── projects/                 # Project management
│   ├── tasks/                    # Task management
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
├── lib/                         # Utility functions and configurations
├── public/                      # Static assets
└── types/                       # TypeScript type definitions
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CE_Tasks_Management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

4. **Set up the database**
   ```bash
   # Run the database schema
   psql -d your_database -f schema.sql
   ```

5. **Load demo data (optional)**
   ```bash
   # Load comprehensive demo data for testing
   npm run db:demo
   ```
   **WARNING**: This will delete all existing data except the admin user and CloudExtel organization. Do NOT run in production!

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables
- **organization**: Multi-tenant organizations
- **app_user**: User accounts
- **organization_membership**: User-organization relationships
- **project**: Projects within organizations
- **project_member**: Project team members
- **task**: Individual tasks
- **task_assignment**: Task assignments to users
- **task_comment**: Task comments
- **task_status_log**: Status change history

### Key Relationships
- Users belong to organizations via `organization_membership`
- Projects belong to organizations
- Tasks belong to projects
- Users can be assigned to tasks via `task_assignment`
- All operations are scoped by organization for multi-tenancy

## 🎭 Demo Data

### Comprehensive Demo Data
The application includes comprehensive demo data to showcase all features:

#### Users (15 total)
- **Finance Team**: Sarah Johnson (Manager), Michael Chen (Analyst)
- **HR Team**: Emily Davis (Director), James Wilson (Coordinator)
- **Sales Team**: Robert Martinez (Director), Jennifer Brown (Manager), David Lee (Rep)
- **Marketing**: Lisa Anderson (Manager)
- **Operations**: Thomas Garcia (Manager)
- **IT**: Amanda Rodriguez (Manager)
- **Product**: Christopher Taylor (Manager)
- **Project Management**: Jessica White (Coordinator)
- **Business Analysis**: Daniel Harris (Analyst)
- **Executive**: Michelle Clark (Assistant), William Turner (CEO)

#### Projects with Hierarchies
- **Budget Preparation 2025** (Parent)
  - Capex Budget, Opex Budget, Revenue Forecast, Department Allocations
- **HR Operations 2025** (Parent)
  - Recruitment Q1, Employee Onboarding, Performance Reviews, Training & Development
- **Sales Initiatives 2025** (Parent)
  - Q1 Sales Campaign, Client Acquisition, Partner Development, Market Expansion
- **Finance Operations** (Parent)
  - Monthly Reporting, Audit Preparation, Tax Planning, Financial Analysis

#### Tasks (100+ total)
- Varied statuses: OPEN (30%), IN_PROGRESS (25%), BLOCKED (10%), DONE (30%), CANCELED (5%)
- Varied priorities: LOW (20%), MEDIUM (50%), HIGH (25%), CRITICAL (5%)
- Realistic titles and descriptions
- Due dates spread across project timelines
- Multiple assignees per task (collaborative work)
- Some tasks unassigned (showing work backlog)

### Demo Data Features
- **Realistic Project Hierarchies**: Parent projects with child projects
- **Cross-functional Teams**: Users assigned to relevant projects
- **Task Assignments**: Single and multiple assignees per task
- **Status Variety**: Tasks in all statuses showing workflow
- **Priority Distribution**: Realistic priority distribution
- **Date Ranges**: Past, present, and future tasks
- **Collaboration**: Task watchers and realistic assignments

## 🔐 Authentication

### User Management
- **Domain-based Authentication**: `@cloudextel.com` users with password `Welcome@0`
- **Auto User Creation**: New users are automatically created and assigned to default organization
- **Session Management**: JWT-based sessions with organization context

### Security Features
- **Organization Isolation**: All data is scoped by organization
- **Role-based Access**: Different permission levels for project members
- **Secure API Routes**: All API endpoints require authentication
- **Input Validation**: Comprehensive validation on all inputs

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Professional blue and gray theme
- **Typography**: Clean, readable font hierarchy
- **Components**: Consistent button, form, and card styles
- **Responsive**: Mobile-first responsive design

### Key Pages
1. **My Tasks**: Tabular view for quick task management
2. **Project Kanban**: Visual task board
3. **Task Details**: Comprehensive task information
4. **Project Management**: Project creation and settings

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables for production
- [ ] Set up production PostgreSQL database
- [ ] Configure NextAuth secret
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS
- [ ] Set up monitoring and logging

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@host:port/postgres

# Authentication
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

# Optional: Azure AD Integration
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/callback/credentials` - User login
- `GET /api/auth/session` - Get current session

### Task Management
- `GET /api/tasks/my-tasks` - Get user's assigned tasks
- `PATCH /api/tasks/[taskId]` - Update task status/priority
- `POST /api/tasks/[taskId]/comments` - Add task comment

### Project Management
- `GET /api/projects` - List projects
- `GET /api/projects/[projectId]/tasks` - Get project tasks
- `POST /api/projects/[projectId]/tasks` - Create new task

## 🧪 Testing

### Manual Testing Checklist
- [ ] User authentication and session management
- [ ] Task creation, editing, and deletion
- [ ] Status updates and history tracking
- [ ] Comment system functionality
- [ ] Project management features
- [ ] Responsive design on different screen sizes

## 🔧 Development

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Component Structure**: Functional components with hooks
- **API Design**: RESTful API with consistent error handling

### Adding New Features
1. Create API routes in `app/api/`
2. Add components in `components/`
3. Update types in `types/`
4. Add database migrations as needed
5. Update documentation

## 📈 Performance

### Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connections
- **Client-side Caching**: React state management
- **Code Splitting**: Next.js automatic code splitting

## 🐛 Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL format
2. **Authentication**: Verify NEXTAUTH_SECRET is set
3. **Session Issues**: Clear browser cookies and restart
4. **Build Errors**: Check TypeScript errors and dependencies

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and check console logs.

## 📄 License

This project is proprietary software for CloudExtel.

## 👥 Contributing

For internal development team:
1. Follow the established code standards
2. Update documentation for new features
3. Test thoroughly before deployment
4. Use meaningful commit messages

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintainer**: CloudExtel Development Team
