const router = require('express').Router();

// Simple rule-based recommend placeholder
router.get('/for-user/:userId', async (req,res) => {
  // TODO: use watch history to craft results
  res.json({ userId: req.params.userId, recommendations: [] });
});

module.exports = router;
