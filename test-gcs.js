const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim().replace(/^['"]|['"]$/g, '');
    val = val.split('\\n').join('\n');
    acc[match[1]] = val;
  }
  return acc;
}, {});

const storage = new Storage({
  projectId: envVars.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: envVars.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: envVars.GOOGLE_CLOUD_PRIVATE_KEY,
  },
});

async function listBuckets() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(bucket => {
      console.log(bucket.name);
    });
    if (buckets.length === 0) {
      console.log('No buckets found in this project.');
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
listBuckets();
