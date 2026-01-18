import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueHistory extends Document {
  sessionId: string; // Unique session ID for this queue run
  runnerId: mongoose.Types.ObjectId;
  runnerName: string;
  doctors: Array<{
    _id: string;
    name: string;
    username?: string;
    doctorRank?: string;
  }>;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  totalDoctors: number;
  completedDoctors: number; // How many doctors were processed
  status: 'completed' | 'stopped' | 'cancelled';
  stoppedBy?: mongoose.Types.ObjectId;
  stoppedByName?: string;
  metadata?: {
    averageTimePerDoctor?: number;
    longestWaitTime?: number;
    shortestWaitTime?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QueueHistorySchema = new Schema<IQueueHistory>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    doctors: [{
      _id: String,
      name: String,
      username: String,
      doctorRank: String,
    }],
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    endTime: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
    },
    totalDoctors: {
      type: Number,
      required: true,
    },
    completedDoctors: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['completed', 'stopped', 'cancelled'],
      default: 'completed',
      index: true,
    },
    stoppedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    stoppedByName: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
QueueHistorySchema.index({ runnerId: 1, createdAt: -1 });
QueueHistorySchema.index({ startTime: -1 });
QueueHistorySchema.index({ status: 1 });
QueueHistorySchema.index({ createdAt: -1 });

const QueueHistory = mongoose.models.QueueHistory || mongoose.model<IQueueHistory>('QueueHistory', QueueHistorySchema);

export default QueueHistory;
