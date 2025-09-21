import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Plans management
export const getPlans = async () => {
  try {
    const response = await api.get('/api/plans');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch plans' };
  }
};

export const createPlan = async (planData) => {
  try {
    const response = await api.post('/api/plans/admin', planData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create plan' };
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const response = await api.put(`/api/plans/admin/${planId}`, planData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update plan' };
  }
};

export const deletePlan = async (planId) => {
  try {
    const response = await api.delete(`/api/plans/admin/${planId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete plan' };
  }
};

// User management
export const getUsers = async () => {
  try {
    const response = await api.get('/api/users/admin');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

// Analytics
export const getAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch analytics' };
  }
};

export default {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getUsers,
  getAnalytics
};