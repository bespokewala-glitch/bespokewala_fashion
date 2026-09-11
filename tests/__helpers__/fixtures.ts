/**
 * Test data factories — produces consistent, realistic test objects.
 * NEVER uses real customer data, real payment info, or real credentials.
 */
import mongoose from 'mongoose';

// ── Product ───────────────────────────────────────────────────────────────────

export function makeProduct(overrides: Partial<Record<string, any>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Saree',
    slug: `test-saree-${Date.now()}`,
    description: 'A beautiful test saree for testing purposes.',
    price: 15000,
    originalPrice: 18000,
    productType: 'readytowear',
    category: 'sarees',
    subcategory: 'silk-sarees',
    collectionName: 'Test Collection',
    occasion: 'festive',
    images: ['https://example.com/test-image-1.jpg'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['red'],
    inventoryCount: 10,
    isFeatured: false,
    isNewArrival: false,
    details: {},
    seo: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeCoutureProduct(overrides: Partial<Record<string, any>> = {}) {
  return makeProduct({
    name: 'Test Couture Lehenga',
    slug: `test-couture-lehenga-${Date.now()}`,
    productType: 'couture',
    category: 'lehengas',
    subcategory: 'bridal-lehengas',
    price: 85000,
    ...overrides,
  });
}

export function makeFootwearProduct(overrides: Partial<Record<string, any>> = {}) {
  return makeProduct({
    name: 'Test Heels',
    slug: `test-heels-${Date.now()}`,
    productType: 'footwear',
    category: 'footwear',
    subcategory: 'heels',
    price: 5000,
    ...overrides,
  });
}

// ── Cart Item ─────────────────────────────────────────────────────────────────

export function makeCartItem(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: `test-saree-${Date.now()}-M`,
    productSlug: `test-saree-${Date.now()}`,
    name: 'Test Saree',
    price: 15000,
    image: 'https://example.com/test-image-1.jpg',
    quantity: 1,
    size: 'M',
    ...overrides,
  };
}

// ── Shipping Details ──────────────────────────────────────────────────────────

export function makeShippingDetails(overrides: Partial<Record<string, any>> = {}) {
  return {
    firstName: 'Test',
    lastName: 'Customer',
    address: '123 Test Street, Test Area',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400001',
    country: 'India',
    phone: '9876543210',
    ...overrides,
  };
}

// ── User ──────────────────────────────────────────────────────────────────────

export function makeUser(overrides: Partial<Record<string, any>> = {}) {
  const timestamp = Date.now();
  return {
    name: 'Test User',
    email: `testuser_${timestamp}@test.example`,
    mobileNumber: `98765${String(timestamp).slice(-5)}`,
    password: 'TestPassword123!',
    role: 'customer' as const,
    ...overrides,
  };
}

export function makeAdminUser(overrides: Partial<Record<string, any>> = {}) {
  return makeUser({ role: 'admin', ...overrides });
}

// ── Order ─────────────────────────────────────────────────────────────────────

export function makeOrderBody(
  productSlug: string,
  overrides: Partial<Record<string, any>> = {}
) {
  return {
    items: [
      {
        productSlug,
        name: 'Test Saree',
        quantity: 1,
        size: 'M',
        image: 'https://example.com/test-image-1.jpg',
      },
    ],
    shippingDetails: makeShippingDetails(),
    paymentMethod: 'card',
    ...overrides,
  };
}
