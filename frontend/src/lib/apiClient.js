import axios from 'axios';
import { getAuthToken, removeAuthToken } from './cookieUtils';
import { API_URL } from './config';

/**
 * Enhanced API client with error handling and retry mechanism
 * Helps reduce network-related errors and improves reliability
 */
const apiClient = axios.create({
  baseURL: API_URL + '/api', // Use configured API URL
  timeout: 15000, // 15 seconds for production
  headers: {
    'Content-Type': 'application/json',
  },
  // CORS configuration for production
  withCredentials: false,
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from cookies if available
    const token = getAuthToken();
    
    // Debug logging for production
    if (process.env.NODE_ENV === 'production') {
      
    }
    
    // Add token to headers if available
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
    } else {
      
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors with retry logic
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        originalRequest._retryCount = originalRequest._retryCount || 0;
        
        if (originalRequest._retryCount < (originalRequest.retry || 2)) {
          originalRequest._retryCount++;
          
          // Wait before retrying
          await new Promise(resolve => 
            setTimeout(resolve, originalRequest.retryDelay || 1000)
          );
          
          
          return apiClient(originalRequest);
        }
      }
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if needed
      if (typeof window !== 'undefined') {
        removeAuthToken();
        
        // Dispatch custom event for components to react
        window.dispatchEvent(new CustomEvent('loginStatusChanged'));
      }
    }
    
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        code: error.code
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
