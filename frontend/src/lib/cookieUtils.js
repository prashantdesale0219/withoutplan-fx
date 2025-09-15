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
 * Set authentication token in cookie
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  console.log('Setting auth token in frontend cookie:', token.substring(0, 10) + '...');
  setCookie('token', token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
  
  // Also store in localStorage as backup
  try {
    localStorage.setItem('auth_token', token);
    console.log('Token also stored in localStorage');
  } catch (error) {
    console.error('Failed to store token in localStorage:', error);
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
 * Set user data in cookie
 * @param {Object} userData - User object
 */
export const setUserData = (userData) => {
  setCookie('user_data', JSON.stringify(userData), {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
};

/**
 * Get user data from cookie
 * @returns {Object|null} - User object or null if not found
 */
export const getUserData = () => {
  const userData = getCookie('user_data');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from cookie:', error);
      return null;
    }
  }
  return null;
};

/**
 * Remove user data from cookie
 */
export const removeUserData = () => {
  removeCookie('user_data');
};

/**
 * Clear all authentication related cookies
 */
export const clearAuthCookies = () => {
  removeAuthToken();
  removeUserData();
};

/**
 * Check if user is authenticated
 * @returns {boolean|string} - True/token if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  // Check for token in cookie first
  const token = getCookie('token');
  
  // If not in cookie, check localStorage
  if (!token) {
    try {
      const localToken = localStorage.getItem('auth_token');
      if (localToken) {
        console.log('Token found in localStorage, syncing to cookie');
        // Set the token in cookie for future requests
        setAuthToken(localToken);
        
        // Also update the user data if available in localStorage
        const localUserData = localStorage.getItem('user_data');
        if (localUserData) {
          try {
            const userData = JSON.parse(localUserData);
            setUserData(userData);
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
          }
        }
        
        // Dispatch event to notify components about authentication change
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('loginStatusChanged'));
        }
        
        return localToken;
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }
    console.log('No authentication token found');
    return false;
  }
  
  console.log('Token found in cookie, user is authenticated');
  return token;
  
  // Commented out for now as we're not decoding on client side
  // try {
  //   // Decode token to check if it's valid
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   return !!decoded;
  // } catch (error) {
  //   return false;
  // }
};