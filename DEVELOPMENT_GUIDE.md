# Development Guide

## Project Overview

This is a comprehensive task management system built with Next.js 15, TypeScript, and PostgreSQL. The system features hierarchical project management, real-time chat, mention notifications, and robust access control.

## Architecture

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **State Management**: React hooks (useState, useEffect)

### Backend
- **API Routes**: Next.js API routes
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based sessions
- **Real-time**: Polling-based updates

### Database Schema
- **Multi-tenant**: Organization-based isolation
- **Hierarchical**: Parent-child project relationships
- **Access Control**: Role-based permissions
- **Real-time**: Chat and mention systems

## Key Features

### 1. Project Management
- **Hierarchical Structure**: Parent-child project relationships
- **Access Control**: Individual project permissions
- **Visual Indicators**: Grey styling for inaccessible projects
- **Member Management**: Add/remove project members

### 2. Task Management
- **Kanban Board**: Drag-and-drop task management
- **Status Tracking**: Task status and priority management
- **Assignment**: User assignment and tracking
- **Comments**: Task-level discussions

### 3. Chat System
- **Project Chat**: Dedicated chat rooms per project
- **Mentions**: @username tagging with notifications
- **Real-time**: Polling-based message updates
- **Badge System**: Unread mention indicators

### 4. Access Control
- **Organization-based**: Multi-tenant isolation
- **Project-level**: Individual project permissions
- **Role-based**: ADMIN, EDITOR, VIEWER roles
- **Inheritance**: Automatic member inheritance in hierarchies

## Component Structure

### Core Components
```
components/
├── ProjectCard.tsx          # Individual project card
├── ChildProjectCard.tsx     # Child project card with hierarchy
├── ProjectGrid.tsx          # Main project grid layout
├── TaskCard.tsx             # Individual task card
├── AddTaskButton.tsx        # Task creation component
└── ProjectsLinkWithBadge.tsx # Navigation with mention badge
```

### Layout Components
```
app/
├── projects/layout.tsx       # Projects page layout
├── dashboard/layout.tsx      # Dashboard layout
├── tasks/layout.tsx         # Tasks layout
└── (auth)/signin/page.tsx   # Authentication page
```

## API Structure

### Authentication
- **POST** `/api/auth/signin` - User authentication
- **GET** `/api/auth/signout` - User logout
- **GET** `/api/auth/session` - Session validation

### Projects
- **GET** `/api/projects` - List all projects with access control
- **POST** `/api/projects` - Create new project
- **GET** `/api/projects/[id]` - Get project details
- **PATCH** `/api/projects/[id]` - Update project
- **GET** `/api/projects/[id]/members` - Get project members
- **POST** `/api/projects/[id]/members` - Add project member
- **DELETE** `/api/projects/[id]/members` - Remove project member

### Tasks
- **GET** `/api/projects/[id]/tasks` - Get project tasks
- **POST** `/api/projects/[id]/tasks` - Create new task
- **GET** `/api/tasks/my-tasks` - Get user's assigned tasks
- **PATCH** `/api/tasks/[id]` - Update task
- **DELETE** `/api/tasks/[id]` - Delete task

### Chat
- **GET** `/api/projects/[id]/chat/messages` - Get chat messages
- **POST** `/api/projects/[id]/chat/messages` - Send message
- **GET** `/api/chat/mentions/unread` - Get unread mention count
- **GET** `/api/chat/mentions/by-project` - Get mentions by project
- **POST** `/api/chat/mentions/mark-read-room` - Mark mentions as read

## Database Schema

### Core Tables
```sql
-- Organizations
organization (id, name, created_at, updated_at)

-- Users
app_user (id, name, primary_email, created_at, updated_at)

-- Organization membership
organization_membership (org_id, user_id, role)

-- Projects
project (id, org_id, name, slug, parent_id, status, start_at, end_at, severity, description, created_at, updated_at)

-- Project membership
project_member (org_id, project_id, user_id, role, added_at)

-- Tasks
task (id, project_id, title, description, status, priority, assigned_to, created_by, created_at, updated_at)

-- Chat
chat_room (id, project_id, created_at)
chat_message (id, room_id, user_id, content, created_at)
chat_participant (room_id, user_id, joined_at)
chat_mention (id, message_id, user_id, is_read, created_at)
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local

# Set up database
npm run db:setup

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

## Code Quality

### TypeScript
- Strict type checking enabled
- Interface definitions for all data structures
- Proper error handling with typed responses

### Component Architecture
- Modular, reusable components
- Proper separation of concerns
- Clean prop interfaces

### Database
- Connection pooling for performance
- Transaction support for data integrity
- Proper error handling and logging

## Testing

### Manual Testing
1. **Authentication**: Test login/logout flows
2. **Project Access**: Verify access control works correctly
3. **Chat System**: Test real-time messaging and mentions
4. **Task Management**: Test CRUD operations
5. **Hierarchy**: Test parent-child relationships

### Automated Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build
npm run build
```

## Deployment

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Run database setup
npm run db:setup

# Reset database (development only)
npm run db:reset
```

## Security Considerations

### Authentication
- JWT-based sessions with expiration
- Secure password handling
- Session validation on all protected routes

### Access Control
- Organization-based isolation
- Project-level permissions
- Role-based access control

### Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection

## Performance Optimization

### Database
- Connection pooling
- Efficient queries with proper indexing
- Transaction management

### Frontend
- Component memoization where appropriate
- Efficient state management
- Optimized re-renders

### Caching
- Session caching
- Database query optimization
- Static asset optimization

## Troubleshooting

### Common Issues
1. **Database Connection**: Check DATABASE_URL and PostgreSQL service
2. **Authentication**: Verify NEXTAUTH_SECRET and session configuration
3. **Access Control**: Check project membership and organization context
4. **Chat Issues**: Verify mention parsing and notification system

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and logging.

## Contributing

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper error handling
- Include JSDoc comments for complex functions

### Git Workflow
- Create feature branches
- Write descriptive commit messages
- Test thoroughly before merging
- Update documentation as needed

## Future Enhancements

### Planned Features
- Real-time WebSocket connections
- Advanced task filtering and search
- File attachments in chat
- Mobile-responsive design improvements
- Advanced reporting and analytics

### Technical Improvements
- Database query optimization
- Caching layer implementation
- Automated testing suite
- Performance monitoring
- Error tracking and logging
