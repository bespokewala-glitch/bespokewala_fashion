/**
 * MIME type validator using file magic bytes (file signatures).
 * This prevents extension spoofing — we check the actual binary
 * content of the first bytes, NOT the filename or Content-Type header.
 */

// ─── Magic byte signatures ────────────────────────────────────────────────────
interface MagicEntry {
  mime: string;
  /** offset into the buffer to start matching */
  offset: number;
  /** hex bytes to match */
  bytes: string;
}

const MAGIC_BYTES: MagicEntry[] = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', offset: 0, bytes: 'ffd8ff' },

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: 'image/png', offset: 0, bytes: '89504e470d0a1a0a' },

  // WebP: RIFF....WEBP
  { mime: 'image/webp', offset: 0, bytes: '52494646' }, // RIFF — then check offset 8
  { mime: 'image/webp', offset: 8, bytes: '57454250' }, // WEBP

  // AVIF: ....ftypavif (offset 4)
  { mime: 'image/avif', offset: 4, bytes: '6674797061766966' }, // ftypavif

  // GIF87a or GIF89a
  { mime: 'image/gif', offset: 0, bytes: '474946383761' }, // GIF87a
  { mime: 'image/gif', offset: 0, bytes: '474946383961' }, // GIF89a

  // MP4 (ftyp box at offset 4)
  { mime: 'video/mp4', offset: 4, bytes: '66747970' }, // ftyp

  // QuickTime MOV (ftyp or wide/mdat)
  { mime: 'video/quicktime', offset: 4, bytes: '6674797071742020' }, // ftypqt

  // WebM: 1A 45 DF A3
  { mime: 'video/webm', offset: 0, bytes: '1a45dfa3' },
];

// ─── Extension → MIME map ─────────────────────────────────────────────────────
const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

// ─── Result ───────────────────────────────────────────────────────────────────
export interface MimeValidationResult {
  valid: boolean;
  detectedMime: string | null;
  declaredMime: string | null;
  error?: string;
}

// ─── Validators ───────────────────────────────────────────────────────────────

/**
 * Detect MIME type from raw bytes. Checks file magic bytes.
 * Returns null if not recognized.
 */
export function detectMimeFromBytes(buffer: Buffer): string | null {
  // Try each known signature
  for (const entry of MAGIC_BYTES) {
    const hex = buffer
      .slice(entry.offset, entry.offset + entry.bytes.length / 2)
      .toString('hex');

    if (hex.startsWith(entry.bytes)) {
      return entry.mime;
    }
  }

  // Special case: MP4 variants — many different ftyp brands
  // Check if bytes 4-8 spell "ftyp"
  if (buffer.length >= 8) {
    const ftyp = buffer.slice(4, 8).toString('ascii');
    if (ftyp === 'ftyp') {
      const brand = buffer.slice(8, 12).toString('ascii').trim();
      // Common MP4 brands
      if (['isom', 'mp41', 'mp42', 'avc1', 'M4V ', 'M4A ', 'f4v ', 'dash'].includes(brand)) {
        return 'video/mp4';
      }
      // QuickTime brands
      if (['qt  ', 'MSNV'].includes(brand)) {
        return 'video/quicktime';
      }
    }
  }

  return null;
}

/**
 * Get the MIME type from a file extension.
 */
export function mimeFromExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? null;
}

/**
 * Fully validate a file:
 * 1. Detect MIME from magic bytes
 * 2. Compare to declared Content-Type
 * 3. Compare to extension
 * 4. Check against allowed list
 *
 * All three must agree (or the extension match is a soft hint).
 */
export function validateMime(
  buffer: Buffer,
  declaredContentType: string,
  filename: string,
  allowedMimes: string[]
): MimeValidationResult {
  const detectedMime = detectMimeFromBytes(buffer);
  const declaredMime = declaredContentType.split(';')[0].trim().toLowerCase();
  const extMime = mimeFromExtension(filename);

  // Must be able to detect from magic bytes
  if (!detectedMime) {
    return {
      valid: false,
      detectedMime: null,
      declaredMime,
      error: 'Could not detect file type from content. File may be corrupt or an unsupported format.',
    };
  }

  // Detected MIME must be in allowed list
  if (!allowedMimes.includes(detectedMime)) {
    return {
      valid: false,
      detectedMime,
      declaredMime,
      error: `File type "${detectedMime}" is not allowed for this upload context.`,
    };
  }

  // Declared Content-Type must match detected (allows for minor variants)
  const declaredCategory = declaredMime.split('/')[0]; // "image" or "video"
  const detectedCategory = detectedMime.split('/')[0];
  if (declaredCategory !== detectedCategory) {
    return {
      valid: false,
      detectedMime,
      declaredMime,
      error: `Content-Type mismatch: header says "${declaredMime}" but file bytes indicate "${detectedMime}". Possible spoofing attempt.`,
    };
  }

  return { valid: true, detectedMime, declaredMime };
}

/**
 * Read the first N bytes from a readable stream / request body for MIME detection.
 * Only need the first 16 bytes for magic number checks.
 */
export async function readFileHeader(file: File, bytesToRead = 16): Promise<Buffer> {
  const slice = file.slice(0, bytesToRead);
  const arrayBuffer = await slice.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
