const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/auth', authRoutes);

module.exports = router;
