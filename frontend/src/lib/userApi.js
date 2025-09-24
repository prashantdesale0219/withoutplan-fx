import api from './api';

/**
 * User API service for user-specific functionality
 */
const userApi = {
  /**
   * Get user profile information
   * @returns {Promise} - API response
   */
  getProfile: async () => {
    return api.get('/user/profile');
  },
  
  /**
   * Get user profile information (new API endpoint)
   * @returns {Promise} - API response
   */
  getUserProfile: async () => {
    return api.get('/api/user/profile');
  },
  
  /**
   * Update user profile information
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateProfile: async (profileData) => {
    return api.put('/api/user/profile', profileData);
  },
  
  /**
   * Update user profile information (new API endpoint)
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - API response
   */
  updateUserProfile: async (profileData) => {
    return api.put('/api/user/profile', profileData);
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Password data {currentPassword, newPassword}
   * @returns {Promise} - API response
   */
  changePassword: async (passwordData) => {
    return api.put('api/user/change-password', passwordData);
  },
  
  /**
   * Get user credits information
   * @returns {Promise} - API response
   */
  getCredits: async () => {
    return api.get('/user/credits');
  },
  
  /**
   * Update user credits
   * @param {Object} credits - Credits object {total, used}
   * @returns {Promise} - API response
   */
  updateCredits: async (credits) => {
    return api.patch('/user/credits', { credits });
  },
  
  /**
   * Get user transaction history
   * @returns {Promise} - API response
   */
  getTransactions: async () => {
    return api.get('/user/transactions');
  },
  
  /**
   * Get user media history
   * @returns {Promise} - API response
   */
  getMediaHistory: async () => {
    return api.get('/user/media');
  }
};

export default userApi;