import mongoose, { Schema, Model } from 'mongoose';
import { IProduct } from '@/types/product';

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    productType: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, required: true, index: true },
    collectionName: { type: String, index: true },
    occasion: { type: String, index: true },
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
    details: {
      styleCode: { type: String },
      commodityName: { type: String },
      composition: { type: String },
      componentsCount: { type: String },
      includes: { type: String },
      shipping: { type: String },
      disclaimer: { type: String },
      legal: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation of the model if it already exists (common issue in Next.js dev mode)
// However, to ensure schema changes take effect in dev, we should delete the cached model
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema, 'Products');

export default Product;
