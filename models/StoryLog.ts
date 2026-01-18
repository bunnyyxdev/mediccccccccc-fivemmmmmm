import mongoose, { Schema, Document } from 'mongoose';

export interface IStoryLog extends Document {
  teamA: {
    type: string;
    name: string;
  };
  teamB: {
    type: string;
    name: string;
  };
  status: string;
  negotiation: {
    date?: string;
    observerMedic?: string;
    explainMedic?: string;
    entourageMedic?: string;
  };
  fieldWork: {
    startDate?: string;
    endDate?: string;
    observerMedic?: string;
    headStory: string[];
    internStory: string[];
  };
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoryLogSchema: Schema = new Schema(
  {
    teamA: {
      type: {
        type: String,
        required: [true, 'Team A type is required'],
        trim: true,
      },
      name: {
        type: String,
        required: [true, 'Team A name is required'],
        trim: true,
        index: true,
      },
    },
    teamB: {
      type: {
        type: String,
        required: [true, 'Team B type is required'],
        trim: true,
      },
      name: {
        type: String,
        required: [true, 'Team B name is required'],
        trim: true,
        index: true,
      },
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      trim: true,
      index: true,
    },
    negotiation: {
      date: {
        type: String,
        trim: true,
      },
      observerMedic: {
        type: String,
        trim: true,
      },
      explainMedic: {
        type: String,
        trim: true,
      },
      entourageMedic: {
        type: String,
        trim: true,
      },
    },
    fieldWork: {
      startDate: {
        type: String,
        trim: true,
      },
      endDate: {
        type: String,
        trim: true,
      },
      observerMedic: {
        type: String,
        trim: true,
      },
      headStory: [{
        type: String,
        trim: true,
      }],
      internStory: [{
        type: String,
        trim: true,
      }],
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

StoryLogSchema.index({ createdAt: -1 });
StoryLogSchema.index({ recordedBy: 1, createdAt: -1 });
StoryLogSchema.index({ 'teamA.name': 1, 'teamB.name': 1 });
StoryLogSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.StoryLog || mongoose.model<IStoryLog>('StoryLog', StoryLogSchema);
