const router = require('express').Router();
const axios = require('axios');

const OMDB_API_KEY = '70c8d861';
const OMDB_BASE_URL = 'https://www.omdbapi.com/';

// Mock data for testing - Extended movie database
const ALL_MOCK_MOVIES = [
  {
    Title: 'Inception',
    Year: '2010',
    imdbID: 'tt1375666',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMjAxMzc5NzAxN15BMl5BanBnXkFtZTcwNTI5OTMyNw@@._V1_SX300.jpg',
    Runtime: '148 min',
    Genre: 'Action, Sci-Fi, Thriller',
    Director: 'Christopher Nolan',
    Plot: 'A thief who steals corporate secrets through the use of dream-sharing technology.',
    Actors: 'Leonardo DiCaprio, Marion Cotillard, Ellen Page',
    imdbRating: '8.8'
  },
  {
    Title: 'The Matrix',
    Year: '1999',
    imdbID: 'tt0133093',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTAwLWI5OTAtNTU4OWQ1NzA4Nzc1XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
    Runtime: '136 min',
    Genre: 'Action, Sci-Fi',
    Director: 'Lana Wachowski, Lilly Wachowski',
    Plot: 'A computer programmer discovers that reality as he knows it is a simulation.',
    Actors: 'Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss',
    imdbRating: '8.7'
  },
  {
    Title: 'The Dark Knight',
    Year: '2008',
    imdbID: 'tt0468569',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg',
    Runtime: '152 min',
    Genre: 'Action, Crime, Drama',
    Director: 'Christopher Nolan',
    Plot: 'When the menace known as the Joker wreaks havoc and chaos on Gotham.',
    Actors: 'Christian Bale, Heath Ledger, Aaron Eckhart',
    imdbRating: '9.0'
  },
  {
    Title: 'Interstellar',
    Year: '2014',
    imdbID: 'tt0816692',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00ODE3LWFmMTAtNzU4ODExNTU2OTQ1XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_SX300.jpg',
    Runtime: '169 min',
    Genre: 'Adventure, Drama, Sci-Fi',
    Director: 'Christopher Nolan',
    Plot: 'A team of explorers travel through a wormhole in space to ensure humanity\'s survival.',
    Actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    imdbRating: '8.6'
  },
  {
    Title: 'Pulp Fiction',
    Year: '1994',
    imdbID: 'tt0110912',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItMDJlODU2OTg3ODZhXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
    Runtime: '154 min',
    Genre: 'Crime, Drama',
    Director: 'Quentin Tarantino',
    Plot: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine.',
    Actors: 'John Travolta, Uma Thurman, Samuel L. Jackson',
    imdbRating: '8.9'
  },
  {
    Title: 'Forrest Gump',
    Year: '1994',
    imdbID: 'tt0109830',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY0d4Yy00YjA5LWEwYjgtMzk1NTMzOTkyMjkxXkEyXkFqcGdeQXVyMTAwMzUwNzk@._V1_SX300.jpg',
    Runtime: '142 min',
    Genre: 'Drama, Romance',
    Director: 'Robert Zemeckis',
    Plot: 'The presidencies of Kennedy and Johnson unfold through the perspective of an Alabama man.',
    Actors: 'Tom Hanks, Gary Sinise, Sally Field',
    imdbRating: '8.8'
  },
  {
    Title: 'The Shawshank Redemption',
    Year: '1994',
    imdbID: 'tt0111161',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2ZhMS00NmQ2LWE3MzAtMDI3NGM2YjA2MzlkXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg',
    Runtime: '142 min',
    Genre: 'Drama',
    Director: 'Frank Darabont',
    Plot: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.',
    Actors: 'Tim Robbins, Morgan Freeman',
    imdbRating: '9.3'
  },
  {
    Title: 'Avengers: Endgame',
    Year: '2019',
    imdbID: 'tt4154796',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2AxVQqw@@._V1_SX300.jpg',
    Runtime: '181 min',
    Genre: 'Action, Adventure, Drama',
    Director: 'Anthony Russo, Joe Russo',
    Plot: 'After the devastating events, the Avengers assemble once more to reverse Thanos\' actions.',
    Actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo',
    imdbRating: '8.4'
  },
  {
    Title: 'Titanic',
    Year: '1997',
    imdbID: 'tt0120338',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMDdmZGU3NDQtY2E5My00ZDZhLWFlMTAtYTc4MDc1Nzg0Yzg1XkEyXkFqcGdeQXVyNjk1Njg5OTA@._V1_SX300.jpg',
    Runtime: '194 min',
    Genre: 'Drama, Romance',
    Director: 'James Cameron',
    Plot: 'A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious.',
    Actors: 'Leonardo DiCaprio, Kate Winslet, Billy Zane',
    imdbRating: '7.8'
  },
  {
    Title: 'Avatar',
    Year: '2009',
    imdbID: 'tt0499549',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMjEyOTYzODU3Nl5BMl5BanBnXkFtZTcwOTcyMDAwOA@@._V1_SX300.jpg',
    Runtime: '162 min',
    Genre: 'Action, Adventure, Fantasy',
    Director: 'James Cameron',
    Plot: 'A paraplegic Marine dispatched to the moon Pandora on a unique mission.',
    Actors: 'Sam Worthington, Zoe Saldana, Sigourney Weaver',
    imdbRating: '7.8'
  },
  {
    Title: 'The Godfather',
    Year: '1972',
    imdbID: 'tt0068646',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWFjMzYtNDkxODZmZjg2OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg',
    Runtime: '175 min',
    Genre: 'Crime, Drama',
    Director: 'Francis Ford Coppola',
    Plot: 'The aging patriarch of an organized crime dynasty transfers control of his empire.',
    Actors: 'Marlon Brando, Al Pacino, James Caan',
    imdbRating: '9.2'
  },
  {
    Title: 'The Lion King',
    Year: '1994',
    imdbID: 'tt0110357',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BYTYxNGMyNWYtMjE3MS00MzNjLWFjNmYtMDk3N2FmYzZiNTg4XkEyXkFqcGdeQXVyNjY5NDk5NjE@._V1_SX300.jpg',
    Runtime: '88 min',
    Genre: 'Animation, Adventure, Drama',
    Director: 'Roger Allers, Rob Minkoff',
    Plot: 'Lion prince Simba and his father are targeted by his bitter uncle.',
    Actors: 'James Earl Jones, Jeremy Irons, Matthew Broderick',
    imdbRating: '8.5'
  },
  {
    Title: 'Gladiator',
    Year: '2000',
    imdbID: 'tt0172495',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMDliMmNhNDEtODg0MS00ZThjLWIyZDUtMzhlYWIwYzZmODc5XkEyXkFqcGdeQXVyNjg2NjE4OTk@._V1_SX300.jpg',
    Runtime: '155 min',
    Genre: 'Action, Adventure, Drama',
    Director: 'Ridley Scott',
    Plot: 'A former Roman General sets out to exact vengeance against the Emperor.',
    Actors: 'Russell Crowe, Joaquin Phoenix, Lucilla',
    imdbRating: '8.5'
  },
  {
    Title: 'The Prestige',
    Year: '2006',
    imdbID: 'tt0482571',
    Type: 'movie',
    Poster: 'https://m.media-amazon.com/images/M/MV5BMjA4NjkwNzYyM15BMl5BanBnXkFtZTcwMzAxMTgyMQ@@._V1_SX300.jpg',
    Runtime: '130 min',
    Genre: 'Mystery, Sci-Fi, Thriller',
    Director: 'Christopher Nolan',
    Plot: 'After a tragic accident, two stage magicians engage in a battle to create.',
    Actors: 'Christian Bale, Hugh Jackman, Michael Caine',
    imdbRating: '8.5'
  }
];

// Search movies - for filtering/searching
router.get('/movies', async (req, res) => {
  try {
    const { q, page = 1 } = req.query;

    // Use local movies data for search
    let allMovies = ALL_MOCK_MOVIES;

    // If no query, return all movies
    let filtered = allMovies;
    
    if (q && q.trim()) {
      const query = q.toLowerCase().trim();
      
      filtered = allMovies.filter(movie => {
        const titleLower = movie.Title.toLowerCase();
        const genreLower = movie.Genre.toLowerCase();
        const plotLower = movie.Plot.toLowerCase();
        const actorsLower = movie.Actors.toLowerCase();
        
        // Substring matching for better results (e.g., 'spider' matches 'Spider-Man')
        return (
          titleLower.includes(query) || 
          genreLower.includes(query) ||
          plotLower.includes(query) ||
          actorsLower.includes(query)
        );
      });
    }

    const itemsPerPage = 10;
    const pageNum = parseInt(page) || 1;
    const startIdx = (pageNum - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedResults = filtered.slice(startIdx, endIdx);

    return res.json({
      Response: 'True',
      Search: paginatedResults,
      totalResults: filtered.length.toString()
    });
  } catch (error) {
    console.error('Error searching movies:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});
    const pageNum = parseInt(page) || 1;
    const startIdx = (pageNum - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedResults = filtered.slice(startIdx, endIdx);

    return res.json({
      Response: 'True',
      Search: paginatedResults,
      totalResults: filtered.length.toString()
    });
  } catch (error) {
    console.error('Error searching movies:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Get movie details by ID
router.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const movie = ALL_MOCK_MOVIES.find(m => m.imdbID === id);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    return res.json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

module.exports = router;

// TODO: integrate with Elastic, Typesense, or MongoDB text index.
// Minimal /suggest and /query placeholders:
router.get('/suggest', (req,res) => res.json({ q: req.query.q, suggestions: [] }));
router.get('/query', (req,res) => res.json({ q: req.query.q, results: [] }));

module.exports = router;
