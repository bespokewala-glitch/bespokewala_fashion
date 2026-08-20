


import { Storage } from '@google-cloud/storage';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;

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
 *      → Need to replace `\\n` (3 chars) with real newline.
 *
 * Strategy: detect which format we received and normalise accordingly.
 */
function normalisePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  // If the key already contains real newlines (format A), it's ready.
  if (raw.includes('\n')) return raw;

  // Format B / C: replace any run of backslashes followed by 'n' with a real newline.
  // This covers both `\n` (B) and `\\n` (C).
  return raw.replace(/\\+n/g, '\n');
}

const privateKey = normalisePrivateKey(process.env.GOOGLE_CLOUD_PRIVATE_KEY);

if (!projectId || !clientEmail || !privateKey) {
  console.warn(
    '[GCS] Google Cloud Storage credentials are not fully configured.\n' +
    '  Missing: ' + [!projectId && 'GOOGLE_CLOUD_PROJECT_ID', !clientEmail && 'GOOGLE_CLOUD_CLIENT_EMAIL', !privateKey && 'GOOGLE_CLOUD_PRIVATE_KEY'].filter(Boolean).join(', ') + '\n' +
    '  generateSignedUrl/generatePrivateReadUrl will FAIL at runtime.\n' +
    '  If running on Cloud Run without a key file, grant the service account\n' +
    '  the roles/iam.serviceAccountTokenCreator role on itself.'
  );
}

export const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

// ── Public bucket — product images, banners, etc. (allUsers: Storage Object Viewer) ──
export const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || '';
export const bucket = storage.bucket(bucketName || 'dummy-bucket-name-for-build');

// ── Private bucket — invoices, bills, documents (no public access) ──
export const privateBucketName = process.env.GOOGLE_CLOUD_PRIVATE_BUCKET_NAME || '';
export const privateBucket = storage.bucket(privateBucketName || 'dummy-private-bucket-name-for-build');
