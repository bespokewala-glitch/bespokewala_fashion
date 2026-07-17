import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroCampaign extends Document {
  title: string;
  subtitle: string;
  videoUrl: string;
  linkUrl: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroCampaignSchema = new Schema<IHeroCampaign>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, 'Please provide a subtitle'],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Please provide a video URL'],
    },
    linkUrl: {
      type: String,
      required: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from compiling the model multiple times in development, but force update for now
delete mongoose.models.HeroCampaign;
const HeroCampaign: Model<IHeroCampaign> = mongoose.model<IHeroCampaign>('HeroCampaign', HeroCampaignSchema);

export default HeroCampaign;
