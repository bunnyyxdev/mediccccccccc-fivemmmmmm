import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
  imageUrl: string;
  imagePath?: string;
  caption?: string;
  postedBy: mongoose.Types.ObjectId;
  postedByName: string;
  likes: mongoose.Types.ObjectId[];
  likesCount: number;
  views: number;
  isPublished: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    imagePath: {
      type: String,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: [500, 'Caption cannot exceed 500 characters'],
    },
    postedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postedByName: {
      type: String,
      required: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likesCount: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

StorySchema.index({ createdAt: -1 });
StorySchema.index({ postedBy: 1, createdAt: -1 });
StorySchema.index({ isPublished: 1, createdAt: -1 });
StorySchema.index({ expiresAt: 1 });

// Auto-update likesCount
StorySchema.pre('save', function (next) {
  if (this.isModified('likes')) {
    const doc = this as unknown as IStory;
    doc.likesCount = doc.likes.length;
  }
  next();
});

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
