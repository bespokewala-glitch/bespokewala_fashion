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

// Use existing compiled model in development to avoid hot-reload re-compilation
const HeroCampaign: Model<IHeroCampaign> = (mongoose.models.HeroCampaign as Model<IHeroCampaign>) || mongoose.model<IHeroCampaign>('HeroCampaign', HeroCampaignSchema);

export default HeroCampaign;
