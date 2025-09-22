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
    // Create a clean query params object without empty values
    const cleanFilters = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        cleanFilters[key] = filters[key];
      }
    });
    
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...cleanFilters
    }).toString();
    
    return api.get(`/api/admin/users?${queryParams}`);
  },
  
  /**
   * Get a single user by ID with full profile and media history
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  getUserById: async (userId) => {
    return api.get(`/api/admin/users/${userId}`);
  },
  
  /**
   * Update user credits
   * @param {String} userId - User ID
   * @param {Object} credits - Credits object {total, used}
   * @returns {Promise} - API response
   */
  updateUserCredits: async (userId, credits) => {
    return api.patch(`/api/admin/users/${userId}/credits`, { credits });
  },
  
  /**
   * Block or unblock a user
   * @param {String} userId - User ID
   * @param {Boolean} isBlocked - Block status
   * @returns {Promise} - API response
   */
  updateUserStatus: async (userId, isBlocked) => {
    return api.patch(`/api/admin/users/${userId}/status`, { isBlocked });
  },
  
  /**
   * Delete a user
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  deleteUser: async (userId) => {
    return api.delete(`/api/admin/users/${userId}`);
  },
  
  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} - API response
   */
  updateUser: async (userId, userData) => {
    return api.put(`/api/admin/users/${userId}`, userData);
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise} - API response
   */
  createUser: async (userData) => {
    return api.post(`/api/admin/users`, userData);
  },
  
  /**
   * Verify user OTP
   * @param {Object} data - OTP verification data
   * @returns {Promise} - API response
   */
  verifyUserOTP: async (data) => {
    return api.post(`/api/admin/users/verify-otp`, data);
  },
  
  /**
   * Get analytics data for admin dashboard
   * @returns {Promise} - API response
   */
  getAnalytics: async () => {
    return api.get('/api/admin/analytics');
  },
  
  /**
   * Update user plan
   * @param {String} userId - User ID
   * @param {Object} planData - Plan data {plan}
   * @returns {Promise} - API response
   */
  updateUserPlan: async (userId, planData) => {
    return api.patch(`/api/admin/users/${userId}/plan`, planData);
  },
  
  /**
   * Process refund for a transaction
   * @param {String} userId - User ID
   * @param {String} transactionId - Transaction ID
   * @returns {Promise} - API response
   */
  processRefund: async (userId, transactionId) => {
    return api.post(`/api/admin/users/${userId}/refund`, { transactionId });
  },
  
  /**
   * Get user transaction history
   * @param {String} userId - User ID
   * @returns {Promise} - API response
   */
  getUserTransactions: async (userId) => {
    return api.get(`/api/admin/users/${userId}/transactions`);
  },
  
  /**
   * Create a new user
   * @param {Object} userData - User data (firstName, lastName, email, password, plan, etc.)
   * @returns {Promise} - API response
   */
  createUser: async (userData) => {
    return api.post('/api/admin/users', userData);
  }
};

export default adminApi;