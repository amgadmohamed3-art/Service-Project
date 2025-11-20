const router = require('express').Router();
const Review = require('../models/Review');

router.post('/', async (req,res) => {
  const r = await Review.create(req.body);
  res.json(r);
});
router.get('/content/:id', async (req,res) => {
  const items = await Review.find({ contentId: req.params.id });
  res.json(items);
});
module.exports = router;
