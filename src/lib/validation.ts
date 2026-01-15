/**
 * Input validation utilities for forms and user inputs.
 * Provides consistent validation patterns across the application.
 * @module validation
 */

import { z } from 'zod';

/**
 * Email validation schema with proper sanitization.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be less than 255 characters' });

/**
 * Password validation schema with strength requirements.
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' });

/**
 * Simple password schema for less strict validation.
 */
export const simplePasswordSchema = z
  .string()
  .min(6, { message: 'Password must be at least 6 characters' })
  .max(128, { message: 'Password must be less than 128 characters' });

/**
 * Authentication form schema.
 */
export const authFormSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export type AuthFormData = z.infer<typeof authFormSchema>;

/**
 * Sanitizes a string for safe display by escaping HTML entities.
 *
 * @param input - String to sanitize
 * @returns Sanitized string safe for HTML display
 */
export function sanitizeHtml(input: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, (char) => escapeMap[char] || char);
}

/**
 * Validates that a value is a valid UUID v4.
 *
 * @param value - Value to validate
 * @returns True if valid UUID v4
 */
export function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Validates and normalizes a URL.
 *
 * @param url - URL string to validate
 * @returns Normalized URL or null if invalid
 */
export function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Trims and normalizes whitespace in a string.
 *
 * @param input - String to normalize
 * @returns Normalized string
 */
export function normalizeWhitespace(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Validates tool execution arguments against a schema.
 *
 * @param args - Arguments to validate
 * @param schema - Tool schema with properties and required fields
 * @returns Validation result with errors if any
 */
export function validateToolArgs(
  args: Record<string, unknown>,
  schema: { properties: Record<string, unknown>; required?: string[] }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = schema.required || [];

  // Check required fields
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
