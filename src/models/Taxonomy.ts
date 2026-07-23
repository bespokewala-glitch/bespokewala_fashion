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
  createdAt?: Date;
  updatedAt?: Date;
}

const taxonomySchema = new Schema<ITaxonomy>(
  {
    type: { type: String, required: true, enum: ['collection', 'occasion', 'category'], index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    productTypes: { type: [String], default: [] },
    genders: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Taxonomy) {
  delete mongoose.models.Taxonomy;
}

const Taxonomy: Model<ITaxonomy> = mongoose.model<ITaxonomy>('Taxonomy', taxonomySchema, 'Taxonomies');

export default Taxonomy;
