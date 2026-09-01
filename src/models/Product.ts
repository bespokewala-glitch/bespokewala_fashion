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
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: { type: String },
      canonicalUrl: { type: String },
      noIndex: { type: Boolean, default: false },
      image: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1, subcategory: 1, productType: 1 });
productSchema.index({ productType: 1, createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ isFeatured: -1, createdAt: -1 });
// Compound indexes for primary listing-page query patterns:
// /products/footwear/womens → { productType, category } filtered + createdAt sorted
productSchema.index({ productType: 1, category: 1, createdAt: -1 });
// Price sort queries: price_asc and price_desc
productSchema.index({ productType: 1, category: 1, price: 1 });
productSchema.index({ productType: 1, category: 1, price: -1 });
// "Popular" sort (isFeatured desc, createdAt desc)
productSchema.index({ productType: 1, category: 1, isFeatured: -1, createdAt: -1 });
// Subcategory level (e.g. /products/footwear/womens/kitten-heels)
productSchema.index({ productType: 1, category: 1, subcategory: 1, createdAt: -1 });
productSchema.index({ 
  name: 'text', 
  category: 'text', 
  subcategory: 'text', 
  collectionName: 'text',
  productType: 'text',
  description: 'text'
});

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema, 'Products');

export default Product;
