import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { VotingSession } from '../models/VotingSession';
import { Group } from '../models/Group';
import { User } from '../models/User';
import { movieRecommendationService } from '../services/movieRecommendationService';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Start a voting session
router.post('/:groupId/start', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    // Check if user is group owner
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only group owner can start voting session' });
    }

    // Check if there's already an active session
    const existingSession = await VotingSession.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      return res.status(400).json({ message: 'There is already an active voting session' });
    }

    // Get movie recommendations
    const recommendations = await movieRecommendationService.getMovieRecommendations(groupId, 20);

    if (recommendations.length === 0) {
      return res.status(400).json({ message: 'No movie recommendations available' });
    }

    // Create voting session
    const votingSession = await VotingSession.createWithRecommendations(groupId, recommendations);

    res.status(201).json({
      success: true,
      session: {
        id: votingSession._id,
        groupId: votingSession.groupId,
        status: votingSession.status,
        movies: votingSession.movies,
        createdAt: votingSession.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start voting session' });
  }
});

// Get current voting session
router.get('/:groupId/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(user._id) && group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const session = await VotingSession.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });

    if (!session) {
      return res.status(404).json({ message: 'No active voting session found' });
    }

    // Get user's votes for this session
    const userVotes = session.votes.filter(vote => vote.userId.toString() === user._id.toString());

    res.json({
      success: true,
      session: {
        id: session._id,
        groupId: session.groupId,
        status: session.status,
        movies: session.movies,
        userVotes: userVotes.map(vote => ({
          movieId: vote.movieId,
          vote: vote.vote
        })),
        progress: session.progress,
        startedAt: session.startedAt,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get voting session' });
  }
});

// Vote on a movie
router.post('/:groupId/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { movieId, vote } = req.body;
    const user = (req as any).user;

    if (!movieId || !vote || !['yes', 'no'].includes(vote)) {
      return res.status(400).json({ message: 'Invalid vote data' });
    }

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(user._id) && group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Get active voting session
    const session = await VotingSession.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });

    if (!session) {
      return res.status(404).json({ message: 'No active voting session found' });
    }

    // Check if movie exists in session
    const movieExists = session.movies.some(movie => movie.id === movieId);
    if (!movieExists) {
      return res.status(400).json({ message: 'Movie not found in voting session' });
    }

    // Update vote
    await session.updateVote(user._id.toString(), movieId, vote);

    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

// End voting session (owner only)
router.post('/:groupId/end', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    // Check if user is group owner
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only group owner can end voting session' });
    }

    // Get active voting session
    const session = await VotingSession.findOne({
      groupId,
      status: { $in: ['pending', 'active'] }
    });

    if (!session) {
      return res.status(404).json({ message: 'No active voting session found' });
    }

    // End session and select best movie
    const endedSession = await VotingSession.endSession(session._id.toString());

    res.json({
      success: true,
      message: 'Voting session ended',
      session: {
        id: endedSession._id,
        groupId: endedSession.groupId,
        status: endedSession.status,
        selectedMovie: endedSession.selectedMovie,
        voteResults: endedSession.getVoteResults(),
        endedAt: endedSession.endedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to end voting session' });
  }
});

// Get voting session results
router.get('/:groupId/results/:sessionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId, sessionId } = req.params;
    const user = (req as any).user;

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(user._id) && group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const session = await VotingSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: 'Voting session not found' });
    }

    if (session.groupId.toString() !== groupId) {
      return res.status(400).json({ message: 'Session does not belong to this group' });
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        groupId: session.groupId,
        status: session.status,
        movies: session.movies,
        selectedMovie: session.selectedMovie,
        voteResults: session.getVoteResults(),
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get voting results' });
  }
});

// Get voting history for group
router.get('/:groupId/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    // Check if user is group member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(user._id) && group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    const sessions = await VotingSession.find({
      groupId,
      status: 'completed'
    }).sort({ endedAt: -1 }).limit(10);

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      status: session.status,
      selectedMovie: session.selectedMovie,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      createdAt: session.createdAt
    }));

    res.json({
      success: true,
      sessions: formattedSessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get voting history' });
  }
});

export { router as votingRoutes }; 