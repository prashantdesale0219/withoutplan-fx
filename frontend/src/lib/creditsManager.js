/**
 * Centralized Credits Management System
 * This module provides functions to manage credits across the application
 */
import { getCreditsByPlan } from './creditUtils';
import userApi from './userApi';
import adminApi from './adminApi';

/**
 * Get user credits based on their plan
 * @param {Object} user - User object containing plan and credits information
 * @returns {Object} - Credits object with total and used properties
 */
export const getUserCredits = (user) => {
  if (!user) return { total: 0, used: 0 };
  
  // If user has credits object, use it
  if (user.credits && typeof user.credits.total !== 'undefined') {
    return {
      total: user.credits.total,
      used: user.credits.used || 0,
      remaining: user.credits.total - (user.credits.used || 0)
    };
  }
  
  // Otherwise calculate based on plan
  const totalCredits = getCreditsByPlan(user.plan || 'Free');
  return {
    total: totalCredits,
    used: 0,
    remaining: totalCredits
  };
};

/**
 * Update user credits in the database
 * @param {string} userId - User ID
 * @param {Object} credits - Credits object with total and used properties
 * @param {boolean} isAdmin - Whether the request is from admin panel
 * @returns {Promise} - Promise resolving to updated user data
 */
export const updateUserCredits = async (userId, credits, isAdmin = false) => {
  try {
    if (isAdmin) {
      return await adminApi.updateUserCredits(userId, credits);
    } else {
      return await userApi.updateCredits(credits);
    }
  } catch (error) {
    console.error('Error updating credits:', error);
    throw error;
  }
};

/**
 * Reset user credits based on their plan
 * @param {string} userId - User ID
 * @param {string} plan - Plan type
 * @param {boolean} isAdmin - Whether the request is from admin panel
 * @returns {Promise} - Promise resolving to updated user data
 */
export const resetUserCredits = async (userId, plan, isAdmin = false) => {
  const totalCredits = getCreditsByPlan(plan || 'Free');
  const credits = {
    total: totalCredits,
    used: 0
  };
  
  try {
    return await updateUserCredits(userId, credits, isAdmin);
  } catch (error) {
    console.error('Error resetting credits:', error);
    throw error;
  }
};

/**
 * Use credits for a specific action
 * @param {number} amount - Amount of credits to use
 * @param {boolean} isAdmin - Whether the request is from admin panel
 * @returns {Promise} - Promise resolving to updated user data
 */
export const useCredits = async (amount, isAdmin = false) => {
  try {
    // Get current user data
    const response = isAdmin ? 
      await adminApi.getCurrentAdmin() : 
      await userApi.getCurrentUser();
    
    const user = response.data;
    const currentCredits = getUserCredits(user);
    
    // Check if user has enough credits
    if (currentCredits.remaining < amount) {
      throw new Error('Not enough credits');
    }
    
    // Update credits
    const updatedCredits = {
      total: currentCredits.total,
      used: currentCredits.used + amount
    };
    
    return await updateUserCredits(user._id, updatedCredits, isAdmin);
  } catch (error) {
    console.error('Error using credits:', error);
    throw error;
  }
};