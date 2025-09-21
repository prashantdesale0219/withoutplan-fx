const User = require('../models/User');
const Payment = require('../models/Payment');

// Function to get plan details (credits and price)
const getPlanDetails = (planName) => {
  switch(planName?.toLowerCase()) {
    case 'basic': return { credits: 50, price: 500 };
    case 'pro': return { credits: 200, price: 999 };
    case 'enterprise': return { credits: 1000, price: 2999 };
    case 'free':
    default: return { credits: 3, price: 0 };
  }
};

// Function to get credits based on plan name (for backward compatibility)
const getPlanCredits = (planName) => {
  return getPlanDetails(planName).credits;
};

/**
 * Get all users with filtering options
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { plan, media, tcAccepted, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { role: 'user' };
    
    // Only show users with role 'user', not admins
    if (plan) filter.plan = plan;
    if (tcAccepted) filter.termsAccepted = tcAccepted === 'true';
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const users = await User.find(filter)
      .select('-passwordHash -emailVerificationToken -passwordResetToken')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Enhance user data with plan and credits information
    const enhancedUsers = users.map(user => {
      const planCredits = getPlanCredits(user.plan);
      return {
        ...user._doc,
        credits: {
          totalPurchased: user.credits?.totalPurchased || planCredits,
          totalUsed: user.credits?.totalUsed || 0,
          balance: user.credits?.balance || planCredits,
          imagesGenerated: user.credits?.imagesGenerated || 0,
          videosGenerated: user.credits?.videosGenerated || 0,
          scenesGenerated: user.credits?.scenesGenerated || 0
        }
      };
    });
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: enhancedUsers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: enhancedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

/**
 * Update user plan
 * @route PATCH /api/admin/users/:id/plan
 * @access Private (Admin only)
 */
exports.updateUserPlan = async (req, res) => {
  try {
    const userId = req.params.id;
    const { plan, planPrice } = req.body;
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required'
      });
    }

    // Convert plan to lowercase to match User model schema
    const normalizedPlan = plan.toLowerCase();
    const validPlans = ['free', 'basic', 'pro', 'enterprise'];
    
    if (!validPlans.includes(normalizedPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan type'
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get plan details including credits
    const planDetails = getPlanDetails(normalizedPlan);
    
    // Update user plan and credits
    user.plan = normalizedPlan;
    
    // Update credits based on the plan
    if (!user.credits) {
      user.credits = {
        balance: planDetails.credits,
        totalPurchased: planDetails.credits,
        totalUsed: 0,
        imagesGenerated: 0
      };
    } else {
      // Update credits while preserving usage data
      user.credits.totalPurchased = planDetails.credits;
      user.credits.balance = planDetails.credits - (user.credits.totalUsed || 0);
      
      // Ensure balance doesn't go negative
      if (user.credits.balance < 0) {
        user.credits.balance = 0;
      }
    }
    
    // Update plan price if provided
    if (planPrice !== undefined) {
      user.planPrice = planPrice;
    } else {
      user.planPrice = planDetails.price;
    }
    
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User plan and credits updated successfully',
      data: {
        userId: user._id,
        plan: user.plan,
        planPrice: user.planPrice,
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user plan',
      error: error.message
    });
  }
};

/**
 * Log admin security actions
 * @route POST /api/admin/security/log
 * @access Private (Admin only)
 */
exports.logSecurityAction = async (req, res) => {
  try {
    const { action, timestamp } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }
    
    // Here you would typically save this to a database
    // For now, we'll just log it to the console
    console.log(`Admin Security Log: ${req.user.email} performed ${action} at ${timestamp}`);
    
    return res.status(200).json({
      success: true,
      message: 'Security action logged successfully'
    });
  } catch (error) {
    console.error('Error logging security action:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging security action',
      error: error.message
    });
  }
};

/**
 * Get a single user by ID with full profile and media history
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId)
      .select('-passwordHash -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Ensure credits are properly set based on plan
    const planDetails = getPlanDetails(user.plan);
    
    // Initialize credits if not present
    if (!user.credits) {
      user.credits = {
        totalPurchased: planDetails.credits,
        totalUsed: 0,
        balance: planDetails.credits,
        imagesGenerated: 0,
        videosGenerated: 0,
        scenesGenerated: 0
      };
      await user.save();
    } else if (user.credits.totalPurchased < planDetails.credits) {
      // Update credits if they're less than what the plan should provide
      user.credits.totalPurchased = planDetails.credits;
      user.credits.balance = planDetails.credits - user.credits.totalUsed;
      if (user.credits.balance < 0) user.credits.balance = 0;
      await user.save();
    }
    
    // Get user's payment history
    const payments = await Payment.find({ userId }).sort({ createdAt: -1 });
    
    // Enhance user data with plan and credits information
    const planCredits = planDetails.credits;
    const planPrice = planDetails.price;
    
    const enhancedUser = {
      ...user._doc,
      planPrice: planPrice,
      credits: {
        totalPurchased: user.credits?.totalPurchased || planCredits,
        totalUsed: user.credits?.totalUsed || 0,
        balance: user.credits?.balance || planCredits,
        imagesGenerated: user.credits?.imagesGenerated || 0,
        videosGenerated: user.credits?.videosGenerated || 0,
        scenesGenerated: user.credits?.scenesGenerated || 0
      }
    };
    
    res.status(200).json({
      success: true,
      data: enhancedUser
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

/**
 * Update user credits
 * @route PATCH /api/admin/users/:id/credits
 * @access Private (Admin only)
 */
exports.updateUserCredits = async (req, res) => {
  try {
    const userId = req.params.id;
    const { credits } = req.body;
    
    if (!credits || typeof credits !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Credits object is required'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize credits object if it doesn't exist
    if (!user.credits) {
      user.credits = {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        imagesGenerated: 0,
        videosGenerated: 0,
        scenesGenerated: 0
      };
    }
    
    // Update all credit fields
    if (credits.totalPurchased !== undefined) user.credits.totalPurchased = credits.totalPurchased;
    if (credits.totalUsed !== undefined) user.credits.totalUsed = credits.totalUsed;
    if (credits.balance !== undefined) user.credits.balance = credits.balance;
    if (credits.imagesGenerated !== undefined) user.credits.imagesGenerated = credits.imagesGenerated;
    if (credits.videosGenerated !== undefined) user.credits.videosGenerated = credits.videosGenerated;
    if (credits.scenesGenerated !== undefined) user.credits.scenesGenerated = credits.scenesGenerated;
    
    // For backward compatibility
    if (credits.total !== undefined) user.credits.totalPurchased = credits.total;
    if (credits.used !== undefined) user.credits.totalUsed = credits.used;
    
    // Calculate balance if not explicitly provided
    if (credits.balance === undefined && (credits.totalPurchased !== undefined || credits.totalUsed !== undefined)) {
      user.credits.balance = user.credits.totalPurchased - user.credits.totalUsed;
      // Ensure balance doesn't go negative
      if (user.credits.balance < 0) user.credits.balance = 0;
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User credits updated successfully',
      data: {
        credits: user.credits
      }
    });
  } catch (error) {
    console.error('Error updating user credits:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user credits',
      error: error.message
    });
  }
};

/**
 * Get analytics data for admin dashboard
 * @route GET /api/admin/analytics
 * @access Private (Admin only)
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Total users count
    const totalUsers = await User.countDocuments();
    
    // Users per plan
    const usersByPlan = await User.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Terms & Conditions acceptance
    const termsAccepted = await User.countDocuments({ termsAccepted: true });
    
    // Get media generation stats
    const users = await User.find();
    let totalImages = 0;
    let totalVideos = 0;
    let totalScenes = 0;
    let totalCreditsUsed = 0;
    let totalCreditsAllocated = 0;
    
    // Credits by plan
    let creditsByPlan = {
      Free: { used: 0, issued: 0 },
      Basic: { used: 0, issued: 0 },
      Pro: { used: 0, issued: 0 },
      Enterprise: { used: 0, issued: 0 }
    };
    
    users.forEach(user => {
      // Count media by type
      if (user.mediaGenerated) {
        user.mediaGenerated.forEach(media => {
          if (media.type === 'image') totalImages++;
          if (media.type === 'video') totalVideos++;
          if (media.type === 'scene') totalScenes++;
        });
      }
      
      // Count credits
      if (user.credits) {
        const used = user.credits.used || 0;
        const total = user.credits.total || 0;
        
        totalCreditsUsed += used;
        totalCreditsAllocated += total;
        
        // Add to plan-specific credits
        const plan = user.plan || 'Free';
        if (creditsByPlan[plan]) {
          creditsByPlan[plan].used += used;
          creditsByPlan[plan].issued += total;
        }
      }
    });
    
    // Format data for frontend
    const analytics = {
      userStats: {
        total: totalUsers,
        active: totalUsers, // Assuming all users are active for now
        new: 0, // This would need a date filter to calculate
        planDistribution: usersByPlan.reduce((acc, item) => {
          acc[item._id || 'Free'] = item.count;
          return acc;
        }, {}),
        termsAcceptanceRate: totalUsers > 0 ? termsAccepted / totalUsers : 0
      },
      mediaStats: {
        totalGenerated: totalImages + totalVideos + totalScenes,
        images: totalImages,
        videos: totalVideos,
        scenes: totalScenes
      },
      creditStats: {
        total: totalCreditsAllocated,
        totalIssued: totalCreditsAllocated,
        totalUsed: totalCreditsUsed,
        averagePerUser: totalUsers > 0 ? totalCreditsAllocated / totalUsers : 0,
        byPlan: creditsByPlan
      }
    };
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics',
      error: error.message
    });
  }
};