/**
 * Unit tests for validation utility functions.
 * @module validation.test
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  simplePasswordSchema,
  authFormSchema,
  sanitizeHtml,
  isValidUuid,
  normalizeUrl,
  normalizeWhitespace,
  validateToolArgs,
} from '../validation';

describe('emailSchema', () => {
  it('accepts valid email addresses', () => {
    expect(() => emailSchema.parse('user@example.com')).not.toThrow();
    expect(() => emailSchema.parse('test.user@domain.co.uk')).not.toThrow();
  });

  it('trims and lowercases email', () => {
    expect(emailSchema.parse('  User@Example.COM  ')).toBe('user@example.com');
  });

  it('rejects invalid email addresses', () => {
    expect(() => emailSchema.parse('invalid')).toThrow();
    expect(() => emailSchema.parse('user@')).toThrow();
    expect(() => emailSchema.parse('@domain.com')).toThrow();
  });

  it('rejects emails longer than 255 characters', () => {
    const longEmail = 'a'.repeat(250) + '@test.com';
    expect(() => emailSchema.parse(longEmail)).toThrow();
  });
});

describe('passwordSchema', () => {
  it('accepts valid passwords', () => {
    expect(() => passwordSchema.parse('Password1')).not.toThrow();
    expect(() => passwordSchema.parse('MyStr0ngP@ss')).not.toThrow();
  });

  it('rejects passwords shorter than 8 characters', () => {
    expect(() => passwordSchema.parse('Pass1')).toThrow();
  });

  it('rejects passwords without uppercase', () => {
    expect(() => passwordSchema.parse('password1')).toThrow();
  });

  it('rejects passwords without lowercase', () => {
    expect(() => passwordSchema.parse('PASSWORD1')).toThrow();
  });

  it('rejects passwords without numbers', () => {
    expect(() => passwordSchema.parse('Password')).toThrow();
  });
});

describe('simplePasswordSchema', () => {
  it('accepts passwords 6+ characters', () => {
    expect(() => simplePasswordSchema.parse('simple')).not.toThrow();
    expect(() => simplePasswordSchema.parse('123456')).not.toThrow();
  });

  it('rejects passwords shorter than 6 characters', () => {
    expect(() => simplePasswordSchema.parse('short')).toThrow();
  });

  it('rejects passwords longer than 128 characters', () => {
    expect(() => simplePasswordSchema.parse('a'.repeat(129))).toThrow();
  });
});

describe('authFormSchema', () => {
  it('validates complete auth form data', () => {
    const result = authFormSchema.parse({
      email: 'user@example.com',
      password: 'password123',
    });
    expect(result.email).toBe('user@example.com');
    expect(result.password).toBe('password123');
  });

  it('rejects incomplete form data', () => {
    expect(() => authFormSchema.parse({ email: 'user@example.com' })).toThrow();
    expect(() => authFormSchema.parse({ password: 'password123' })).toThrow();
  });
});

describe('sanitizeHtml', () => {
  it('escapes HTML entities', () => {
    expect(sanitizeHtml('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeHtml('"test"')).toBe('&quot;test&quot;');
    expect(sanitizeHtml("'test'")).toBe('&#x27;test&#x27;');
  });

  it('escapes ampersands', () => {
    expect(sanitizeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('leaves safe text unchanged', () => {
    expect(sanitizeHtml('Hello World')).toBe('Hello World');
  });

  it('handles mixed content', () => {
    expect(sanitizeHtml('<a href="test">Click</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;Click&lt;&#x2F;a&gt;'
    );
  });
});

describe('isValidUuid', () => {
  it('accepts valid UUID v4', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('6ba7b810-9dad-41d4-80b4-00c04fd430c8')).toBe(true);
  });

  it('rejects invalid UUIDs', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-21d4-a716-446655440000')).toBe(false); // v2
    expect(isValidUuid('')).toBe(false);
  });
});

describe('normalizeUrl', () => {
  it('normalizes valid HTTP/HTTPS URLs', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com/');
    expect(normalizeUrl('http://test.com/path')).toBe('http://test.com/path');
  });

  it('returns null for invalid URLs', () => {
    expect(normalizeUrl('not a url')).toBe(null);
    expect(normalizeUrl('')).toBe(null);
  });

  it('rejects non-HTTP protocols', () => {
    expect(normalizeUrl('ftp://example.com')).toBe(null);
    expect(normalizeUrl('javascript:alert(1)')).toBe(null);
  });
});

describe('normalizeWhitespace', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('collapses multiple spaces to single space', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('handles mixed whitespace characters', () => {
    expect(normalizeWhitespace('hello\t\n  world')).toBe('hello world');
  });
});

describe('validateToolArgs', () => {
  const schema = {
    properties: {
      name: { type: 'string' },
      count: { type: 'number' },
    },
    required: ['name'],
  };

  it('validates args with all required fields', () => {
    const result = validateToolArgs({ name: 'test' }, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when required field is missing', () => {
    const result = validateToolArgs({ count: 5 }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name is required');
  });

  it('fails when required field is empty string', () => {
    const result = validateToolArgs({ name: '' }, schema);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('name is required');
  });

  it('validates schema without required fields', () => {
    const optionalSchema = { properties: { name: {} } };
    const result = validateToolArgs({}, optionalSchema);
    expect(result.valid).toBe(true);
  });
});
