import Cookies from 'js-cookie';
import jwt_decode from 'jwt-decode';

// Cookie names
const TOKEN_COOKIE = 'fashionx_token';
const USER_COOKIE = 'fashionx_user';

// Set token in cookie
export const setToken = (token) => {
  if (!token) return false;
  try {
    Cookies.set(TOKEN_COOKIE, token, { expires: 7 }); // 7 days expiry
    return true;
  } catch (error) {
    console.error('Error setting token cookie:', error);
    return false;
  }
};

// Get token from cookie
export const getToken = () => {
  try {
    return Cookies.get(TOKEN_COOKIE);
  } catch (error) {
    console.error('Error getting token cookie:', error);
    return null;
  }
};

// Remove token from cookie
export const removeToken = () => {
  try {
    Cookies.remove(TOKEN_COOKIE);
    return true;
  } catch (error) {
    console.error('Error removing token cookie:', error);
    return false;
  }
};

// Set user data in cookie
export const setUserData = (userData) => {
  if (!userData) return false;
  try {
    Cookies.set(USER_COOKIE, JSON.stringify(userData), { expires: 7 }); // 7 days expiry
    return true;
  } catch (error) {
    console.error('Error setting user cookie:', error);
    return false;
  }
};

// Get user data from cookie
export const getUserData = () => {
  try {
    const userData = Cookies.get(USER_COOKIE);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user cookie:', error);
    return null;
  }
};

// Remove user data from cookie
export const removeUserData = () => {
  try {
    Cookies.remove(USER_COOKIE);
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

// Logout - clear all cookies
export const logout = () => {
  try {
    removeToken();
    removeUserData();
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};