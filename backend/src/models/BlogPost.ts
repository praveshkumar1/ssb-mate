import mongoose, { Schema, Document } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  excerpt?: string;
  content: string;
  category?: string;
  thumbnailUrl?: string;
  authorId: mongoose.Types.ObjectId;
  featured?: boolean;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  excerpt: { type: String, trim: true, maxlength: 500 },
  content: { type: String, required: true },
  category: { type: String, trim: true },
  thumbnailUrl: { type: String, trim: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true }
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

BlogPostSchema.index({ published: 1, createdAt: -1 });
BlogPostSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export default mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);
