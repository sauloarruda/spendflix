import { encrypt, decrypt } from './encryption';

// Mock process.env.NODE_ENV
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'test';

describe('Encryption Utility', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_SECRET = 'test-secret-key-1234567890123456789012';
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('encrypt', () => {
    it('should encrypt text successfully', () => {
      const text = 'test-password-123';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should throw error when ENCRYPTION_SECRET is not set', () => {
      delete process.env.ENCRYPTION_SECRET;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET environment variable is required');
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text successfully', () => {
      const originalText = 'test-password-123';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should throw error when decrypting invalid data', () => {
      expect(() => decrypt('invalid-base64')).toThrow();
    });

    it('should throw error when decrypting with wrong key', () => {
      const originalText = 'test-password-123';
      const encrypted = encrypt(originalText);

      // Change the encryption key
      process.env.ENCRYPTION_SECRET = 'different-secret-key-123456789012345';

      expect(() => decrypt(encrypted)).toThrow();
    });
  });

  describe('encrypt and decrypt', () => {
    it('should handle various text lengths', () => {
      const texts = [
        'a',
        'short',
        'medium-length-password',
        'very-long-password-with-special-characters!@#$%^&*()_+',
        ' '.repeat(100), // 100 spaces
      ];

      texts.forEach((text) => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(specialChars);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(specialChars);
    });
  });
});
