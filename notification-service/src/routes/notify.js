const router = require('express').Router();

// placeholder endpoints to send email / push
router.post('/email-verification', (req,res)=> res.json({ message: 'send email verification placeholder' }));
router.post('/new-release', (req,res)=> res.json({ message: 'notify new release placeholder' }));
module.exports = router;
