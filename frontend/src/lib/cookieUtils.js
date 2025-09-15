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
 * Set auth token in cookie and localStorage
 * @param {string} token - Auth token
 */
export const setAuthToken = (token) => {
  // Set in cookie
  setCookie('token', token, {
    expires: 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  });
  
  // Also store in localStorage for redundancy and to ensure storage events work properly
  try {
    localStorage.setItem('auth_token', token);
    console.log('Auth token stored in both cookie and localStorage');
    
    // Dispatch a storage event to notify other components
    const storageEvent = new Event('storage');
    window.dispatchEvent(storageEvent);
  } catch (error) {
    console.error('Failed to store auth token in localStorage:', error);
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
  
  // Also clear any other auth-related localStorage items if they exist
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
    
    console.log('Cleared all auth data from cookies and localStorage');
  } catch (error) {
    console.error('Error clearing auth data from localStorage:', error);
  }
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