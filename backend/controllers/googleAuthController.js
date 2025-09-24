const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Set token cookie
const sendTokenCookie = (res, token) => {
  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('token', token, options);
};

// Google OAuth callback handler
exports.googleCallback = async (req, res) => {
  try {
    // req.user is set by passport after successful authentication
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=Authentication failed`);
    }

    // Generate JWT token
    const token = generateToken(req.user);
    
    // Set token in cookie
    sendTokenCookie(res, token);

    // Update last login
    await User.findByIdAndUpdate(req.user._id, { lastLogin: Date.now() });

    // Redirect to dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=Server error`);
  }
};

// Google authentication failure handler
exports.googleFailure = (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/login?error=Google authentication failed`);
};