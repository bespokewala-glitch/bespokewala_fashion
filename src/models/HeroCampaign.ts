import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHeroCampaign extends Document {
  title: string;
  subtitle: string;
  videoUrl: string;
  linkUrl: string;
  category: string;
  mediaType: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroCampaignSchema = new Schema<IHeroCampaign>(
  {
    title: {
      type: String,
      required: false,
      trim: true,
    },
    subtitle: {
      type: String,
      required: false,
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
    category: {
      type: String,
      enum: ['couture', 'jewellery', 'diffusion', 'beauty', 'general'],
      default: 'general',
    },
    mediaType: {
      type: String,
      enum: ['video', 'image'],
      default: 'image',
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

// Delete cached model in development to ensure schema updates are applied
if (mongoose.models.HeroCampaign) {
  delete mongoose.models.HeroCampaign;
}

const HeroCampaign: Model<IHeroCampaign> = mongoose.model<IHeroCampaign>('HeroCampaign', HeroCampaignSchema);

export default HeroCampaign;
