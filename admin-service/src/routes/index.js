const express = require('express');
const router = express.Router();
const adminRoutes = require('./admin');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/admin', adminRoutes);

module.exports = router;
