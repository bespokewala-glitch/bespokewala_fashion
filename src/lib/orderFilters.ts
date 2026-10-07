/**
 * Phase 1 persists a `pending` Order as soon as a Razorpay checkout session is created
 * (so a paid-but-disconnected customer is never orphaned). Those rows are *attempts*,
 * not orders, until payment completes, so they must not appear in customer order
 * history or inflate admin order counts.
 *
 * Legacy non-Razorpay orders (e.g. manual/COD created via /api/orders) are unaffected.
 */

/** Customer-facing: hide unpaid/failed Razorpay attempts. */
export const HIDE_UNPAID_RAZORPAY_FOR_CUSTOMER = {
  $nor: [{ paymentMethod: 'razorpay', paymentStatus: { $in: ['pending', 'failed'] } }],
};

/** Admin-facing: hide only still-pending Razorpay attempts (failed payments stay visible). */
export const HIDE_PENDING_RAZORPAY_FOR_ADMIN = {
  $nor: [{ paymentMethod: 'razorpay', paymentStatus: 'pending' }],
};
