const Content = require('../models/Content');

// Standardized genre taxonomy
const STANDARD_GENRES = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'Film Noir', 'History',
  'Horror', 'Music', 'Musical', 'Mystery', 'Romance', 'Sci-Fi',
  'Sport', 'Superhero', 'Thriller', 'War', 'Western'
];

// Genre mapping for common variations
const GENRE_MAPPING = {
  'Science Fiction': 'Sci-Fi',
  'Science-Fiction': 'Sci-Fi',
  'Sciencefiction': 'Sci-Fi',
  'Science fiction': 'Sci-Fi',
  'Sci Fi': 'Sci-Fi',
  'SciFi': 'Sci-Fi',
  'Martial Arts': 'Action',
  'Martial art': 'Action',
  'Superhero': 'Action',
  'Super hero': 'Action',
  'Super-hero': 'Action',
  'Animated': 'Animation',
  'Animated movie': 'Animation',
  'Cartoon': 'Animation',
  'Anime': 'Animation',
  'Romantic Comedy': 'Romance',
  'Rom-Com': 'Romance',
  'Rom Com': 'Romance',
  'Romantic': 'Romance',
  'Love Story': 'Romance',
  'Crime Drama': 'Crime',
  'Crime Thriller': 'Crime',
  'Psychological Thriller': 'Thriller',
  'Psychological': 'Thriller',
  'Suspense': 'Thriller',
  'War Drama': 'War',
  'War film': 'War',
  'Historical': 'History',
  'Period Drama': 'History',
  'Historical Drama': 'History',
  'Biographical': 'Biography',
  'Bio': 'Biography',
  'Life Story': 'Biography',
  'Music Documentary': 'Documentary',
  'Doc': 'Documentary',
  'Documentary film': 'Documentary',
  'Family Film': 'Family',
  'Kids': 'Family',
  'Children': 'Family',
  'Teen': 'Drama',
  'Teen Drama': 'Drama',
  'Young Adult': 'Drama',
  'YA': 'Drama',
  'Dark Comedy': 'Comedy',
  'Black Comedy': 'Comedy',
  'Slapstick': 'Comedy',
  'Satire': 'Comedy',
  'Parody': 'Comedy',
  'Gangster': 'Crime',
  'Mob': 'Crime',
  'Mobster': 'Crime',
  'Police': 'Crime',
  'Detective': 'Crime',
  'Noir': 'Film Noir',
  'Neo-noir': 'Film Noir',
  'Space Opera': 'Sci-Fi',
  'Dystopian': 'Sci-Fi',
  'Post-apocalyptic': 'Sci-Fi',
  'Zombie': 'Horror',
  'Slasher': 'Horror',
  'Monster': 'Horror',
  'Found Footage': 'Horror',
  'Ghost': 'Horror',
  'Supernatural': 'Horror',
  'Teen Horror': 'Horror',
  'Musical Drama': 'Musical',
  'Concert Film': 'Music',
  'Music Video': 'Music',
  'Rockumentary': 'Music',
  'Sports': 'Sport',
  'Sports Drama': 'Sport',
  'Football': 'Sport',
  'Basketball': 'Sport',
  'Baseball': 'Sport',
  'Boxing': 'Sport',
  'Racing': 'Sport',
  'Western': 'Western',
  'Spaghetti Western': 'Western',
  'Modern Western': 'Western'
};

class GenreService {
  /**
   * Normalize genre names to standard format
   */
  normalizeGenres(genres) {
    if (!genres || !Array.isArray(genres)) {
      return [];
    }

    return genres
      .map(genre => {
        if (!genre || typeof genre !== 'string') return null;

        // Trim whitespace
        let normalized = genre.trim();

        // Handle empty strings
        if (!normalized) return null;

        // Check against genre mapping first
        const mapped = GENRE_MAPPING[normalized];
        if (mapped) {
          return mapped;
        }

        // Case-insensitive check against standard genres
        const standard = STANDARD_GENRES.find(
          standardGenre => standardGenre.toLowerCase() === normalized.toLowerCase()
        );

        if (standard) {
          return standard;
        }

        // Return null if not found in standards
        return null;
      })
      .filter(genre => genre) // Remove null values
      .filter((genre, index, arr) => arr.indexOf(genre) === index); // Remove duplicates
  }

  /**
   * Validate genres against allowed list
   */
  validateGenres(genres) {
    const normalized = this.normalizeGenres(genres);
    const invalidGenres = genres?.filter(genre => {
      const normalizedGenre = this.normalizeGenres([genre])[0];
      return !normalizedGenre;
    });

    return {
      valid: normalized,
      invalid: invalidGenres || [],
      allValid: normalized.length === (genres?.length || 0)
    };
  }

  /**
   * Get genre statistics
   */
  async getGenreStats() {
    try {
      const pipeline = [
        { $match: { status: 'active', genres: { $ne: [] } } },
        { $unwind: '$genres' },
        {
          $group: {
            _id: '$genres',
            count: { $sum: 1 },
            avgRating: { $avg: '$averageUserRating' },
            totalViews: { $sum: '$viewCount' }
          }
        },
        { $sort: { count: -1 } }
      ];

      const stats = await Content.aggregate(pipeline);

      // Transform to more readable format
      const genreStats = stats.map(stat => ({
        genre: stat._id,
        count: stat.count,
        avgRating: Math.round((stat.avgRating || 0) * 10) / 10,
        totalViews: stat.totalViews
      }));

      // Add genres with zero count
      const allGenres = STANDARD_GENRES.map(genre => {
        const existing = genreStats.find(stat => stat.genre === genre);
        return existing || { genre, count: 0, avgRating: 0, totalViews: 0 };
      });

      // Sort by count (descending), then alphabetically
      allGenres.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.genre.localeCompare(b.genre);
      });

      return allGenres;
    } catch (error) {
      console.error('Error getting genre stats:', error.message);
      throw new Error('Failed to get genre statistics');
    }
  }

  /**
   * Suggest genres based on title and description
   */
  suggestGenres(title, description) {
    if (!title && !description) {
      return [];
    }

    const text = `${title || ''} ${description || ''}`.toLowerCase();
    const suggestions = [];

    // Genre keyword mapping
    const genreKeywords = {
      'Action': ['fight', 'battle', 'war', 'combat', 'mission', 'soldier', 'hero', 'save', 'rescue', 'spy', 'agent'],
      'Adventure': ['journey', 'quest', 'expedition', 'adventure', 'discover', 'explore', 'treasure', 'map'],
      'Comedy': ['funny', 'humor', 'comedy', 'laugh', 'joke', 'comedic', 'hilarious'],
      'Drama': ['drama', 'emotional', 'family', 'relationship', 'love', 'marriage', 'divorce', 'life'],
      'Horror': ['horror', 'scary', 'fear', 'ghost', 'monster', 'haunted', 'evil', 'dark', 'nightmare'],
      'Sci-Fi': ['space', 'future', 'robot', 'alien', 'planet', 'technology', 'science', 'time travel'],
      'Mystery': ['mystery', 'detective', 'crime', 'murder', 'investigation', 'secret', 'clue'],
      'Romance': ['love', 'romance', 'relationship', 'dating', 'marriage', 'heart', 'romantic'],
      'Thriller': ['thriller', 'suspense', 'tension', 'chase', 'escape', 'danger', 'risk'],
      'Fantasy': ['magic', 'wizard', 'dragon', 'fantasy', 'mythical', 'enchanted', 'spell'],
      'Animation': ['animation', 'animated', 'cartoon', 'anime'],
      'Documentary': ['documentary', 'real', 'true story', 'based on true events', 'biography'],
      'Biography': ['biography', 'life story', 'real person', 'based on real life'],
      'History': ['history', 'historical', 'ancient', 'medieval', 'world war', 'historical'],
      'War': ['war', 'battle', 'soldier', 'military', 'army', 'conflict'],
      'Western': ['western', 'cowboy', 'ranch', 'frontier', 'wild west', 'gunfighter'],
      'Music': ['music', 'band', 'singer', 'song', 'concert', 'musical', 'album'],
      'Musical': ['musical', 'sing', 'dance', 'performance', 'stage'],
      'Sport': ['sport', 'sports', 'team', 'game', 'championship', 'competition', 'athlete'],
      'Family': ['family', 'children', 'kids', 'parents', 'growing up'],
      'Crime': ['crime', 'criminal', 'robbery', 'heist', 'gang', 'mafia', 'police']
    };

    // Score each genre based on keyword matches
    const genreScores = {};
    Object.entries(genreKeywords).forEach(([genre, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword.toLowerCase())) {
          score++;
        }
      });
      if (score > 0) {
        genreScores[genre] = score;
      }
    });

    // Sort by score and return top suggestions
    const sortedGenres = Object.entries(genreScores)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre)
      .slice(0, 3); // Top 3 suggestions

    return sortedGenres;
  }

  /**
   * Get trending genres
   */
  async getTrendingGenres() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const pipeline = [
        {
          $match: {
            status: 'active',
            genres: { $ne: [] },
            viewCount: { $gt: 0 }
          }
        },
        { $unwind: '$genres' },
        {
          $group: {
            _id: '$genres',
            totalViews: { $sum: '$viewCount' },
            count: { $sum: 1 },
            avgRating: { $avg: '$averageUserRating' }
          }
        },
        { $sort: { totalViews: -1 } },
        { $limit: 10 }
      ];

      const trending = await Content.aggregate(pipeline);

      return trending.map(item => ({
        genre: item._id,
        totalViews: item.totalViews,
        count: item.count,
        avgRating: Math.round((item.avgRating || 0) * 10) / 10
      }));
    } catch (error) {
      console.error('Error getting trending genres:', error.message);
      throw new Error('Failed to get trending genres');
    }
  }

  /**
   * Get content by genre
   */
  async getContentByGenre(genre, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // Validate genre
      const validGenres = this.normalizeGenres([genre]);
      if (validGenres.length === 0) {
        throw new Error('Invalid genre');
      }

      const normalizedGenre = validGenres[0];

      // Build query
      const query = {
        status: 'active',
        genres: normalizedGenre
      };

      if (type) {
        query.type = type;
      }

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [contents, total] = await Promise.all([
        Content.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate('seriesId', 'title poster')
          .lean(),
        Content.countDocuments(query)
      ]);

      return {
        contents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        },
        genre: normalizedGenre
      };
    } catch (error) {
      console.error('Error getting content by genre:', error.message);
      throw new Error(`Failed to get content by genre: ${error.message}`);
    }
  }

  /**
   * Get all standard genres
   */
  getStandardGenres() {
    return [...STANDARD_GENRES].sort();
  }

  /**
   * Get genre mapping
   */
  getGenreMapping() {
    return { ...GENRE_MAPPING };
  }
}

module.exports = new GenreService();