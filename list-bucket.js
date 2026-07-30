const { Storage } = require('@google-cloud/storage');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

async function listFiles() {
  try {
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
    console.log('Listing files in bucket:', bucketName);
    const [files] = await storage.bucket(bucketName).getFiles();
    if (files.length === 0) {
      console.log('Bucket is EMPTY — no files uploaded yet.');
    } else {
      console.log(`Found ${files.length} file(s):`);
      files.forEach(f => console.log(' -', f.name));
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
listFiles();
