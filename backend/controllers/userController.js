const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash -emailVerificationToken -passwordResetToken');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, profileImage, preferences } = req.body;
  
  // Find user
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Update fields
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (profileImage) user.profileImage = profileImage;
  
  // Update preferences if provided
  if (preferences) {
    if (preferences.notifications !== undefined) {
      user.preferences.notifications = preferences.notifications;
    }
    if (preferences.theme) {
      user.preferences.theme = preferences.theme;
    }
  }
  
  // Save updated user
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      preferences: user.preferences
    }
  });
});

// @desc    Change user password
// @route   PUT /api/user/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // Find user
  const user = await User.findById(req.user.id);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Check if current password is correct
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }
  
  // Update password
  user.passwordHash = newPassword;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword
};