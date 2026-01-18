import mongoose, { Schema, Document } from 'mongoose';

export interface IReportCase extends Document {
  title: string;
  description: string;
  category: 'urgent' | 'normal' | 'informational';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: mongoose.Types.ObjectId;
  reportedByName: string;
  status: 'pending' | 'in-review' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  assignedToName?: string;
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ReportCaseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['urgent', 'normal', 'informational'],
      default: 'normal',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedByName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in-review', 'resolved', 'closed'],
      default: 'pending',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedToName: {
      type: String,
    },
    resolution: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [{
      type: String,
    }],
  },
  {
    timestamps: true,
  }
);

ReportCaseSchema.index({ status: 1, priority: 1, createdAt: -1 });
ReportCaseSchema.index({ reportedBy: 1, createdAt: -1 });
ReportCaseSchema.index({ assignedTo: 1, status: 1 });
ReportCaseSchema.index({ category: 1, createdAt: -1 });

export default mongoose.models.ReportCase || mongoose.model<IReportCase>('ReportCase', ReportCaseSchema);
