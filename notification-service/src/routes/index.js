const express = require('express');
const router = express.Router();
const notifyRoutes = require('./notify');

// Example route
router.get('/ping', (req, res) => res.json({ pong: true }));
router.use('/notify', notifyRoutes);

module.exports = router;
