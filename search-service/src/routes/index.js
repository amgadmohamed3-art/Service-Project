const express = require('express');
const router = express.Router();
const searchRoutes = require('./search');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/search', searchRoutes);

module.exports = router;
