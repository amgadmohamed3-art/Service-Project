const mongoose = require('mongoose');
const ContentSchema = new mongoose.Schema({
  title: String,
  description: String,
  type: { type: String, enum: ['movie','series','episode'], default: 'movie' },
  duration: Number, // minutes
  year: Number,
  genres: [String],
  rating: { type: Number, default: 0 },
  metadata: Object,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Content', ContentSchema);
