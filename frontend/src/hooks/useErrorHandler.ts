import { useCallback } from 'react';
import { ApiError } from '../api/client';
import {
  AppError,
  ValidationError,
  NetworkError,
  AuthenticationError,
  NotFoundError,
} from '../utils/errors';

/**
 * Standard error handler hook
 *
 * Provides consistent error handling across the application with:
 * - User-friendly error messages
 * - Proper error logging
 * - Type-safe error detection
 * - Extensible error handling strategies
 *
 * @example
 * ```tsx
 * const { handleError, handleApiError } = useErrorHandler();
 *
 * try {
 *   await createStory(data);
 * } catch (error) {
 *   handleError(error, 'Failed to create story');
 * }
 * ```
 */
export const useErrorHandler = () => {
  /**
   * Handle any error with optional user message
   */
  const handleError = useCallback((error: unknown, userMessage?: string) => {
    // Determine error type and appropriate handling
    if (error instanceof ApiError) {
      handleApiError(error, userMessage);
    } else if (error instanceof ValidationError) {
      handleValidationError(error);
    } else if (error instanceof NetworkError) {
      handleNetworkError(error);
    } else if (error instanceof AuthenticationError) {
      handleAuthError(error);
    } else if (error instanceof NotFoundError) {
      handleNotFoundError(error);
    } else if (error instanceof AppError) {
      handleAppError(error);
    } else {
      handleUnknownError(error, userMessage);
    }
  }, []);

  /**
   * Handle API-specific errors
   */
  const handleApiError = useCallback((error: ApiError, userMessage?: string) => {
    const message = userMessage || error.message;

    // Log technical details
    console.error('API Error:', {
      message: error.message,
      status: error.status,
      response: error.response,
    });

    // Show user-friendly message (replace with toast/notification in production)
    console.warn(`User Message: ${message}`);

    // TODO: Replace with actual toast notification
    // toast.error(message);

    // Handle specific HTTP status codes
    switch (error.status) {
      case 401:
        // TODO: Redirect to login or refresh token
        console.warn('Authentication required');
        break;
      case 403:
        console.warn('Permission denied');
        break;
      case 404:
        console.warn('Resource not found');
        break;
      case 500:
        console.warn('Server error - please try again later');
        break;
      default:
        break;
    }
  }, []);

  /**
   * Handle validation errors
   */
  const handleValidationError = useCallback((error: ValidationError) => {
    console.error('Validation Error:', error.message);

    if (error.fields && Object.keys(error.fields).length > 0) {
      console.error('Field Errors:', error.fields);
      // TODO: Display field-specific errors in form
    }

    // TODO: Replace with toast notification
    console.warn(`User Message: ${error.message}`);
  }, []);

  /**
   * Handle network errors
   */
  const handleNetworkError = useCallback((error: NetworkError) => {
    console.error('Network Error:', error.message);

    // TODO: Replace with toast notification with retry option
    console.warn('User Message: Network error. Please check your connection and try again.');

    // TODO: Implement retry logic
    // if (error.retryable) {
    //   showRetryOption();
    // }
  }, []);

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error: AuthenticationError) => {
    console.error('Authentication Error:', error.message);

    // TODO: Replace with toast notification
    console.warn('User Message: Please log in to continue.');

    // TODO: Redirect to login page
    // router.push('/login');
  }, []);

  /**
   * Handle not found errors
   */
  const handleNotFoundError = useCallback((error: NotFoundError) => {
    console.error('Not Found Error:', error.message);

    const resourceType = error.resourceType || 'Resource';
    const resourceId = error.resourceId || 'unknown';

    // TODO: Replace with toast notification
    console.warn(`User Message: ${resourceType} (${resourceId}) not found.`);
  }, []);

  /**
   * Handle generic application errors
   */
  const handleAppError = useCallback((error: AppError) => {
    console.error('Application Error:', {
      message: error.message,
      code: error.code,
      context: error.context,
    });

    // TODO: Replace with toast notification
    console.warn(`User Message: ${error.message}`);
  }, []);

  /**
   * Handle unknown errors
   */
  const handleUnknownError = useCallback((error: unknown, userMessage?: string) => {
    console.error('Unknown Error:', error);

    const message = userMessage || 'An unexpected error occurred';

    // TODO: Replace with toast notification
    console.warn(`User Message: ${message}`);

    // Extract error message if possible
    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }
  }, []);

  /**
   * Create an error boundary handler
   */
  const createErrorBoundaryHandler = useCallback(() => {
    return (error: Error, errorInfo: { componentStack: string }) => {
      console.error('Error Boundary Caught:', {
        error: error.message,
        componentStack: errorInfo.componentStack,
      });

      // TODO: Send to error reporting service
      // sendToErrorReporting({ error, errorInfo });

      // TODO: Show fallback UI
      console.warn('User Message: Something went wrong. Please refresh the page.');
    };
  }, []);

  /**
   * Wrap async operations with error handling
   */
  const wrapAsync = useCallback(<T,>(
    asyncFn: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> => {
    return asyncFn().catch((error) => {
      handleError(error, errorMessage);
      return null;
    });
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    handleValidationError,
    handleNetworkError,
    handleAuthError,
    handleNotFoundError,
    handleAppError,
    handleUnknownError,
    createErrorBoundaryHandler,
    wrapAsync,
  };
};

/**
 * Example usage in a component:
 *
 * ```tsx
 * const MyComponent = () => {
 *   const { handleError, wrapAsync } = useErrorHandler();
 *   const { createSeries } = useSeriesStore();
 *
 *   const handleSubmit = async (data: CreateSeriesData) => {
 *     const result = await wrapAsync(
 *       () => createSeries(data),
 *       'Failed to create series'
 *     );
 *
 *     if (result) {
 *       // Success handling
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * };
 * ```
 */
