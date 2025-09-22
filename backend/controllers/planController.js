const asyncHandler = require('express-async-handler');
const Plan = require('../models/Plan');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * @desc    Select a plan for the user
 * @route   POST /api/plans/select
 * @access  Private
 */
const selectPlan = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  
  if (!planId) {
    throw new AppError('Plan ID is required', 400);
  }
  
  // Find the plan in database
  const plan = await Plan.findOne({ id: planId });
  
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  // Check if plan is active
  if (!plan.isActive) {
    throw new AppError('This plan is currently unavailable', 400);
  }
  
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if user is trying to select free plan again
  if (plan.id === 'free' && user.plan === 'free' && user.credits.imagesGenerated > 0) {
    throw new AppError('Free plan can only be used once', 400);
  }
  
  // Update user plan and credits
  user.plan = plan.id;
  user.planActivatedAt = Date.now();
  user.credits.balance = plan.credits;
  user.credits.totalPurchased = user.credits.totalPurchased + plan.credits;
  
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
  
  // Get plan details
  const plan = await Plan.findOne({ id: user.plan });
  
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        credits: plan.credits,
        description: plan.description,
        features: plan.features
      },
      userPlanDetails: {
        credits: user.credits.balance,
        imagesGenerated: user.credits.imagesGenerated,
        planActivatedAt: user.planActivatedAt
      }
    }
  });
});

/**
 * @desc    Get all available plans
 * @route   GET /api/plans
 * @access  Public
 */
const getPlans = asyncHandler(async (req, res) => {
  // Get all active plans
  const plans = await Plan.find({ isActive: true });
  
  res.status(200).json({
    success: true,
    plans
  });
});

/**
 * @desc    Get plan by ID
 * @route   GET /api/plans/:id
 * @access  Public
 */
const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findOne({ id: req.params.id });
  
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  res.status(200).json({
    success: true,
    plan
  });
});

/**
 * @desc    Create a new plan (Admin only)
 * @route   POST /api/plans/admin
 * @access  Admin
 */
const createPlan = asyncHandler(async (req, res) => {
  const { id, name, price, credits, description, features } = req.body;
  
  if (!id || !name || price === undefined || !credits) {
    throw new AppError('Please provide all required plan details', 400);
  }
  
  // Check if plan with this ID already exists
  const existingPlan = await Plan.findOne({ id });
  if (existingPlan) {
    throw new AppError('Plan with this ID already exists', 400);
  }
  
  // Create new plan
  const plan = await Plan.create({
    id,
    name,
    price,
    credits,
    description,
    features
  });
  
  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    plan
  });
});

/**
 * @desc    Update an existing plan (Admin only)
 * @route   PUT /api/plans/admin/:id
 * @access  Admin
 */
const updatePlan = asyncHandler(async (req, res) => {
  const { name, price, credits, description, features, isActive } = req.body;
  
  // Find plan by ID
  const plan = await Plan.findOne({ id: req.params.id });
  
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  // Update plan fields
  if (name) plan.name = name;
  if (price !== undefined) plan.price = price;
  if (credits !== undefined) plan.credits = credits;
  if (description !== undefined) plan.description = description;
  if (features !== undefined) plan.features = features;
  if (isActive !== undefined) plan.isActive = isActive;
  
  // Save updated plan
  await plan.save();
  
  res.status(200).json({
    success: true,
    message: 'Plan updated successfully',
    plan
  });
});

/**
 * @desc    Delete a plan (Admin only)
 * @route   DELETE /api/plans/admin/:id
 * @access  Admin
 */
const deletePlan = asyncHandler(async (req, res) => {
  // Find plan by ID
  const plan = await Plan.findOne({ id: req.params.id });
  
  if (!plan) {
    throw new AppError('Plan not found', 404);
  }
  
  // Check if any users are currently using this plan
  const usersWithPlan = await User.countDocuments({ plan: plan.id });
  
  if (usersWithPlan > 0) {
    // Instead of deleting, just mark as inactive
    plan.isActive = false;
    await plan.save();
    
    return res.status(200).json({
      success: true,
      message: 'Plan marked as inactive as it is currently in use by users'
    });
  }
  
  // If no users are using this plan, delete it
  await Plan.deleteOne({ id: req.params.id });
  
  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully'
  });
});

/**
 * @desc    Initialize default plans if none exist
 * @access  Internal
 */
const initDefaultPlans = asyncHandler(async () => {
  const count = await Plan.countDocuments();
  
  if (count === 0) {
    // Create default plans
    const defaultPlans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        credits: 3,
        description: 'One-time per user',
        features: [
          { text: "3 AI-generated images", header: false },
          { text: "Basic editing tools", header: false },
          { text: "Standard resolution", header: false },
          { text: "24/7 Support", header: false }
        ]
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 399,
        credits: 50,
        description: 'Starter plan',
        features: [
          { text: "50 AI-generated images", header: false },
          { text: "Advanced editing tools", header: false },
          { text: "HD resolution", header: false },
          { text: "Email support", header: false }
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 999,
        credits: 200,
        description: 'Recommended plan',
        features: [
          { text: "200 AI-generated images", header: false },
          { text: "Premium editing tools", header: false },
          { text: "4K resolution", header: false },
          { text: "Priority support", header: false },
          { text: "Commercial usage", header: false }
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2999,
        credits: 1000,
        description: 'For businesses',
        features: [
          { text: "1000 AI-generated images", header: false },
          { text: "All premium features", header: false },
          { text: "Unlimited resolution", header: false },
          { text: "Dedicated support", header: false },
          { text: "API access", header: false },
          { text: "Custom branding", header: false }
        ]
      }
    ];
    
    await Plan.insertMany(defaultPlans);
    console.log('Default plans initialized');
  }
});

// Call this function when the server starts
initDefaultPlans().catch(err => console.error('Error initializing default plans:', err));

module.exports = {
  selectPlan,
  getCurrentPlan,
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
};