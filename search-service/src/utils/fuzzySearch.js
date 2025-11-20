/**
 * Enhanced Search Utilities
 * Implements fuzzy search, text similarity, and result ranking
 */

class FuzzySearchEngine {
  constructor() {
    this.searchWeights = {
      titleMatch: 10,
      exactMatch: 8,
      partialMatch: 4,
      genreMatch: 3,
      actorMatch: 2,
      directorMatch: 5,
      ratingBoost: 2,
      popularityBoost: 1,
      yearProximity: 2
    };
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity ratio between two strings (0-1)
   */
  similarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Normalize and clean search terms
   */
  normalizeSearchTerm(term) {
    return term
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Check if string contains all search terms
   */
  containsAllTerms(text, searchTerms) {
    const normalizedText = this.normalizeSearchTerm(text);
    return searchTerms.every(term =>
      normalizedText.includes(this.normalizeSearchTerm(term))
    );
  }

  /**
   * Check if string contains any search terms
   */
  containsAnyTerm(text, searchTerms) {
    const normalizedText = this.normalizeSearchTerm(text);
    return searchTerms.some(term =>
      normalizedText.includes(this.normalizeSearchTerm(term))
    );
  }

  /**
   * Calculate match score for a movie against search query
   */
  calculateMatchScore(movie, searchQuery) {
    let score = 0;
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    const normalizedQuery = this.normalizeSearchTerm(searchQuery);

    // Title matching (highest priority)
    const normalizedTitle = this.normalizeSearchTerm(movie.Title || movie.title || '');

    // Exact title match
    if (normalizedTitle === normalizedQuery) {
      score += this.searchWeights.exactMatch;
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += this.searchWeights.titleMatch;
    } else if (this.containsAllTerms(movie.Title || movie.title || '', searchTerms)) {
      score += this.searchWeights.partialMatch;
    } else if (this.containsAnyTerm(movie.Title || movie.title || '', searchTerms)) {
      score += this.searchWeights.partialMatch * 0.5;
    } else {
      // Fuzzy matching for title
      const titleSimilarity = this.similarity(normalizedQuery, normalizedTitle);
      if (titleSimilarity > 0.5) {
        score += titleSimilarity * this.searchWeights.titleMatch * 0.7;
      }
    }

    // Description/Plot matching
    const description = movie.Plot || movie.description || '';
    if (this.containsAllTerms(description, searchTerms)) {
      score += this.searchWeights.partialMatch * 0.8;
    } else if (this.containsAnyTerm(description, searchTerms)) {
      score += this.searchWeights.partialMatch * 0.4;
    }

    // Director matching
    const director = movie.Director || movie.director || '';
    if (this.containsAllTerms(director, searchTerms)) {
      score += this.searchWeights.directorMatch;
    } else if (this.containsAnyTerm(director, searchTerms)) {
      score += this.searchWeights.directorMatch * 0.6;
    }

    // Actor matching
    const actors = movie.Actors || movie.actors || [];
    if (Array.isArray(actors)) {
      const actorsText = actors.join(' ');
      if (this.containsAllTerms(actorsText, searchTerms)) {
        score += this.searchWeights.actorMatch;
      } else if (this.containsAnyTerm(actorsText, searchTerms)) {
        score += this.searchWeights.actorMatch * 0.6;
      }
    } else {
      if (this.containsAllTerms(actors, searchTerms)) {
        score += this.searchWeights.actorMatch;
      } else if (this.containsAnyTerm(actors, searchTerms)) {
        score += this.searchWeights.actorMatch * 0.6;
      }
    }

    // Genre matching
    const genres = movie.Genre || movie.genres || [];
    if (Array.isArray(genres)) {
      const genresText = genres.join(' ');
      if (this.containsAllTerms(genresText, searchTerms)) {
        score += this.searchWeights.genreMatch;
      } else if (this.containsAnyTerm(genresText, searchTerms)) {
        score += this.searchWeights.genreMatch * 0.6;
      }
    } else {
      if (this.containsAllTerms(genres, searchTerms)) {
        score += this.searchWeights.genreMatch;
      } else if (this.containsAnyTerm(genres, searchTerms)) {
        score += this.searchWeights.genreMatch * 0.6;
      }
    }

    // Rating boost (higher rated movies get preference)
    const imdbRating = parseFloat(movie.imdbRating || 0);
    if (imdbRating >= 8) {
      score += this.searchWeights.ratingBoost;
    } else if (imdbRating >= 7) {
      score += this.searchWeights.ratingBoost * 0.7;
    } else if (imdbRating >= 6) {
      score += this.searchWeights.ratingBoost * 0.4;
    }

    // User rating boost
    const userRating = parseFloat(movie.averageUserRating || 0);
    if (userRating >= 4) {
      score += this.searchWeights.popularityBoost * 1.5;
    } else if (userRating >= 3) {
      score += this.searchWeights.popularityBoost;
    }

    // Popularity boost (view count)
    const viewCount = parseInt(movie.viewCount || 0);
    if (viewCount > 1000) {
      score += this.searchWeights.popularityBoost;
    } else if (viewCount > 500) {
      score += this.searchWeights.popularityBoost * 0.5;
    }

    // Year proximity boost (if search query contains a year)
    const yearMatch = searchQuery.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      const searchYear = parseInt(yearMatch[0]);
      const movieYear = parseInt(movie.Year || movie.year || 0);

      if (movieYear === searchYear) {
        score += this.searchWeights.yearProximity * 2;
      } else if (Math.abs(movieYear - searchYear) <= 2) {
        score += this.searchWeights.yearProximity;
      }
    }

    return score;
  }

  /**
   * Sort and rank search results by relevance
   */
  rankResults(movies, searchQuery) {
    return movies
      .map(movie => ({
        ...movie,
        relevanceScore: this.calculateMatchScore(movie, searchQuery)
      }))
      .filter(movie => movie.relevanceScore > 0)
      .sort((a, b) => {
        // Primary sort: relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }

        // Secondary sort: user rating
        const aRating = parseFloat(a.averageUserRating || a.imdbRating || 0);
        const bRating = parseFloat(b.averageUserRating || b.imdbRating || 0);
        if (bRating !== aRating) {
          return bRating - aRating;
        }

        // Tertiary sort: popularity (view count)
        const aViews = parseInt(a.viewCount || 0);
        const bViews = parseInt(b.viewCount || 0);
        return bViews - aViews;
      });
  }

  /**
   * Apply fuzzy search with minimum similarity threshold
   */
  fuzzySearch(movies, searchQuery, minSimilarity = 0.4) {
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);

    return movies.filter(movie => {
      const score = this.calculateMatchScore(movie, searchQuery);

      // Include movies with meaningful matches
      if (score > 0) return true;

      // Include movies with fuzzy title matching
      const titleSimilarity = this.similarity(
        this.normalizeSearchTerm(searchQuery),
        this.normalizeSearchTerm(movie.Title || movie.title || '')
      );

      return titleSimilarity >= minSimilarity;
    });
  }

  /**
   * Generate search suggestions based on available content
   */
  generateSuggestions(movies, query, limit = 10) {
    if (!query || query.length < 2) return [];

    const normalizedQuery = this.normalizeSearchTerm(query);
    const suggestions = new Map();

    movies.forEach(movie => {
      const title = movie.Title || movie.title || '';
      const normalizedTitle = this.normalizeSearchTerm(title);

      // Check for partial matches in title
      if (normalizedTitle.includes(normalizedQuery) ||
          normalizedQuery.includes(normalizedTitle)) {
        suggestions.set(title, {
          title,
          type: movie.Type || movie.type || 'movie',
          year: movie.Year || movie.year,
          imdbID: movie.imdbID,
          relevance: this.calculateMatchScore(movie, query)
        });
      }

      // Check for fuzzy matches
      const similarity = this.similarity(normalizedQuery, normalizedTitle);
      if (similarity > 0.6 && !suggestions.has(title)) {
        suggestions.set(title, {
          title,
          type: movie.Type || movie.type || 'movie',
          year: movie.Year || movie.year,
          imdbID: movie.imdbID,
          relevance: similarity * 5
        });
      }
    });

    return Array.from(suggestions.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * Advanced search with multiple filters and fuzzy matching
   */
  advancedSearch(movies, options = {}) {
    const {
      query,
      type,
      genre,
      year,
      minRating,
      maxRating,
      sortBy = 'relevance',
      limit = 20,
      offset = 0
    } = options;

    let filtered = movies;

    // Apply text search if query provided
    if (query && query.trim()) {
      filtered = this.fuzzySearch(filtered, query);
      filtered = this.rankResults(filtered, query);
    }

    // Apply filters
    if (type) {
      filtered = filtered.filter(movie =>
        (movie.Type || movie.type || 'movie').toLowerCase() === type.toLowerCase()
      );
    }

    if (genre) {
      filtered = filtered.filter(movie => {
        const genres = movie.Genre || movie.genres || [];
        const genreArray = Array.isArray(genres) ? genres : (genres || '').split(',').map(g => g.trim());
        return genreArray.some(g =>
          this.normalizeSearchTerm(g).includes(this.normalizeSearchTerm(genre))
        );
      });
    }

    if (year) {
      filtered = filtered.filter(movie => {
        const movieYear = parseInt(movie.Year || movie.year || 0);
        if (year.includes('-')) {
          const [startYear, endYear] = year.split('-').map(Number);
          return movieYear >= startYear && movieYear <= endYear;
        }
        return movieYear === parseInt(year);
      });
    }

    if (minRating) {
      filtered = filtered.filter(movie => {
        const rating = parseFloat(movie.imdbRating || movie.averageUserRating || 0);
        return rating >= parseFloat(minRating);
      });
    }

    if (maxRating) {
      filtered = filtered.filter(movie => {
        const rating = parseFloat(movie.imdbRating || movie.averageUserRating || 0);
        return rating <= parseFloat(maxRating);
      });
    }

    // Apply additional sorting if not already sorted by relevance
    if (sortBy !== 'relevance' || !query) {
      switch (sortBy) {
        case 'rating':
          filtered.sort((a, b) => {
            const aRating = parseFloat(a.imdbRating || a.averageUserRating || 0);
            const bRating = parseFloat(b.imdbRating || b.averageUserRating || 0);
            return bRating - aRating;
          });
          break;
        case 'year':
          filtered.sort((a, b) => {
            const aYear = parseInt(a.Year || a.year || 0);
            const bYear = parseInt(b.Year || b.year || 0);
            return bYear - aYear;
          });
          break;
        case 'popularity':
          filtered.sort((a, b) => {
            const aViews = parseInt(a.viewCount || 0);
            const bViews = parseInt(b.viewCount || 0);
            return bViews - aViews;
          });
          break;
        case 'title':
          filtered.sort((a, b) => {
            const aTitle = (a.Title || a.title || '').toLowerCase();
            const bTitle = (b.Title || b.title || '').toLowerCase();
            return aTitle.localeCompare(bTitle);
          });
          break;
      }
    }

    // Apply pagination
    const total = filtered.length;
    const paginatedResults = filtered.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total,
      offset,
      limit,
      hasMore: offset + limit < total
    };
  }
}

module.exports = FuzzySearchEngine;