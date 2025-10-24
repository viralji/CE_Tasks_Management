/**
 * Application constants
 * 
 * @fileoverview Centralized constants for the application
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNIN: '/api/auth/signin',
    SIGNOUT: '/api/auth/signout',
    SESSION: '/api/auth/session'
  },
  
  // Projects
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    DETAIL: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
    MEMBERS: (id: string) => `/api/projects/${id}/members`,
    TASKS: (id: string) => `/api/projects/${id}/tasks`,
    CHAT: (id: string) => `/api/projects/${id}/chat/messages`,
    SETTINGS: (id: string) => `/api/projects/${id}/settings`
  },
  
  // Tasks
  TASKS: {
    MY_TASKS: '/api/tasks/my-tasks',
    DETAIL: (id: string) => `/api/tasks/${id}`,
    UPDATE: (id: string) => `/api/tasks/${id}`,
    ASSIGN: (id: string) => `/api/tasks/${id}/assign`,
    COMMENTS: (id: string) => `/api/tasks/${id}/comments`
  },
  
  // Chat
  CHAT: {
    MENTIONS: {
      UNREAD: '/api/chat/mentions/unread',
      BY_PROJECT: '/api/chat/mentions/by-project',
      MARK_READ: '/api/chat/mentions/mark-read',
      MARK_READ_ROOM: '/api/chat/mentions/mark-read-room'
    }
  },
  
  // Dashboard
  DASHBOARD: {
    ANALYTICS: '/api/dashboard/analytics'
  }
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id: string) => `/projects/${id}`,
  PROJECT_TASKS: (id: string) => `/projects/${id}/tasks`,
  PROJECT_CHAT: (id: string) => `/projects/${id}/chat`,
  PROJECT_MEMBERS: (id: string) => `/projects/${id}/members`,
  TASK_DETAIL: (projectId: string, taskId: string) => `/projects/${projectId}/tasks/${taskId}`,
  ADMIN: '/admin/organizations'
} as const;

/**
 * Task status values
 */
export const TASK_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  DONE: 'DONE',
  CANCELED: 'CANCELED'
} as const;

/**
 * Task priority values
 */
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

/**
 * Project roles
 */
export const PROJECT_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER'
} as const;

/**
 * Organization roles
 */
export const ORG_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER'
} as const;

/**
 * UI constants
 */
export const UI = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Polling intervals
  CHAT_POLLING_INTERVAL: 3000,
  TASK_POLLING_INTERVAL: 5000,
  
  // Timeouts
  API_TIMEOUT: 10000,
  DEBOUNCE_DELAY: 300,
  
  // Limits
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_COMMENT_LENGTH: 1000,
  MAX_DESCRIPTION_LENGTH: 2000
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  FILTER_STATE: 'filter_state',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

/**
 * Event names for custom events
 */
export const EVENTS = {
  TASK_FILTERS_CHANGED: 'taskFiltersChanged',
  PROJECT_SELECTED: 'projectSelected',
  TASK_UPDATED: 'taskUpdated',
  MESSAGE_SENT: 'messageSent'
} as const;

/**
 * Default values
 */
export const DEFAULTS = {
  PROJECT: {
    DEFAULT_DUE_DAYS: 7,
    DEFAULT_PRIORITY: TASK_PRIORITY.MEDIUM,
    DEFAULT_STATUS: TASK_STATUS.OPEN
  },
  USER: {
    DEFAULT_ROLE: PROJECT_ROLES.MEMBER
  },
  FILTERS: {
    DEFAULT_STATUS_FILTER: [TASK_STATUS.OPEN, TASK_STATUS.IN_PROGRESS, TASK_STATUS.BLOCKED, TASK_STATUS.CANCELED],
    DEFAULT_PROJECT_FILTER: []
  }
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  AUTHENTICATION: 'Please sign in to continue.',
  AUTHORIZATION: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.'
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  MEMBER_ADDED: 'Member added successfully',
  MEMBER_REMOVED: 'Member removed successfully',
  COMMENT_ADDED: 'Comment added successfully',
  MESSAGE_SENT: 'Message sent successfully'
} as const;
