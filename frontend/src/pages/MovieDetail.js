import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MovieDetail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    setUser(userData ? JSON.parse(userData) : null);
    
    // Check if movie is in favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));

    fetchMovieDetails();
    fetchReviews();
  }, [id]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get movie from OMDB API via search service
      const response = await axios.get(`http://localhost:6005/api/search/movie/${id}`);
      setMovie(response.data);
    } catch (err) {
      // Fallback: Create a basic movie object for demo purposes
      console.error('Error fetching movie details:', err);
      setMovie({ imdbID: id, Title: 'Movie Details', Error: 'Could not fetch details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`http://localhost:4003/api/reviews/movie/${id}`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }
  };

  const handleAddToFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      const index = favorites.indexOf(id);
      favorites.splice(index, 1);
      setIsFavorite(false);
    } else {
      favorites.push(id);
      setIsFavorite(true);
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!newReview.trim()) {
      alert('Please write a review');
      return;
    }

    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:4003/api/reviews`,
        {
          movieId: id,
          rating: newRating,
          comment: newReview,
          userId: user?.id || 'anonymous'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setNewReview('');
      setNewRating(5);
      fetchReviews();
      alert('Review submitted successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Make sure review service is running.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="detail-container"><div className="loading">Loading movie details...</div></div>;

  if (!movie) return <div className="detail-container"><div className="error">Movie not found</div></div>;

  return (
    <div className="detail-container">
      <button className="back-btn" onClick={() => navigate('/')}>← Back to Movies</button>

      <div className="movie-detail">
        <div className="detail-poster">
          {movie.Poster && movie.Poster !== 'N/A' ? (
            <img src={movie.Poster} alt={movie.Title} />
          ) : (
            <div className="no-poster-detail">No Poster Available</div>
          )}
        </div>

        <div className="detail-content">
          <h1>{movie.Title}</h1>
          
          <div className="detail-meta">
            {movie.Year && <span className="meta-item">📅 {movie.Year}</span>}
            {movie.Runtime && <span className="meta-item">⏱️ {movie.Runtime}</span>}
            {movie.Rated && <span className="meta-item">🎞️ {movie.Rated}</span>}
            {movie.imdbRating && <span className="meta-item">⭐ {movie.imdbRating}/10</span>}
          </div>

          <div className="detail-buttons">
            <button 
              className={`favorite-btn ${isFavorite ? 'active' : ''}`}
              onClick={handleAddToFavorites}
            >
              {isFavorite ? '❤️ Remove from Favorites' : '🤍 Add to Favorites'}
            </button>
          </div>

          {movie.Plot && (
            <div className="detail-section">
              <h3>Plot</h3>
              <p>{movie.Plot}</p>
            </div>
          )}

          <div className="detail-info-grid">
            {movie.Genre && (
              <div className="info-item">
                <strong>Genre:</strong>
                <p>{movie.Genre}</p>
              </div>
            )}
            {movie.Director && (
              <div className="info-item">
                <strong>Director:</strong>
                <p>{movie.Director}</p>
              </div>
            )}
            {movie.Writer && (
              <div className="info-item">
                <strong>Writer:</strong>
                <p>{movie.Writer}</p>
              </div>
            )}
            {movie.Actors && (
              <div className="info-item">
                <strong>Actors:</strong>
                <p>{movie.Actors}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Reviews & Ratings</h2>

        <div className="review-form">
          <h3>Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="form-group">
              <label>Rating: {newRating}/10</label>
              <input
                type="range"
                min="1"
                max="10"
                value={newRating}
                onChange={(e) => setNewRating(parseInt(e.target.value))}
                className="rating-slider"
              />
            </div>

            <div className="form-group">
              <label>Your Review:</label>
              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Share your thoughts about this movie..."
                rows="4"
                className="review-textarea"
              />
            </div>

            <button
              type="submit"
              className="submit-review-btn"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        <div className="reviews-list">
          <h3>All Reviews ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <div className="no-reviews">No reviews yet. Be the first to review!</div>
          ) : (
            reviews.map((review, index) => (
              <div key={index} className="review-item">
                <div className="review-header">
                  <strong>{review.userName || 'Anonymous'}</strong>
                  <span className="review-rating">⭐ {review.rating}/10</span>
                </div>
                <p className="review-text">{review.comment}</p>
                <small className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
