import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  id: string;
  mentorId: string;
  menteeId: string;
  title: string;
  description?: string;
  sessionType: 'mock_interview' | 'guidance' | 'assessment' | 'group_discussion' | 'personal_interview';
  scheduledAt: Date;
  durationMinutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  mentorRating?: number;
  menteeRating?: number;
  mentorFeedback?: string;
  menteeFeedback?: string;
  recordingUrl?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema({
  mentorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  menteeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  sessionType: {
    type: String,
    enum: ['mock_interview', 'guidance', 'assessment', 'group_discussion', 'personal_interview'],
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60,
    min: 15,
    max: 180
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  mentorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  menteeRating: {
    type: Number,
    min: 1,
    max: 5
  },
  mentorFeedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  menteeFeedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  attachments: [{
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
      return ret;
    }
  }
});

// Indexes for performance
SessionSchema.index({ mentorId: 1 });
SessionSchema.index({ menteeId: 1 });
SessionSchema.index({ scheduledAt: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ sessionType: 1 });

export default mongoose.model<ISession>('Session', SessionSchema);
