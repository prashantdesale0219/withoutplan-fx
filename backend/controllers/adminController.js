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
    if (plan) filter.plan = plan.toLowerCase();
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
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      status: 'success',
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: users
    });
  } catch (err) {
    console.error('Error in getAllUsers:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users'
    });
  }
};

/**
 * Get user by ID with full profile and media history
 * @route GET /api/admin/users/:id
 * @access Private (Admin only)
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Get user's payment history
    const payments = await Payment.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      status: 'success',
      data: {
        user,
        payments
      }
    });
  } catch (err) {
    console.error('Error in getUserById:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user details'
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
    const { credits } = req.body;
    
    if (!credits) {
      return res.status(400).json({
        status: 'error',
        message: 'Credits data is required'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user credits
    user.credits = {
      ...user.credits,
      ...credits
    };
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'User credits updated successfully',
      data: {
        credits: user.credits
      }
    });
  } catch (err) {
    console.error('Error in updateUserCredits:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user credits'
    });
  }
};

/**
 * Update user status (block/unblock)
 * @route PATCH /api/admin/users/:userId/status
 * @access Private (Admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { isBlocked } = req.body;
    
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'isBlocked must be a boolean value'
      });
    }
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    user.isBlocked = isBlocked;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          isBlocked: user.isBlocked
        }
      }
    });
  } catch (err) {
    console.error('Error in updateUserStatus:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user status'
    });
  }
};

/**
 * Delete user
 * @route DELETE /api/admin/users/:userId
 * @access Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteUser:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete user'
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/admin/users/:userId
 * @access Private (Admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, plan, role } = req.body;
    
    // Find user
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (plan) user.plan = plan;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    
    await user.save();
    
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          plan: user.plan,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error('Error in updateUser:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update user'
    });
  }
};

/**
 * Create new user
 * @route POST /api/admin/users
 * @access Private (Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, plan, role, planPrice, credits } = req.body;
    
    // Check if required fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide firstName, lastName, email and password'
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      role: role && ['user', 'admin'].includes(role) ? role : 'user',
      plan: plan || 'Free',
      emailVerified: true // Admin created accounts are pre-verified
    });
    
    // Set password
    newUser.setPassword(password);
    
    // Set planPrice
    const planDetails = getPlanDetails(newUser.plan);
    newUser.planPrice = planPrice !== undefined ? planPrice : planDetails.price;
    
    // Set credits based on provided credits or plan
    if (credits) {
      newUser.credits = {
        ...credits,
        totalUsed: credits.totalUsed || 0,
        balance: credits.balance || planDetails.credits
      };
    } else {
      newUser.credits = {
        totalPurchased: planDetails.credits,
        totalUsed: 0,
        balance: planDetails.credits,
        imagesGenerated: 0,
        videosGenerated: 0,
        scenesGenerated: 0
      };
    }
    
    await newUser.save();
    
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          _id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          plan: newUser.plan,
          planPrice: newUser.planPrice,
          credits: newUser.credits,
          role: newUser.role
        }
      }
    });
  } catch (err) {
    console.error('Error in createUser:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create user'
    });
  }
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
    if (plan) filter.plan = plan.toLowerCase();
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
 * Block/Unblock a user
 * @route PATCH /api/admin/users/:userId/status
 * @access Private (Admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;
    
    if (typeof isBlocked !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: 'isBlocked field must be a boolean value' 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Update user status
    user.isBlocked = isBlocked;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: isBlocked ? 'User has been blocked' : 'User has been unblocked',
      data: {
        userId: user._id,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating user status' 
    });
  }
};

/**
 * Delete a user
 * @route DELETE /api/admin/users/:userId
 * @access Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    return res.status(200).json({
      success: true,
      message: 'User has been deleted successfully',
      data: {
        userId
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting user' 
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/admin/users/:userId
 * @access Private (Admin only)
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, plan } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Update user fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (plan) user.plan = plan.toLowerCase();
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          plan: user.plan
        }
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while updating user' 
    });
  }
};

/**
 * Verify OTP for admin created user
 * @route POST /api/admin/users/verify-otp
 * @access Private (Admin only)
 */
exports.verifyUserOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    // Check if required fields are provided
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userId and OTP'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if OTP is valid and not expired
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    if (user.otpExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    // Mark user as verified
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpires = null;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (err) {
    console.error('Error in verifyUserOTP:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while verifying OTP'
    });
  }
};

/**
 * Create a new user
 * @route POST /api/admin/users
 * @access Private (Admin only)
 */
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, plan = 'free', planPrice, credits } = req.body;
    
    // Check if required fields are provided
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide firstName, lastName, email and password'
      });
    }
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Generate OTP for email verification
    const emailService = require('../services/emailService');
    const otp = emailService.generateOTP();
    const otpExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
    
    // Create new user with unverified status
    const user = new User({
      firstName,
      lastName,
      email,
      phone,
      plan: plan.toLowerCase(),
      role: 'user',
      isEmailVerified: false, // Set to false until OTP verification
      otp: otp,
      otpExpires: otpExpires,
      termsAccepted: true, // Admin created users accept terms by default
      isBlocked: false
    });
    
    // Use bcrypt to encrypt password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    
    // Set planPrice
    const planDetails = getPlanDetails(plan);
    user.planPrice = planPrice !== undefined ? planPrice : planDetails.price;
    
    // Set credits based on provided credits or plan
    if (credits) {
      user.credits = {
        ...credits,
        totalUsed: credits.totalUsed || 0,
        balance: credits.balance || planDetails.credits
      };
    } else {
      user.credits = {
        totalPurchased: planDetails.credits,
        totalUsed: 0,
        balance: planDetails.credits,
        imagesGenerated: 0,
        videosGenerated: 0,
        scenesGenerated: 0
      };
    }
    
    await user.save();
    
    // Send OTP to user's email
    try {
      await emailService.sendNewUserVerificationOTP(email, firstName, otp);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Continue with user creation even if email fails
    }
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully. OTP sent to email for verification.',
      userId: user._id,
      requiresOTP: true,
      data: {
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          plan: user.plan,
          planPrice: user.planPrice,
          credits: user.credits
        }
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while creating user',
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
    // Get total users count
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Get users by plan
    const freeUsers = await User.countDocuments({ role: 'user', plan: 'free' });
    const basicUsers = await User.countDocuments({ role: 'user', plan: 'basic' });
    const proUsers = await User.countDocuments({ role: 'user', plan: 'pro' });
    const enterpriseUsers = await User.countDocuments({ role: 'user', plan: 'enterprise' });
    
    // Get recent payments
    const recentPayments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName email');
    
    // Get total revenue
    const payments = await Payment.find();
    const totalRevenue = payments.reduce((acc, payment) => acc + (payment.amount || 0), 0);
    
    return res.status(200).json({
      success: true,
      data: {
        userStats: {
          total: totalUsers,
          byPlan: {
            free: freeUsers,
            basic: basicUsers,
            pro: proUsers,
            enterprise: enterpriseUsers
          }
        },
        financialStats: {
          totalRevenue,
          recentPayments
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching analytics'
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
    const { id } = req.params;
    const { plan, planPrice, credits } = req.body;
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan is required'
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user plan
    user.plan = plan.toLowerCase();
    
    // Always update planPrice when provided
    if (planPrice !== undefined) {
      user.planPrice = planPrice;
    } else {
      // If planPrice not provided, get it from plan details
      const planInfo = getPlanDetails(plan);
      user.planPrice = planInfo.price;
    }
    
    // If credits are provided directly, use them
    if (credits) {
      // Ensure lastPurchase is properly formatted as an object with date and amount
      const lastPurchase = {
        date: new Date(),
        amount: credits.balance || 0
      };
      
      user.credits = {
        ...user.credits,
        ...credits,
        lastPurchase: lastPurchase
      };
    } else {
      // Otherwise update credits based on new plan
      const planDetails = getPlanDetails(plan);
      
      // Add new credits from plan
      const currentBalance = user.credits?.balance || 0;
      user.credits = {
        ...user.credits,
        totalPurchased: (user.credits?.totalPurchased || 0) + planDetails.credits,
        balance: currentBalance + planDetails.credits,
        lastPurchase: {
          date: new Date(),
          amount: planDetails.credits
        }
      };
    }
    
    // Save user with updated plan and credits
    const updatedUser = await user.save();
    
    // Make sure the user data is properly updated in the database
    await User.findByIdAndUpdate(id, {
      plan: updatedUser.plan,
      planPrice: updatedUser.planPrice,
      credits: updatedUser.credits
    }, { new: true });
    
    return res.status(200).json({
      success: true,
      message: 'User plan updated successfully',
      data: {
        user: {
          _id: updatedUser._id,
          email: updatedUser.email,
          plan: updatedUser.plan,
          planPrice: updatedUser.planPrice,
          credits: updatedUser.credits
        }
      }
    });
  } catch (error) {
    console.error('Error updating user plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating user plan'
    });
  }
};

/**
 * Log security action
 * @route POST /api/admin/security/log
 * @access Private (Admin only)
 */
exports.logSecurityAction = async (req, res) => {
  try {
    const { action, userId, details } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Action is required'
      });
    }
    
    // Here you would typically log this to a security log collection
    // For now, we'll just log to console
    console.log(`SECURITY LOG: Admin ${req.user._id} performed ${action} on user ${userId || 'N/A'} with details: ${JSON.stringify(details || {})}`);
    
    return res.status(200).json({
      success: true,
      message: 'Security action logged successfully'
    });
  } catch (error) {
    console.error('Error logging security action:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while logging security action'
    });
  }
};
