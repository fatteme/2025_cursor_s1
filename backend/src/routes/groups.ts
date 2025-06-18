import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Group } from '../models/Group';
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

// Create a new group
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const user = (req as any).user;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const group = new Group({
      name: name.trim(),
      owner: user._id,
      members: [user._id]
    });

    await group.save();

    // Add group to user's groups
    user.groups.push(group._id);
    await user.save();

    res.status(201).json({
      success: true,
      group: {
        id: group._id,
        name: group.name,
        invitationCode: group.invitationCode,
        owner: user._id,
        members: [{
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }],
        memberCount: 1,
        status: group.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const groups = await Group.find({
      $or: [
        { owner: user._id },
        { members: user._id }
      ]
    }).populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    const formattedGroups = groups.map(group => ({
      id: group._id,
      name: group.name,
      invitationCode: group.invitationCode,
      owner: group.owner,
      members: group.members,
      memberCount: group.memberCount,
      status: group.status,
      createdAt: group.createdAt
    }));

    res.json({
      success: true,
      groups: formattedGroups
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Get specific group details
router.get('/:groupId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    const group = await Group.findOne({
      _id: groupId,
      $or: [
        { owner: user._id },
        { members: user._id }
      ]
    }).populate('owner', 'name email avatar')
      .populate('members', 'name email avatar preferences');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.json({
      success: true,
      group: {
        id: group._id,
        name: group.name,
        invitationCode: group.invitationCode,
        owner: group.owner,
        members: group.members,
        memberCount: group.memberCount,
        status: group.status,
        createdAt: group.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch group' });
  }
});

// Join group with invitation code
router.post('/join', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { invitationCode } = req.body;
    const user = (req as any).user;

    if (!invitationCode) {
      return res.status(400).json({ message: 'Invitation code is required' });
    }

    const group = await Group.findByInvitationCode(invitationCode);

    if (!group) {
      return res.status(404).json({ message: 'Invalid invitation code' });
    }

    // Check if user is already a member
    if (group.members.includes(user._id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to group
    group.members.push(user._id);
    await group.save();

    // Add group to user's groups
    user.groups.push(group._id);
    await user.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('owner', 'name email avatar')
      .populate('members', 'name email avatar');

    res.json({
      success: true,
      message: 'Successfully joined group',
      group: {
        id: populatedGroup!._id,
        name: populatedGroup!.name,
        invitationCode: populatedGroup!.invitationCode,
        owner: populatedGroup!.owner,
        members: populatedGroup!.members,
        memberCount: populatedGroup!.memberCount,
        status: populatedGroup!.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to join group' });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.members.includes(user._id)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Check if user is the owner
    if (group.owner.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Group owner cannot leave. Transfer ownership or delete the group.' });
    }

    // Remove user from group
    group.members = group.members.filter(memberId => memberId.toString() !== user._id.toString());
    await group.save();

    // Remove group from user's groups
    user.groups = user.groups.filter(groupId => groupId.toString() !== group._id.toString());
    await user.save();

    res.json({
      success: true,
      message: 'Successfully left group'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to leave group' });
  }
});

// Delete group (owner only)
router.delete('/:groupId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const user = (req as any).user;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the owner
    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only group owner can delete the group' });
    }

    // Remove group from all members' groups
    const memberIds = [...group.members, group.owner];
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { groups: group._id } }
    );

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

// Remove member from group (owner only)
router.delete('/:groupId/members/:memberId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { groupId, memberId } = req.params;
    const user = (req as any).user;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the owner
    if (group.owner.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Only group owner can remove members' });
    }

    // Check if trying to remove owner
    if (memberId === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove group owner' });
    }

    // Remove member from group
    await Group.removeMember(groupId, memberId);

    // Remove group from member's groups
    await User.findByIdAndUpdate(memberId, {
      $pull: { groups: group._id }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

export { router as groupRoutes }; 