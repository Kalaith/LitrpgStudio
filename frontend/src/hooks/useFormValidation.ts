import { useState, useCallback } from 'react';
import type { FormValidationResult, FormField } from '../types/common';
import { ERROR_MESSAGES, APP_CONFIG } from '../constants';

export type ValidationRule<T = string> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | undefined;
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  rules: ValidationRules<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [fields, setFields] = useState<Record<keyof T, FormField>>(() =>
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T] as string,
        touched: false,
        isDirty: false
      };
      return acc;
    }, {} as Record<keyof T, FormField>)
  );

  const validateField = useCallback(<K extends keyof T>(
    name: K,
    value: T[K]
  ): string | undefined => {
    const rule = rules[name];
    if (!rule) return undefined;

    const stringValue = String(value);

    if (rule.required && !stringValue.trim()) {
      return ERROR_MESSAGES.REQUIRED_FIELD;
    }

    if (rule.minLength && stringValue.length < rule.minLength) {
      return `Minimum length is ${rule.minLength} characters`;
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      return `Maximum length is ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(stringValue)) {
      return 'Invalid format';
    }

    if (rule.custom) {
      return rule.custom(value);
    }

    return undefined;
  }, [rules]);

  const validateForm = useCallback((): FormValidationResult => {
    const errors: Record<string, string> = {};
    let isValid = true;

    for (const [name, value] of Object.entries(values)) {
      const error = validateField(name as keyof T, value as T[keyof T]);
      if (error) {
        errors[name] = error;
        isValid = false;
      }
    }

    return { isValid, errors };
  }, [values, validateField]);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value: value as string,
        isDirty: true,
        error: validateField(name, value)
      }
    }));
  }, [validateField]);

  const setFieldTouched = useCallback(<K extends keyof T>(name: K) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        touched: true,
        error: validateField(name, values[name])
      }
    }));
  }, [values, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setFields(Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T] as string,
        touched: false,
        isDirty: false
      };
      return acc;
    }, {} as Record<keyof T, FormField>));
  }, [initialValues]);

  return {
    values,
    fields,
    setValue,
    setFieldTouched,
    validateForm,
    resetForm,
    isValid: validateForm().isValid
  };
}

// Pre-defined validation rules
export const commonValidationRules = {
  required: { required: true },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!value.includes('@')) return ERROR_MESSAGES.INVALID_EMAIL;
      return undefined;
    }
  },
  password: {
    required: true,
    minLength: APP_CONFIG.MIN_PASSWORD_LENGTH,
    custom: (value: string) => {
      if (value.length < APP_CONFIG.MIN_PASSWORD_LENGTH) {
        return ERROR_MESSAGES.PASSWORD_TOO_SHORT;
      }
      return undefined;
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50
  },
  description: {
    maxLength: APP_CONFIG.MAX_INPUT_LENGTH
  },
  level: {
    required: true,
    custom: (value: number) => {
      const num = Number(value);
      if (isNaN(num) || num < APP_CONFIG.MIN_LEVEL || num > APP_CONFIG.MAX_LEVEL) {
        return `Level must be between ${APP_CONFIG.MIN_LEVEL} and ${APP_CONFIG.MAX_LEVEL}`;
      }
      return undefined;
    }
  }
};