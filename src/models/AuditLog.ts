import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Types -------------------------------------------------------------------
export type AuditOutcome = 'success' | 'denied' | 'not_found' | 'rate_limited' | 'error';
export type AuditAction  = 'private_file_access';

export interface IAuditLog extends Document {
  /** Action that was attempted */
  action: AuditAction;
  /** Authenticated user making the request (null = unauthenticated) */
  user_id: string | null;
  /** The Media document ID being accessed */
  resource_id: string;
  /** Outcome of the request */
  outcome: AuditOutcome;
  /** Client IP address (may be null in serverless environments) */
  ip: string | null;
  /** Optional extra context — never log file contents or signed URLs */
  meta?: Record<string, string | number | boolean>;
  /** When the event occurred — set automatically by timestamps option */
  created_at: Date;
}

// --- Schema ------------------------------------------------------------------
const AuditLogSchema = new Schema<IAuditLog>(
  {
    action:      { type: String, enum: ['private_file_access'], required: true, index: true },
    user_id:     { type: String, default: null, index: true },
    resource_id: { type: String, required: true, index: true },
    outcome:     {
      type: String,
      enum: ['success', 'denied', 'not_found', 'rate_limited', 'error'],
      required: true,
      index: true,
    },
    ip:   { type: String, default: null },
    meta: { type: Schema.Types.Mixed },
  },
  {
    // createdAt = created_at; no updatedAt — audit logs are immutable
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Auto-delete entries older than 90 days (data hygiene / GDPR)
AuditLogSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Query indexes: "all accesses by user" and "all accesses to a file"
AuditLogSchema.index({ user_id: 1, created_at: -1 });
AuditLogSchema.index({ resource_id: 1, created_at: -1 });

// --- Model -------------------------------------------------------------------
const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;