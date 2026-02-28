/**
 * Standardized Error Handling System for LitRPG Studio
 *
 * Provides a comprehensive error handling system with custom error classes,
 * error parsing utilities, React hooks, and retry logic.
 *
 * @module utils/errors
 */

import { useState, useCallback } from 'react';
import { ERROR_MESSAGES } from '../constants';

// =============================================================================
// CUSTOM ERROR CLASSES
// =============================================================================

/**
 * Base application error class with optional metadata support
 *
 * @example
 * ```typescript
 * throw new AppError('Invalid operation', { userId: '123', action: 'delete' });
 * ```
 */
export class AppError extends Error {
  public readonly timestamp: Date;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly metadata?: Record<string, any>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, metadata?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.timestamp = new Date();
    this.metadata = metadata;
    this.code = typeof metadata?.code === 'string' ? metadata.code : undefined;
    this.context = (metadata?.context as Record<string, unknown> | undefined) ?? undefined;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    const captureStackTrace = (Error as ErrorConstructor & {
      captureStackTrace?: (targetObject: object) => void;
    }).captureStackTrace;
    if (captureStackTrace) {
      captureStackTrace(this);
    }
  }
}

/**
 * API-related error with HTTP status code
 *
 * @example
 * ```typescript
 * throw new ApiError('Failed to fetch user', 404, { endpoint: '/users/123' });
 * ```
 */
export class ApiError extends AppError {
  public readonly status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly response?: any;

  constructor(
    message: string,
    status: number = 500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ) {
    super(message, metadata);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Form validation error
 *
 * @example
 * ```typescript
 * throw new ValidationError('Name is required', { field: 'name', value: '' });
 * ```
 */
export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationErrors?: Record<string, string[]>;
  // Backward-compat alias used by older hooks/components.
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors?: Record<string, string[]>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ) {
    super(message, metadata);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
    this.fields = validationErrors;
  }
}

/**
 * Network/connectivity error
 *
 * @example
 * ```typescript
 * throw new NetworkError('Failed to connect to server');
 * ```
 */
export class NetworkError extends AppError {
  public readonly isOffline: boolean;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR, metadata?: Record<string, any>) {
    super(message, metadata);
    this.name = 'NetworkError';
    const nav = (globalThis as { navigator?: Navigator }).navigator;
    this.isOffline = nav ? !nav.onLine : false;
  }
}

/**
 * 404 Not Found error
 *
 * @example
 * ```typescript
 * throw new NotFoundError('User not found', { userId: '123' });
 * ```
 */
export class NotFoundError extends ApiError {
  public readonly resourceType?: string;
  public readonly resourceId?: string;

  constructor(
    message: string = 'Resource not found',
    resourceType?: string,
    resourceId?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ) {
    super(message, 404, undefined, metadata);
    this.name = 'NotFoundError';
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * 401 Unauthorized error
 *
 * @example
 * ```typescript
 * throw new UnauthorizedError('Authentication required');
 * ```
 */
export class UnauthorizedError extends ApiError {
  public readonly requiresLogin: boolean;

  constructor(
    message: string = 'Unauthorized access',
    requiresLogin: boolean = true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>
  ) {
    super(message, 401, undefined, metadata);
    this.name = 'UnauthorizedError';
    this.requiresLogin = requiresLogin;
  }
}

// Backward compatibility alias for older imports.
export class AuthenticationError extends UnauthorizedError {}

// =============================================================================
// ERROR INFO TYPE
// =============================================================================

/**
 * Standardized error information object
 */
export interface ErrorInfo {
  /** User-friendly error message */
  message: string;
  /** Error type/classification */
  type: string;
  /** HTTP status code (if applicable) */
  status?: number;
  /** Additional error details */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  /** Timestamp when error occurred */
  timestamp: Date;
  /** Error metadata */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

// =============================================================================
// ERROR HANDLER UTILITY
// =============================================================================

/**
 * Parse any error into a standardized ErrorInfo format
 *
 * @param error - The error to parse (can be any type)
 * @returns Standardized error information object
 *
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (err) {
 *   const errorInfo = handleError(err);
 *   console.error(errorInfo.message);
 * }
 * ```
 */
export function handleError(error: unknown): ErrorInfo {
  const timestamp = new Date();

  // Handle custom error classes
  if (error instanceof ApiError) {
    return {
      message: error.message,
      type: error.name,
      status: error.status,
      details: error.response,
      timestamp: error.timestamp,
      metadata: error.metadata,
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      type: error.name,
      details: error.validationErrors,
      timestamp: error.timestamp,
      metadata: error.metadata,
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      type: error.name,
      details: { isOffline: error.isOffline },
      timestamp: error.timestamp,
      metadata: error.metadata,
    };
  }

  if (error instanceof AppError) {
    return {
      message: error.message,
      type: error.name,
      timestamp: error.timestamp,
      metadata: error.metadata,
    };
  }

  // Handle native Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.name,
      timestamp,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'Error',
      timestamp,
    };
  }

  // Handle unknown error types
  return {
    message: ERROR_MESSAGES.GENERIC_ERROR,
    type: 'UnknownError',
    details: error,
    timestamp,
  };
}

// =============================================================================
// TOAST UTILITY (for use with existing Toast component)
// =============================================================================

type ToastType = 'info' | 'success' | 'error' | 'warning';

/**
 * Toast notification manager
 *
 * Note: This is a simple implementation. For production use,
 * consider integrating with a state management solution or
 * using a library like react-hot-toast.
 */
class ToastManager {
  private listeners: Array<(message: string, type: ToastType, duration: number) => void> = [];

  /**
   * Subscribe to toast notifications
   */
  subscribe(listener: (message: string, type: ToastType, duration: number) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: ToastType = 'info', duration: number = 3000) {
    this.listeners.forEach(listener => listener(message, type, duration));
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }
}

/**
 * Global toast manager instance
 *
 * @example
 * ```typescript
 * toast.success('Operation completed');
 * toast.error('Something went wrong');
 * toast.warning('Please review your input');
 * toast.info('Processing your request...');
 * ```
 */
export const toast = new ToastManager();

// =============================================================================
// REACT HOOK FOR ERROR HANDLING
// =============================================================================

interface UseErrorHandlerReturn {
  /** Current error state */
  error: ErrorInfo | null;
  /** Handle and display an error */
  handleError: (error: unknown) => ErrorInfo;
  /** Clear the current error */
  clearError: () => void;
  /** Check if there's an active error */
  hasError: boolean;
}

/**
 * React hook for component error handling with toast notifications
 *
 * @returns Object with error state and handler functions
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { error, handleError, clearError, hasError } = useErrorHandler();
 *
 *   const fetchData = async () => {
 *     try {
 *       await api.getData();
 *     } catch (err) {
 *       handleError(err); // Automatically shows toast and logs to console
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       {hasError && <ErrorMessage error={error} onDismiss={clearError} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setError] = useState<ErrorInfo | null>(null);

  const handleErrorCallback = useCallback((err: unknown): ErrorInfo => {
    const errorInfo = handleError(err);

    // Set error state
    setError(errorInfo);

    // Show toast notification
    toast.error(errorInfo.message);

    // Log to console for debugging
    console.error(`[${errorInfo.type}]`, errorInfo.message, {
      status: errorInfo.status,
      details: errorInfo.details,
      metadata: errorInfo.metadata,
      timestamp: errorInfo.timestamp,
    });

    return errorInfo;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError: handleErrorCallback,
    clearError,
    hasError: error !== null,
  };
}

// =============================================================================
// RETRY LOGIC HELPER
// =============================================================================

export interface RetryOptions {
  /** Number of retry attempts (default: 3) */
  attempts?: number;
  /** Initial delay in milliseconds (default: 1000) */
  delay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Function to determine if error is retryable (default: all errors are retryable) */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback invoked on each retry attempt */
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Retry a failed promise with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects after all retries fail
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (3 attempts, 1s initial delay, 2x backoff)
 * const data = await withRetry(() => fetchData());
 *
 * // Custom configuration
 * const data = await withRetry(
 *   () => api.getData(),
 *   {
 *     attempts: 5,
 *     delay: 500,
 *     backoffMultiplier: 1.5,
 *     shouldRetry: (error, attempt) => {
 *       // Don't retry validation errors
 *       if (error instanceof ValidationError) return false;
 *       // Only retry up to 3 times for API errors
 *       if (error instanceof ApiError) return attempt < 3;
 *       return true;
 *     },
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry attempt ${attempt}:`, error);
 *       toast.warning(`Retrying... (attempt ${attempt})`);
 *     }
 *   }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    delay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      const shouldAttemptRetry = attempt < attempts && shouldRetry(error, attempt);

      if (!shouldAttemptRetry) {
        throw error;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt);
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.min(currentDelay, maxDelay)));
      currentDelay *= backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Check if an error is an API error
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is a 404 error
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

/**
 * Check if an error is a 401 error
 */
export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

/**
 * Extract user-friendly message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return ERROR_MESSAGES.GENERIC_ERROR;
}
