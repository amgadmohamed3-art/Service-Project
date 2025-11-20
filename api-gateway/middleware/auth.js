const jwt = require('jsonwebtoken');

// Authentication middleware for API Gateway
const authenticateToken = (req, res, next) => {
  // Public endpoints that don't require authentication
  const publicEndpoints = [
    '/api/users/login',
    '/api/users/register',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/contents/movies',
    '/contents/movie',
    '/contents/series',
    '/contents/search',
    '/contents/genres',
    '/contents/trending',
    '/contents/featured',
    '/search/movies',
    '/search/movie',
    '/search/suggestions',
    '/'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint =>
    req.path.startsWith(endpoint) ||
    req.path.includes(endpoint)
  );

  // Skip authentication for public endpoints and OPTIONS requests
  if (isPublicEndpoint || req.method === 'OPTIONS') {
    return next();
  }

  // Check for Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  // Verify JWT token
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production', (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
      });
    }

    // Add user info to request for downstream services
    req.user = decoded;
    next();
  });
};

// Role-based access control middleware
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Admin-only access middleware
const adminOnly = authorizeRoles('Admin');

// Rate limiting middleware (basic implementation)
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes for auth
const searchRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes for search
const defaultRateLimit = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes default

module.exports = {
  authenticateToken,
  authorizeRoles,
  adminOnly,
  authRateLimit,
  searchRateLimit,
  defaultRateLimit
};