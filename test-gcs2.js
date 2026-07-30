const { Storage } = require('@google-cloud/storage');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const rawKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY;
console.log('Raw key snippet:', rawKey ? rawKey.substring(0, 40) : null);
console.log('Contains literal \\n?', rawKey?.includes('\\n'));
console.log('Contains actual newline?', rawKey?.includes('\n'));

const privateKey = rawKey?.replace(/\\n/g, '\n');
console.log('Processed key snippet:', privateKey ? privateKey.substring(0, 40) : null);

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: privateKey,
  },
});

async function run() {
  try {
    const [buckets] = await storage.getBuckets();
    console.log('Buckets:');
    buckets.forEach(b => console.log(' - ' + b.name));
    if (buckets.length === 0) console.log('No buckets found.');
  } catch (err) {
    console.error('ERROR listing buckets:', err);
  }
}
run();
