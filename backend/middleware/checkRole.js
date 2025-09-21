/**
 * Middleware to check if user has the required role
 * @param {String} role - The role required to access the route
 * @returns {Function} - Express middleware function
 */
const checkRole = (role) => {
  return (req, res, next) => {
    // User should be attached to req by the auth middleware
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check if user has the required role
    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user has admin role
 */
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required'
    });
  }
  
  next();
};

module.exports = { checkRole, admin };