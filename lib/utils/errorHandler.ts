/**
 * Centralized error handling utilities
 * 
 * @fileoverview Comprehensive error handling and logging system
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    statusCode?: number,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
  }
}

/**
 * Error handler class for centralized error management
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: Array<{ timestamp: Date; error: Error; context?: any }> = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors
   * @param error - Error to handle
   * @param context - Additional context
   */
  public handleError(error: Error, context?: any): void {
    this.logError(error, context);
    this.displayError(error);
  }

  /**
   * Log error to console and internal log
   * @param error - Error to log
   * @param context - Additional context
   */
  private logError(error: Error, context?: any): void {
    const logEntry = {
      timestamp: new Date(),
      error,
      context
    };

    this.errorLog.push(logEntry);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack trace',
        context: context || 'No context'
      });
    }
  }

  /**
   * Display user-friendly error message
   * @param error - Error to display
   */
  private displayError(error: Error): void {
    const userMessage = this.getUserFriendlyMessage(error);
    
    // You can integrate with toast notifications here
    console.error('User Error:', userMessage);
  }

  /**
   * Get user-friendly error message
   * @param error - Error to convert
   * @returns User-friendly message
   */
  private getUserFriendlyMessage(error: Error): string {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorType.NETWORK:
          return 'Network error. Please check your connection and try again.';
        case ErrorType.AUTHENTICATION:
          return 'Please sign in to continue.';
        case ErrorType.AUTHORIZATION:
          return 'You do not have permission to perform this action.';
        case ErrorType.NOT_FOUND:
          return 'The requested resource was not found.';
        case ErrorType.VALIDATION:
          return error.message;
        case ErrorType.SERVER:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    // Handle common error patterns
    if (error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }

    if (error.message.includes('401')) {
      return 'Please sign in to continue.';
    }

    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }

    if (error.message.includes('404')) {
      return 'The requested resource was not found.';
    }

    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get error log for debugging
   * @returns Array of logged errors
   */
  public getErrorLog(): Array<{ timestamp: Date; error: Error; context?: any }> {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility function to create typed errors
 * @param message - Error message
 * @param type - Error type
 * @param statusCode - HTTP status code
 * @param context - Additional context
 * @returns AppError instance
 */
export const createError = (
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  statusCode?: number,
  context?: Record<string, any>
): AppError => {
  return new AppError(message, type, statusCode, context);
};

/**
 * Handle API errors with proper typing
 * @param response - Fetch response
 * @returns Promise that rejects with AppError
 */
export const handleApiError = async (response: Response): Promise<never> => {
  let errorMessage = 'An error occurred';
  let errorType = ErrorType.UNKNOWN;

  try {
    const errorData = await response.json();
    errorMessage = errorData.error || errorData.message || errorMessage;
  } catch {
    // If we can't parse the error response, use default message
  }

  switch (response.status) {
    case 400:
      errorType = ErrorType.VALIDATION;
      break;
    case 401:
      errorType = ErrorType.AUTHENTICATION;
      break;
    case 403:
      errorType = ErrorType.AUTHORIZATION;
      break;
    case 404:
      errorType = ErrorType.NOT_FOUND;
      break;
    case 500:
    case 502:
    case 503:
      errorType = ErrorType.SERVER;
      break;
    default:
      if (response.status >= 400 && response.status < 500) {
        errorType = ErrorType.VALIDATION;
      } else if (response.status >= 500) {
        errorType = ErrorType.SERVER;
      }
  }

  throw createError(errorMessage, errorType, response.status);
};
