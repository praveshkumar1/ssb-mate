import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILiveDiscussion extends Document {
  title: string;
  description?: string;
  startTime: Date;
  capacity: number;
  meetLink: string;
  attendees: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LiveDiscussionSchema = new Schema<ILiveDiscussion>({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  capacity: { type: Number, required: true, default: 10, min: 1 },
  meetLink: { type: String, required: true },
  attendees: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<ILiveDiscussion>('LiveDiscussion', LiveDiscussionSchema);
