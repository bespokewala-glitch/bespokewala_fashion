import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type EntityType = 'product' | 'review' | 'banner' | 'avatar' | 'category' | 'invoice' | 'document';
export type FileType = 'image' | 'video';
export type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';

// ─── Interface ────────────────────────────────────────────────────────────────
export interface IMedia extends Document {
  // Identity
  entity_type: EntityType;
  entity_id: string;
  uploader_id: string;

  // File info
  file_type: FileType;
  original_filename: string;
  mime_type: string;
  file_size: number; // bytes

  // GCS storage
  gcs_key: string;     // full path inside bucket
  gcs_bucket: string;

  /**
   * Whether this file is in the private bucket.
   * true  → file_url is intentionally empty; use /api/v1/media/serve/[id] to get a fresh signed URL
   * false → file_url is a permanent public CDN URL
   */
  is_private: boolean;

  // Processed URLs (empty string for private files — never stored here)
  file_url: string;           // CDN URL to original (public only)
  thumbnail_url?: string;     // CDN URL to thumbnail (images/videos)
  medium_url?: string;        // CDN URL to medium size (images)
  webp_url?: string;          // CDN URL to WebP version (images)

  // Video-specific
  hls_url?: string;           // HLS playlist for videos
  duration?: number;          // seconds

  // Image-specific
  width?: number;
  height?: number;

  // Status tracking
  status: UploadStatus;
  error_message?: string;
  retry_count: number;

  // Pre-signed URL (ephemeral — only set during upload flow)
  upload_id?: string;         // GCS upload session ID (resumable)

  // Security
  is_malware_scanned: boolean;
  malware_scan_result?: 'clean' | 'infected' | 'error';

  // Metadata
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const MediaSchema = new Schema<IMedia>(
  {
    entity_type: {
      type: String,
      enum: ['product', 'review', 'banner', 'avatar', 'category', 'invoice', 'document'],
      required: true,
      index: true,
    },
    entity_id: { type: String, required: true, index: true },
    uploader_id: { type: String, required: true, index: true },

    file_type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    original_filename: { type: String, required: true },
    mime_type: { type: String, required: true },
    file_size: { type: Number, required: true }, // bytes

    gcs_key: { type: String, required: true },
    gcs_bucket: { type: String, required: true },

    // true = private bucket; file_url will be '' — use /api/v1/media/serve/[id] for access
    is_private: { type: Boolean, default: false, index: true },

    file_url: { type: String, default: '' },
    thumbnail_url: { type: String },
    medium_url: { type: String },
    webp_url: { type: String },
    hls_url: { type: String },

    duration: { type: Number },
    width: { type: Number },
    height: { type: Number },

    status: {
      type: String,
      enum: ['pending', 'uploading', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    error_message: { type: String },
    retry_count: { type: Number, default: 0 },
    upload_id: { type: String },

    is_malware_scanned: { type: Boolean, default: false },
    malware_scan_result: {
      type: String,
      enum: ['clean', 'infected', 'error'],
    },

    completed_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

// ─── Compound indexes ─────────────────────────────────────────────────────────
MediaSchema.index({ entity_type: 1, entity_id: 1 });
MediaSchema.index({ uploader_id: 1, created_at: -1 });
MediaSchema.index({ status: 1, created_at: -1 });

// ─── Model ────────────────────────────────────────────────────────────────────
const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
