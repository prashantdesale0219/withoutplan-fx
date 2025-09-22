import axios from 'axios';
import { getAuthToken } from '../lib/cookieUtils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Plans API service
const planApi = {
  // Get all plans (public)
  getAllPlans: async () => {
    try {
      const response = await api.get('/api/plans');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch plans' };
    }
  },

  // Get plan by ID (public)
  getPlanById: async (planId) => {
    try {
      const response = await api.get(`/api/plans/${planId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch plan details' };
    }
  },

  // Get current user's plan (requires auth)
  getCurrentPlan: async () => {
    try {
      const response = await api.get('/plans/current');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch current plan' };
    }
  },

  // Select a plan (requires auth)
  selectPlan: async (planId) => {
    try {
      const response = await api.post('/plans/select', { planId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to select plan' };
    }
  },

  // Admin: Create new plan
  createPlan: async (planData) => {
    try {
      const response = await api.post('/api/plans/admin', planData);
      return response.data;
    } catch (error) {
      console.error('Create plan error:', error);
      throw error.response?.data || error.message || { message: 'Failed to create plan' };
    }
  },

  // Admin: Update plan
  updatePlan: async (planId, planData) => {
    try {
      const response = await api.put(`/api/plans/admin/${planId}`, planData);
      return response.data;
    } catch (error) {
      console.error('Update plan error:', error);
      throw error.response?.data || error.message || { message: 'Failed to update plan' };
    }
  },

  // Admin: Delete plan
  deletePlan: async (planId) => {
    try {
      const response = await api.delete(`/api/plans/admin/${planId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete plan' };
    }
  }
};

export default planApi;