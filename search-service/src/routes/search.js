const router = require('express').Router();
const axios = require('axios');
const FuzzySearchEngine = require('../utils/fuzzySearch');
const cacheService = require('../../shared/cache');

// Initialize fuzzy search engine
const fuzzySearch = new FuzzySearchEngine();

// Cache TTL settings
const SEARCH_CACHE_TTL = 10 * 60; // 10 minutes for search results
const MOVIE_CACHE_TTL = 60 * 60; // 1 hour for movie details
const SUGGESTION_CACHE_TTL = 5 * 60; // 5 minutes for suggestions

// Content service configuration
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:6003';
const OMDB_API_KEY = process.env.OMDB_API_KEY || '70c8d861';
const OMDB_BASE_URL = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';

/**
 * Search content-service with pagination and fallback to OMDb
 */
async function searchContentService(query, page = 1, filters = {}) {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page,
      limit: '20',
      ...filters
    });

    const response = await axios.get(`${CONTENT_SERVICE_URL}/api/contents/search?${params}`, {
      timeout: 5000
    });

    return {
      success: true,
      data: response.data.data || [],
      pagination: response.data.pagination || {},
      totalResults: response.data.pagination?.totalItems || 0,
      fromContentService: true
    };
  } catch (error) {
    console.error('Content service search failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get movie from content-service, fallback to OMDb
 */
async function getMovieWithFallback(imdbID) {
  try {
    // Try content-service first
    const response = await axios.get(`${CONTENT_SERVICE_URL}/api/contents/movie/${imdbID}`, {
      timeout: 5000
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
        fromContentService: true
      };
    }
  } catch (error) {
    console.log('Content service lookup failed, trying OMDb fallback');
  }

  // Fallback to OMDb
  try {
    const params = new URLSearchParams({
      apikey: OMDB_API_KEY,
      i: imdbID,
      plot: 'full'
    });

    const response = await axios.get(`${OMDB_BASE_URL}?${params}`, {
      timeout: 10000
    });

    if (response.data.Response === 'True') {
      return {
        success: true,
        data: response.data,
        fromOMDb: true
      };
    } else {
      return {
        success: false,
        error: 'Movie not found'
      };
    }
  } catch (error) {
    console.error('OMDb lookup failed:', error.message);
    return {
      success: false,
      error: 'Movie not found in content-service or OMDb'
    };
  }
}

/**
 * Search OMDb directly for additional results
 */
async function searchOMDb(query, page = 1) {
  try {
    const params = new URLSearchParams({
      apikey: OMDB_API_KEY,
      s: query,
      page: page,
      type: 'movie'
    });

    const response = await axios.get(`${OMDB_BASE_URL}?${params}`, {
      timeout: 10000
    });

    if (response.data.Response === 'True') {
      return {
        success: true,
        data: response.data.Search || [],
        totalResults: parseInt(response.data.totalResults) || 0,
        fromOMDb: true
      };
    } else {
      return {
        success: false,
        error: response.data.Error || 'No results found'
      };
    }
  } catch (error) {
    console.error('OMDb search failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate cache key for search results
 */
function getCacheKey(query, page, filters) {
  const filtersStr = JSON.stringify(filters);
  return `search:${query}:${page}:${Buffer.from(filtersStr).toString('base64')}`;
}

/**
 * GET /api/search/movies
 * Search movies with content-service primary and OMDb fallback
 */
router.get('/movies', async (req, res) => {
  try {
    const { q, page = 1, type, year, genre } = req.query;
    const pageNum = parseInt(page) || 1;

    // Validate query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        Response: 'False',
        Error: 'Search query must be at least 2 characters long'
      });
    }

    const query = q.trim();
    const cacheKey = getCacheKey(query, pageNum, { type, year, genre });

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return res.json(cached.data);
    }

    // Build filters
    const filters = {};
    if (type) filters.type = type;
    if (year) filters.year = year;
    if (genre) filters.genre = genre;

    // Try content-service first
    let contentServiceResult = await searchContentService(query, pageNum, filters);
    let results = [];
    let totalResults = 0;
    let hasContentServiceResults = false;

    if (contentServiceResult.success && contentServiceResult.data.length > 0) {
      // Transform content-service data to OMDb format for compatibility
      results = contentServiceResult.data.map(item => ({
        imdbID: item.imdbID || item._id,
        Title: item.title,
        Year: item.year?.toString() || '',
        Type: item.type || 'movie',
        Poster: item.poster || '',
        Runtime: item.duration ? `${item.duration} min` : '',
        Genre: item.genres ? item.genres.join(', ') : '',
        Director: item.director || '',
        Plot: item.description || '',
        Actors: item.actors ? item.actors.join(', ') : '',
        imdbRating: item.imdbRating?.toString() || '',
        averageUserRating: item.averageUserRating || 0,
        viewCount: item.viewCount || 0
      }));

      totalResults = contentServiceResult.totalResults;
      hasContentServiceResults = true;
    }

    // If content-service has limited results, supplement with OMDb
    if (!hasContentServiceResults || results.length < 10) {
      console.log('Content service results limited, supplementing with OMDb');

      const omdbResult = await searchOMDb(query, pageNum);

      if (omdbResult.success) {
        // Deduplicate results by imdbID
        const existingIds = new Set(results.map(r => r.imdbID));
        const newResults = omdbResult.data.filter(omdbMovie =>
          !existingIds.has(omdbMovie.imdbID)
        );

        results = [...results, ...newResults].slice(0, 20); // Limit to 20 total

        if (!hasContentServiceResults) {
          totalResults = omdbResult.totalResults;
        }
      }
    }

    // Apply fuzzy search ranking to all results
    if (results.length > 0) {
      results = fuzzySearch.rankResults(results, query);
    }

    // Format response
    const response = {
      Response: 'True',
      Search: results,
      totalResults: totalResults.toString(),
      fromContentService: hasContentServiceResults,
      page: pageNum,
      sources: {
        contentService: hasContentServiceResults,
        omdb: results.length > (contentServiceResult.data?.length || 0)
      }
    };

    // Cache the result
    searchCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }

    res.json(response);
  } catch (error) {
    console.error('Error in movie search:', error.message);

    // Fallback to a simple error response
    res.status(500).json({
      Response: 'False',
      Error: 'Search service temporarily unavailable'
    });
  }
});

/**
 * GET /api/search/movie/:id
 * Get movie details with content-service primary and OMDb fallback
 */
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `movie_${id}`;

    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return res.json(cached.data);
    }

    const result = await getMovieWithFallback(id);

    if (!result.success) {
      return res.status(404).json({
        Response: 'False',
        Error: result.error
      });
    }

    // Cache the result
    searchCache.set(cacheKey, {
      data: result.data,
      timestamp: Date.now()
    });

    res.json(result.data);
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    res.status(500).json({
      Response: 'False',
      Error: 'Failed to fetch movie details'
    });
  }
});

/**
 * GET /api/search/suggest
 * Get search suggestions based on partial query using fuzzy matching
 */
router.get('/suggest', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const query = q.trim();
    const limitNum = parseInt(limit) || 10;

    // Get content for suggestions
    let allMovies = [];

    // Try content-service first
    try {
      const response = await axios.get(`${CONTENT_SERVICE_URL}/api/contents/movies`, {
        params: { limit: 100 }, // Get more movies for better suggestions
        timeout: 3000
      });

      if (response.data.success && response.data.data) {
        const movies = response.data.data.map(item => ({
          imdbID: item.imdbID || item._id,
          Title: item.title,
          Year: item.year?.toString() || '',
          Type: item.type || 'movie',
          Poster: item.poster || '',
          Genre: item.genres ? item.genres.join(', ') : ''
        }));

        allMovies.push(...movies);
      }
    } catch (error) {
      console.log('Content service suggestions failed, trying OMDb');
    }

    // Fallback to OMDb if needed
    if (allMovies.length < 50) {
      try {
        const omdbResult = await searchOMDb(query, 1);
        if (omdbResult.success) {
          allMovies.push(...omdbResult.data);
        }
      } catch (error) {
        console.log('OMDb suggestions failed');
      }
    }

    // Generate fuzzy suggestions
    const suggestions = fuzzySearch.generateSuggestions(allMovies, query, limitNum);

    res.json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error.message);
    res.json({ suggestions: [] });
  }
});

/**
 * GET /api/search/query
 * Advanced search with multiple filters
 */
router.get('/query', async (req, res) => {
  try {
    const {
      q,
      page = 1,
      type,
      year,
      genre,
      rating,
      sortBy = 'relevance'
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const query = q.trim();
    const pageNum = parseInt(page) || 1;

    // Build filters for content-service
    const filters = {};
    if (type) filters.type = type;
    if (year) filters.year = year;
    if (genre) filters.genre = genre;
    if (rating) filters.rating = rating;

    // Try content-service first
    const contentServiceResult = await searchContentService(query, pageNum, filters);

    if (contentServiceResult.success) {
      return res.json({
        success: true,
        results: contentServiceResult.data,
        pagination: contentServiceResult.pagination,
        totalResults: contentServiceResult.totalResults,
        fromContentService: true
      });
    }

    // Fallback to OMDb
    const omdbResult = await searchOMDb(query, pageNum);

    if (omdbResult.success) {
      return res.json({
        success: true,
        results: omdbResult.data,
        totalResults: omdbResult.totalResults,
        fromOMDb: true
      });
    }

    // No results
    res.json({
      success: true,
      results: [],
      totalResults: 0,
      message: 'No results found'
    });
  } catch (error) {
    console.error('Error in advanced search:', error.message);
    res.status(500).json({
      success: false,
      error: 'Advanced search failed'
    });
  }
});

/**
 * POST /api/search/sync
 * Sync search index with content-service data
 */
router.post('/sync', async (req, res) => {
  try {
    // Clear cache to force fresh data
    searchCache.clear();

    // This would typically trigger a reindexing process
    // For now, just clear the cache and return success
    res.json({
      success: true,
      message: 'Search cache cleared successfully'
    });
  } catch (error) {
    console.error('Error syncing search index:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to sync search index'
    });
  }
});

/**
 * GET /api/search/enhanced
 * Enhanced search with fuzzy matching, advanced ranking, and comprehensive filters
 */
router.get('/enhanced', async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      type,
      genre,
      year,
      minRating,
      maxRating,
      sortBy = 'relevance',
      fuzzy = true
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    const query = q.trim();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Get all available movies from both sources
    let allMovies = [];

    // Try content-service first
    const contentServiceResult = await searchContentService(query, 1, { limit: 100 }); // Get more for better fuzzy matching

    if (contentServiceResult.success && contentServiceResult.data.length > 0) {
      const formattedResults = contentServiceResult.data.map(item => ({
        imdbID: item.imdbID || item._id,
        Title: item.title,
        Year: item.year?.toString() || '',
        Type: item.type || 'movie',
        Poster: item.poster || '',
        Runtime: item.duration ? `${item.duration} min` : '',
        Genre: item.genres ? item.genres.join(', ') : '',
        Director: item.director || '',
        Plot: item.description || '',
        Actors: item.actors ? item.actors.join(', ') : '',
        imdbRating: item.imdbRating?.toString() || '',
        averageUserRating: item.averageUserRating || 0,
        viewCount: item.viewCount || 0
      }));

      allMovies.push(...formattedResults);
    }

    // Supplement with OMDb if needed
    if (allMovies.length < 50) {
      const omdbResult = await searchOMDb(query, 1);

      if (omdbResult.success) {
        const existingIds = new Set(allMovies.map(m => m.imdbID));
        const newResults = omdbResult.data.filter(omdbMovie =>
          !existingIds.has(omdbMovie.imdbID)
        );

        allMovies.push(...newResults.slice(0, 50 - allMovies.length));
      }
    }

    // Apply advanced search with fuzzy matching
    const searchOptions = {
      query,
      type,
      genre,
      year,
      minRating,
      maxRating,
      sortBy,
      limit: limitNum,
      offset
    };

    let searchResults;
    if (fuzzy === 'true' || fuzzy === true) {
      searchResults = fuzzySearch.advancedSearch(allMovies, searchOptions);
    } else {
      // Simple search without fuzzy matching
      searchResults = fuzzySearch.advancedSearch(allMovies, { ...searchOptions, fuzzy: false });
    }

    // Format response
    const response = {
      success: true,
      data: {
        Search: searchResults.results,
        totalResults: searchResults.total.toString(),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(searchResults.total / limitNum),
          totalItems: searchResults.total,
          itemsPerPage: limitNum,
          hasNextPage: searchResults.hasMore,
          hasPreviousPage: pageNum > 1
        },
        searchOptions: {
          query,
          type,
          genre,
          year,
          minRating,
          maxRating,
          sortBy,
          fuzzy: fuzzy === 'true' || fuzzy === true
        },
        sources: {
          contentService: contentServiceResult.success,
          omdb: allMovies.length > (contentServiceResult.data?.length || 0),
          totalMovies: allMovies.length
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in enhanced search:', error.message);
    res.status(500).json({
      success: false,
      error: 'Enhanced search temporarily unavailable'
    });
  }
});

/**
 * GET /api/search/stats
 * Get search service statistics
 */
router.get('/stats', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        cacheSize: searchCache.size,
        cacheTTL: CACHE_TTL / 1000, // in seconds
        contentServiceUrl: CONTENT_SERVICE_URL,
        omdbEnabled: !!OMDB_API_KEY
      }
    });
  } catch (error) {
    console.error('Error getting search stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get search statistics'
    });
  }
});

module.exports = router;