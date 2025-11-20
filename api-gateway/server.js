require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const { authenticateToken, adminOnly, authRateLimit, searchRateLimit, defaultRateLimit } = require('./middleware/auth');
const app = express();
app.use(cors());
app.use(express.json());

/*
Example routing with environment variables:

* /users -> ${USER_SERVICE_URL}
* /auth  -> ${AUTH_SERVICE_URL}
* /contents -> ${CONTENT_SERVICE_URL}
  Adjust ports to match each service's PORT in .env
  */

// Service URLs from environment variables with localhost fallbacks
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:6001';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:6002';
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:6003';
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:6004';
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:6005';
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:6006';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:6007';
const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:6008';

// Apply authentication middleware globally
app.use(authenticateToken);

// Rate limiting for different routes
app.use('/auth', authRateLimit);
app.use('/search', searchRateLimit);
app.use('/', defaultRateLimit);

// Service routes with authentication
app.use('/users', createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info to downstream services
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true
}));

app.use('/contents', createProxyMiddleware({
  target: CONTENT_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

app.use('/recs', createProxyMiddleware({
  target: RECOMMENDATION_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

app.use('/search', createProxyMiddleware({
  target: SEARCH_SERVICE_URL,
  changeOrigin: true
}));

app.use('/reviews', createProxyMiddleware({
  target: REVIEW_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

app.use('/notify', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

// Admin-only routes
app.use('/admin', adminOnly, createProxyMiddleware({
  target: ADMIN_SERVICE_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user.userId || req.user.id);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

app.get('/', (req,res)=> res.json({ gateway: true }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, ()=> console.log('API Gateway listening on', PORT));
