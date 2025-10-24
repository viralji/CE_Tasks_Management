# CE Tasks Intelligence - Project Documentation

## 🎯 Project Overview

**CE Tasks Intelligence** is a multi-tenant AI-powered project and task management application with integrated chat functionality. Built with Next.js 15, React 18, TypeScript, PostgreSQL, and NextAuth.js.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.6, React 18, TypeScript
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: NextAuth.js v4 with Azure AD + Credentials provider
- **UI**: Tailwind CSS, Radix UI components
- **Drag & Drop**: @dnd-kit/core and @dnd-kit/sortable
- **Deployment**: DigitalOcean with Ubuntu

### Multi-Tenancy
- **Tenant Isolation**: Row Level Security (RLS) using `app.current_org` GUC
- **Routing**: Subdomain-based (`acme.yourdomain.com`)
- **Data Segregation**: All tables include `org_id` for tenant isolation
- **File Storage**: Separate S3 buckets per tenant

## 📁 Project Structure

```
CE_Tasks_Management/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   └── signin/page.tsx      # Sign-in page
│   ├── (public)/                 # Public pages
│   │   └── page.tsx             # Landing page
│   ├── admin/                    # Admin pages
│   │   └── organizations/        # Organization management
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   ├── projects/             # Project CRUD APIs
│   │   ├── tasks/                # Task management APIs
│   │   └── chat/                 # Chat APIs
│   ├── dashboard/                # Main dashboard
│   ├── projects/                 # Project management
│   │   ├── [projectId]/          # Project detail pages
│   │   │   ├── page.tsx         # Project dashboard
│   │   │   ├── board/page.tsx   # Kanban board view
│   │   │   └── chat/page.tsx    # Project chat
│   │   ├── layout.tsx           # Project layout with sidebar
│   │   └── page.tsx             # Project listing
│   └── tasks/                    # Task management
├── components/                    # React components
│   ├── AddChildButton.tsx        # Add child project button
│   ├── AddTaskButton.tsx         # Add task modal
│   ├── ChatButton.tsx            # Chat button with unread count
│   ├── DragDropProvider.tsx      # Drag & drop context
│   ├── ProjectMembersSidebar.tsx # Project members sidebar
│   ├── TaskBoard.tsx             # Kanban board component
│   ├── TaskCard.tsx              # Individual task card
│   └── TaskDetailModal.tsx       # Task detail modal
├── db/                           # Database files
│   └── schema.sql                # Complete database schema
├── lib/                          # Utility libraries
│   ├── data/                     # Data access layer
│   │   ├── chat.ts              # Chat operations
│   │   ├── members.ts           # Project member operations
│   │   ├── projects.ts          # Project operations
│   │   └── tasks.ts             # Task operations
│   ├── api.ts                    # API helper functions
│   ├── db.ts                     # Database connection & RLS
│   ├── slug.ts                   # URL slug generation
│   └── tenant.ts                 # Tenant routing helpers
├── middleware.ts                  # Next.js middleware for tenant routing
└── .env.local                    # Environment variables
```

## 🗄️ Database Schema

### Core Tables
- **organization**: Tenant organizations
- **app_user**: System users (multi-tenant)
- **organization_membership**: User-organization relationships
- **project**: Hierarchical projects with soft deletes
- **task**: Tasks with status, priority, assignments
- **project_member**: Project team members
- **task_assignment**: Task assignments
- **task_status_log**: Task status change history
- **task_closure_request**: Task closure requests
- **task_comment**: Task comments
- **chat_room**: Project chat rooms
- **chat_message**: Chat messages
- **chat_read_status**: Unread message tracking

### Key Features
- **UUID Primary Keys**: All tables use `gen_random_uuid()`
- **Soft Deletes**: `deleted_at` timestamptz columns
- **Audit Trail**: `created_at`, `updated_at` timestamps
- **Row Level Security**: Tenant isolation via `app.current_org`
- **Composite Foreign Keys**: `(org_id, id)` for tenant safety

## 🔐 Authentication & Authorization

### Authentication Providers
1. **Azure AD (Microsoft)**: Primary OAuth provider
2. **Credentials**: Dummy login for development/testing

### User Management
- **JIT Provisioning**: Users created on first login
- **Multi-tenant**: Users belong to specific organizations
- **Role-based Access**: Owner, Admin, Member, Viewer roles

### Session Management
- **NextAuth.js**: Session handling and JWT tokens
- **Tenant Context**: Organization ID stored in session
- **User ID Resolution**: Handles email-to-UUID mapping

## 🎨 User Interface

### Design System
- **Theme**: Dark theme with compact design
- **Colors**: Gray-based palette with accent colors
- **Typography**: System fonts with clear hierarchy
- **Spacing**: Consistent padding and margins
- **Components**: Radix UI primitives with custom styling

### Key UI Components
1. **Project Dashboard**: Kanban board with task columns
2. **Task Cards**: Draggable task cards with assignments
3. **Member Sidebar**: Draggable user list for assignments
4. **Task Modal**: Detailed task view with comments and history
5. **Chat Integration**: Unread count badges and chat rooms

### Responsive Design
- **Mobile-first**: Optimized for mobile devices
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-friendly**: Large touch targets for mobile

## 🔄 Core Features

### Project Management
- **Hierarchical Projects**: Parent-child project relationships
- **Project Dashboard**: Kanban board with task status columns
- **Team Management**: Add/remove project members
- **Project Chat**: Dedicated chat room per project

### Task Management
- **Task Creation**: Title, description, priority, due date
- **Status Tracking**: Open, In Progress, Blocked, Done, Canceled
- **User Assignment**: Drag-and-drop user assignment
- **Task Comments**: Collaborative commenting system
- **Status History**: Complete audit trail of changes
- **Closure Requests**: Non-creators can request task closure

### Drag & Drop
- **User Assignment**: Drag users from sidebar to tasks
- **Visual Feedback**: Hover states and drop indicators
- **Real-time Updates**: Immediate UI updates on assignment

### Chat System
- **Project Chat Rooms**: One chat room per project
- **Unread Tracking**: Real-time unread message counts
- **Message History**: Persistent chat message storage
- **User Presence**: Show who's in the chat room

## 🚀 API Endpoints

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `GET /api/projects/[id]/members` - List project members
- `POST /api/projects/[id]/members` - Add project member
- `DELETE /api/projects/[id]/members` - Remove project member
- `GET /api/projects/[id]/tasks` - List project tasks

### Tasks
- `GET /api/tasks/[id]` - Get task details
- `PATCH /api/tasks/[id]` - Update task
- `GET /api/tasks/[id]/assign` - Get task assignments
- `POST /api/tasks/[id]/assign` - Assign users to task
- `GET /api/tasks/[id]/log` - Get task status log
- `POST /api/tasks/[id]/close` - Close or request closure
- `GET /api/tasks/[id]/comments` - Get task comments
- `POST /api/tasks/[id]/comments` - Add task comment

### Chat
- `GET /api/chat/[roomId]/unread` - Get unread message count

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Azure AD (Optional)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
```

### Installation
1. Clone repository
2. Install dependencies: `npm install`
3. Set up database: `psql -f db/schema.sql`
4. Configure environment variables
5. Start development server: `npm run dev`

## 🧪 Testing

### Dummy Users
The system includes 3 dummy users for testing:
- **Viral Shah**: `v.shah@cloudextel.com`
- **Alice Anderson**: `a.a@cloudextel.com`
- **Bob Brown**: `b.b@cloudextel.com`

### Test Scenarios
1. **Multi-user Task Assignment**: Login with different users and assign tasks
2. **Chat Functionality**: Test chat rooms and unread counts
3. **Task Lifecycle**: Create, assign, update, and close tasks
4. **Project Management**: Create projects and manage team members

## 🚀 Deployment

### Production Setup
1. **Database**: PostgreSQL with RLS enabled
2. **Environment**: DigitalOcean Ubuntu server
3. **Domain**: Subdomain-based tenant routing
4. **File Storage**: S3 buckets per tenant
5. **SSL**: HTTPS with proper certificates

### Environment Configuration
- Set production database URL
- Configure Azure AD credentials
- Set up S3 storage per tenant
- Configure domain and subdomain routing

## 📋 Current Status

### ✅ Completed Features
- [x] Multi-tenant database schema with RLS
- [x] NextAuth.js authentication (Azure AD + Credentials)
- [x] Project management with hierarchical structure
- [x] Task management with Kanban board
- [x] User assignment via drag-and-drop
- [x] Task comments and status history
- [x] Project chat with unread tracking
- [x] Responsive dark theme UI
- [x] Modular code architecture
- [x] Comprehensive API endpoints

### 🔄 In Progress
- [ ] Real-time chat functionality
- [ ] File attachments
- [ ] Advanced task filtering
- [ ] Project templates
- [ ] Email notifications

### 📋 Future Enhancements
- [ ] AI-powered task insights
- [ ] Advanced analytics dashboard
- [ ] Mobile app
- [ ] Webhook integrations
- [ ] Advanced reporting
- [ ] Custom fields
- [ ] Time tracking
- [ ] Gantt charts

## 🐛 Known Issues

### Fixed Issues
- ✅ JSX syntax errors in TaskDetailModal
- ✅ Database column name mapping (dueAt → due_at)
- ✅ Next.js 15 async params warnings
- ✅ Task modal transparency issues
- ✅ Comments API null userId errors

### Current Issues
- ⚠️ Port 3000 already in use (restart dev server)
- ⚠️ Some hydration mismatches on date formatting

## 🔧 Maintenance

### Code Organization
- **Modular Architecture**: Separate data access layers
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized queries and caching

### Database Maintenance
- **Regular Backups**: Automated database backups
- **Index Optimization**: Regular index analysis
- **RLS Testing**: Verify tenant isolation
- **Migration Scripts**: Version-controlled schema changes

## 📞 Support

### Development Team
- **Lead Developer**: AI Assistant
- **Project Owner**: Viral Shah
- **Testing Team**: Alice Anderson, Bob Brown

### Resources
- **Documentation**: This file and inline code comments
- **Database Schema**: `db/schema.sql`
- **API Documentation**: Inline JSDoc comments
- **Component Library**: Radix UI + custom components

---

**Last Updated**: October 20, 2025
**Version**: 1.0.0
**Status**: Development Complete, Ready for Testing
