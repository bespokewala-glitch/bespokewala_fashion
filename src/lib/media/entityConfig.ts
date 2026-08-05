/**
 * Entity-type–based rules that drive ALL validation, storage paths,
 * and processing decisions across the upload pipeline.
 */

import type { EntityType } from '@/models/Media';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface EntityRule {
  /** GCS folder prefix */
  storagePath: string;

  /**
   * If true, this entity type is stored in the PRIVATE bucket.
   * Files are never publicly accessible — a backend proxy generates
   * fresh signed URLs on every authenticated request.
   * If false, files go to the PUBLIC bucket (permanent CDN URLs).
   */
  isPrivate: boolean;

  /** Max bytes per file */
  maxFileSize: {
    image: number;
    video: number;
  };

  /** Allowed MIME types */
  allowedMimes: {
    image: string[];
    video: string[];
  };

  /** Max files that can exist per entity_id */
  maxFilesPerEntity: {
    image: number;
    video: number;
  };

  /** Whether to generate responsive sizes after upload */
  generateSizes: boolean;

  /** Whether to transcode video to multiple resolutions */
  transcodeVideo: boolean;

  /** CDN cache TTL in seconds (for Cache-Control header) */
  cacheTtl: number;

  /** Human-readable label */
  label: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
export const ENTITY_RULES: Record<EntityType, EntityRule> = {
  product: {
    isPrivate: false,
    label: 'Product',
    storagePath: 'products',
    maxFileSize: {
      image: 5 * 1024 * 1024,   // 5 MB
      video: 50 * 1024 * 1024,  // 50 MB
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
      video: ['video/mp4', 'video/quicktime'],
    },
    maxFilesPerEntity: { image: 10, video: 3 },
    generateSizes: true,
    transcodeVideo: true,
    cacheTtl: 86400 * 7, // 7 days
  },

  review: {
    isPrivate: false,
    label: 'Review',
    storagePath: 'reviews',
    maxFileSize: {
      image: 8 * 1024 * 1024,   // 8 MB
      video: 50 * 1024 * 1024,  // 50 MB
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
    },
    maxFilesPerEntity: { image: 5, video: 1 },
    generateSizes: true,
    transcodeVideo: true,
    cacheTtl: 86400 * 30, // 30 days
  },

  banner: {
    isPrivate: false,
    label: 'Banner/Ad',
    storagePath: 'banners',
    maxFileSize: {
      image: 10 * 1024 * 1024,  // 10 MB
      video: 100 * 1024 * 1024, // 100 MB
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/webm'],
    },
    maxFilesPerEntity: { image: 5, video: 3 },
    generateSizes: true,
    transcodeVideo: true,
    cacheTtl: 86400 * 1, // 1 day (campaigns change often)
  },

  avatar: {
    isPrivate: false,
    label: 'User Avatar',
    storagePath: 'avatars',
    maxFileSize: {
      image: 2 * 1024 * 1024,  // 2 MB
      video: 0,                  // avatars are images only
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: [],                 // no videos
    },
    maxFilesPerEntity: { image: 1, video: 0 },
    generateSizes: true,
    transcodeVideo: false,
    cacheTtl: 86400 * 14, // 14 days
  },

  category: {
    isPrivate: false,
    label: 'Category',
    storagePath: 'categories',
    maxFileSize: {
      image: 5 * 1024 * 1024,  // 5 MB
      video: 20 * 1024 * 1024, // 20 MB
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4'],
    },
    maxFilesPerEntity: { image: 3, video: 1 },
    generateSizes: true,
    transcodeVideo: false,
    cacheTtl: 86400 * 7, // 7 days
  },

  // ── Private entity types (stored in private bucket, served via proxy API) ──

  invoice: {
    isPrivate: true,
    label: 'Invoice',
    storagePath: 'invoices',
    maxFileSize: {
      image: 10 * 1024 * 1024,  // 10 MB
      video: 0,
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      video: [],
    },
    maxFilesPerEntity: { image: 5, video: 0 },
    generateSizes: false,   // no responsive sizes for private docs
    transcodeVideo: false,
    cacheTtl: 0,            // never cache — always generate fresh URL
  },

  document: {
    isPrivate: true,
    label: 'Document',
    storagePath: 'documents',
    maxFileSize: {
      image: 20 * 1024 * 1024, // 20 MB
      video: 0,
    },
    allowedMimes: {
      image: ['image/jpeg', 'image/png', 'application/pdf'],
      video: [],
    },
    maxFilesPerEntity: { image: 20, video: 0 },
    generateSizes: false,
    transcodeVideo: false,
    cacheTtl: 0,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the rule set for an entity_type. Throws if unknown.
 */
export function getEntityRule(entityType: EntityType): EntityRule {
  const rule = ENTITY_RULES[entityType];
  if (!rule) throw new Error(`Unknown entity_type: "${entityType}"`);
  return rule;
}

/**
 * Build a storage key: {storagePath}/{entity_id}/{uuid}.{ext}
 */
export function buildStorageKey(
  entityType: EntityType,
  entityId: string,
  uploadId: string,
  ext: string
): string {
  const rule = getEntityRule(entityType);
  return `${rule.storagePath}/${entityId}/${uploadId}.${ext.toLowerCase().replace(/^\./, '')}`;
}

/**
 * Build derivative paths (thumbnail, medium, webp) from the original key.
 */
export function buildDerivativeKeys(originalKey: string): {
  thumbnail: string;
  medium: string;
  webp: string;
} {
  const base = originalKey.replace(/\.[^.]+$/, '');
  return {
    thumbnail: `${base}_thumb.webp`,
    medium: `${base}_md.webp`,
    webp: `${base}.webp`,
  };
}

/**
 * Formats bytes as human-readable string for error messages.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}
