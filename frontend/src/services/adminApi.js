import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const adminApi = {
  // User management
  getAllUsers: () => api.get('/api/admin/users'),
  getUserById: (userId) => api.get(`/api/admin/users/${userId}`),
  updateUserCredits: (userId, credits) => api.patch(`/api/admin/users/${userId}/credits`, { credits }),
  updateUserStatus: (userId, status) => api.patch(`/api/admin/users/${userId}/status`, { status }),
  deleteUser: (userId) => api.delete(`/api/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/api/admin/users/${userId}`, userData),
  createUser: (userData) => api.post('/api/admin/users', userData),
  verifyUserOTP: (data) => api.post('/api/admin/users/verify-otp', data),
  
  // Analytics
  getAnalytics: () => api.get('/api/admin/analytics'),
  
  // Refunds
  processRefund: (userId, data) => api.post(`/api/admin/users/${userId}/refund`, data),
  
  // Transactions
  getUserTransactions: (userId) => api.get(`/api/admin/users/${userId}/transactions`),
  
  // Plans
  updateUserPlan: (userId, planData) => api.patch(`/api/admin/users/${userId}/plan`, planData),
  
  // Security logging
  logSecurityAction: (actionData) => api.post('/api/admin/security/log', actionData),
  
  // Environment variables
  getEnvironmentVariables: () => api.get('/api/admin/environment'),
  updateEnvironmentVariables: (variables) => api.post('/api/admin/environment', { variables }),
  addEnvironmentVariable: (key, value) => api.post('/api/admin/environment/variable', { key, value }),
  deleteEnvironmentVariable: (key) => api.delete(`/api/admin/environment/variable/${key}`),
};

export default adminApi;