import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!accessToken) {
      navigate('/login');
      return;
    }

    setUser(userData ? JSON.parse(userData) : null);
    fetchMovies('', 1);
  }, []);

  const fetchMovies = async (query = '', page = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Always use search service - it has the movies data
      const response = await axios.get('http://localhost:6005/api/search/movies', {
        params: {
          q: query,
          page: page
        }
      });

      console.log('Movies response:', response.data);

      if (response.data.Response === 'True') {
        setMovies(response.data.Search || []);
        setTotalResults(parseInt(response.data.totalResults) || 0);
      } else {
        setError(response.data.Error || 'No movies found');
        setMovies([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error('Error fetching movies:', err.message);
      setError(`Failed to fetch movies. Make sure search service is running on port 6005.`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      fetchMovies(searchQuery, 1);
    }
  };

  const handleMovieClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchMovies(searchQuery, newPage);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = () => {
    const totalPages = Math.ceil(totalResults / 10);
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchMovies(searchQuery, newPage);
      window.scrollTo(0, 0);
    }
  };

  const totalPages = Math.ceil(totalResults / 10);

  return (
    <div className="home-container">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎬 MovieReview</h1>
            <p>Discover and review your favorite movies</p>
          </div>
          <div className="header-right">
            {user && <span className="user-info">Welcome, {user.email || user.name}</span>}
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <div className="search-section">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">Search</button>
        </form>
      </div>

      {loading && <div className="loading">Loading movies...</div>}
      {error && <div className="error">Error: {error}</div>}

      <div className="movies-grid">
        {movies.map((movie) => (
          <div key={movie.imdbID} className="movie-card" onClick={() => handleMovieClick(movie.imdbID)}>
            <div className="movie-poster">
              {movie.Poster !== 'N/A' ? (
                <img src={movie.Poster} alt={movie.Title} />
              ) : (
                <div className="no-poster">No Poster</div>
              )}
              <div className="movie-overlay">
                <button className="view-details-btn">View Details</button>
              </div>
            </div>
            <div className="movie-info">
              <h3>{movie.Title}</h3>
              <p className="year">{movie.Year}</p>
              <p className="type">{movie.Type}</p>
            </div>
          </div>
        ))}
      </div>

      {!loading && movies.length === 0 && !error && (
        <div className="no-movies">No movies found. Try a different search.</div>
      )}

      {totalPages > 1 && !loading && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={handlePrevious}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
          <button
            className="pagination-btn"
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
