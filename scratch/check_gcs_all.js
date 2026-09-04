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
async function list() {
  const [files] = await bucket.getFiles({ prefix: 'uploads/' });
  // count total files
  console.log('Total files in bucket:', files.length);
  // are there any files with g17?
  const g17 = files.filter(f => f.name.toLowerCase().includes('g17'));
  console.log('Files with g17:', g17.map(f => f.name));
}
list().catch(console.error);
