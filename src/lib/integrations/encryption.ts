import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get the encryption key from environment variables.
 * In production, this should be a 32-byte base64-encoded key.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY environment variable is not set');
  }
  
  // Assume key is base64-encoded
  try {
    const decoded = Buffer.from(key, 'base64');
    if (decoded.length !== 32) {
      throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes (256 bits)');
    }
    return decoded;
  } catch (err) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key');
  }
}

/**
 * Encrypt a token string using AES-256-GCM.
 * Returns a base64-encoded string containing: salt + iv + authTag + ciphertext
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  // Combine salt + iv + authTag + encrypted data
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a token that was encrypted with encryptToken.
 * @param encryptedToken Base64-encoded string containing salt + iv + authTag + ciphertext
 */
export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedToken, 'base64');
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}
