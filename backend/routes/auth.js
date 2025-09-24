const express = require('express');
const {
  signup,
  requestOTP,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  deleteAccount,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  verifyAuth
} = require('../controllers/authController');
const { googleCallback, googleFailure } = require('../controllers/googleAuthController');
const passport = require('../config/passport');
const { protect } = require('../middleware/auth');
const {
  validateRegistration,
  validateLogin,
  validateRequestOTP,
  validateResendOTP,
  validateVerifyEmailOTP,
  validateProfileUpdate,
  validatePasswordChange
} = require('../middleware/validation');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.post('/signup', validateRegistration, signup);
router.post('/request-otp', validateRequestOTP, requestOTP);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/verify-email', validateVerifyEmailOTP, verifyEmail);
router.post('/resend-otp', validateResendOTP, resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/api/auth/google/failure' }), googleCallback);
router.get('/google/failure', googleFailure);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/verify', verifyAuth); // New endpoint to verify authentication
router.get('/me', getMe);
router.post('/logout', logout);
router.put('/profile', 
  upload.single('profileImage'),
  validateProfileUpdate, 
  updateProfile
);
router.put('/change-password', validatePasswordChange, changePassword);
// Legacy route - redirects to resend-otp
router.post('/resend-verification', (req, res, next) => {
  req.body.email = req.user.email;
  next();
}, resendOTP);
router.delete('/delete-account', deleteAccount);

module.exports = router;