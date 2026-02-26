/**
 * Usage Examples for Error Handling System
 *
 * This file demonstrates how to use the standardized error handling utilities.
 * DO NOT import this file in production code - it's for reference only.
 */

import {
  AppError,
  ApiError,
  ValidationError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  handleError,
  useErrorHandler,
  withRetry,
  toast,
  isApiError,
  isValidationError,
  getErrorMessage,
} from './errors';

// =============================================================================
// EXAMPLE 1: Throwing Custom Errors
// =============================================================================

function exampleThrowingErrors() {
  // Basic app error
  throw new AppError('Something went wrong');

  // App error with metadata
  throw new AppError('Failed to process user', {
    userId: '123',
    action: 'delete',
    timestamp: new Date(),
  });

  // API error
  throw new ApiError('Failed to fetch data', 404, {
    endpoint: '/api/users',
    method: 'GET',
  });

  // Validation error
  throw new ValidationError('Form validation failed', {
    name: ['Name is required', 'Name must be at least 3 characters'],
    email: ['Email is required', 'Email must be valid'],
  });

  // Network error
  throw new NetworkError('Unable to connect to server');

  // Not found error
  throw new NotFoundError('User not found', 'User', '123');

  // Unauthorized error
  throw new UnauthorizedError('Please log in to continue');
}

// =============================================================================
// EXAMPLE 2: Using handleError Utility
// =============================================================================

function exampleHandleError() {
  try {
    // Some operation that might fail
    throw new ApiError('Server error', 500);
  } catch (error) {
    const errorInfo = handleError(error);
    console.log(errorInfo.message); // "Server error"
    console.log(errorInfo.type); // "ApiError"
    console.log(errorInfo.status); // 500
  }
}

// =============================================================================
// EXAMPLE 3: Using useErrorHandler Hook in Components
// =============================================================================

function ExampleComponent() {
  const { error, handleError, clearError, hasError } = useErrorHandler();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new ApiError('Failed to fetch data', response.status);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      // Automatically shows toast and logs to console
      handleError(err);
    }
  };

  void fetchData;
  void clearError;
  return { error, hasError };
}

// =============================================================================
// EXAMPLE 4: Using Toast Notifications
// =============================================================================

function exampleToastNotifications() {
  // Success toast
  toast.success('Data saved successfully!');

  // Error toast
  toast.error('Failed to save data');

  // Warning toast
  toast.warning('Please review your input');

  // Info toast
  toast.info('Processing your request...');

  // Custom duration (in milliseconds)
  toast.success('Quick message', 1000);
  toast.error('Long error message', 5000);
}

// =============================================================================
// EXAMPLE 5: Using withRetry for Resilient API Calls
// =============================================================================

async function exampleWithRetry() {
  // Basic retry with defaults (3 attempts, 1s delay, 2x backoff)
  const data = await withRetry(async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new ApiError('Failed to fetch', response.status);
    }
    return response.json();
  });
  void data;

  // Custom retry configuration
  const customRetry = await withRetry(
    async () => {
      return await fetch('/api/important-data').then(r => r.json());
    },
    {
      attempts: 5,
      delay: 500,
      backoffMultiplier: 1.5,
      maxDelay: 10000,
      shouldRetry: (error, _attempt) => {
        // Don't retry validation errors
        if (error instanceof ValidationError) return false;
        // Don't retry 404s
        if (error instanceof NotFoundError) return false;
        // Retry all other errors
        return true;
      },
      onRetry: (error, attempt) => {
        console.log(`Retry attempt ${attempt}:`, getErrorMessage(error));
        toast.warning(`Retrying... (attempt ${attempt})`);
      },
    }
  );

  return customRetry;
}

// =============================================================================
// EXAMPLE 6: Error Type Checking
// =============================================================================

function exampleErrorTypeChecking(error: unknown) {
  // Check specific error types
  if (isApiError(error)) {
    console.log('API Error:', error.status);
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status === 404) {
      // Show not found page
    }
  }

  if (isValidationError(error)) {
    console.log('Validation errors:', error.validationErrors);
    // Display field-specific errors in form
  }

  // Get user-friendly message from any error type
  const message = getErrorMessage(error);
  toast.error(message);
}

// =============================================================================
// EXAMPLE 7: Complete API Integration Pattern
// =============================================================================

// In a store or API module
async function exampleCompleteApiPattern() {
  try {
    // Attempt API call with retry logic
    const data = await withRetry(
      async () => {
        const response = await fetch('/api/users');

        // Handle different status codes
        if (response.status === 401) {
          throw new UnauthorizedError('Authentication required');
        }
        if (response.status === 404) {
          throw new NotFoundError('Users not found', 'User');
        }
        if (!response.ok) {
          throw new ApiError(`HTTP ${response.status}`, response.status);
        }

        return response.json();
      },
      {
        attempts: 3,
        shouldRetry: (error, _attempt) => {
          // Don't retry auth errors or not found
          if (isApiError(error) && [401, 404].includes(error.status)) {
            return false;
          }
          return true;
        },
        onRetry: (_error, _attempt) => {
          toast.info('Retrying...');
        },
      }
    );

    toast.success('Users loaded successfully');
    return data;
  } catch (error) {
    // Handle error with toast and console logging
    handleError(error);

    // Rethrow if you want calling code to handle it
    throw error;
  }
}

// =============================================================================
// EXAMPLE 8: Form Validation Pattern
// =============================================================================

function exampleFormValidation(formData: Record<string, string | undefined>) {
  const errors: Record<string, string[]> = {};

  if (!formData.name || formData.name.trim().length === 0) {
    errors.name = ['Name is required'];
  } else if (formData.name.length < 3) {
    errors.name = ['Name must be at least 3 characters'];
  }

  if (!formData.email) {
    errors.email = ['Email is required'];
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = ['Email must be valid'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Form validation failed', errors, {
      formId: 'user-form',
      attemptedAt: new Date(),
    });
  }

  // Form is valid, proceed...
}

// =============================================================================
// EXAMPLE 9: Network Error Handling
// =============================================================================

async function exampleNetworkErrorHandling() {
  try {
    const response = await fetch('/api/data');
    return response.json();
  } catch (error) {
    // Check if it's a network error (no internet, timeout, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Unable to connect to server. Please check your internet connection.');
    }

    // Rethrow other errors
    throw error;
  }
}

// =============================================================================
// EXAMPLE 10: Error Boundary Pattern (for React error boundaries)
// =============================================================================

class ErrorBoundaryExample {
  hasError = false;
  error: Error | null = null;

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: Record<string, unknown>) {
    const errorDetails = handleError(error);
    console.error('Error boundary caught:', errorDetails, errorInfo);
    toast.error(errorDetails.message);
  }
}

export {
  exampleThrowingErrors,
  exampleHandleError,
  ExampleComponent,
  exampleToastNotifications,
  exampleWithRetry,
  exampleErrorTypeChecking,
  exampleCompleteApiPattern,
  exampleFormValidation,
  exampleNetworkErrorHandling,
  ErrorBoundaryExample,
};
