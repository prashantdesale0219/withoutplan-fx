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
// File-based storage implementation
const getPlansFromStorage = asyncHandler(async (req, res) => {
  const plans = [
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
  
  // Return in a format that works with both admin panel and frontend
  res.status(200).json({
    success: true,
    plans: plans,
    data: { plans: plans }
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
  const existingPlans = await getPlansFromDB();
  if (existingPlans.some(plan => plan.id === id)) {
    throw new AppError('Plan with this ID already exists', 400);
  }
  
  // Add the new plan to the database or storage
  const newPlan = { id, name, price, credits, description, features };
  await savePlanToDB(newPlan);
  
  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: newPlan
  });
});

/**
 * @desc    Update an existing plan (Admin only)
 * @route   PUT /api/plans/admin/:id
 * @access  Admin
 */
const updatePlan = asyncHandler(async (req, res) => {
  const planId = req.params.id;
  const { name, price, credits, description, features } = req.body;
  
  // Get existing plans
  const plans = await getPlansFromDB();
  const planIndex = plans.findIndex(plan => plan.id === planId);
  
  if (planIndex === -1) {
    throw new AppError('Plan not found', 404);
  }
  
  // Update plan details
  plans[planIndex] = {
    ...plans[planIndex],
    name: name || plans[planIndex].name,
    price: price !== undefined ? price : plans[planIndex].price,
    credits: credits || plans[planIndex].credits,
    description: description || plans[planIndex].description,
    features: features || plans[planIndex].features
  };
  
  // Save updated plans
  await saveAllPlansToDB(plans);
  
  res.status(200).json({
    success: true,
    message: 'Plan updated successfully',
    data: plans[planIndex]
  });
});

/**
 * @desc    Delete a plan (Admin only)
 * @route   DELETE /api/plans/admin/:id
 * @access  Admin
 */
const deletePlan = asyncHandler(async (req, res) => {
  const planId = req.params.id;
  
  // Get existing plans
  const plans = await getPlansFromDB();
  const filteredPlans = plans.filter(plan => plan.id !== planId);
  
  if (plans.length === filteredPlans.length) {
    throw new AppError('Plan not found', 404);
  }
  
  // Save updated plans
  await saveAllPlansToDB(filteredPlans);
  
  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully'
  });
});

// Helper functions for plan storage
// In a real application, these would interact with a database
// For now, we'll use a simple file-based storage

const fs = require('fs').promises;
const path = require('path');

const PLANS_FILE = path.join(__dirname, '../data/plans.json');

// Initialize plans file if it doesn't exist
const initPlansFile = async () => {
  try {
    await fs.access(PLANS_FILE);
  } catch (error) {
    // File doesn't exist, create directory if needed
    try {
      await fs.mkdir(path.dirname(PLANS_FILE), { recursive: true });
    } catch (err) {
      // Directory already exists or cannot be created
      if (err.code !== 'EEXIST') throw err;
    }
    
    // Create initial plans file with default plans
    const defaultPlans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        credits: 3,
        description: 'One-time per user',
        features: ['3 AI-generated images', 'Basic editing tools', 'Standard resolution']
      },
      {
        id: 'basic',
        name: 'Basic',
        price: 399,
        credits: 50,
        description: 'Starter plan',
        features: ['50 AI-generated images', 'Advanced editing tools', 'HD resolution', 'Email support']
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 999,
        credits: 200,
        description: 'Recommended plan',
        features: ['200 AI-generated images', 'Premium editing tools', '4K resolution', 'Priority support', 'Commercial usage']
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 2999,
        credits: 1000,
        description: 'For businesses',
        features: ['1000 AI-generated images', 'All premium features', 'Unlimited resolution', 'Dedicated support', 'API access', 'Custom branding']
      }
    ];
    
    await fs.writeFile(PLANS_FILE, JSON.stringify(defaultPlans, null, 2));
    return defaultPlans;
  }
  
  return getPlansFromDB();
};

const getPlansFromDB = async () => {
  try {
    const data = await fs.readFile(PLANS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, initialize it
    if (error.code === 'ENOENT') {
      return initPlansFile();
    }
    throw error;
  }
};

const savePlanToDB = async (plan) => {
  const plans = await getPlansFromDB();
  plans.push(plan);
  await fs.writeFile(PLANS_FILE, JSON.stringify(plans, null, 2));
};

const saveAllPlansToDB = async (plans) => {
  await fs.writeFile(PLANS_FILE, JSON.stringify(plans, null, 2));
};

// Override the getPlans function to use the file-based storage
// Replacing the original getPlans function
getPlans = asyncHandler(async (req, res) => {
  const plans = await getPlansFromDB();
  
  res.status(200).json({
    success: true,
    plans
  });
});

module.exports = {
  selectPlan,
  getCurrentPlan,
  getPlans: getPlansFromStorage,
  createPlan,
  updatePlan,
  deletePlan
};