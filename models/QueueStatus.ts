import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueStatus extends Document {
  isRunning: boolean;
  currentQueueIndex: number;
  doctors: Array<{
    _id: string;
    name: string;
    username?: string;
    doctorRank?: string;
  }>;
  startTime?: Date;
  elapsedTime?: number; // in milliseconds
  runnerId: mongoose.Types.ObjectId;
  runnerName: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QueueStatusSchema: Schema = new Schema(
  {
    isRunning: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentQueueIndex: {
      type: Number,
      default: 0,
    },
    doctors: [{
      _id: String,
      name: String,
      username: String,
      doctorRank: String,
    }],
    startTime: {
      type: Date,
    },
    elapsedTime: {
      type: Number,
      default: 0,
    },
    runnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    runnerName: {
      type: String,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active queue
QueueStatusSchema.index({ isRunning: 1, lastUpdated: -1 });
QueueStatusSchema.index({ createdAt: -1 });

export default mongoose.models.QueueStatus || mongoose.model<IQueueStatus>('QueueStatus', QueueStatusSchema);
