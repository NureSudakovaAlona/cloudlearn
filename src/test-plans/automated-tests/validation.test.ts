// validation.test.ts
import { validateEmail, validatePhone, validatePassword } from '../../lib/validation';

describe('Validation functions', () => {
  test('validateEmail should correctly identify valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  test('validatePhone should correctly validate phone numbers', () => {
    expect(validatePhone('+380501234567')).toBe(true);
    expect(validatePhone('123')).toBe(false);
  });

  test('validatePassword should check password complexity', () => {
    expect(validatePassword('StrongP@ss123')).toBe(true);
    expect(validatePassword('weak')).toBe(false);
  });
});