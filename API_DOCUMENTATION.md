# API Documentation

## Overview
This document describes all API endpoints for the CE Tasks Management System. All endpoints require authentication and are scoped by organization for multi-tenant support.

## Authentication
All API endpoints require a valid session. The session includes:
- `user.id`: User ID
- `org`: Organization ID for multi-tenant data isolation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://yourdomain.com`

---

## Authentication Endpoints

### POST /api/auth/callback/credentials
**Description**: Handles user login with email and password

**Request Body**:
```json
{
  "email": "user@cloudextel.com",
  "password": "Welcome@0"
}
```

**Response**:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@cloudextel.com",
    "name": "User Name"
  },
  "org": "org-uuid"
}
```

---

## Task Management Endpoints

### GET /api/tasks/my-tasks
**Description**: Fetches all tasks assigned to the current user

**Headers**: 
- `Cookie`: Session cookie

**Response**:
```json
{
  "data": [
    {
      "id": "task-uuid",
      "title": "Task Title",
      "description": "Task description",
      "status": "OPEN",
      "priority": "MEDIUM",
      "due_at": "2025-01-15T10:00:00Z",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-01T10:00:00Z",
      "project_id": "project-uuid",
      "project_name": "Project Name"
    }
  ]
}
```

### PATCH /api/tasks/[taskId]
**Description**: Updates task status and/or priority

**Headers**:
- `Cookie`: Session cookie
- `Content-Type`: application/json

**Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH"
}
```

**Response**:
```json
{
  "data": {
    "id": "task-uuid",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "updated_at": "2025-01-01T10:00:00Z"
  },
  "message": "Task updated successfully"
}
```

### POST /api/tasks/[taskId]/comments
**Description**: Adds a comment to a task

**Headers**:
- `Cookie`: Session cookie
- `Content-Type`: application/json

**Request Body**:
```json
{
  "content": "This is a comment"
}
```

**Response**:
```json
{
  "data": {
    "id": "comment-uuid",
    "content": "This is a comment",
    "author_id": "user-uuid",
    "created_at": "2025-01-01T10:00:00Z"
  },
  "message": "Comment added successfully"
}
```

---

## Project Management Endpoints

### GET /api/projects
**Description**: Lists all projects for the current organization

**Headers**: 
- `Cookie`: Session cookie

**Response**:
```json
{
  "data": [
    {
      "id": "project-uuid",
      "name": "Project Name",
      "slug": "project-slug",
      "description": "Project description",
      "status": "ACTIVE",
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### GET /api/projects/[projectId]/tasks
**Description**: Fetches all tasks for a specific project

**Headers**: 
- `Cookie`: Session cookie

**Response**:
```json
{
  "data": [
    {
      "id": "task-uuid",
      "title": "Task Title",
      "status": "OPEN",
      "priority": "MEDIUM",
      "due_at": "2025-01-15T10:00:00Z",
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### POST /api/projects/[projectId]/tasks
**Description**: Creates a new task in a project

**Headers**:
- `Cookie`: Session cookie
- `Content-Type`: application/json

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "MEDIUM",
  "dueAt": "2025-01-15T10:00:00Z"
}
```

**Response**:
```json
{
  "data": {
    "id": "task-uuid",
    "title": "New Task",
    "status": "OPEN",
    "priority": "MEDIUM",
    "created_at": "2025-01-01T10:00:00Z"
  },
  "message": "Task created successfully"
}
```

---

## Project Member Management Endpoints

### GET /api/projects/[projectId]/members
**Description**: Fetches project members

**Headers**: 
- `Cookie`: Session cookie

**Query Parameters**:
- `available=true`: Returns users not yet in the project

**Response**:
```json
{
  "data": [
    {
      "id": "user-uuid",
      "name": "User Name",
      "primary_email": "user@cloudextel.com",
      "role": "MEMBER"
    }
  ]
}
```

### POST /api/projects/[projectId]/members
**Description**: Adds a user to a project

**Headers**:
- `Cookie`: Session cookie
- `Content-Type`: application/json

**Request Body**:
```json
{
  "userId": "user-uuid"
}
```

**Response**:
```json
{
  "data": {
    "user_id": "user-uuid",
    "message": "User added to project successfully"
  }
}
```

### DELETE /api/projects/[projectId]/members/[userId]
**Description**: Removes a user from a project

**Headers**: 
- `Cookie`: Session cookie

**Response**:
```json
{
  "message": "User removed from project successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request data"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production deployment.

## CORS

CORS is configured to allow requests from the same origin. For production, configure appropriate CORS settings.

## Security Considerations

1. **Authentication**: All endpoints require valid session
2. **Authorization**: Users can only access data within their organization
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection**: All queries use parameterized statements
5. **XSS Protection**: Output is properly escaped

---

**API Version**: 1.0  
**Last Updated**: October 2025  
**Maintainer**: CloudExtel Development Team
