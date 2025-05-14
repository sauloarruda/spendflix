import getConfig from '@/common/config';
import { encrypt, decrypt } from '@/common/encryption';

describe('Encryption Utility', () => {
  describe('encrypt', () => {
    it('should encrypt text successfully', () => {
      const text = 'test-password-123';
      const encrypted = encrypt(text);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it('should throw error when ENCRYPTION_SECRET is not set', () => {
      const secret = getConfig().ENCRYPTION_SECRET;
      getConfig().ENCRYPTION_SECRET = undefined;
      expect(() => encrypt('test')).toThrow('ENCRYPTION_SECRET environment variable is required');
      getConfig().ENCRYPTION_SECRET = secret;
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
      const secret = getConfig().ENCRYPTION_SECRET;
      getConfig().ENCRYPTION_SECRET = 'different-secret-key-123456789012345';
      expect(() => decrypt(encrypted)).toThrow();
      getConfig().ENCRYPTION_SECRET = secret;
    });
  });

  describe('encrypt and decrypt', () => {
    it('should handle various text lengths', () => {
      const maxSpaces = 100;
      const texts = [
        'a',
        'short',
        'medium-length-password',
        'very-long-password-with-special-characters!@#$%^&*()_+',
        ' '.repeat(maxSpaces), // 100 spaces
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
