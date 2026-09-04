const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-storage');
async function list() {
  const [files] = await bucket.getFiles({ prefix: 'uploads/' });
  const g17 = files.filter(f => f.name.toLowerCase().includes('g17'));
  console.log('Files with g17 in bespokewala-storage:', g17.map(f => f.name));
}
list().catch(console.error);
