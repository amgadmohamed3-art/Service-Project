const express = require('express');
const router = express.Router();
const contentRoutes = require('./contents');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/contents', contentRoutes);

module.exports = router;
