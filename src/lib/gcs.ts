


import { Storage } from '@google-cloud/storage';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
// Handle escaped newlines in the private key
const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
