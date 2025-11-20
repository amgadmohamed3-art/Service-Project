const mongoose = require('mongoose');
const ReviewSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  userId: { type: String, required: true },
  rating: { type: Number, min:1, max:5 },
  text: String,
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Review', ReviewSchema);
