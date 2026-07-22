export interface IProduct {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  productType: string;
  category: string;
  subcategory: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  inventoryCount: number;
  isFeatured: boolean;
  referenceImages?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
