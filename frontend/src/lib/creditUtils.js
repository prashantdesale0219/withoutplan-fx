/**
 * Credit utility functions for managing user credits across the application
 */

/**
 * Get credit allocation based on plan type
 * @param {string} planType - The user's plan (Free, Basic, Pro, Enterprise)
 * @returns {number} - Total credits for the plan
 */
export const getCreditsByPlan = (planType) => {
  // Normalize plan type to handle case variations
  const normalizedPlanType = planType?.toLowerCase() || 'free';
  
  const planCredits = {
    'free': 3,
    'basic': 50,
    'pro': 200,
    'enterprise': 1000,
    'custom': null // Custom plans will need to be set manually
  };

  return planCredits[normalizedPlanType] || 3; // Default to Free plan credits
};

/**
 * Calculate credit usage percentage
 * @param {Object} credits - The credits object with used and total properties
 * @returns {number} - Percentage of credits used (0-100)
 */
export const calculateCreditUsage = (credits) => {
  if (!credits || !credits.total) return 0;
  const percentage = (credits.used / credits.total) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Ensure between 0-100
};

/**
 * Format credit display for UI
 * @param {Object} credits - The credits object with used and total properties
 * @returns {string} - Formatted credit display
 */
export const formatCreditDisplay = (credits) => {
  if (!credits) return '0 / 0';
  return `${credits.used || 0} / ${credits.total || 0}`;
};

/**
 * Get color class based on credit usage
 * @param {number} percentage - Credit usage percentage
 * @returns {string} - Tailwind CSS color class
 */
export const getCreditColorClass = (percentage) => {
  if (percentage >= 90) return 'bg-red-600';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-blue-600';
};