const jwt = require('jsonwebtoken');
const { getOne } = require('../config/database');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token is required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    console.log('🔍 Auth: Looking up user with ID:', decoded.userId);
    const user = await getOne(
      'SELECT id, email, user_type as role, first_name, last_name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('🔍 Auth: Database user result:', user);

    if (!user || !user.is_active) {
      console.log('❌ Auth: User not found or inactive');
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    console.log('✅ Auth: Setting req.user with role:', user.role);
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid access token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token has expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if user has required role
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
};

// Optional token verification (for routes that work with/without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await getOne(
      'SELECT id, email, user_type as role, first_name, last_name, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    console.log('🔍 OptionalAuth: User lookup result:', user);
    req.user = user && user.is_active ? user : null;
    console.log('🔍 OptionalAuth: Final req.user:', req.user);
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  verifyToken,
  requireRole,
  optionalAuth
};