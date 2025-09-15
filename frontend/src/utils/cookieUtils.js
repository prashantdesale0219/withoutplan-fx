import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

// Import lib cookieUtils functions for synchronization
import * as libCookieUtils from '../lib/cookieUtils';

// Cookie names
const TOKEN_COOKIE = 'fashionx_token';
const USER_COOKIE = 'fashionx_user';

// Lib cookie names for synchronization
const LIB_TOKEN_COOKIE = 'token';
const LIB_USER_COOKIE = 'user_data';

// Set token in cookie and sync with lib cookieUtils
export const setToken = (token) => {
  if (!token) return false;
  try {
    // Set in utils cookie
    Cookies.set(TOKEN_COOKIE, token, { expires: 7 }); // 7 days expiry
    
    // Sync with lib cookieUtils
    libCookieUtils.setAuthToken(token);
    
    // Also update localStorage for redundancy
    try {
      localStorage.setItem('auth_token', token);
    } catch (localError) {
      console.error('Error setting token in localStorage:', localError);
    }
    
    console.log('Token set and synchronized between utils and lib');
    return true;
  } catch (error) {
    console.error('Error setting token cookie:', error);
    return false;
  }
};

// Get token from cookie with fallback to lib cookieUtils
export const getToken = () => {
  try {
    // First try to get from utils cookie
    let token = Cookies.get(TOKEN_COOKIE);
    
    // If not found, try lib cookie
    if (!token) {
      token = libCookieUtils.getAuthToken();
      
      // If found in lib cookie, sync back to utils cookie
      if (token) {
        console.log('Token found in lib cookie, syncing to utils cookie');
        setToken(token);
      }
    }
    
    // If still not found, try localStorage
    if (!token && typeof window !== 'undefined') {
      try {
        token = localStorage.getItem('auth_token');
        if (token) {
          console.log('Token found in localStorage, syncing to cookies');
          setToken(token);
        }
      } catch (localError) {
        console.error('Error getting token from localStorage:', localError);
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting token cookie:', error);
    return null;
  }
};

// Remove token from cookie and sync with lib cookieUtils
export const removeToken = () => {
  try {
    // Remove from utils cookie
    Cookies.remove(TOKEN_COOKIE);
    
    // Sync with lib cookieUtils
    libCookieUtils.removeAuthToken();
    
    // Also remove from localStorage
    try {
      localStorage.removeItem('auth_token');
    } catch (localError) {
      console.error('Error removing token from localStorage:', localError);
    }
    
    console.log('Token removed and synchronized between utils and lib');
    return true;
  } catch (error) {
    console.error('Error removing token cookie:', error);
    return false;
  }
};

// Set user data in cookie and sync with lib cookieUtils
export const setUserData = (userData) => {
  if (!userData) return false;
  try {
    // Set in utils cookie
    Cookies.set(USER_COOKIE, JSON.stringify(userData), { expires: 7 }); // 7 days expiry
    
    // Sync with lib cookieUtils
    libCookieUtils.setUserData(userData);
    
    // Also update localStorage for redundancy
    try {
      localStorage.setItem('user_data', JSON.stringify(userData));
    } catch (localError) {
      console.error('Error setting user data in localStorage:', localError);
    }
    
    console.log('User data set and synchronized between utils and lib');
    return true;
  } catch (error) {
    console.error('Error setting user cookie:', error);
    return false;
  }
};

// Get user data from cookie with fallback to lib cookieUtils
export const getUserData = () => {
  try {
    // First try to get from utils cookie
    let userData = Cookies.get(USER_COOKIE);
    let parsedUserData = null;
    
    if (userData) {
      try {
        parsedUserData = JSON.parse(userData);
      } catch (parseError) {
        console.error('Error parsing user data from utils cookie:', parseError);
      }
    }
    
    // If not found or invalid, try lib cookie
    if (!parsedUserData) {
      const libUserData = libCookieUtils.getUserData();
      
      // If found in lib cookie, sync back to utils cookie
      if (libUserData) {
        console.log('User data found in lib cookie, syncing to utils cookie');
        setUserData(libUserData);
        parsedUserData = libUserData;
      }
    }
    
    // If still not found, try localStorage
    if (!parsedUserData && typeof window !== 'undefined') {
      try {
        const localUserData = localStorage.getItem('user_data');
        if (localUserData) {
          parsedUserData = JSON.parse(localUserData);
          console.log('User data found in localStorage, syncing to cookies');
          setUserData(parsedUserData);
        }
      } catch (localError) {
        console.error('Error getting user data from localStorage:', localError);
      }
    }
    
    return parsedUserData;
  } catch (error) {
    console.error('Error getting user cookie:', error);
    return null;
  }
};

// Remove user data from cookie and sync with lib cookieUtils
export const removeUserData = () => {
  try {
    // Remove from utils cookie
    Cookies.remove(USER_COOKIE);
    
    // Sync with lib cookieUtils
    libCookieUtils.removeUserData();
    
    // Also remove from localStorage
    try {
      localStorage.removeItem('user_data');
    } catch (localError) {
      console.error('Error removing user data from localStorage:', localError);
    }
    
    console.log('User data removed and synchronized between utils and lib');
    return true;
  } catch (error) {
    console.error('Error removing user cookie:', error);
    return false;
  }
};

// Check if token is valid
export const isTokenValid = () => {
  try {
    const token = getToken();
    if (!token) return false;
    
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

// Logout - clear all cookies and sync with lib cookieUtils
export const logout = () => {
  try {
    // Get user ID before removing data
    const userData = getUserData();
    const userId = userData?._id || 'guest';
    
    // Remove from utils cookies
    removeToken();
    removeUserData();
    
    // Sync with lib cookieUtils
    libCookieUtils.clearAuthCookies();
    
    // Clear user-specific image history
    try {
      const historyKey = `imageEditHistory_${userId}`;
      localStorage.removeItem(historyKey);
      console.log('Cleared user-specific image history for user:', userId);
    } catch (historyError) {
      console.error('Error clearing image history:', historyError);
    }
    
    console.log('Logout completed and synchronized between utils and lib');
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Synchronize cookies between utils and lib
export const syncCookies = () => {
  try {
    // Check utils cookies first
    const utilsToken = Cookies.get(TOKEN_COOKIE);
    let utilsUserData = null;
    try {
      const userData = Cookies.get(USER_COOKIE);
      if (userData) {
        utilsUserData = JSON.parse(userData);
      }
    } catch (parseError) {
      console.error('Error parsing user data from utils cookie:', parseError);
    }
    
    // Check lib cookies
    const libToken = libCookieUtils.getAuthToken();
    const libUserData = libCookieUtils.getUserData();
    
    // Sync token (prefer utils token if available)
    if (utilsToken && !libToken) {
      console.log('Syncing token from utils to lib');
      libCookieUtils.setAuthToken(utilsToken);
    } else if (!utilsToken && libToken) {
      console.log('Syncing token from lib to utils');
      setToken(libToken);
    }
    
    // Sync user data (prefer utils user data if available)
    if (utilsUserData && !libUserData) {
      console.log('Syncing user data from utils to lib');
      libCookieUtils.setUserData(utilsUserData);
    } else if (!utilsUserData && libUserData) {
      console.log('Syncing user data from lib to utils');
      setUserData(libUserData);
    }
    
    return true;
  } catch (error) {
    console.error('Error synchronizing cookies:', error);
    return false;
  }
};

// Call syncCookies on module load
if (typeof window !== 'undefined') {
  syncCookies();
}