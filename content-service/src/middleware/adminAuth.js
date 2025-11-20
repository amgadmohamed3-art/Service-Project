const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// JWT Secret for admin tokens
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate JWT token for admin
 */
const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Admin authentication middleware
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No admin token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find admin by ID
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token or admin account inactive.'
      });
    }

    // Add admin to request object
    req.admin = admin;
    req.adminPermissions = admin.permissions;
    req.adminRole = admin.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired.'
      });
    }

    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during authentication.'
    });
  }
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    // Check if admin has the required permission
    if (!req.adminPermissions || !req.adminPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${permission}`
      });
    }
    next();
  };
};

/**
 * Role-based authorization middleware
 */
const requireRole = (role) => {
  return (req, res, next) => {
    // Check if admin has the required role (or higher)
    const roleHierarchy = {
      'moderator': 1,
      'content_admin': 2,
      'super_admin': 3
    };

    const userRoleLevel = roleHierarchy[req.adminRole] || 0;
    const requiredRoleLevel = roleHierarchy[role] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${role}`
      });
    }
    next();
  };
};

/**
 * Super admin only middleware
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Content admin or higher middleware
 */
const requireContentAdmin = requireRole('content_admin');

/**
 * Multiple permissions middleware (any of the permissions)
 */
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    const hasPermission = permissions.some(permission =>
      req.adminPermissions && req.adminPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required one of these permissions: ${permissions.join(', ')}`
      });
    }
    next();
  };
};

/**
 * Optional admin authentication - doesn't fail if no token
 */
const optionalAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without admin
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (admin && admin.isActive) {
      req.admin = admin;
      req.adminPermissions = admin.permissions;
      req.adminRole = admin.role;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without admin context
    next();
  }
};

module.exports = {
  generateAdminToken,
  authenticateAdmin,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  requireContentAdmin,
  requireAnyPermission,
  optionalAdminAuth
};