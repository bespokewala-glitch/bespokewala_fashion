import mongoose, { Schema, Model } from 'mongoose';

export interface ITaxonomy {
  _id?: string;
  type: 'collection' | 'occasion' | 'category';
  name: string;
  slug: string;
  order: number;
  enabled: boolean;
  productTypes: string[];
  genders: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    image?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const taxonomySchema = new Schema<ITaxonomy>(
  {
    type: { type: String, required: true, enum: ['collection', 'occasion', 'category'], index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    productTypes: { type: [String], default: [] },
    genders: { type: [String], default: [] },
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

taxonomySchema.index({ type: 1, slug: 1 }, { unique: true });

if (mongoose.models.Taxonomy) {
  delete mongoose.models.Taxonomy;
}

const Taxonomy: Model<ITaxonomy> = mongoose.model<ITaxonomy>('Taxonomy', taxonomySchema, 'Taxonomies');

export default Taxonomy;
