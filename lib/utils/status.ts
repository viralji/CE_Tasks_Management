/**
 * Status and priority utility functions
 * 
 * @fileoverview Centralized status and priority management utilities
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/**
 * Status configuration with labels and colors
 */
export const STATUS_CONFIG = {
  OPEN: { label: 'Open', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-100 text-red-800' },
  DONE: { label: 'Closed', color: 'bg-green-100 text-green-800' },
  CANCELED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
} as const;

/**
 * Priority configuration with labels and colors
 */
export const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: 'bg-green-100 text-green-800' },
  MEDIUM: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' }
} as const;

/**
 * Get status configuration
 * @param status - Task status
 * @returns Status configuration object
 */
export const getStatusConfig = (status: TaskStatus) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
};

/**
 * Get priority configuration
 * @param priority - Task priority
 * @returns Priority configuration object
 */
export const getPriorityConfig = (priority: TaskPriority) => {
  return PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.MEDIUM;
};

/**
 * Get status color classes
 * @param status - Task status
 * @returns CSS color classes
 */
export const getStatusColor = (status: TaskStatus): string => {
  return getStatusConfig(status).color;
};

/**
 * Get priority color classes
 * @param priority - Task priority
 * @returns CSS color classes
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  return getPriorityConfig(priority).color;
};

/**
 * Get all status options for dropdowns
 * @returns Array of status options
 */
export const getStatusOptions = () => {
  return Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as TaskStatus,
    label: config.label
  }));
};

/**
 * Get all priority options for dropdowns
 * @returns Array of priority options
 */
export const getPriorityOptions = () => {
  return Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
    value: value as TaskPriority,
    label: config.label
  }));
};

/**
 * Check if a status is considered "active" (not completed)
 * @param status - Task status
 * @returns True if status is active
 */
export const isActiveStatus = (status: TaskStatus): boolean => {
  return status !== 'DONE' && status !== 'CANCELED';
};

/**
 * Check if a status is considered "completed"
 * @param status - Task status
 * @returns True if status is completed
 */
export const isCompletedStatus = (status: TaskStatus): boolean => {
  return status === 'DONE' || status === 'CANCELED';
};
