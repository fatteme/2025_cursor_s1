import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { VotingSession } from '../models/VotingSession';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  groupId?: string;
}

export const setupSocketIO = (io: Server): void => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join a voting session
    socket.on('join-voting-session', async (data: { groupId: string }) => {
      try {
        socket.groupId = data.groupId;
        socket.join(`group-${data.groupId}`);
        
        // Notify other users in the group
        socket.to(`group-${data.groupId}`).emit('user-joined-voting', {
          userId: socket.userId,
          timestamp: new Date()
        });

        console.log(`User ${socket.userId} joined voting session for group ${data.groupId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join voting session' });
      }
    });

    // Handle movie vote (swipe)
    socket.on('vote-movie', async (data: { movieId: string; vote: 'yes' | 'no' }) => {
      try {
        if (!socket.groupId) {
          socket.emit('error', { message: 'Not in a voting session' });
          return;
        }

        // Broadcast vote to other users in the group
        socket.to(`group-${socket.groupId}`).emit('movie-voted', {
          userId: socket.userId,
          movieId: data.movieId,
          vote: data.vote,
          timestamp: new Date()
        });

        // Update voting session in database
        await VotingSession.updateVote(socket.groupId, socket.userId!, data.movieId, data.vote);

        console.log(`User ${socket.userId} voted ${data.vote} for movie ${data.movieId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to record vote' });
      }
    });

    // Handle voting session start
    socket.on('start-voting-session', async (data: { groupId: string }) => {
      try {
        socket.to(`group-${data.groupId}`).emit('voting-session-started', {
          groupId: data.groupId,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to start voting session' });
      }
    });

    // Handle voting session end
    socket.on('end-voting-session', async (data: { groupId: string; selectedMovie: any }) => {
      try {
        socket.to(`group-${data.groupId}`).emit('voting-session-ended', {
          groupId: data.groupId,
          selectedMovie: data.selectedMovie,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to end voting session' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.groupId) {
        socket.to(`group-${socket.groupId}`).emit('user-left-voting', {
          userId: socket.userId,
          timestamp: new Date()
        });
      }
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}; 