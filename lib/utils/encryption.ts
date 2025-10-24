/**
 * Encryption utilities for sensitive data
 * 
 * @fileoverview Centralized encryption/decryption for AWS credentials and sensitive data
 * @author CloudExtel Development Team
 * @version 1.0.0
 */

/**
 * Base64 encoding for development/testing
 * Note: This is NOT secure for production use - just obfuscation
 */

/**
 * Get encryption key from environment
 * @returns String containing the encryption key
 */
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (key.length < 16) {
    throw new Error('ENCRYPTION_KEY must be at least 16 characters long');
  }
  
  return key;
};

/**
 * Simple pass-through for development/testing
 * Note: This is NOT secure for production use
 */
export const encrypt = (text: string): string => {
  try {
    // For development, just return the text as-is
    return text;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Simple pass-through for development/testing
 * @param encryptedText - Encrypted text (actually plain text in dev)
 * @returns Decrypted string
 */
export const decrypt = (encryptedText: string): string => {
  try {
    // For development, just return the text as-is
    return encryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Encrypt AWS credentials for database storage
 * @param accessKey - AWS access key
 * @param secretKey - AWS secret key
 * @returns Object with encrypted credentials
 */
export const encryptAwsCredentials = (accessKey: string, secretKey: string) => {
  return {
    accessKeyEncrypted: encrypt(accessKey),
    secretKeyEncrypted: encrypt(secretKey)
  };
};

/**
 * Decrypt AWS credentials from database
 * @param accessKeyEncrypted - Encrypted AWS access key
 * @param secretKeyEncrypted - Encrypted AWS secret key
 * @returns Object with decrypted credentials
 */
export const decryptAwsCredentials = (accessKeyEncrypted: string, secretKeyEncrypted: string) => {
  return {
    accessKey: decrypt(accessKeyEncrypted),
    secretKey: decrypt(secretKeyEncrypted)
  };
};

/**
 * Generate a random encryption key (for initial setup)
 * @returns 32-character hex string suitable for ENCRYPTION_KEY
 */
export const generateEncryptionKey = (): string => {
  return require('crypto').randomBytes(32).toString('hex');
};

/**
 * Validate encryption key format
 * @param key - Key to validate
 * @returns True if key is valid
 */
export const isValidEncryptionKey = (key: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(key);
};
