import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: 'mentor' | 'mentee' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  bio?: string;
  experience?: number;
  specializations: string[];
  rank?: string;
  unit?: string;
  achievements: string[];
  hourlyRate?: number;
  availability: string[];
  rating?: number;
  totalReviews?: number;
  location?: string;
  profileImageUrl?: string;
  certifications: string[];
  sportsPlayed: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['mentor', 'mentee', 'admin'],
    default: 'mentee'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  experience: {
    type: Number,
    min: 0
  },
  specializations: [{
    type: String,
    trim: true
  }],
  rank: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  },
  achievements: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  profileImageUrl: {
    type: String,
    trim: true
  },
  certifications: [{
    type: String,
    trim: true
  }],
  sportsPlayed: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Never return password in JSON
      
      // Create name field from firstName and lastName for frontend compatibility
      if (ret.firstName || ret.lastName) {
        ret.name = `${ret.firstName || ''} ${ret.lastName || ''}`.trim();
      }
      
      // Add profileImageUrl for frontend compatibility if not present
      if (!ret.profileImageUrl) {
        ret.profileImageUrl = '/placeholder.svg';
      }
      
      // Map experience number to experience level string for frontend compatibility
      if (typeof ret.experience === 'number') {
        if (ret.experience >= 10) {
          ret.experienceLevel = 'senior';
        } else if (ret.experience >= 5) {
          ret.experienceLevel = 'experienced';
        } else {
          ret.experienceLevel = 'entry_level';
        }
      }
      
      return ret;
    }
  }
});

// Index for search optimization
// Note: 'email' already has `unique: true` in the schema definition above which creates
// an index automatically. Avoid declaring the same index twice to prevent Mongoose warnings.
UserSchema.index({ role: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ specializations: 1 });
UserSchema.index({ 'firstName': 'text', 'lastName': 'text', 'bio': 'text' });

export default mongoose.model<IUser>('User', UserSchema);
