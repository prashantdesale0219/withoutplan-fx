const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    let token;
    
    // Debug logging for production
    if (process.env.NODE_ENV === 'production') {
      console.log('Auth Debug - Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'Missing',
        cookie: req.headers.cookie ? 'Present' : 'Missing',
        origin: req.headers.origin
      });
    }
    
    // Check for token in cookies first, then Authorization header
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Token found in cookies:', token.substring(0, 15) + '...');
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found in Authorization header:', token.substring(0, 15) + '...');
    } else {
      // Check for token in raw cookie header as fallback
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        console.log('Checking raw cookie header as fallback');
        const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
          console.log('Token found in raw cookie header:', token.substring(0, 15) + '...');
        }
      }
    }
    
    if (!token) {
      console.log('No token provided - cookies:', !!req.cookies?.token, 'auth header:', !!req.headers.authorization);
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully');
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: jwtError.name === 'TokenExpiredError' 
          ? 'Token expired. Please login again.' 
          : 'Invalid token. Please login again.'
      });
    }
    
    // Get user from database - handle both id and userId fields
    const userId = decoded.userId || decoded.id;
    console.log('Looking for user ID:', userId);
    
    let user;

    try {
      // Try with ObjectId conversion first
      user = await User.findById(new mongoose.Types.ObjectId(userId)).select('-passwordHash');
      console.log('ObjectId conversion successful');
    } catch (error) {
      console.log('ObjectId conversion failed:', error.message);
      // If ObjectId conversion fails, try with string directly
      user = await User.findById(userId).select('-passwordHash');
    }
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (user) {
      console.log('Found user:', user._id, user.email);
    } else {
      console.log('No user found for ID:', userId);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked. Please contact support for assistance.'
      });
    }
    
    // Add user to request object with id field for compatibility
    req.user = {
      ...user.toObject(),
      id: user._id.toString() // Ensure id is available as string
    };
    
    // Log successful authentication
    console.log('User successfully authenticated:', {
      id: req.user.id,
      email: req.user.email,
      tokenSource: req.cookies.token ? 'cookie' : 'header'
    });
    
    // Set token in cookie if it came from header (to ensure cookie is always set)
    if (!req.cookies.token && token) {
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
      console.log('Set token cookie from header token');
    }
    
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  
  next();
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

// Check if user owns the resource
const checkOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    // Admin can access all resources
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if resource belongs to user
    const resourceUserId = req.resource ? req.resource[resourceField] : req.params.userId;
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ownership cannot be determined.'
      });
    }
    
    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }
    
    next();
  };
};

// Rate limiting for authenticated users
const authRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get user's request history
    let userRequests = requests.get(userId) || [];
    
    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if user has exceeded the limit
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [key, timestamps] of requests.entries()) {
        const filtered = timestamps.filter(timestamp => timestamp > windowStart);
        if (filtered.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, filtered);
        }
      }
    }
    
    next();
  };
};

module.exports = {
  verifyToken,
  protect: verifyToken, // Alias for verifyToken
  requireAdmin,
  restrictTo, // Role-based access control
  optionalAuth,
  checkOwnership,
  authRateLimit,
  rateLimitAuth: (req, res, next) => next() // Placeholder rate limit middleware
};