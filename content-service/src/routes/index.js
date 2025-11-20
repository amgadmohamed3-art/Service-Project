const express = require('express');
const router = express.Router();
const contentRoutes = require('./contents');
const adminRoutes = require('./admin');

// Health check route
router.get('/ping', (req, res) => res.json({ pong: true }));

// Public content routes
router.use('/contents', contentRoutes);

// Admin routes
router.use('/admin', adminRoutes);

module.exports = router;
