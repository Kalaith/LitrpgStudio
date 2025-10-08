# Error Handling System Documentation

## Overview

LitRPG Studio uses a standardized error handling system that provides:

- **Custom error classes** with typed metadata
- **Standardized error parsing** for consistent error handling
- **React hooks** for component-level error management
- **Toast notifications** for user feedback
- **Retry logic** with exponential backoff for resilient API calls

## Quick Start

```typescript
import { useErrorHandler, withRetry, toast } from '@/utils/errors';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const fetchData = async () => {
    try {
      // Retry failed requests automatically
      const data = await withRetry(() => api.getData());
      toast.success('Data loaded successfully');
      return data;
    } catch (error) {
      // Show toast and log to console
      handleError(error);
    }
  };

  return <button onClick={fetchData}>Load Data</button>;
}
```

## Custom Error Classes

### AppError (Base Class)

Base error class with optional metadata support.

```typescript
throw new AppError('Operation failed', {
  userId: '123',
  action: 'delete',
  timestamp: new Date(),
});
```

**Properties:**
- `message: string` - Error message
- `timestamp: Date` - When error occurred
- `metadata?: Record<string, any>` - Optional metadata

### ApiError

For API-related errors with HTTP status codes.

```typescript
throw new ApiError('Failed to fetch user', 404, {
  endpoint: '/api/users/123',
  method: 'GET',
});
```

**Properties:**
- All AppError properties
- `status: number` - HTTP status code
- `response?: any` - API response data

### ValidationError

For form and data validation errors.

```typescript
throw new ValidationError('Form validation failed', {
  name: ['Name is required', 'Name must be at least 3 characters'],
  email: ['Email must be valid'],
});
```

**Properties:**
- All AppError properties
- `validationErrors?: Record<string, string[]>` - Field-specific errors

### NetworkError

For network/connectivity errors.

```typescript
throw new NetworkError('Unable to connect to server');
```

**Properties:**
- All AppError properties
- `isOffline: boolean` - Whether user is offline

### NotFoundError (extends ApiError)

For 404 errors.

```typescript
throw new NotFoundError('User not found', 'User', '123');
```

**Properties:**
- All ApiError properties (status: 404)
- `resourceType?: string` - Type of resource
- `resourceId?: string` - Resource identifier

### UnauthorizedError (extends ApiError)

For 401 errors.

```typescript
throw new UnauthorizedError('Please log in to continue');
```

**Properties:**
- All ApiError properties (status: 401)
- `requiresLogin: boolean` - Whether login is required

## Utilities

### handleError()

Parse any error into a standardized `ErrorInfo` format.

```typescript
import { handleError } from '@/utils/errors';

try {
  await api.fetchData();
} catch (error) {
  const errorInfo = handleError(error);
  console.log(errorInfo);
  // {
  //   message: "Failed to fetch",
  //   type: "ApiError",
  //   status: 500,
  //   details: {...},
  //   timestamp: Date,
  //   metadata: {...}
  // }
}
```

### Toast Notifications

Global toast manager for user notifications.

```typescript
import { toast } from '@/utils/errors';

toast.success('Operation completed');
toast.error('Something went wrong');
toast.warning('Please review your input');
toast.info('Processing your request...');

// Custom duration (milliseconds)
toast.error('Critical error', 5000);
```

## React Hook

### useErrorHandler()

React hook for component-level error handling with automatic toast notifications.

```typescript
import { useErrorHandler } from '@/utils/errors';

function MyComponent() {
  const { error, handleError, clearError, hasError } = useErrorHandler();

  const fetchData = async () => {
    try {
      await api.getData();
    } catch (err) {
      // Automatically shows toast and logs to console
      handleError(err);
    }
  };

  return (
    <div>
      <button onClick={fetchData}>Load Data</button>
      {hasError && (
        <div className="error-banner">
          <p>{error?.message}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
```

**Returns:**
- `error: ErrorInfo | null` - Current error state
- `handleError: (error: unknown) => ErrorInfo` - Handle and display error
- `clearError: () => void` - Clear current error
- `hasError: boolean` - Whether there's an active error

## Retry Logic

### withRetry()

Retry failed promises with exponential backoff.

```typescript
import { withRetry, isValidationError, toast } from '@/utils/errors';

// Basic usage (3 attempts, 1s delay, 2x backoff)
const data = await withRetry(() => api.getData());

// Custom configuration
const data = await withRetry(
  () => api.getData(),
  {
    attempts: 5,
    delay: 500,
    backoffMultiplier: 1.5,
    maxDelay: 10000,

    // Don't retry certain errors
    shouldRetry: (error, attempt) => {
      if (isValidationError(error)) return false;
      if (isNotFoundError(error)) return false;
      return true;
    },

    // Callback on each retry
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}`);
      toast.warning(`Retrying... (${attempt}/5)`);
    },
  }
);
```

**Options:**
- `attempts?: number` - Number of retry attempts (default: 3)
- `delay?: number` - Initial delay in ms (default: 1000)
- `backoffMultiplier?: number` - Multiplier for exponential backoff (default: 2)
- `maxDelay?: number` - Maximum delay in ms (default: 10000)
- `shouldRetry?: (error, attempt) => boolean` - Determine if error is retryable
- `onRetry?: (error, attempt) => void` - Callback on each retry

## Type Guards

Check error types safely:

```typescript
import {
  isApiError,
  isValidationError,
  isNetworkError,
  isNotFoundError,
  isUnauthorizedError,
} from '@/utils/errors';

try {
  await api.fetchData();
} catch (error) {
  if (isApiError(error)) {
    console.log('API Error:', error.status);
  }

  if (isValidationError(error)) {
    console.log('Validation errors:', error.validationErrors);
  }

  if (isNetworkError(error) && error.isOffline) {
    toast.error('You are offline');
  }
}
```

## Helper Functions

### getErrorMessage()

Extract user-friendly message from any error type.

```typescript
import { getErrorMessage } from '@/utils/errors';

try {
  await api.fetchData();
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

## Best Practices

### 1. Use Specific Error Classes

```typescript
// ✅ Good - specific error class
if (response.status === 404) {
  throw new NotFoundError('User not found', 'User', userId);
}

// ❌ Bad - generic error
throw new Error('Not found');
```

### 2. Include Metadata for Debugging

```typescript
// ✅ Good - includes context
throw new ApiError('Failed to update user', 500, response, {
  userId,
  updateFields: ['name', 'email'],
  attemptedAt: new Date(),
});

// ❌ Bad - no context
throw new ApiError('Update failed', 500);
```

### 3. Handle Errors at Appropriate Levels

```typescript
// Component level - handle UI errors
function UserProfile() {
  const { handleError } = useErrorHandler();

  const updateProfile = async () => {
    try {
      await api.updateUser(data);
      toast.success('Profile updated');
    } catch (error) {
      handleError(error); // Show toast, log error
    }
  };
}

// Store level - handle business logic errors
const userStore = create((set) => ({
  updateUser: async (userId, data) => {
    try {
      const response = await withRetry(() => api.updateUser(userId, data));
      set({ user: response.data });
    } catch (error) {
      // Log but don't show toast (component will handle it)
      console.error('Failed to update user:', error);
      throw error; // Re-throw for component to handle
    }
  },
}));
```

### 4. Use Retry for Transient Failures

```typescript
// ✅ Good - retry network errors
const data = await withRetry(
  () => api.getData(),
  {
    shouldRetry: (error) => {
      // Retry network errors and 5xx errors
      return isNetworkError(error) ||
             (isApiError(error) && error.status >= 500);
    },
  }
);

// ❌ Bad - retry everything (including validation errors)
const data = await withRetry(() => api.getData());
```

### 5. Provide User-Friendly Messages

```typescript
// ✅ Good - clear message
throw new ValidationError('Please fill in all required fields', {
  name: ['Name is required'],
  email: ['Email must be valid'],
});

// ❌ Bad - technical jargon
throw new ValidationError('Validation schema mismatch at key path');
```

## Integration Examples

### API Client Integration

```typescript
// api/client.ts
import { ApiError, NetworkError } from '@/utils/errors';

async function request(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Network errors
    if (error instanceof TypeError) {
      throw new NetworkError('Unable to connect to server');
    }

    throw error;
  }
}
```

### Store Integration

```typescript
// stores/userStore.ts
import { create } from 'zustand';
import { withRetry } from '@/utils/errors';
import { userApi } from '@/api/users';

export const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await withRetry(() => userApi.getAll());
      set({ users: response.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users',
        isLoading: false,
      });
      throw error; // Re-throw for component to handle
    }
  },
}));
```

### Form Validation Integration

```typescript
// components/UserForm.tsx
import { useErrorHandler, ValidationError } from '@/utils/errors';

function UserForm() {
  const { handleError } = useErrorHandler();

  const validateForm = (data: FormData) => {
    const errors: Record<string, string[]> = {};

    if (!data.name) {
      errors.name = ['Name is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Please fix validation errors', errors);
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      validateForm(data);
      await api.createUser(data);
      toast.success('User created successfully');
    } catch (error) {
      if (isValidationError(error)) {
        // Show field-specific errors
        setFieldErrors(error.validationErrors);
      }
      handleError(error);
    }
  };
}
```

## Testing

See `errors.test.ts` for comprehensive test examples covering:
- Custom error class creation
- Error parsing and type guards
- Retry logic with exponential backoff
- Error message extraction

Run tests:
```bash
npm run test errors.test.ts
```

## Files

- `utils/errors.ts` - Main error handling implementation
- `utils/errors.example.ts` - Usage examples (reference only)
- `utils/errors.test.ts` - Comprehensive test suite
- `utils/ERROR_HANDLING.md` - This documentation
