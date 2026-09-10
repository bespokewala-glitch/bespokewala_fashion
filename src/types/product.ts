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
  collectionName?: string;
  occasion?: string;
  images: string[];
  sizes?: string[];
  colors?: string[];
  inventoryCount: number;
  isFeatured: boolean;
  isNewArrival?: boolean;
  referenceImages?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
  details?: {
    styleCode?: string;
    commodityName?: string;
    composition?: string;
    componentsCount?: string;
    includes?: string;
    shipping?: string;
    disclaimer?: string;
    legal?: string;
  };
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
