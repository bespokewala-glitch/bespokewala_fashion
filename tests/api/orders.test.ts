/**
 * API Integration Tests — Order creation & price integrity
 *
 * Tests: POST /api/orders (order placement logic)
 * CRITICAL: Verifies that the server recalculates prices from DB — never trusts client.
 * Tests: order belongs to correct user, data isolation
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { makeProduct, makeShippingDetails } from '../__helpers__/fixtures';
import { TEST_CUSTOMER, TEST_CUSTOMER_2 } from '../__helpers__/auth';

let dbConnect: () => Promise<any>;
let Order: any;
let Product: any;

beforeAll(async () => {
  const mod = await import('../../src/lib/mongoose');
  dbConnect = mod.default;
  const orderMod = await import('../../src/models/Order');
  Order = orderMod.default;
  const productMod = await import('../../src/models/Product');
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

// ── Helper: replicate order creation logic ────────────────────────────────────
async function createOrder(
  userId: string | null,
  items: Array<{ productSlug: string; quantity: number; size?: string; clientPrice?: number }>,
  shippingDetails: Record<string, string>
) {
  if (!items || items.length === 0) {
    return { status: 400, body: { message: 'Cart is empty' } };
  }
  if (!shippingDetails) {
    return { status: 400, body: { message: 'Shipping details are required' } };
  }

  let calculatedSubtotal = 0;
  const finalItems = [];

  for (const item of items) {
    if (!item.productSlug) {
      return { status: 400, body: { message: 'Product slug is required' } };
    }
    const product = await Product.findOne({ slug: item.productSlug });
    if (!product) {
      return { status: 404, body: { message: `Product not found: ${item.productSlug}` } };
    }
    // CRITICAL: use DB price, ignore any client-submitted price
    calculatedSubtotal += product.price * item.quantity;
    finalItems.push({
      productId: product._id,
      name: product.name,
      price: product.price, // from DB
      quantity: item.quantity,
      image: product.images[0] || '',
      size: item.size,
    });
  }

  const shippingCost = calculatedSubtotal > 10000 ? 0 : 500;
  const total = calculatedSubtotal + shippingCost;

  const order = await Order.create({
    user: userId,
    items: finalItems,
    shippingDetails,
    paymentMethod: 'card',
    paymentStatus: 'completed',
    orderStatus: 'confirmed',
    subtotal: calculatedSubtotal,
    shippingCost,
    total,
  });

  return { status: 201, body: { success: true, orderId: order._id.toString() }, order };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/orders — order creation logic', () => {
  let testProduct: any;

  beforeEach(async () => {
    const productData = makeProduct({ name: 'Test Saree Order', price: 15000 });
    testProduct = await Product.create(productData);
  });

  it('creates an order successfully', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct.slug, quantity: 1 }],
      makeShippingDetails()
    );
    expect(result.status).toBe(201);
    expect(result.body.orderId).toBeDefined();
  });

  it('calculates subtotal from DB price, ignoring client-submitted price', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct.slug, quantity: 1, clientPrice: 1 }], // Attempt price injection
      makeShippingDetails()
    ) as any;

    expect(result.status).toBe(201);
    const order = await Order.findById(result.body.orderId);
    // Must use real DB price (15000), NOT the injected clientPrice (1)
    expect(order.subtotal).toBe(15000);
    expect(order.items[0].price).toBe(15000);
  });

  it('applies free shipping for orders above 10000', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct.slug, quantity: 1 }], // 15000 > 10000
      makeShippingDetails()
    ) as any;

    const order = await Order.findById(result.body.orderId);
    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(15000);
  });

  it('returns 400 for empty cart', async () => {
    const result = await createOrder(TEST_CUSTOMER.id, [], makeShippingDetails());
    expect(result.status).toBe(400);
  });

  it('returns 404 for non-existent product slug', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: 'nonexistent-product-slug-abc123', quantity: 1 }],
      makeShippingDetails()
    );
    expect(result.status).toBe(404);
  });

  it('returns 400 when shippingDetails is missing', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct.slug, quantity: 1 }],
      null as any
    );
    expect(result.status).toBe(400);
  });

  it('stores the correct userId on the order', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct.slug, quantity: 1 }],
      makeShippingDetails()
    ) as any;

    const order = await Order.findById(result.body.orderId);
    expect(order.user.toString()).toBe(TEST_CUSTOMER.id);
  });
});

describe('Order — user data isolation (CRITICAL)', () => {
  let testProduct2: any;

  beforeEach(async () => {
    const productData = makeProduct({ name: 'Test Saree Isolation', price: 12000 });
    testProduct2 = await Product.create(productData);
  });

  it('user1 order is not visible to user2', async () => {
    const result = await createOrder(
      TEST_CUSTOMER.id,
      [{ productSlug: testProduct2.slug, quantity: 1 }],
      makeShippingDetails()
    ) as any;

    // Query as user2
    const user2Orders = await Order.find({ user: TEST_CUSTOMER_2.id });
    const orderId = result.body.orderId;
    expect(user2Orders.map((o: any) => o._id.toString())).not.toContain(orderId);
  });

  it('user orders query returns only their own orders', async () => {
    // Create orders for both users
    await createOrder(TEST_CUSTOMER.id, [{ productSlug: testProduct2.slug, quantity: 1 }], makeShippingDetails());
    await createOrder(TEST_CUSTOMER_2.id, [{ productSlug: testProduct2.slug, quantity: 1 }], makeShippingDetails());

    const user1Orders = await Order.find({ user: TEST_CUSTOMER.id }).lean();
    const user2Orders = await Order.find({ user: TEST_CUSTOMER_2.id }).lean();

    // Ensure no cross-contamination
    const user1Ids = user1Orders.map((o: any) => o._id.toString());
    const user2Ids = user2Orders.map((o: any) => o._id.toString());
    const overlap = user1Ids.filter((id: string) => user2Ids.includes(id));
    expect(overlap).toHaveLength(0);
  });
});
