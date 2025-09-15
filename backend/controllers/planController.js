const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * @desc    Select a plan for the user
 * @route   POST /api/plans/select
 * @access  Private
 */
const selectPlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;
  
  // Validate plan
  const validPlans = ['free', 'basic', 'pro', 'enterprise'];
  if (!validPlans.includes(plan)) {
    throw new AppError('Invalid plan selected', 400);
  }
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if user is trying to select free plan again
  if (plan === 'free' && user.plan === 'free' && user.credits.imagesGenerated > 0) {
    throw new AppError('Free plan can only be used once', 400);
  }
  
  // Assign credits based on plan
  let credits = 0;
  switch (plan) {
    case 'free':
      credits = 3;
      break;
    case 'basic':
      credits = 50;
      break;
    case 'pro':
      credits = 200;
      break;
    case 'enterprise':
      credits = 1000;
      break;
    default:
      credits = 3;
  }
  
  // Update user plan and credits
  user.plan = plan;
  user.planActivatedAt = Date.now();
  user.credits.balance = credits;
  user.credits.totalPurchased = user.credits.totalPurchased + credits;
  
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Plan activated successfully',
    data: {
      plan: user.plan,
      credits: user.credits.balance,
      planActivatedAt: user.planActivatedAt
    }
  });
});

/**
 * @desc    Get user's current plan
 * @route   GET /api/plans/current
 * @access  Private
 */
const getCurrentPlan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      plan: user.plan,
      credits: user.credits.balance,
      imagesGenerated: user.credits.imagesGenerated,
      planActivatedAt: user.planActivatedAt
    }
  });
});

/**
 * @desc    Get all available plans
 * @route   GET /api/plans
 * @access  Public
 */
const getPlans = asyncHandler(async (req, res) => {
  const plans = [
    {
      name: 'Free',
      price: 0,
      credits: 3,
      description: 'One-time per user',
      features: ['3 AI-generated images', 'Basic editing tools', 'Standard resolution']
    },
    {
      name: 'Basic',
      price: 399,
      credits: 50,
      description: 'Starter plan',
      features: ['50 AI-generated images', 'Advanced editing tools', 'HD resolution', 'Email support']
    },
    {
      name: 'Pro',
      price: 999,
      credits: 200,
      description: 'Recommended plan',
      features: ['200 AI-generated images', 'Premium editing tools', '4K resolution', 'Priority support', 'Commercial usage']
    },
    {
      name: 'Enterprise',
      price: 2999,
      credits: 1000,
      description: 'For businesses',
      features: ['1000 AI-generated images', 'All premium features', 'Unlimited resolution', 'Dedicated support', 'API access', 'Custom branding']
    }
  ];
  
  res.status(200).json({
    success: true,
    data: plans
  });
});

module.exports = {
  selectPlan,
  getCurrentPlan,
  getPlans
};