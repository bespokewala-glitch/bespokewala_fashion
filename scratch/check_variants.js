const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.NEW_PUBLIC_BUCKET_NAME || 'bespokewala-public-product-images');

async function check() {
  const [files] = await bucket.getFiles({ prefix: '_variants/' });
  console.log(`Found ${files.length} variant files in GCS.`);
  if (files.length > 0) {
    console.log(files.slice(0, 5).map(f => f.name));
  }
}
check().catch(console.error);
