import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: 'interview_tips' | 'preparation_guide' | 'assessment_format' | 'success_stories' | 'mock_tests' | 'video_tutorials';
  authorId: string;
  tags: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  isPublic: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['interview_tips', 'preparation_guide', 'assessment_format', 'success_stories', 'mock_tests', 'video_tutorials'],
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  fileUrl: {
    type: String,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedReadTime: {
    type: Number,
    min: 1
  }
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

// Text search index
ResourceSchema.index({ 
  title: 'text', 
  description: 'text', 
  content: 'text',
  tags: 'text'
});

// Other indexes
ResourceSchema.index({ category: 1 });
ResourceSchema.index({ authorId: 1 });
ResourceSchema.index({ isPublic: 1 });
ResourceSchema.index({ difficulty: 1 });
ResourceSchema.index({ createdAt: -1 });

export default mongoose.model<IResource>('Resource', ResourceSchema);
