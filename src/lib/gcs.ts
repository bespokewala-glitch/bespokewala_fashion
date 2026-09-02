


import { Storage } from '@google-cloud/storage';

/**
 * Normalise the GCS private key regardless of how the hosting platform
 * (Vercel dashboard, dotenv, CI secrets) delivers it.
 *
 * Three formats are encountered in practice:
 *
 *   A) Actual newlines already present (Vercel "plain text" paste):
 *        "-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
 *      → Already correct; nothing to do.
 *
 *   B) Literal backslash + n two-character sequence (dotenv .env file with \\n):
 *        "-----BEGIN PRIVATE KEY-----\\nMII...\\n-----END PRIVATE KEY-----\\n"
 *      → Need to replace `\n` (2 chars: 0x5C 0x6E) with real newline (0x0A).
 *
 *   C) Double-escaped (some CI systems escape the backslash again):
 *        "-----BEGIN PRIVATE KEY-----\\\\nMII...\\\\n-----END PRIVATE KEY-----\\\\n"
 *      → Need to replace `\\n` with real newline.
 *
 * Strategy: detect which format we received and normalise accordingly.
 */
function normalisePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // If the key already contains real newlines (format A), it's ready.
  if (raw.includes('\n')) return raw;
  // Format B / C: replace any run of backslashes followed by 'n' with a real newline.
  return raw.replace(/\\+n/g, '\n');
}

// ── Credential resolution ─────────────────────────────────────────────────────
// Priority order:
//   1. GOOGLE_APPLICATION_CREDENTIALS_JSON  — full service-account JSON blob
//      (preferred for Vercel: paste the entire JSON as one env var)
//   2. Individual GOOGLE_CLOUD_* variables  — legacy / local .env approach
// ─────────────────────────────────────────────────────────────────────────────

let storage: Storage;

const jsonCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (jsonCredentials) {
  // Parse the full service-account JSON
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(jsonCredentials);
  } catch (e) {
    console.error('[GCS] Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    parsed = {};
  }

  const projectId   = parsed.project_id;
  const clientEmail = parsed.client_email;
  // The private_key in the JSON already has real newlines — no replacement needed.
  const privateKey  = parsed.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[GCS] GOOGLE_APPLICATION_CREDENTIALS_JSON is missing required fields (project_id, client_email, private_key).');
  } else {
    console.log(`[GCS] Initialised from GOOGLE_APPLICATION_CREDENTIALS_JSON (project: ${projectId})`);
  }

  storage = new Storage({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

} else {
  // Fall back to individual env vars
  const projectId   = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey  = normalisePrivateKey(process.env.GOOGLE_CLOUD_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[GCS] Google Cloud Storage credentials are not fully configured.\n' +
      '  Missing: ' + [!projectId && 'GOOGLE_CLOUD_PROJECT_ID', !clientEmail && 'GOOGLE_CLOUD_CLIENT_EMAIL', !privateKey && 'GOOGLE_CLOUD_PRIVATE_KEY'].filter(Boolean).join(', ') + '\n' +
      '  RECOMMENDED FIX: Add a single GOOGLE_APPLICATION_CREDENTIALS_JSON env var\n' +
      '  containing the full service account JSON from Google Cloud Console.\n' +
      '  See: https://cloud.google.com/iam/docs/keys-create-delete'
    );
  }

  storage = new Storage({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });
}

export { storage };

// ── Public bucket — product images, banners, etc. ────────────────────────────
export const bucketName = process.env.NEW_PUBLIC_BUCKET_NAME || process.env.GOOGLE_CLOUD_BUCKET_NAME || '';
export const bucket = storage.bucket(bucketName || 'dummy-bucket-name-for-build');

// ── Private bucket — invoices, bills, documents (no public access) ────────────
export const privateBucketName = process.env.GOOGLE_CLOUD_PRIVATE_BUCKET_NAME || '';
export const privateBucket = storage.bucket(privateBucketName || 'dummy-private-bucket-name-for-build');
