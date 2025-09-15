import axios from 'axios';
import { getAuthToken } from './cookieUtils';

// Create a custom axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true, // Important: This enables sending cookies with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, redirecting to login');
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;