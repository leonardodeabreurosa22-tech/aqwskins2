import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generate cryptographically secure random integer
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} - Random integer
 */
export const secureRandomInt = (min, max) => {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValue = Math.pow(256, bytesNeeded);
  const limit = maxValue - (maxValue % range);
  
  let randomValue;
  do {
    randomValue = crypto.randomBytes(bytesNeeded).reduce((acc, byte) => acc * 256 + byte, 0);
  } while (randomValue >= limit);
  
  return min + (randomValue % range);
};

/**
 * Generate HMAC hash for fairness verification
 * @param {string} data - Data to hash
 * @param {string} secret - Secret key
 * @returns {string} - HMAC hex string
 */
export const generateHMAC = (data, secret = process.env.HMAC_SECRET) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verify HMAC hash
 * @param {string} data - Original data
 * @param {string} hash - Hash to verify
 * @param {string} secret - Secret key
 * @returns {boolean} - Whether hash is valid
 */
export const verifyHMAC = (data, hash, secret = process.env.HMAC_SECRET) => {
  const expectedHash = generateHMAC(data, secret);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
};

/**
 * Hash password with bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(12);
    return bcrypt.default.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - Whether password matches
 */
export const comparePassword = async (password, hash) => {
  try {
    const bcrypt = await import('bcryptjs');
    return bcrypt.default.compare(password, hash);
  } catch (error) {
    console.error('Error comparing password:', error);
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Expiration time
 * @returns {string} - JWT token
 */
export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 * @param {object} payload - Token payload
 * @returns {string} - Refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
};

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text (iv:encrypted)
 */
export const encrypt = (text) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text (iv:encrypted)
 * @returns {string} - Decrypted plain text
 */
export const decrypt = (encryptedText) => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Generate unique ID
 * @returns {string} - UUID v4
 */
export const generateId = () => {
  return crypto.randomUUID();
};

/**
 * Generate fingerprint hash from user data
 * @param {object} data - User data (IP, user-agent, etc)
 * @returns {string} - Fingerprint hash
 */
export const generateFingerprint = (data) => {
  const fingerprintString = JSON.stringify(data);
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

export default {
  secureRandomInt,
  generateHMAC,
  verifyHMAC,
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  encrypt,
  decrypt,
  generateId,
  generateFingerprint
};
