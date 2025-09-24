/**
 * Enhanced security utilities for the admin panel
 * Provides comprehensive protection against common web vulnerabilities
 */

/**
 * Validates user input to prevent XSS attacks
 * @param {string} input - User input to validate
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (!input) return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Encrypts sensitive data for storage
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
export const encryptData = (data) => {
  // In a real implementation, use a proper encryption library
  // This is a simple placeholder for demonstration
  return btoa(data);
};

/**
 * Decrypts sensitive data
 * @param {string} encryptedData - Encrypted data
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData) => {
  // In a real implementation, use a proper decryption library
  // This is a simple placeholder for demonstration
  return atob(encryptedData);
};

/**
 * Logs security events
 * @param {string} event - Event to log
 * @param {object} data - Additional data
 */
export const logSecurityEvent = (event, data = {}) => {
  
  // In a real implementation, send to server or monitoring service
};

/**
 * Rate limiting for API calls
 */
const rateLimits = {};

/**
 * Checks if a request is rate limited
 * @param {string} key - Rate limit key (e.g., endpoint, user ID)
 * @param {number} limit - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Whether request is allowed
 */
export const checkRateLimit = (key, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  
  if (!rateLimits[key]) {
    rateLimits[key] = {
      count: 1,
      resetAt: now + windowMs
    };
    return true;
  }
  
  if (now > rateLimits[key].resetAt) {
    rateLimits[key] = {
      count: 1,
      resetAt: now + windowMs
    };
    return true;
  }
  
  if (rateLimits[key].count >= limit) {
    return false;
  }
  
  rateLimits[key].count++;
  return true;
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with status and message
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return { 
      isValid: false, 
      message: 'Password must contain uppercase, lowercase, numbers, and special characters' 
    };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Detects suspicious activity based on user behavior
 * @param {Object} userActivity - User activity data
 * @returns {boolean} - Whether suspicious activity is detected
 */
export const detectSuspiciousActivity = (userActivity) => {
  const { loginAttempts, ipAddress, lastLogin, currentLogin } = userActivity;
  
  // Check for multiple failed login attempts
  if (loginAttempts > 5) {
    logSecurityEvent('Multiple failed login attempts', { loginAttempts });
    return true;
  }
  
  // Check for rapid location changes (if IP geolocation data is available)
  if (ipAddress?.previous && ipAddress?.current && 
      ipAddress.previous !== ipAddress.current) {
    // Calculate time difference between logins in hours
    const hoursDiff = (currentLogin - lastLogin) / (1000 * 60 * 60);
    
    // If location changed in less than 24 hours, might be suspicious
    if (hoursDiff < 24) {
      logSecurityEvent('Rapid location change', { 
        previousIP: ipAddress.previous,
        currentIP: ipAddress.current,
        hoursBetweenLogins: hoursDiff
      });
      return true;
    }
  }
  
  return false;
};
