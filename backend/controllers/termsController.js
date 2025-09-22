const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * @desc    Update user's terms and conditions acceptance status
 * @route   POST /api/terms/accept
 * @access  Private
 */
const acceptTerms = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find user
  const user = await User.findById(userId);
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  // Update terms acceptance status
  user.termsAccepted.status = true;
  user.termsAccepted.acceptedAt = new Date();
  user.termsAccepted.version = req.body.version || '1.0';
  
  // Save updated user
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'Terms and conditions accepted successfully',
    data: {
      termsAccepted: user.termsAccepted
    }
  });
});

/**
 * @desc    Get user's terms and conditions acceptance status
 * @route   GET /api/terms/status
 * @access  Private
 */
const getTermsStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find user
  const user = await User.findById(userId).select('termsAccepted');
  
  if (!user) {
    throw new AppError('User not found', 404);
  }
  
  res.status(200).json({
    success: true,
    data: {
      termsAccepted: user.termsAccepted
    }
  });
});

module.exports = {
  acceptTerms,
  getTermsStatus
};