const express = require('express');
const router = express.Router();
const reviewRoutes = require('./reviews');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/reviews', reviewRoutes);

module.exports = router;
