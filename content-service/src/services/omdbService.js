const axios = require('axios');
const Content = require('../models/Content');

class OMDbService {
  constructor() {
    this.apiKey = process.env.OMDB_API_KEY;
    this.baseUrl = process.env.OMDB_BASE_URL || 'https://www.omdbapi.com/';
    this.rateLimit = parseInt(process.env.OMDB_RATE_LIMIT) || 40;
    this.requestCount = 0;
    this.resetTime = Date.now() + 60000; // Reset every minute
  }

  /**
   * Check rate limit and wait if necessary
   */
  async checkRateLimit() {
    const now = Date.now();

    // Reset counter if minute has passed
    if (now > this.resetTime) {
      this.requestCount = 0;
      this.resetTime = now + 60000;
    }

    // If at limit, wait until reset
    if (this.requestCount >= this.rateLimit) {
      const waitTime = this.resetTime - now;
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
    }

    this.requestCount++;
  }

  /**
   * Make HTTP request to OMDb API with retry logic
   */
  async makeRequest(params, retries = 3) {
    try {
      await this.checkRateLimit();

      const response = await axios.get(this.baseUrl, {
        params: {
          apikey: this.apiKey,
          ...params,
          timeout: 10000
        }
      });

      return response.data;
    } catch (error) {
      if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND')) {
        console.log(`Request failed, retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.makeRequest(params, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Search movies by title
   */
  async searchMovies(query, page = 1) {
    try {
      const result = await this.makeRequest({
        s: query,
        page: page,
        type: 'movie'
      });

      if (result.Response === 'False') {
        return { Search: [], totalResults: '0', Response: 'True' };
      }

      return result;
    } catch (error) {
      console.error('Error searching movies:', error.message);
      throw new Error('Failed to search movies from OMDb');
    }
  }

  /**
   * Search series by title
   */
  async searchSeries(query, page = 1) {
    try {
      const result = await this.makeRequest({
        s: query,
        page: page,
        type: 'series'
      });

      if (result.Response === 'False') {
        return { Search: [], totalResults: '0', Response: 'True' };
      }

      return result;
    } catch (error) {
      console.error('Error searching series:', error.message);
      throw new Error('Failed to search series from OMDb');
    }
  }

  /**
   * Get detailed movie/series information by IMDB ID
   */
  async getMovieDetails(imdbID) {
    try {
      const result = await this.makeRequest({
        i: imdbID,
        plot: 'full'
      });

      if (result.Response === 'False') {
        return null;
      }

      return result;
    } catch (error) {
      console.error('Error getting movie details:', error.message);
      throw new Error('Failed to get movie details from OMDb');
    }
  }

  /**
   * Transform OMDb data to Content model format
   */
  transformOMDbData(omdbData, options = {}) {
    const content = {
      title: omdbData.Title,
      description: omdbData.Plot,
      type: omdbData.Type === 'movie' ? 'movie' : omdbData.Type === 'series' ? 'series' : 'episode',
      year: parseInt(omdbData.Year) || null,
      genres: omdbData.Genre ? omdbData.Genre.split(', ').map(g => g.trim()) : [],
      imdbID: omdbData.imdbID,
      omdbData: omdbData,
      poster: omdbData.Poster && omdbData.Poster !== 'N/A' ? omdbData.Poster : null,
      director: omdbData.Director && omdbData.Director !== 'N/A' ? omdbData.Director : null,
      writer: omdbData.Writer && omdbData.Writer !== 'N/A' ? omdbData.Writer : null,
      actors: omdbData.Actors && omdbData.Actors !== 'N/A' ? omdbData.Actors.split(', ').map(a => a.trim()) : [],
      language: omdbData.Language && omdbData.Language !== 'N/A' ? omdbData.Language : null,
      country: omdbData.Country && omdbData.Country !== 'N/A' ? omdbData.Country : null,
      awards: omdbData.Awards && omdbData.Awards !== 'N/A' ? omdbData.Awards : null,
      imdbRating: omdbData.imdbRating && omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : null,
      boxOffice: omdbData.BoxOffice && omdbData.BoxOffice !== 'N/A' ? omdbData.BoxOffice : null,
      production: omdbData.Production && omdbData.Production !== 'N/A' ? omdbData.Production : null,
      website: omdbData.Website && omdbData.Website !== 'N/A' ? omdbData.Website : null,
      lastSyncedAt: new Date()
    };

    // Parse runtime for movies
    if (omdbData.Runtime && omdbData.Runtime !== 'N/A') {
      const runtime = omdbData.Runtime.match(/(\d+)\s*min/);
      if (runtime) {
        content.duration = parseInt(runtime[1]);
      }
    }

    // Parse ratings from other sources
    if (omdbData.Ratings && Array.isArray(omdbData.Ratings)) {
      omdbData.Ratings.forEach(rating => {
        if (rating.Source === 'Rotten Tomatoes' && rating.Value) {
          const rtValue = rating.Value.match(/(\d+)%/);
          if (rtValue) {
            content.rottenTomatoesRating = parseInt(rtValue[1]);
          }
        }
        if (rating.Source === 'Metacritic' && rating.Value) {
          const mcValue = rating.Value.match(/(\d+)\/100/);
          if (mcValue) {
            content.metacriticRating = parseInt(mcValue[1]);
          }
        }
      });
    }

    // Handle series-specific data
    if (content.type === 'series' && omdbData.totalSeasons) {
      content.totalSeasons = parseInt(omdbData.totalSeasons);
    }

    // Apply custom options
    if (options.customFields) {
      content.customFields = options.customFields;
    }
    if (options.isFeatured) {
      content.isFeatured = true;
    }
    if (options.status) {
      content.status = options.status;
    }

    return content;
  }

  /**
   * Import movie from OMDb to database
   */
  async importMovie(imdbID, options = {}) {
    try {
      // Check if movie already exists
      const existingContent = await Content.findOne({ imdbID });

      // Get movie details from OMDb
      const omdbData = await this.getMovieDetails(imdbID);
      if (!omdbData) {
        throw new Error('Movie not found in OMDb');
      }

      // Transform data
      const contentData = this.transformOMDbData(omdbData, options);

      if (existingContent) {
        // Update existing content
        Object.assign(existingContent, contentData);
        existingContent.updatedAt = new Date();
        await existingContent.save();
        return existingContent;
      } else {
        // Create new content
        const newContent = new Content(contentData);
        await newContent.save();
        return newContent;
      }
    } catch (error) {
      console.error('Error importing movie:', error.message);
      throw new Error(`Failed to import movie: ${error.message}`);
    }
  }

  /**
   * Batch import multiple movies
   */
  async importBatchMovies(imdbIDs, options = {}) {
    const results = {
      successful: [],
      failed: [],
      total: imdbIDs.length
    };

    for (const imdbID of imdbIDs) {
      try {
        const content = await this.importMovie(imdbID, options);
        results.successful.push({ imdbID, contentId: content._id });
        console.log(`Successfully imported: ${imdbID}`);
      } catch (error) {
        results.failed.push({ imdbID, error: error.message });
        console.error(`Failed to import ${imdbID}:`, error.message);
      }

      // Add small delay between requests to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Sync existing movie with latest OMDb data
   */
  async syncMovie(imdbID) {
    try {
      const content = await Content.findOne({ imdbID });
      if (!content) {
        throw new Error('Movie not found in database');
      }

      const omdbData = await this.getMovieDetails(imdbID);
      if (!omdbData) {
        throw new Error('Movie not found in OMDb');
      }

      // Transform data but preserve admin customizations
      const contentData = this.transformOMDbData(omdbData);

      // Preserve admin-only fields
      const preservedFields = [
        'isAdminCreated', 'isFeatured', 'status', 'customFields',
        'viewCount', 'averageUserRating', 'totalReviews'
      ];

      preservedFields.forEach(field => {
        if (content[field] !== undefined) {
          contentData[field] = content[field];
        }
      });

      Object.assign(content, contentData);
      content.updatedAt = new Date();
      await content.save();

      return content;
    } catch (error) {
      console.error('Error syncing movie:', error.message);
      throw new Error(`Failed to sync movie: ${error.message}`);
    }
  }

  /**
   * Check if movie exists in database
   */
  async movieExists(imdbID) {
    try {
      const content = await Content.findOne({ imdbID });
      return content || null;
    } catch (error) {
      console.error('Error checking movie existence:', error.message);
      return null;
    }
  }

  /**
   * Get popular movies for seeding
   */
  async getPopularMovies() {
    const popularIMDBIds = [
      'tt0111161', // The Shawshank Redemption
      'tt0068646', // The Godfather
      'tt0071562', // The Godfather: Part II
      'tt0468569', // The Dark Knight
      'tt0050083', // 12 Angry Men
      'tt0108052', // Schindler's List
      'tt0167260', // The Lord of the Rings: The Return of the King
      'tt0120737', // The Lord of the Rings: The Fellowship of the Ring
      'tt0180093', // Pulp Fiction
      'tt0137523', // Fight Club
      'tt0060196', // The Good, the Bad and the Ugly
      'tt0133093', // The Matrix
      'tt1375666', // Inception
      'tt0080684', // Star Wars: Episode V - The Empire Strikes Back
      'tt0076759', // Star Wars: Episode IV - A New Hope
      'tt0167261', // The Lord of the Rings: The Two Towers
      'tt0120815', // Saving Private Ryan
      'tt0109830', // Forrest Gump
      'tt0245429', // The Lord of the Rings: The Fellowship of the Ring (extended)
      'tt0110912', // Pulp Fiction (alternate ID)
    ];

    return popularIMDBIds;
  }
}

module.exports = new OMDbService();