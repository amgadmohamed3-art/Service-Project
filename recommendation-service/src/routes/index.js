const express = require('express');
const router = express.Router();
const recRoutes = require('./recs');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/recs', recRoutes);

module.exports = router;
