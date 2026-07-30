import { Storage } from '@google-cloud/storage';

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
// Handle escaped newlines in the private key
const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.warn('Google Cloud Storage credentials are not fully configured in environment variables.');
}

export const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});

export const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || '';
export const bucket = storage.bucket(bucketName);
