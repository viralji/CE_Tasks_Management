# Project Structure Documentation

## Overview
This document describes the complete file structure and organization of the CE Tasks Management System. The project follows Next.js 15 App Router conventions with a clean, modular architecture.

## Root Directory Structure

```
CE_Tasks_Management/
├── README.md                           # Main project documentation
├── PROJECT_STRUCTURE.md                # This file - project structure guide
├── API_DOCUMENTATION.md                # Complete API reference
├── DEPLOYMENT_GUIDE.md                 # Production deployment guide
├── database-schema.md                  # Database schema documentation
├── env.example                         # Environment variables template
├── package.json                        # Project dependencies and scripts
├── next.config.js                      # Next.js configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
├── postcss.config.js                   # PostCSS configuration
├── .gitignore                          # Git ignore rules
├── .env.local                          # Local environment variables (not in git)
├── app/                                # Next.js 15 App Router directory
├── components/                         # Reusable React components
├── lib/                               # Utility functions and configurations
├── public/                            # Static assets
└── types/                             # TypeScript type definitions
```

---

## App Directory (`/app`)

The app directory follows Next.js 15 App Router conventions with file-based routing.

### Authentication Routes (`/app/(auth)/`)
```
app/(auth)/
└── signin/
    └── page.tsx                        # Sign-in page with form
```

### Dashboard Routes (`/app/dashboard/`)
```
app/dashboard/
├── layout.tsx                          # Dashboard layout with navigation
└── page.tsx                           # Dashboard overview page
```

### Project Management (`/app/projects/`)
```
app/projects/
├── layout.tsx                          # Projects layout with navigation
├── page.tsx                           # Projects list page
├── [projectId]/
│   ├── page.tsx                       # Project detail page
│   ├── settings/
│   │   └── page.tsx                   # Project settings page
│   ├── tasks/
│   │   ├── page.tsx                   # Project tasks kanban board
│   │   └── [taskId]/
│   │       └── page.tsx               # Task detail page
│   └── chat/
│       └── page.tsx                   # Project chat page
```

### Task Management (`/app/tasks/`)
```
app/tasks/
├── layout.tsx                          # Tasks layout with navigation
└── page.tsx                           # My Tasks tabular view
```

### API Routes (`/app/api/`)
```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts                   # NextAuth.js API route
├── projects/
│   ├── route.ts                       # Projects CRUD operations
│   └── [projectId]/
│       ├── route.ts                   # Individual project operations
│       ├── members/
│       │   └── route.ts               # Project member management
│       └── tasks/
│           └── route.ts                # Project tasks operations
└── tasks/
    ├── my-tasks/
    │   └── route.ts                   # User's assigned tasks
    └── [taskId]/
        ├── route.ts                   # Individual task operations
        └── comments/
            └── route.ts               # Task comments operations
```

### Global Files
```
app/
├── globals.css                         # Global styles and CSS variables
├── layout.tsx                         # Root layout component
├── page.tsx                           # Home page (redirects to dashboard)
├── not-found.tsx                      # 404 error page
└── loading.tsx                        # Global loading component
```

---

## Components Directory (`/components`)

Reusable React components organized by functionality.

### UI Components
```
components/
├── TaskCard.tsx                        # Compact task card for kanban
├── TaskBoard.tsx                      # Kanban board component
├── AddTaskButton.tsx                  # Task creation button with modal
├── ChatButton.tsx                     # Chat navigation button
├── ProjectDetailModal.tsx             # Project information modal
├── DynamicRightSidebar.tsx            # Dynamic right sidebar
├── ProjectLayoutClient.tsx            # Client-side layout component
└── TaskDetailClient.tsx               # Task detail client component
```

### Component Features
- **TaskCard**: Minimal task display for kanban boards
- **TaskBoard**: Drag-and-drop kanban interface
- **AddTaskButton**: Modal form for creating new tasks
- **ChatButton**: Navigation to project chat with unread count
- **ProjectDetailModal**: Project information display
- **DynamicRightSidebar**: Context-aware right sidebar
- **ProjectLayoutClient**: Client-side layout management
- **TaskDetailClient**: Comprehensive task detail view

---

## Library Directory (`/lib`)

Utility functions, configurations, and shared logic.

### Core Libraries
```
lib/
├── auth.ts                            # NextAuth.js configuration
├── db.ts                              # Database connection and utilities
└── data/
    └── projects.ts                    # Project data operations
```

### Library Features
- **auth.ts**: Authentication configuration with JWT sessions
- **db.ts**: PostgreSQL connection pooling and organization scoping
- **data/projects.ts**: Project creation and management functions

---

## Public Directory (`/public`)

Static assets and files served directly.

```
public/
├── favicon.ico                        # Site favicon
├── logo.svg                           # Application logo
└── images/                           # Static images
    ├── logo.png                       # Company logo
    └── placeholder.png                # Placeholder images
```

---

## Types Directory (`/types`)

TypeScript type definitions and interfaces.

```
types/
├── index.ts                           # Main type exports
├── auth.ts                            # Authentication types
├── task.ts                            # Task-related types
├── project.ts                         # Project-related types
└── user.ts                            # User-related types
```

---

## Configuration Files

### Package Management
```
package.json                           # Dependencies and scripts
package-lock.json                      # Lock file for dependencies
```

### Next.js Configuration
```
next.config.js                         # Next.js build and runtime config
```

### TypeScript Configuration
```
tsconfig.json                          # TypeScript compiler options
```

### Styling Configuration
```
tailwind.config.js                     # Tailwind CSS configuration
postcss.config.js                      # PostCSS configuration
```

### Environment Configuration
```
.env.local                             # Local environment variables
.env.example                           # Environment variables template
```

---

## Key Features by Directory

### Authentication (`/app/(auth)/`)
- Email/password authentication for @cloudextel.com users
- Automatic user creation and organization assignment
- Session management with JWT tokens

### Dashboard (`/app/dashboard/`)
- Organization overview
- User information display
- Navigation to all major features

### Project Management (`/app/projects/`)
- Project creation and settings
- Project member management
- Task kanban board
- Project chat integration

### Task Management (`/app/tasks/`)
- Tabular "My Tasks" view
- Inline status updates
- Comment management
- Quick task navigation

### API Layer (`/app/api/`)
- RESTful API endpoints
- Authentication middleware
- Organization-scoped data access
- Comprehensive error handling

---

## File Naming Conventions

### Pages and Routes
- `page.tsx`: Route page component
- `layout.tsx`: Layout component
- `loading.tsx`: Loading component
- `not-found.tsx`: 404 error component

### Components
- `PascalCase.tsx`: React components
- Descriptive names indicating functionality
- Client components marked with `'use client'`

### API Routes
- `route.ts`: API route handler
- HTTP method functions: `GET`, `POST`, `PATCH`, `DELETE`
- Parameterized routes: `[param]/route.ts`

### Utilities
- `camelCase.ts`: Utility functions
- Descriptive names indicating purpose
- Proper TypeScript typing

---

## Import/Export Patterns

### Component Exports
```typescript
// Default export for pages
export default function PageComponent() { }

// Named exports for components
export function ComponentName() { }
```

### Utility Exports
```typescript
// Named exports for utilities
export { functionName };
export { constantName };
```

### Type Exports
```typescript
// Interface exports
export interface InterfaceName { }
export type TypeName = string | number;
```

---

## Development Workflow

### File Organization
1. **Pages**: Route-based organization in `/app`
2. **Components**: Reusable components in `/components`
3. **Utilities**: Shared logic in `/lib`
4. **Types**: Type definitions in `/types`
5. **API**: Route handlers in `/app/api`

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **Component Structure**: Functional components with hooks

### Testing Structure
- **Manual Testing**: Comprehensive testing checklist
- **API Testing**: Endpoint validation
- **UI Testing**: Component functionality
- **Integration Testing**: Full workflow testing

---

## Production Considerations

### Build Optimization
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: Built-in bundle analyzer
- **Static Generation**: Where applicable

### Performance
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Strategic caching implementation
- **CDN**: Static asset delivery

### Security
- **Authentication**: Secure session management
- **Authorization**: Organization-scoped access
- **Input Validation**: Comprehensive validation
- **SQL Injection**: Parameterized queries

---

**Project Structure Version**: 1.0  
**Last Updated**: October 2025  
**Maintainer**: CloudExtel Development Team
