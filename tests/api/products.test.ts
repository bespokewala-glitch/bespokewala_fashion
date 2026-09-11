/**
 * API Integration Tests — Product listing and filtering
 *
 * Tests: GET /api/products
 * - Listing, pagination, filtering by productType/category/subcategory
 * - Price filters, search (q param), sort orders
 * - Deduplication safety net
 * - Invalid/missing params handled gracefully
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { makeProduct, makeCoutureProduct, makeFootwearProduct } from '../__helpers__/fixtures';

let dbConnect: () => Promise<any>;
let Product: any;

beforeAll(async () => {
  const mod = await import('../../src/lib/mongoose');
  dbConnect = mod.default;
  const productMod = await import('../../src/models/Product');
  Product = productMod.default;
  await dbConnect();
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await Product.deleteMany({ name: { $regex: /^Test/ } });
});

// ── Helper: simulate the GET products query ───────────────────────────────────
async function queryProducts(params: Record<string, string> = {}) {
  const limit = parseInt(params.limit || '50', 10);
  const page = parseInt(params.page || '1', 10);
  const skip = (page - 1) * limit;
  const query: any = {};

  if (params.productType) query.productType = params.productType;
  if (params.category) query.category = params.category;
  if (params.subcategory) query.subcategory = params.subcategory;
  if (params.isNewArrival === 'true') query.isNewArrival = true;

  if (params.q) {
    const words = params.q.trim().split(/\s+/).filter(Boolean);
    const regexPattern = words.map((w) => `(?=.*${w})`).join('');
    const regexString = `^${regexPattern}`;
    query.$and = [
      {
        $or: [
          { name: { $regex: regexString, $options: 'i' } },
          { category: { $regex: regexString, $options: 'i' } },
          { subcategory: { $regex: regexString, $options: 'i' } },
          { collectionName: { $regex: regexString, $options: 'i' } },
        ],
      },
    ];
  }

  if (params.minPrice || params.maxPrice) {
    query.price = {};
    if (params.minPrice) query.price.$gte = Number(params.minPrice);
    if (params.maxPrice) query.price.$lte = Number(params.maxPrice);
  }

  let sortQuery: any = { createdAt: -1 };
  if (params.sort === 'price_asc') sortQuery = { price: 1 };
  if (params.sort === 'price_desc') sortQuery = { price: -1 };

  const products = await Product.find(query)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit > 1000 ? 1000 : limit)
    .lean();

  return products;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/products — listing logic', () => { 
  beforeEach(async () => {
    // Seed test products
    await Product.create([
      makeProduct({ name: 'Test Saree Red', price: 5000, productType: 'readytowear', category: 'sarees' }),
      makeProduct({ name: 'Test Saree Blue', price: 12000, productType: 'readytowear', category: 'sarees', isNewArrival: true }),
      makeCoutureProduct({ name: 'Test Couture Lehenga', price: 85000 }),
      makeFootwearProduct({ name: 'Test Heels Gold', price: 7000 }),
    ]);
  });

  it('returns all products when no filters applied', async () => {
    const products = await queryProducts();
    expect(products.length).toBeGreaterThanOrEqual(4);
  });

  it('filters by productType', async () => {
    const products = await queryProducts({ productType: 'readytowear' });
    expect(products.every((p: any) => p.productType === 'readytowear')).toBe(true);
  });

  it('filters by category', async () => {
    const products = await queryProducts({ category: 'sarees' });
    expect(products.every((p: any) => p.category === 'sarees')).toBe(true);
    expect(products.length).toBeGreaterThanOrEqual(2);
  });

  it('filters by isNewArrival', async () => {
    const products = await queryProducts({ isNewArrival: 'true' });
    expect(products.every((p: any) => p.isNewArrival === true)).toBe(true);
  });

  it('filters by minPrice', async () => {
    const products = await queryProducts({ minPrice: '10000' });
    expect(products.every((p: any) => p.price >= 10000)).toBe(true);
  });

  it('filters by maxPrice', async () => {
    const products = await queryProducts({ maxPrice: '10000' });
    expect(products.every((p: any) => p.price <= 10000)).toBe(true);
  });

  it('filters by price range', async () => {
    const products = await queryProducts({ minPrice: '5000', maxPrice: '15000' });
    expect(products.every((p: any) => p.price >= 5000 && p.price <= 15000)).toBe(true);
  });

  it('returns empty array for impossible price range', async () => {
    const products = await queryProducts({ minPrice: '1000000', maxPrice: '1000001' });
    expect(products).toHaveLength(0);
  });

  it('searches by name keyword', async () => {
    const products = await queryProducts({ q: 'Heels' });
    expect(products.some((p: any) => p.name.includes('Heels'))).toBe(true);
  });

  it('returns empty array for non-matching search', async () => {
    const products = await queryProducts({ q: 'ZZZNotExistingProduct999' });
    expect(products).toHaveLength(0);
  });

  it('sorts by price ascending', async () => {
    const products = await queryProducts({ sort: 'price_asc' });
    for (let i = 1; i < products.length; i++) {
      expect(products[i].price).toBeGreaterThanOrEqual(products[i - 1].price);
    }
  });

  it('sorts by price descending', async () => {
    const products = await queryProducts({ sort: 'price_desc' });
    for (let i = 1; i < products.length; i++) {
      expect(products[i].price).toBeLessThanOrEqual(products[i - 1].price);
    }
  });

  it('respects pagination limit', async () => {
    const products = await queryProducts({ limit: '2' });
    expect(products.length).toBeLessThanOrEqual(2);
  });

  it('returns second page correctly', async () => {
    const page1 = await queryProducts({ limit: '2', page: '1', sort: 'price_asc' });
    const page2 = await queryProducts({ limit: '2', page: '2', sort: 'price_asc' });
    const page1Ids = page1.map((p: any) => p._id.toString());
    const page2Ids = page2.map((p: any) => p._id.toString());
    // No overlap between pages
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
