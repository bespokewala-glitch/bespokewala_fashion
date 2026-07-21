import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/types/product';

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, index: true },
    images: { type: [String], required: true },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    inventoryCount: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false },
    referenceImages: {
      front: { type: String },
      back: { type: String },
      left: { type: String },
      right: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of the model if it already exists (common issue in Next.js dev mode)
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema, 'Products');

export default Product;
