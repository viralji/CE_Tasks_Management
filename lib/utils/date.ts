/**
 * Date utility functions
 * 
 * @fileoverview Centralized date formatting and manipulation utilities
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

/**
 * Format a date string to a readable format
 * @param dateString - ISO date string or null/undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string or 'N/A' if invalid
 */
export const formatDate = (
  dateString?: string | null, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format a date string to time only
 * @param dateString - ISO date string
 * @returns Formatted time string (HH:MM)
 */
export const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

/**
 * Format a date string to datetime
 * @param dateString - ISO date string
 * @returns Formatted datetime string
 */
export const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'N/A';
  }
};

/**
 * Calculate days between two dates
 * @param startDate - Start date string
 * @param endDate - End date string (defaults to now)
 * @returns Number of days between dates
 */
export const calculateDaysBetween = (startDate: string, endDate?: string): number => {
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
};

/**
 * Check if a date is overdue
 * @param dueDate - Due date string
 * @returns True if the date is in the past
 */
export const isOverdue = (dueDate: string): boolean => {
  try {
    return new Date(dueDate) < new Date();
  } catch (error) {
    console.error('Error checking if date is overdue:', error);
    return false;
  }
};
