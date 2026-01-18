import mongoose, { Schema, Document } from 'mongoose';

export interface IQueue extends Document {
  queueNumber: number;
  patientName?: string;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  handledBy?: mongoose.Types.ObjectId;
  handledByName?: string;
  notes?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  createdAt: Date;
  updatedAt: Date;
}

const QueueSchema: Schema = new Schema(
  {
    queueNumber: {
      type: Number,
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    handledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    handledByName: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

QueueSchema.index({ queueNumber: -1 });
QueueSchema.index({ status: 1, queueNumber: 1 });
QueueSchema.index({ handledBy: 1, createdAt: -1 });
QueueSchema.index({ createdAt: -1 });

// Get next queue number
QueueSchema.statics.getNextQueueNumber = async function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastQueue = await this.findOne({
    createdAt: { $gte: today },
  }).sort({ queueNumber: -1 });

  return lastQueue ? lastQueue.queueNumber + 1 : 1;
};

export default mongoose.models.Queue || mongoose.model<IQueue>('Queue', QueueSchema);
