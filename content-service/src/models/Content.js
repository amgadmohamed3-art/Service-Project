const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  // Basic fields (existing)
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['movie', 'series', 'episode'], default: 'movie' },
  duration: Number, // minutes
  year: { type: Number, required: true },
  genres: [String],
  rating: { type: Number, default: 0 },
  metadata: Object,
  createdAt: { type: Date, default: Date.now },

  // Enhanced metadata fields (new)
  imdbID: { type: String, unique: true, sparse: true },
  omdbData: Object, // Store raw OMDb response
  poster: String, // Primary poster URL
  posters: [String], // Multiple poster URLs
  trailer: String, // Trailer URL
  trailers: [String], // Multiple trailer URLs
  director: String,
  writer: String,
  actors: [String],
  actorsWithImages: [{
    name: String,
    image: String,
    role: String
  }],
  language: String,
  country: String,
  awards: String,
  imdbRating: Number,
  rottenTomatoesRating: Number,
  metacriticRating: Number,
  boxOffice: String,
  production: String,
  website: String,

  // Series-specific fields (new)
  seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
  seasonNumber: Number,
  episodeNumber: Number,
  totalSeasons: Number,
  totalEpisodes: Number,

  // Enhanced series structure
  seasons: [{
    seasonNumber: Number,
    title: String,
    description: String,
    releaseYear: Number,
    episodeCount: Number,
    poster: String,
    episodes: [{
      episodeNumber: Number,
      title: String,
      description: String,
      duration: Number,
      airDate: Date,
      imdbID: String,
      poster: String
    }]
  }],

  // Episode relationships
  episodeTitle: String,
  airDate: Date,

  // Admin fields (new)
  isAdminCreated: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'archived'],
    default: 'active'
  },
  lastSyncedAt: Date, // Last OMDb sync
  customFields: Object, // Flexible admin-defined fields

  // Analytics fields
  viewCount: { type: Number, default: 0 },
  averageUserRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  // Additional timestamps
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
ContentSchema.index({ "imdbID": 1 }, { unique: true, sparse: true });
ContentSchema.index({ "title": "text", "description": "text" });
ContentSchema.index({ "type": 1, "status": 1 });
ContentSchema.index({ "genres": 1 });
ContentSchema.index({ "year": -1 });
ContentSchema.index({ "rating": -1 });
ContentSchema.index({ "viewCount": -1 });
ContentSchema.index({ "averageUserRating": -1 });
ContentSchema.index({ "seriesId": 1, "seasonNumber": 1, "episodeNumber": 1 });
ContentSchema.index({ "isAdminCreated": 1 });
ContentSchema.index({ "isFeatured": 1 });

// Update the updatedAt field on save
ContentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Content', ContentSchema);
