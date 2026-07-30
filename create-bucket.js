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

async function createBucket() {
  try {
    const bucketName = envVars.GOOGLE_CLOUD_BUCKET_NAME;
    console.log('Attempting to create bucket:', bucketName);
    const [bucket] = await storage.createBucket(bucketName, {
      location: 'US', // Optional: you can choose a different location
    });
    console.log('Bucket created successfully:', bucket.name);
    
    // Attempt to make it public
    await bucket.makePublic();
    console.log('Bucket made public successfully!');
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}
createBucket();
