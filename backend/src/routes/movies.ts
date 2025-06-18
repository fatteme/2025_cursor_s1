import { Router, Request, Response } from 'express';
import { movieRecommendationService } from '../services/movieRecommendationService';

const router = Router();

// Search movies
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const movies = await movieRecommendationService.searchMovies(query, parseInt(limit as string));

    res.json({
      success: true,
      movies
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search movies' });
  }
});

// Get movie details
router.get('/:movieId', async (req: Request, res: Response) => {
  try {
    const { movieId } = req.params;

    const movieDetails = await movieRecommendationService.getMovieDetails(movieId);

    res.json({
      success: true,
      movie: movieDetails
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get movie details' });
  }
});

export { router as movieRoutes }; 