const express = require('express');
const router = express.Router();
const userRoutes = require('./users');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/users', userRoutes);

module.exports = router;
