/**
 * make-public.js — Grant allUsers storage.objectViewer on the media bucket.
 *
 * The bucket was intended to be public (create-bucket.js calls makePublic())
 * but the IAM policy may have been reverted. This script restores it.
 *
 * Run once:  node make-public.js
 */
require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: privateKey,
  },
});

async function run() {
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
  if (!bucketName) { console.error('GOOGLE_CLOUD_BUCKET_NAME not set'); process.exit(1); }

  const bucket = storage.bucket(bucketName);

  console.log(`Fetching current IAM policy for: ${bucketName}`);
  const [policy] = await bucket.iam.getPolicy({ requestedPolicyVersion: 3 });

  const bindings = policy.bindings ?? [];
  const existing = bindings.find(
    b => b.role === 'roles/storage.objectViewer' && b.members?.includes('allUsers')
  );

  if (existing) {
    console.log('✅  allUsers objectViewer already present — no change needed.');
    return;
  }

  // Add allUsers objectViewer
  bindings.push({ role: 'roles/storage.objectViewer', members: ['allUsers'] });
  policy.bindings = bindings;

  console.log('Adding allUsers: roles/storage.objectViewer …');
  await bucket.iam.setPolicy(policy);
  console.log(`✅  Bucket "${bucketName}" is now publicly readable.`);

  // Verify
  const testUrl = `https://storage.googleapis.com/${bucketName}/uploads/1787037189491-s8-1.png`;
  console.log(`\nVerifying public access: ${testUrl}`);
  const res = await fetch(testUrl);
  console.log(`HTTP ${res.status} ${res.statusText}`);
  if (res.status === 200) {
    console.log('✅  Public read confirmed — images will load without auth.');
  } else {
    const body = await res.text();
    console.error('❌  Still failing:', body.substring(0, 300));
  }
}

run().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
