import axios from 'axios';
import { User } from '../models/User';
import { Group } from '../models/Group';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  popularity: number;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface MovieRecommendation {
  id: string;
  title: string;
  overview: string;
  posterPath: string;
  releaseDate: string;
  voteAverage: number;
  genres: string[];
  score: number;
}

class MovieRecommendationService {
  private tmdbApiKey: string;
  private tmdbBaseUrl: string;
  private genreMap: Map<number, string> = new Map();

  constructor() {
    this.tmdbApiKey = process.env.TMDB_API_KEY!;
    this.tmdbBaseUrl = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
    this.initializeGenreMap();
  }

  private async initializeGenreMap(): Promise<void> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/genre/movie/list`, {
        params: {
          api_key: this.tmdbApiKey,
          language: 'en-US'
        }
      });

      response.data.genres.forEach((genre: TMDBGenre) => {
        this.genreMap.set(genre.id, genre.name);
      });
    } catch (error) {
      console.error('Failed to initialize genre map:', error);
    }
  }

  private async fetchMoviesByGenres(genreIds: number[], page: number = 1): Promise<TMDBMovie[]> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/discover/movie`, {
        params: {
          api_key: this.tmdbApiKey,
          language: 'en-US',
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false,
          page,
          with_genres: genreIds.join(','),
          'vote_average.gte': 6.0,
          'vote_count.gte': 100
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('Failed to fetch movies by genres:', error);
      return [];
    }
  }

  private async fetchPopularMovies(page: number = 1): Promise<TMDBMovie[]> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/movie/popular`, {
        params: {
          api_key: this.tmdbApiKey,
          language: 'en-US',
          page
        }
      });

      return response.data.results;
    } catch (error) {
      console.error('Failed to fetch popular movies:', error);
      return [];
    }
  }

  private calculateGenreScore(userGenres: string[], movieGenres: string[]): number {
    if (userGenres.length === 0 || movieGenres.length === 0) return 0;

    const userGenreSet = new Set(userGenres);
    const movieGenreSet = new Set(movieGenres);
    
    const intersection = new Set([...userGenreSet].filter(x => movieGenreSet.has(x)));
    const union = new Set([...userGenreSet, ...movieGenreSet]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  private calculateGroupPreferenceScore(groupMembers: any[], movieGenres: string[]): number {
    if (groupMembers.length === 0) return 0;

    let totalScore = 0;
    let memberCount = 0;

    groupMembers.forEach(member => {
      if (member.preferences && member.preferences.genres) {
        const memberScore = this.calculateGenreScore(member.preferences.genres, movieGenres);
        totalScore += memberScore;
        memberCount++;
      }
    });

    return memberCount > 0 ? totalScore / memberCount : 0;
  }

  private calculateMovieScore(
    movie: TMDBMovie,
    groupMembers: any[],
    userPreferences: any
  ): number {
    const movieGenres = movie.genre_ids.map(id => this.genreMap.get(id)).filter(Boolean) as string[];
    
    // Base score from TMDB rating and popularity
    const baseScore = (movie.vote_average / 10) * 0.4 + (movie.popularity / 1000) * 0.2;
    
    // Group preference score
    const groupScore = this.calculateGroupPreferenceScore(groupMembers, movieGenres) * 0.3;
    
    // Individual user preference score (if available)
    let userScore = 0;
    if (userPreferences && userPreferences.genres) {
      userScore = this.calculateGenreScore(userPreferences.genres, movieGenres) * 0.1;
    }
    
    return baseScore + groupScore + userScore;
  }

  private transformTMDBMovie(movie: TMDBMovie): MovieRecommendation {
    const genres = movie.genre_ids
      .map(id => this.genreMap.get(id))
      .filter(Boolean) as string[];

    return {
      id: movie.id.toString(),
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      genres,
      score: 0 // Will be calculated later
    };
  }

  public async getMovieRecommendations(
    groupId: string,
    limit: number = 20
  ): Promise<MovieRecommendation[]> {
    try {
      // Get group and its members with preferences
      const group = await Group.findById(groupId).populate({
        path: 'members',
        select: 'preferences'
      });

      if (!group) {
        throw new Error('Group not found');
      }

      const groupMembers = group.members as any[];
      
      // Get all unique genres from group members
      const allGenres = new Set<string>();
      groupMembers.forEach(member => {
        if (member.preferences && member.preferences.genres) {
          member.preferences.genres.forEach((genre: string) => allGenres.add(genre));
        }
      });

      // Convert genre names to TMDB genre IDs
      const genreIds: number[] = [];
      this.genreMap.forEach((name, id) => {
        if (allGenres.has(name)) {
          genreIds.push(id);
        }
      });

      let movies: TMDBMovie[] = [];

      // Fetch movies based on group preferences
      if (genreIds.length > 0) {
        const preferenceMovies = await this.fetchMoviesByGenres(genreIds, 1);
        movies.push(...preferenceMovies);
      }

      // If we don't have enough movies, fetch popular movies
      if (movies.length < limit) {
        const popularMovies = await this.fetchPopularMovies(1);
        movies.push(...popularMovies);
      }

      // Remove duplicates and transform movies
      const uniqueMovies = movies.filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id)
      );

      // Calculate scores and sort
      const scoredMovies = uniqueMovies
        .map(movie => {
          const transformed = this.transformTMDBMovie(movie);
          transformed.score = this.calculateMovieScore(movie, groupMembers, null);
          return transformed;
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredMovies;
    } catch (error) {
      console.error('Error getting movie recommendations:', error);
      throw error;
    }
  }

  public async searchMovies(query: string, limit: number = 10): Promise<MovieRecommendation[]> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/search/movie`, {
        params: {
          api_key: this.tmdbApiKey,
          language: 'en-US',
          query,
          page: 1,
          include_adult: false
        }
      });

      return response.data.results
        .slice(0, limit)
        .map((movie: TMDBMovie) => this.transformTMDBMovie(movie));
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  }

  public async getMovieDetails(movieId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.tmdbBaseUrl}/movie/${movieId}`, {
        params: {
          api_key: this.tmdbApiKey,
          language: 'en-US',
          append_to_response: 'credits,videos,images'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting movie details:', error);
      throw error;
    }
  }
}

export const movieRecommendationService = new MovieRecommendationService(); 