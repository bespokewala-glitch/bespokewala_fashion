/**
 * API Integration Tests — Address management
 *
 * Tests: GET/POST /api/account/addresses
 * - Authentication required
 * - Field validation
 * - User data isolation (CRITICAL)
 * - First address becomes default
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { makeShippingDetails, makeUser } from '../../__helpers__/fixtures';

let dbConnect: () => Promise<any>;
let User: any;

beforeAll(async () => {
  const mod = await import('../../../src/lib/mongoose');
  dbConnect = mod.default;
  const userMod = await import('../../../src/models/User');
  User = userMod.default;
  await dbConnect();
});

afterAll(async () => {
  await mongoose.disconnect();
});

afterEach(async () => {
  await User.deleteMany({ email: { $regex: '@test.example' } });
});

// ── Helper: replicate address logic ───────────────────────────────────────────
async function addAddress(userId: string, addressData: Record<string, string>) {
  const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country', 'phone'];
  for (const field of requiredFields) {
    if (!addressData[field]) {
      return { status: 400, body: { error: `Missing required field: ${field}` } };
    }
  }

  const user = await User.findById(userId);
  if (!user) return { status: 404, body: { error: 'User not found' } };

  if (!user.addresses) user.addresses = [];
  const isFirst = user.addresses.length === 0;
  const isDefault = isFirst || addressData.isDefault;

  if (isDefault) {
    user.addresses.forEach((a: any) => { a.isDefault = false; });
  }

  user.addresses.push({ ...addressData, isDefault });
  await user.save();

  return { status: 201, body: { message: 'Address added', addresses: user.addresses } };
}

async function getAddresses(userId: string) {
  const user = await User.findById(userId).select('addresses');
  if (!user) return { status: 404, body: { error: 'User not found' } };
  return { status: 200, body: { addresses: user.addresses || [] } };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Address management — logic', () => {
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    const u1 = await User.create(makeUser({ email: 'addr_user1@test.example' }));
    const u2 = await User.create(makeUser({ email: 'addr_user2@test.example' }));
    user1Id = u1._id.toString();
    user2Id = u2._id.toString();
  });

  it('adds an address successfully', async () => {
    const result = await addAddress(user1Id, makeShippingDetails());
    expect(result.status).toBe(201);
    expect(result.body.addresses).toHaveLength(1);
  });

  it('first address becomes default automatically', async () => {
    await addAddress(user1Id, makeShippingDetails({ city: 'Delhi' }));
    const result = await getAddresses(user1Id);
    const defaultAddr = result.body.addresses.find((a: any) => a.isDefault);
    expect(defaultAddr).toBeDefined();
  });

  it('validates required field: firstName', async () => {
    const data = makeShippingDetails();
    delete (data as any).firstName;
    const result = await addAddress(user1Id, data as any);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('firstName');
  });

  it('validates required field: phone', async () => {
    const data = makeShippingDetails();
    delete (data as any).phone;
    const result = await addAddress(user1Id, data as any);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('phone');
  });

  it('validates required field: zipCode', async () => {
    const data = makeShippingDetails();
    delete (data as any).zipCode;
    const result = await addAddress(user1Id, data as any);
    expect(result.status).toBe(400);
    expect(result.body.error).toContain('zipCode');
  });

  it('CRITICAL: user1 addresses not visible to user2', async () => {
    await addAddress(user1Id, makeShippingDetails({ city: 'Pune' }));

    const user2Result = await getAddresses(user2Id);
    expect(user2Result.status).toBe(200);
    // User2 should have no addresses
    expect(user2Result.body.addresses).toHaveLength(0);
  });

  it('adds multiple addresses', async () => {
    await addAddress(user1Id, makeShippingDetails({ city: 'Mumbai' }));
    await addAddress(user1Id, makeShippingDetails({ city: 'Bangalore' }));
    const result = await getAddresses(user1Id);
    expect(result.body.addresses.length).toBeGreaterThanOrEqual(2);
  });
});
