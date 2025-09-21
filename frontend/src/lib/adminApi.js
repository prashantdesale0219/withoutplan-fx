import api from './api';

/**
 * Admin API service for dashboard functionality
 */
const adminApi = {
  /**
   * Get all users with optional filtering
   * @param {Object} filters - Filter parameters (plan, media, tcAccepted, search)
   * @param {Number} page - Page number for pagination
   * @param {Number} limit - Number of items per page
   * @returns {Promise} - API response
   */
  getUsers: async (filters = {}, page = 1, limit = 10) => {
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...filters
    }).toString();
    
    return api.get(`/admin/users?${queryParams}`);
  },
  
  /**
   * Get a single user by ID with full profile and media history
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  getUserById: async (userId) => {
    return api.get(`/admin/users/${userId}`);
  },
  
  /**
   * Update user credits
   * @param {String} userId - User ID
   * @param {Object} credits - Credits object {total, used}
   * @returns {Promise} - API response
   */
  updateUserCredits: async (userId, credits) => {
    return api.patch(`/admin/users/${userId}/credits`, { credits });
  },
  
  /**
   * Get analytics data for admin dashboard
   * @returns {Promise} - API response
   */
  getAnalytics: async () => {
    return api.get('/admin/analytics');
  },
  
  /**
   * Update user plan
   * @param {String} userId - User ID
   * @param {Object} planData - Plan data {plan}
   * @returns {Promise} - API response
   */
  updateUserPlan: async (userId, planData) => {
    return api.patch(`/admin/users/${userId}/plan`, planData);
  },
  
  /**
   * Process refund for a transaction
   * @param {String} userId - User ID
   * @param {String} transactionId - Transaction ID
   * @returns {Promise} - API response
   */
  processRefund: async (userId, transactionId) => {
    return api.post(`/admin/users/${userId}/refund`, { transactionId });
  },
  
  /**
   * Get user transaction history
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  getUserTransactions: async (userId) => {
    return api.get(`/admin/users/${userId}/transactions`);
  }
};

export default adminApi;