import mongoose, { Document, Schema } from 'mongoose';

export interface IVote {
  userId: mongoose.Types.ObjectId;
  movieId: string;
  vote: 'yes' | 'no';
  timestamp: Date;
}

export interface IVotingSession extends Document {
  groupId: mongoose.Types.ObjectId;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  movies: Array<{
    id: string;
    title: string;
    overview: string;
    posterPath: string;
    releaseDate: string;
    voteAverage: number;
    genres: string[];
  }>;
  votes: IVote[];
  selectedMovie?: {
    id: string;
    title: string;
    overview: string;
    posterPath: string;
    releaseDate: string;
    voteAverage: number;
    genres: string[];
  };
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  updateVote(userId: string, movieId: string, vote: 'yes' | 'no'): Promise<void>;
  getVoteResults(): { [movieId: string]: { yes: number; no: number; total: number } };
  selectBestMovie(): any;
}

const voteSchema = new Schema<IVote>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movieId: {
    type: String,
    required: true
  },
  vote: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const votingSessionSchema = new Schema<IVotingSession>({
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  movies: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    overview: {
      type: String,
      required: true
    },
    posterPath: {
      type: String,
      required: true
    },
    releaseDate: {
      type: String,
      required: true
    },
    voteAverage: {
      type: Number,
      required: true
    },
    genres: [{
      type: String,
      required: true
    }]
  }],
  votes: [voteSchema],
  selectedMovie: {
    id: String,
    title: String,
    overview: String,
    posterPath: String,
    releaseDate: String,
    voteAverage: Number,
    genres: [String]
  },
  startedAt: Date,
  endedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
votingSessionSchema.index({ groupId: 1, status: 1 });
votingSessionSchema.index({ 'votes.userId': 1, 'votes.movieId': 1 });

// Method to update a user's vote for a movie
votingSessionSchema.methods.updateVote = async function(userId: string, movieId: string, vote: 'yes' | 'no'): Promise<void> {
  // Remove existing vote for this user and movie
  this.votes = this.votes.filter((v: IVote) => 
    !(v.userId.toString() === userId && v.movieId === movieId)
  );
  
  // Add new vote
  this.votes.push({
    userId: new mongoose.Types.ObjectId(userId),
    movieId,
    vote,
    timestamp: new Date()
  });
  
  await this.save();
};

// Method to get vote results for all movies
votingSessionSchema.methods.getVoteResults = function(): { [movieId: string]: { yes: number; no: number; total: number } } {
  const results: { [movieId: string]: { yes: number; no: number; total: number } } = {};
  
  this.movies.forEach((movie: any) => {
    const movieVotes = this.votes.filter((vote: IVote) => vote.movieId === movie.id);
    const yesVotes = movieVotes.filter((vote: IVote) => vote.vote === 'yes').length;
    const noVotes = movieVotes.filter((vote: IVote) => vote.vote === 'no').length;
    
    results[movie.id] = {
      yes: yesVotes,
      no: noVotes,
      total: yesVotes + noVotes
    };
  });
  
  return results;
};

// Method to select the best movie based on voting results
votingSessionSchema.methods.selectBestMovie = function(): any {
  const results = this.getVoteResults();
  let bestMovie = null;
  let bestScore = -1;
  
  this.movies.forEach((movie: any) => {
    const result = results[movie.id];
    if (!result) return;
    
    // Calculate score: (yes votes - no votes) * vote average
    const score = (result.yes - result.no) * movie.voteAverage;
    
    if (score > bestScore) {
      bestScore = score;
      bestMovie = movie;
    }
  });
  
  return bestMovie;
};

// Virtual for session progress
votingSessionSchema.virtual('progress').get(function() {
  if (this.status === 'pending') return 0;
  if (this.status === 'completed') return 100;
  
  const totalVotes = this.votes.length;
  const totalPossibleVotes = this.movies.length * 5; // Assuming max 5 users per group
  return Math.min((totalVotes / totalPossibleVotes) * 100, 100);
});

// Ensure virtual fields are serialized
votingSessionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});

// Static method to create voting session with movie recommendations
votingSessionSchema.statics.createWithRecommendations = async function(groupId: string, movies: any[]) {
  return this.create({
    groupId,
    movies,
    status: 'pending'
  });
};

// Static method to start voting session
votingSessionSchema.statics.startSession = async function(sessionId: string) {
  const session = await this.findById(sessionId);
  if (!session) {
    throw new Error('Voting session not found');
  }
  
  session.status = 'active';
  session.startedAt = new Date();
  return session.save();
};

// Static method to end voting session
votingSessionSchema.statics.endSession = async function(sessionId: string) {
  const session = await this.findById(sessionId);
  if (!session) {
    throw new Error('Voting session not found');
  }
  
  const selectedMovie = session.selectBestMovie();
  session.selectedMovie = selectedMovie;
  session.status = 'completed';
  session.endedAt = new Date();
  return session.save();
};

export const VotingSession = mongoose.model<IVotingSession>('VotingSession', votingSessionSchema); 