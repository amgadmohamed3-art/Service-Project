const router = require('express').Router();

// admin-only endpoints (protect with auth middleware)
router.post('/upload-content', (req,res) => res.json({ message: 'upload placeholder' }));
router.get('/analytics', (req,res) => res.json({ message: 'analytics placeholder' }));
module.exports = router;
