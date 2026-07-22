import mongoose from 'mongoose';

const MenuImageSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      required: true,
      enum: ['couture', 'jewellery', 'diffusion', 'pret'],
    },
    category: {
      type: String,
      required: true,
      enum: ['womens', 'mens'],
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Ensure there is only one entry per productType and category
MenuImageSchema.index({ productType: 1, category: 1 }, { unique: true });

export default mongoose.models.MenuImage || mongoose.model('MenuImage', MenuImageSchema);
