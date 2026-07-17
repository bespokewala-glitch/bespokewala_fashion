export interface IProduct {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  inventoryCount: number;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
