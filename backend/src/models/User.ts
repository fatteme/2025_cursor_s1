import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
  facebookId?: string;
  preferences: {
    genres: string[];
    maxRating?: number;
    minYear?: number;
    maxYear?: number;
  };
  groups: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  facebookId: {
    type: String,
    unique: true,
    sparse: true
  },
  preferences: {
    genres: {
      type: [String],
      default: [],
      enum: [
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
        'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
        'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
      ]
    },
    maxRating: {
      type: Number,
      min: 1,
      max: 10,
      default: 10
    },
    minYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: 1900
    },
    maxYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear() + 10,
      default: new Date().getFullYear() + 10
    }
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    avatar: this.avatar,
    preferences: this.preferences,
    groups: this.groups
  };
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

// Pre-save middleware to hash password if provided
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    // Note: We're not storing passwords in this implementation since we're using OAuth
    // This is here for potential future email/password authentication
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // Since we're using OAuth, this method is not used in current implementation
  // But kept for potential future email/password authentication
  return false;
};

// Static method to find or create user from OAuth
userSchema.statics.findOrCreateOAuth = async function(profile: any, provider: 'google' | 'facebook') {
  const providerId = provider === 'google' ? 'googleId' : 'facebookId';
  const providerIdValue = profile.id;
  
  let user = await this.findOne({ [providerId]: providerIdValue });
  
  if (!user) {
    user = await this.create({
      email: profile.emails[0].value,
      name: profile.displayName || profile.name.givenName + ' ' + profile.name.familyName,
      avatar: profile.photos?.[0]?.value,
      [providerId]: providerIdValue
    });
  }
  
  return user;
};

export const User = mongoose.model<IUser>('User', userSchema); 