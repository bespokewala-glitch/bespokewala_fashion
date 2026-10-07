import mongoose from 'mongoose';
import Product from '@/models/Product';

/**
 * Inventory helpers shared by checkout, payment verification and the Razorpay webhook.
 *
 * Bespokewala is largely made-to-order couture, and the storefront does not gate
 * purchases on stock. Products can legitimately have `inventoryCount` missing or 0.
 * Therefore:
 *   - Stock is only *decremented* for products that currently track stock (> 0),
 *     and never below zero (so a sale can never turn a missing/0 field into a
 *     negative number).
 *   - Out-of-stock *blocking* at checkout is opt-in via ENFORCE_STOCK_LIMITS=true,
 *     so enabling it is an explicit business decision.
 */

export function isStockEnforced(): boolean {
  return process.env.ENFORCE_STOCK_LIMITS === 'true';
}

/**
 * Atomically reduce stock (floored at 0) for products that track stock.
 * Uses native MongoDB collection driver to execute pipeline updates directly.
 * Products with missing / 0 inventoryCount are left untouched.
 */
export async function decrementStock(
  items: Array<{ productId?: any; quantity: number }>,
  logTag = 'inventory'
): Promise<void> {
  for (const item of items) {
    if (!item?.productId || !Number.isFinite(item.quantity) || item.quantity < 1) continue;
    try {
      const objId = typeof item.productId === 'string' && mongoose.Types.ObjectId.isValid(item.productId)
        ? new mongoose.Types.ObjectId(item.productId)
        : item.productId;

      await Product.collection.updateOne(
        { _id: objId, inventoryCount: { $gt: 0 } },
        [
          {
            $set: {
              inventoryCount: { $max: [0, { $subtract: ['$inventoryCount', item.quantity] }] },
            },
          },
        ]
      );
    } catch (err) {
      console.error(`[${logTag}] Inventory decrement error for ${item.productId}:`, err);
    }
  }
}
