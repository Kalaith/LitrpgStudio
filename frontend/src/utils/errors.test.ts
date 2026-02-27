/**
 * Tests for Error Handling System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AppError,
  ApiError,
  ValidationError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  handleError,
  withRetry,
  isApiError,
  isValidationError,
  isNetworkError,
  isNotFoundError,
  isUnauthorizedError,
  getErrorMessage,
} from './errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should include metadata', () => {
      const metadata = { userId: '123', action: 'delete' };
      const error = new AppError('Test error', metadata);
      expect(error.metadata).toEqual(metadata);
    });
  });

  describe('ApiError', () => {
    it('should create an error with status code', () => {
      const error = new ApiError('API failed', 500);
      expect(error.message).toBe('API failed');
      expect(error.name).toBe('ApiError');
      expect(error.status).toBe(500);
    });

    it('should include response data', () => {
      const response = { error: 'Internal server error' };
      const error = new ApiError('API failed', 500, response);
      expect(error.response).toEqual(response);
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error', () => {
      const validationErrors = {
        name: ['Name is required'],
        email: ['Email must be valid'],
      };
      const error = new ValidationError('Validation failed', validationErrors);
      expect(error.message).toBe('Validation failed');
      expect(error.name).toBe('ValidationError');
      expect(error.validationErrors).toEqual(validationErrors);
    });
  });

  describe('NetworkError', () => {
    it('should create a network error', () => {
      const error = new NetworkError();
      expect(error.name).toBe('NetworkError');
      expect(error.isOffline).toBeDefined();
    });

    it('should use custom message', () => {
      const error = new NetworkError('Connection timeout');
      expect(error.message).toBe('Connection timeout');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('User not found', 'User', '123');
      expect(error.message).toBe('User not found');
      expect(error.status).toBe(404);
      expect(error.resourceType).toBe('User');
      expect(error.resourceId).toBe('123');
    });

    it('should use default message', () => {
      const error = new NotFoundError();
      expect(error.message).toBe('Resource not found');
      expect(error.status).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Login required');
      expect(error.message).toBe('Login required');
      expect(error.status).toBe(401);
      expect(error.requiresLogin).toBe(true);
    });

    it('should use default message', () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe('Unauthorized access');
      expect(error.status).toBe(401);
    });
  });
});

describe('handleError utility', () => {
  it('should parse ApiError', () => {
    const error = new ApiError('API failed', 500, { details: 'error' });
    const info = handleError(error);

    expect(info.message).toBe('API failed');
    expect(info.type).toBe('ApiError');
    expect(info.status).toBe(500);
    expect(info.details).toEqual({ details: 'error' });
  });

  it('should parse ValidationError', () => {
    const validationErrors = { name: ['Required'] };
    const error = new ValidationError('Invalid', validationErrors);
    const info = handleError(error);

    expect(info.message).toBe('Invalid');
    expect(info.type).toBe('ValidationError');
    expect(info.details).toEqual(validationErrors);
  });

  it('should parse NetworkError', () => {
    const error = new NetworkError('Network failed');
    const info = handleError(error);

    expect(info.message).toBe('Network failed');
    expect(info.type).toBe('NetworkError');
    expect(info.details).toHaveProperty('isOffline');
  });

  it('should parse native Error', () => {
    const error = new Error('Native error');
    const info = handleError(error);

    expect(info.message).toBe('Native error');
    expect(info.type).toBe('Error');
  });

  it('should parse string error', () => {
    const info = handleError('String error');

    expect(info.message).toBe('String error');
    expect(info.type).toBe('Error');
  });

  it('should handle unknown error types', () => {
    const info = handleError({ weird: 'object' });

    expect(info.type).toBe('UnknownError');
    expect(info.details).toEqual({ weird: 'object' });
  });
});

describe('Error type guards', () => {
  it('should identify ApiError', () => {
    const error = new ApiError('Test', 500);
    expect(isApiError(error)).toBe(true);
    expect(isValidationError(error)).toBe(false);
  });

  it('should identify ValidationError', () => {
    const error = new ValidationError('Test', {});
    expect(isValidationError(error)).toBe(true);
    expect(isApiError(error)).toBe(false);
  });

  it('should identify NetworkError', () => {
    const error = new NetworkError('Test');
    expect(isNetworkError(error)).toBe(true);
    expect(isApiError(error)).toBe(false);
  });

  it('should identify NotFoundError', () => {
    const error = new NotFoundError('Test');
    expect(isNotFoundError(error)).toBe(true);
    expect(isApiError(error)).toBe(true); // NotFoundError extends ApiError
  });

  it('should identify UnauthorizedError', () => {
    const error = new UnauthorizedError('Test');
    expect(isUnauthorizedError(error)).toBe(true);
    expect(isApiError(error)).toBe(true); // UnauthorizedError extends ApiError
  });
});

describe('getErrorMessage utility', () => {
  it('should extract message from AppError', () => {
    const error = new AppError('App error message');
    expect(getErrorMessage(error)).toBe('App error message');
  });

  it('should extract message from Error', () => {
    const error = new Error('Error message');
    expect(getErrorMessage(error)).toBe('Error message');
  });

  it('should handle string error', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return generic message for unknown types', () => {
    const message = getErrorMessage({ unknown: true });
    expect(message).toBe('An unexpected error occurred');
  });
});

describe('withRetry utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should succeed on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, { attempts: 3, delay: 100 });

    // Fast-forward through delays
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should fail after max attempts', async () => {
    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = withRetry(fn, { attempts: 3, delay: 100 });
    const assertion = expect(promise).rejects.toThrow('persistent failure');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect shouldRetry option', async () => {
    const validationError = new ValidationError('Invalid data', {});
    const fn = vi.fn().mockRejectedValue(validationError);

    const promise = withRetry(fn, {
      attempts: 3,
      shouldRetry: (error) => !isValidationError(error),
    });

    await expect(promise).rejects.toThrow('Invalid data');
    expect(fn).toHaveBeenCalledTimes(1); // Should not retry validation errors
  });

  it('should call onRetry callback', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');

    const onRetry = vi.fn();

    const promise = withRetry(fn, {
      attempts: 2,
      delay: 100,
      onRetry,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const delays: number[] = [];
    const onRetry = vi.fn((_, _attempt) => {
      delays.push(Date.now());
    });

    withRetry(fn, {
      attempts: 3,
      delay: 100,
      backoffMultiplier: 2,
      onRetry,
    });

    // Advance through first retry (100ms)
    await vi.advanceTimersByTimeAsync(100);
    // Advance through second retry (200ms = 100ms * 2)
    await vi.advanceTimersByTimeAsync(200);

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should respect maxDelay', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(fn, {
      attempts: 3,
      delay: 5000,
      backoffMultiplier: 10,
      maxDelay: 1000, // Cap at 1 second
    });

    // Should use maxDelay instead of exponentially growing delay
    await vi.advanceTimersByTimeAsync(1000); // First retry
    await vi.advanceTimersByTimeAsync(1000); // Second retry (capped at 1000ms)

    const result = await promise;
    expect(result).toBe('success');
  });
});
