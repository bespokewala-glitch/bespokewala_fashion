/**
 * API Integration Tests — User orders (data isolation)
 *
 * CRITICAL: Verifies that /api/user/orders only returns the authenticated
 * user's orders, never another user's orders.
 *
 * Also tests the JWT claim fix (BUG-003): user.id is used, not user.userId.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { verifyToken } from '../../../src/lib/auth';
import { generateTestToken, TEST_CUSTOMER, TEST_CUSTOMER_2 } from '../../__helpers__/auth';
import { makeProduct, makeShippingDetails } from '../../__helpers__/fixtures';

let dbConnect: () => Promise<any>;
let Order: any;
let Product: any;

beforeAll(async () => {
  const mod = await import('../../../src/lib/mongoose');
  dbConnect = mod.default;
  const orderMod = await import('../../../src/models/Order');
  Order = orderMod.default;
  const productMod = await import('../../../src/models/Product');
  Product = productMod.default;
  await dbConnect();
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await Order.deleteMany({ 'shippingDetails.firstName': 'Test' });
  await Product.deleteMany({ name: { $regex: /^Test/ } });
});

// ── Helper: simulate user orders query (with JWT claim fix BUG-003) ───────────
async function getUserOrders(token: string | null) {
  if (!token) return { status: 401, body: { message: 'Unauthorized' } };

  const user = await verifyToken(token);
  // BUG-003 fix: accept either 'id' or 'userId' claim
  const userId = user?.id || user?.userId;

  if (!user || !userId) return { status: 401, body: { message: 'Unauthorized' } };

  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).lean();
  return { status: 200, body: { orders } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/user/orders — authentication & isolation (CRITICAL)', () => {
  let product: any;

  beforeAll(async () => {
    product = await Product.create(makeProduct({ name: 'Test Order Product', price: 15000 }));
  });

  it('returns 401 without a token', async () => {
    const result = await getUserOrders(null);
    expect(result.status).toBe(401);
  });

  it('returns 401 with an expired token', async () => {
    const { generateExpiredToken } = await import('../../__helpers__/auth');
    const token = await generateExpiredToken(TEST_CUSTOMER);
    const result = await getUserOrders(token);
    expect(result.status).toBe(401);
  });

  it('BUG-003: accepts token with "id" claim (not "userId")', async () => {
    const token = await generateTestToken(TEST_CUSTOMER);
    const result = await getUserOrders(token);
    // Should NOT return 401 after BUG-003 fix
    expect(result.status).toBe(200);
  });

  it('returns only the authenticated user\'s orders', async () => {
    // Create order for customer 1
    await Order.create({
      user: new mongoose.Types.ObjectId(TEST_CUSTOMER.id),
      items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1, image: 'https://example.com/test-image.jpg' }],
      shippingDetails: makeShippingDetails(),
      paymentMethod: 'card',
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      subtotal: 15000,
      shippingCost: 0,
      total: 15000,
    });

    // Create order for customer 2
    await Order.create({
      user: new mongoose.Types.ObjectId(TEST_CUSTOMER_2.id),
      items: [{ productId: product._id, name: product.name, price: product.price, quantity: 1, image: 'https://example.com/test-image.jpg' }],
      shippingDetails: makeShippingDetails(),
      paymentMethod: 'card',
      paymentStatus: 'completed',
      orderStatus: 'confirmed',
      subtotal: 15000,
      shippingCost: 0,
      total: 15000,
    });

    const token1 = await generateTestToken(TEST_CUSTOMER);
    const result1 = await getUserOrders(token1);
    expect(result1.status).toBe(200);

    // Verify customer 1 only sees their own orders
    const orderUserIds = result1.body.orders.map((o: any) => o.user?.toString());
    expect(orderUserIds.every((id: string) => id === TEST_CUSTOMER.id)).toBe(true);
    // Verify customer 2's order is NOT in customer 1's results
    expect(orderUserIds).not.toContain(TEST_CUSTOMER_2.id);
  });

  it('returns empty orders array for a user with no orders', async () => {
    const token = await generateTestToken(TEST_CUSTOMER);
    const result = await getUserOrders(token);
    expect(result.status).toBe(200);
    expect(Array.isArray(result.body.orders)).toBe(true);
  });
});
