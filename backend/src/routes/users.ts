import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

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

// Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      user: {
        id: updatedUser!._id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        avatar: updatedUser!.avatar,
        preferences: updatedUser!.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user profile' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { genres, maxRating, minYear, maxYear } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        'preferences.genres': genres,
        'preferences.maxRating': maxRating,
        'preferences.minYear': minYear,
        'preferences.maxYear': maxYear
      },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      user: {
        id: updatedUser!._id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        avatar: updatedUser!.avatar,
        preferences: updatedUser!.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

export { router as userRoutes }; 