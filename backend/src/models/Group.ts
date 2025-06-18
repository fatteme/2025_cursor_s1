import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IGroup extends Document {
  name: string;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  invitationCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  generateInvitationCode(): string;
}

const groupSchema = new Schema<IGroup>({
  name: {
    type: String,
    required: [true, 'Group name is required'],
    trim: true,
    maxlength: [50, 'Group name cannot be more than 50 characters']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Group owner is required']
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  invitationCode: {
    type: String,
    unique: true,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
groupSchema.index({ invitationCode: 1 });
groupSchema.index({ owner: 1 });
groupSchema.index({ members: 1 });

// Pre-save middleware to generate invitation code
groupSchema.pre('save', function(next) {
  if (this.isNew && !this.invitationCode) {
    this.invitationCode = this.generateInvitationCode();
  }
  next();
});

// Method to generate unique invitation code
groupSchema.methods.generateInvitationCode = function(): string {
  return uuidv4().substring(0, 8).toUpperCase();
};

// Virtual for group summary
groupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for group status
groupSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.members.length === 0) return 'empty';
  if (this.members.length === 1) return 'ready';
  return 'active';
});

// Ensure virtual fields are serialized
groupSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc: any, ret: any) {
    delete ret.__v;
    return ret;
  }
});

// Static method to find group by invitation code
groupSchema.statics.findByInvitationCode = function(code: string) {
  return this.findOne({ invitationCode: code.toUpperCase(), isActive: true });
};

// Static method to add member to group
groupSchema.statics.addMember = async function(groupId: string, userId: string) {
  const group = await this.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  if (group.members.includes(userId)) {
    throw new Error('User is already a member of this group');
  }
  
  group.members.push(userId);
  return group.save();
};

// Static method to remove member from group
groupSchema.statics.removeMember = async function(groupId: string, userId: string) {
  const group = await this.findById(groupId);
  if (!group) {
    throw new Error('Group not found');
  }
  
  group.members = group.members.filter(memberId => memberId.toString() !== userId);
  return group.save();
};

export const Group = mongoose.model<IGroup>('Group', groupSchema); 