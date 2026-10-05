import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Types -------------------------------------------------------------------
export type AuditOutcome = 'success' | 'denied' | 'not_found' | 'rate_limited' | 'error';

// All recognised admin action strings — use dot-notation namespaces
export type AuditAction =
  // Legacy (kept for backward compat)
  | 'private_file_access'
  | 'admin_login'
  | 'order_status_update'
  | 'order_cancellation'
  | 'user_status_update'
  | 'user_role_update'
  | 'product_create'
  | 'product_update'
  | 'product_delete'
  | 'inventory_update'
  | 'coupon_create'
  | 'coupon_update'
  | 'coupon_delete'
  | 'email_test_dispatch'
  | 'taxonomy_update'
  // Namespaced (new)
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'order.status_updated'
  | 'order.cancelled'
  | 'order.refunded'
  | 'user.suspended'
  | 'user.reactivated'
  | 'user.role_updated'
  | 'inventory.updated'
  | 'coupon.created'
  | 'coupon.updated'
  | 'coupon.deleted'
  | 'taxonomy.created'
  | 'taxonomy.updated'
  | 'taxonomy.deleted'
  | 'content.created'
  | 'content.updated'
  | 'content.deleted'
  | 'system.settings_updated'
  | 'system.email_test'
  | 'system.prewarm';

export type AuditTargetType =
  | 'order'
  | 'product'
  | 'user'
  | 'inventory'
  | 'coupon'
  | 'taxonomy'
  | 'content'
  | 'system'
  | 'auth';

export interface IAuditLog extends Document {
  action: AuditAction;
  /** Actor user ID */
  actor_id: string | null;
  /** Email of the acting administrator */
  actor_email?: string | null;
  /** Category of the target resource */
  target_type: AuditTargetType;
  /** MongoDB ObjectId or identifier of the affected resource */
  target_id?: string | null;
  /** Outcome of the request */
  outcome: AuditOutcome;
  /** Client IP address */
  ip: string | null;
  /** User-Agent header */
  user_agent?: string | null;
  /** Optional sanitized context — never log passwords or sensitive tokens */
  meta?: Record<string, any>;
  createdAt: Date;
}

// --- Schema ------------------------------------------------------------------
const AuditLogSchema = new Schema<IAuditLog>(
  {
    action:       { type: String, required: true, index: true },
    actor_id:     { type: String, default: null, index: true },
    actor_email:  { type: String, default: null },
    target_type:  { type: String, required: true, index: true },
    target_id:    { type: String, default: null, index: true },
    outcome: {
      type: String,
      enum: ['success', 'denied', 'not_found', 'rate_limited', 'error'],
      required: true,
      index: true,
    },
    ip:         { type: String, default: null },
    user_agent: { type: String, default: null },
    meta:       { type: Schema.Types.Mixed },
  },
  {
    timestamps: true, // createdAt + updatedAt (updatedAt never actually changes)
  }
);

// Auto-delete entries older than 180 days (data hygiene / GDPR compliance)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

// Compound query indexes
AuditLogSchema.index({ actor_id: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ target_type: 1, createdAt: -1 });
AuditLogSchema.index({ target_id: 1, createdAt: -1 });

// --- Model -------------------------------------------------------------------
const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;