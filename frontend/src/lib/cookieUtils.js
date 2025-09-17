// Cookie utility functions for managing authentication and user data

/**
 * Set a cookie with specified name, value, and options
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options (expires, path, secure, etc.)
 */
export const setCookie = (name, value, options = {}) => {
  if (typeof window === 'undefined') return; // Server-side check
  
  const defaults = {
    path: '/',
    expires: 7, // 7 days default
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  
  const cookieOptions = { ...defaults, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  
  // Add path
  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`;
  }
  
  // Add expiration
  if (cookieOptions.expires) {
    const date = new Date();
    date.setTime(date.getTime() + (cookieOptions.expires * 24 * 60 * 60 * 1000));
    cookieString += `; expires=${date.toUTCString()}`;
  }
  
  // Add secure flag
  if (cookieOptions.secure) {
    cookieString += '; secure';
  }
  
  // Add sameSite
  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`;
  }
  
  // Add httpOnly flag (note: this won't work from client-side JS)
  if (cookieOptions.httpOnly) {
    cookieString += '; httponly';
  }
  
  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  if (typeof window === 'undefined') return null; // Server-side check
  
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }
  return null;
};

/**
 * Remove a cookie by setting its expiration to the past
 * @param {string} name - Cookie name
 * @param {Object} options - Cookie options (path, domain)
 */
export const removeCookie = (name, options = {}) => {
  if (typeof window === 'undefined') return; // Server-side check
  
  const defaults = {
    path: '/'
  };
  
  const cookieOptions = { ...defaults, ...options };
  
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  
  if (cookieOptions.path) {
    cookieString += `; path=${cookieOptions.path}`;
  }
  
  if (cookieOptions.domain) {
    cookieString += `; domain=${cookieOptions.domain}`;
  }
  
  document.cookie = cookieString;
};

/**
 * Set auth token in secure cookie only
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  // Set in cookie only - this is the secure approach
  setCookie('token', token, {
    expires: 7, // 7 days
    secure: false, // Set to false for localhost development
    sameSite: 'strict', // Use strict for better security in development
    path: '/'
  });
  
  console.log('Auth token stored securely in cookie only');
  
  // Dispatch multiple events to notify other components immediately
  if (typeof window !== 'undefined') {
    const storageEvent = new Event('storage');
    const loginEvent = new Event('loginStatusChanged');
    window.dispatchEvent(storageEvent);
    window.dispatchEvent(loginEvent);
    
    // Also dispatch after a small delay to ensure all components catch it
    setTimeout(() => {
      window.dispatchEvent(new Event('loginStatusChanged'));
    }, 100);
  }
};

/**
 * Get authentication token from cookie
 * @returns {string|null} - Token or null if not found
 */
export const getAuthToken = () => {
  return getCookie('token');
};

/**
 * Remove authentication token
 */
export const removeAuthToken = () => {
  removeCookie('token');
};

/**
 * Set user data in cookie and localStorage
 * @param {Object} userData - User object
 */
export const setUserData = (userData) => {
  console.log('Setting user data in cookie and localStorage:', userData);
  
  // Set in cookie
  setCookie('user_data', JSON.stringify(userData), {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Also set in localStorage for redundancy and to ensure storage events work properly
  try {
    localStorage.setItem('user_data', JSON.stringify(userData));
  } catch (error) {
    console.error('Failed to store user data in localStorage:', error);
  }
};

/**
 * Get user data from cookie or localStorage
 * @returns {Object|null} User object or null
 */
export const getUserData = () => {
  // First try to get from cookie
  const userData = getCookie('user_data');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
    }
  }
  
  // If not in cookie, try localStorage
  try {
    const localUserData = localStorage.getItem('user_data');
    if (localUserData) {
      const parsedData = JSON.parse(localUserData);
      console.log('Retrieved user data from localStorage:', parsedData);
      return parsedData;
    }
  } catch (error) {
    console.error('Error retrieving user data from localStorage:', error);
  }
  
  return null;
};

/**
 * Remove user data from cookie and localStorage
 */
export const removeUserData = () => {
  // Remove from cookie
  removeCookie('user_data');
  
  // Remove from localStorage
  try {
    localStorage.removeItem('user_data');
  } catch (error) {
    console.error('Error removing user data from localStorage:', error);
  }
};

/**
 * Clear all auth cookies and localStorage data
 */
export const clearAuthCookies = () => {
  // Get user ID before removing data
  const userData = getUserData();
  const userId = userData?._id || 'guest';
  
  removeAuthToken();
  removeUserData();
  
  // Also clear any existing localStorage tokens to prevent bypass attempts
  try {
    localStorage.removeItem('auth_token');
    
    // Clear user-specific image history
    try {
      const historyKey = `imageEditHistory_${userId}`;
      localStorage.removeItem(historyKey);
      console.log('Cleared user-specific image history for user:', userId);
    } catch (historyError) {
      console.error('Error clearing image history:', historyError);
    }
    
    console.log('Cleared all auth data from cookies and localStorage for security');
  } catch (error) {
    console.error('Error clearing auth data from localStorage:', error);
  }
  
  // Dispatch event to notify components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('loginStatusChanged'));
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean|string} - True/token if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  // Only check for token in cookie - this is the secure source
  const token = getCookie('token');
  
  // If token exists in cookie, return it (backend will validate)
  if (token) {
    console.log('Token found in cookie, user is authenticated');
    return token;
  }
  
  // No token found in secure cookie storage
  console.log('No authentication token found in cookie');
  return false;
};

/**
 * Validate token with backend server
 * @param {string} token - Token to validate
 * @returns {Promise<boolean>} - True if token is valid, false otherwise
 */
export const validateTokenWithBackend = async (token) => {
  if (!token) return false;
  
  try {
    // Use the backend API URL
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    
    // If token is invalid, don't clear cookies immediately
    // Let the calling function decide whether to clear
    return false;
  } catch (error) {
    console.error('Error validating token with backend:', error);
    // On network error, assume token might be valid (don't clear)
    return true;
  }
};

/**
 * Enhanced authentication check that validates with backend
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 */
export const isAuthenticatedWithValidation = async () => {
  const token = isAuthenticated();
  if (!token) return false;
  
  // Validate token with backend
  const isValid = await validateTokenWithBackend(token);
  if (!isValid) {
    console.log('Token validation failed, clearing auth data');
    clearAuthCookies();
    return false;
  }
  
  return true;
};