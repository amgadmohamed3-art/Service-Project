const router = require('express').Router();
const Content = require('../models/Content');
const genreService = require('../services/genreService');
const omdbService = require('../services/omdbService');

/**
 * GET /api/contents/movies
 * Get paginated movie list with filtering
 */
router.get('/movies', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      year,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    // Build query
    const query = {
      type: 'movie',
      status: 'active'
    };

    if (genre) {
      const normalizedGenres = genreService.normalizeGenres([genre]);
      if (normalizedGenres.length > 0) {
        query.genres = normalizedGenres[0];
      }
    }

    if (year) {
      if (year.includes('-')) {
        const [startYear, endYear] = year.split('-').map(Number);
        query.year = { $gte: startYear, $lte: endYear };
      } else {
        query.year = parseInt(year);
      }
    }

    if (rating) {
      const ratingThreshold = parseFloat(rating);
      query.averageUserRating = { $gte: ratingThreshold };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { director: { $regex: search, $options: 'i' } },
        { actors: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options
    const sortOptions = {};
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'year', 'averageUserRating', 'viewCount', 'totalReviews'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Put featured content first
    sortOptions.isFeatured = -1;

    const [movies, total] = await Promise.all([
      Content.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-omdbData -customFields -updatedAt')
        .lean(),
      Content.countDocuments(query)
    ]);

    // Format response to maintain compatibility with existing frontend
    const formattedMovies = movies.map(movie => ({
      imdbID: movie.imdbID || movie._id,
      Title: movie.title,
      Year: movie.year?.toString() || '',
      Type: movie.type,
      Poster: movie.poster || '',
      Runtime: movie.duration ? `${movie.duration} min` : '',
      Genre: movie.genres ? movie.genres.join(', ') : '',
      Director: movie.director || '',
      Plot: movie.description || '',
      Actors: movie.actors ? movie.actors.join(', ') : '',
      imdbRating: movie.imdbRating?.toString() || '',
      averageUserRating: movie.averageUserRating || 0,
      viewCount: movie.viewCount || 0,
      isFeatured: movie.isFeatured || false
    }));

    res.json({
      success: true,
      Response: 'True',
      Search: formattedMovies,
      totalResults: total.toString(),
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      filters: { genre, year, rating, sortBy, sortOrder, search }
    });
  } catch (error) {
    console.error('Error fetching movies:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movies'
    });
  }
});

/**
 * GET /api/contents/movie/:id
 * Get movie details by imdbID or database _id
 */
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by imdbID first, then by _id
    let movie = await Content.findOne({ imdbID: id, status: 'active' });

    if (!movie) {
      movie = await Content.findById(id);
    }

    if (!movie || movie.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Movie not found'
      });
    }

    // Increment view count
    await Content.findByIdAndUpdate(movie._id, {
      $inc: { viewCount: 1 }
    });

    // Format response to maintain compatibility
    const formattedMovie = {
      imdbID: movie.imdbID || movie._id,
      Title: movie.title,
      Year: movie.year?.toString() || '',
      Type: movie.type,
      Poster: movie.poster || '',
      Runtime: movie.duration ? `${movie.duration} min` : '',
      Genre: movie.genres ? movie.genres.join(', ') : '',
      Director: movie.director || '',
      Plot: movie.description || '',
      Actors: movie.actors ? movie.actors.join(', ') : '',
      imdbRating: movie.imdbRating?.toString() || '',
      averageUserRating: movie.averageUserRating || 0,
      viewCount: movie.viewCount + 1,
      totalReviews: movie.totalReviews || 0,
      rottenTomatoesRating: movie.rottenTomatoesRating || null,
      metacriticRating: movie.metacriticRating || null,
      boxOffice: movie.boxOffice || '',
      awards: movie.awards || '',
      language: movie.language || '',
      country: movie.country || '',
      production: movie.production || '',
      website: movie.website || '',
      trailers: movie.trailers || [],
      posters: movie.posters || [],
      actorsWithImages: movie.actorsWithImages || [],
      isFeatured: movie.isFeatured || false,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt
    };

    res.json({
      success: true,
      data: formattedMovie
    });
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movie details'
    });
  }
});

/**
 * GET /api/contents/series
 * Get series list with pagination
 */
router.get('/series', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);

    // Build query
    const query = {
      type: 'series',
      status: 'active'
    };

    if (genre) {
      const normalizedGenres = genreService.normalizeGenres([genre]);
      if (normalizedGenres.length > 0) {
        query.genres = normalizedGenres[0];
      }
    }

    // Build sort options
    const sortOptions = {};
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'year', 'averageUserRating', 'viewCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [series, total] = await Promise.all([
      Content.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-omdbData -customFields -updatedAt')
        .lean(),
      Content.countDocuments(query)
    ]);

    // Format series with episode counts
    const formattedSeries = await Promise.all(series.map(async (seriesItem) => {
      const episodeCount = await Content.countDocuments({
        seriesId: seriesItem._id,
        status: 'active'
      });

      return {
        imdbID: seriesItem.imdbID || seriesItem._id,
        Title: seriesItem.title,
        Year: seriesItem.year?.toString() || '',
        Type: 'series',
        Poster: seriesItem.poster || '',
        Genre: seriesItem.genres ? seriesItem.genres.join(', ') : '',
        Plot: seriesItem.description || '',
        totalSeasons: seriesItem.totalSeasons || 0,
        totalEpisodes: episodeCount,
        averageUserRating: seriesItem.averageUserRating || 0,
        viewCount: seriesItem.viewCount || 0,
        isFeatured: seriesItem.isFeatured || false
      };
    }));

    res.json({
      success: true,
      data: formattedSeries,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching series:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch series'
    });
  }
});

/**
 * GET /api/contents/series/:id/episodes
 * Get all episodes for a series
 */
router.get('/series/:id/episodes', async (req, res) => {
  try {
    const { id } = req.params;
    const { season } = req.query;

    // Find series
    let series = await Content.findOne({ imdbID: id, type: 'series', status: 'active' });

    if (!series) {
      series = await Content.findById(id);
    }

    if (!series || series.type !== 'series' || series.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Series not found'
      });
    }

    // Build query for episodes
    const query = {
      seriesId: series._id,
      status: 'active',
      type: 'episode'
    };

    if (season) {
      query.seasonNumber = parseInt(season);
    }

    const episodes = await Content.find(query)
      .sort({ seasonNumber: 1, episodeNumber: 1 })
      .select('-omdbData -customFields -updatedAt')
      .lean();

    const formattedEpisodes = episodes.map(episode => ({
      imdbID: episode.imdbID || episode._id,
      Title: episode.title,
      Year: episode.year?.toString() || '',
      Type: 'episode',
      Poster: episode.poster || '',
      Runtime: episode.duration ? `${episode.duration} min` : '',
      Plot: episode.description || '',
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.episodeTitle,
      airDate: episode.airDate,
      averageUserRating: episode.averageUserRating || 0,
      viewCount: episode.viewCount || 0
    }));

    res.json({
      success: true,
      data: {
        series: {
          title: series.title,
          imdbID: series.imdbID || series._id,
          totalSeasons: series.totalSeasons || 0
        },
        episodes: formattedEpisodes
      }
    });
  } catch (error) {
    console.error('Error fetching episodes:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch episodes'
    });
  }
});

/**
 * GET /api/contents/trending
 * Get trending/popular content
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, type } = req.query;

    const query = {
      status: 'active',
      viewCount: { $gt: 0 }
    };

    if (type) {
      query.type = type;
    }

    const trending = await Content.find(query)
      .sort({ viewCount: -1, averageUserRating: -1 })
      .limit(parseInt(limit))
      .select('title imdbID poster year type averageUserRating viewCount genres')
      .lean();

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error('Error fetching trending content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending content'
    });
  }
});

/**
 * GET /api/contents/featured
 * Get admin-curated featured content
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 12, type } = req.query;

    const query = {
      status: 'active',
      isFeatured: true
    };

    if (type) {
      query.type = type;
    }

    const featured = await Content.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('title imdbID poster year type averageUserRating viewCount genres')
      .lean();

    res.json({
      success: true,
      data: featured
    });
  } catch (error) {
    console.error('Error fetching featured content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured content'
    });
  }
});

/**
 * GET /api/contents/genres/:genre
 * Get content by genre with pagination
 */
router.get('/genres/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await genreService.getContentByGenre(genre, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result.contents,
      pagination: result.pagination,
      genre: result.genre
    });
  } catch (error) {
    console.error('Error getting content by genre:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get content by genre'
    });
  }
});

/**
 * GET /api/contents/search
 * Basic search endpoint (search service handles advanced search)
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20, type } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Build search query
    const searchQuery = {
      status: 'active',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { director: { $regex: query, $options: 'i' } },
        { actors: { $regex: query, $options: 'i' } }
      ]
    };

    if (type) {
      searchQuery.type = type;
    }

    const [results, total] = await Promise.all([
      Content.find(searchQuery)
        .sort({ isFeatured: -1, viewCount: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('title imdbID poster year type averageUserRating viewCount genres description')
        .lean(),
      Content.countDocuments(searchQuery)
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum
      },
      query
    });
  } catch (error) {
    console.error('Error searching content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search content'
    });
  }
});

/**
 * GET /api/contents/genres
 * Get all available genres with counts
 */
router.get('/genres', async (req, res) => {
  try {
    const genreStats = await genreService.getGenreStats();

    res.json({
      success: true,
      data: genreStats
    });
  } catch (error) {
    console.error('Error getting genres:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get genres'
    });
  }
});

/**
 * GET /api/contents/related/:id
 * Get related content (same director, similar genres)
 */
router.get('/related/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    // Find the main content
    let content = await Content.findOne({ imdbID: id, status: 'active' });

    if (!content) {
      content = await Content.findById(id);
    }

    if (!content || content.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Build related content query
    const relatedQuery = {
      status: 'active',
      _id: { $ne: content._id },
      $or: []
    };

    // Same director
    if (content.director) {
      relatedQuery.$or.push({ director: content.director });
    }

    // Similar genres
    if (content.genres && content.genres.length > 0) {
      relatedQuery.$or.push({
        genres: {
          $in: content.genres.slice(0, 3) // Limit to top 3 genres
        }
      });
    }

    // If no director or genres, get content of same type
    if (relatedQuery.$or.length === 0) {
      relatedQuery.$or.push({ type: content.type });
    }

    const related = await Content.find(relatedQuery)
      .sort({ averageUserRating: -1, viewCount: -1 })
      .limit(parseInt(limit))
      .select('title imdbID poster year type averageUserRating viewCount genres')
      .lean();

    res.json({
      success: true,
      data: related
    });
  } catch (error) {
    console.error('Error getting related content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get related content'
    });
  }
});

/**
 * GET /api/contents
 * Legacy endpoint - returns all content with pagination
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const items = await Content.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-omdbData -customFields -updatedAt')
      .lean();

    const total = await Content.countDocuments({ status: 'active' });

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contents:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contents'
    });
  }
});

/**
 * POST /api/contents
 * Create new content (admin only, but keeping for compatibility)
 */
router.post('/', async (req, res) => {
  try {
    const contentData = {
      ...req.body,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const item = await Content.create(contentData);
    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error creating content:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create content'
    });
  }
});

module.exports = router;