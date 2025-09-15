import axios from 'axios';
import { getAuthToken } from './cookieUtils';

// Create a custom axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Important: This enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // Add timeout to prevent hanging requests
});

// Add a request interceptor to add auth token to every request
api.interceptors.request.use(
  config => {
    // Get token from cookie
    const token = getAuthToken();
    
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Added auth token to request headers');
    } else {
      console.log('No auth token available for request');
      
      // Try to get from localStorage as fallback
      if (typeof window !== 'undefined') {
        const localToken = localStorage.getItem('auth_token');
        if (localToken) {
          config.headers['Authorization'] = `Bearer ${localToken}`;
          console.log('Added auth token from localStorage to request');
        }
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Log detailed error information
    console.error('API Error:', error.message);
    
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - Cannot connect to backend server');
      // You can show a toast notification here if needed
    }
    
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected');
      
      // Check if we're in the login process
      const isLoginProcess = window.location.pathname === '/login' || 
                            (typeof window !== 'undefined' && 
                             window.location.href.includes('/api/auth/login'));
      
      // Only redirect if we're not in the login process
      if (!isLoginProcess) {
        console.log('Not in login process, redirecting to login');
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        console.log('In login process, not redirecting for 401 error');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;