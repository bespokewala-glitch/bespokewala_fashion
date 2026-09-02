import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

function normalisePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.includes('\n')) return raw;
  return raw.replace(/\\+n/g, '\n');
}

async function migrate() {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
  const privateKey = normalisePrivateKey(process.env.GOOGLE_CLOUD_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing GCP credentials in .env');
    process.exit(1);
  }

  const storage = new Storage({
    projectId,
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  const sourceBucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
  const destBucketName = process.env.NEW_PUBLIC_BUCKET_NAME;

  if (!sourceBucketName || !destBucketName) {
    console.error('Missing bucket names in .env (need GOOGLE_CLOUD_BUCKET_NAME and NEW_PUBLIC_BUCKET_NAME)');
    process.exit(1);
  }

  console.log(`Starting migration from ${sourceBucketName} to ${destBucketName}`);

  const sourceBucket = storage.bucket(sourceBucketName);
  const destBucket = storage.bucket(destBucketName);

  try {
    const [files] = await sourceBucket.getFiles();
    console.log(`Found ${files.length} files to copy.`);

    const BATCH_SIZE = 50;
    let copied = 0;

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (file) => {
        try {
          const destFile = destBucket.file(file.name);
          const [exists] = await destFile.exists();
          
          if (!exists) {
            await file.copy(destFile);
            // Ensure Cache-Control is set properly
            await destFile.setMetadata({
              cacheControl: 'public, max-age=31536000, immutable',
            });
          }
          copied++;
          if (copied % 100 === 0) {
            console.log(`Progress: ${copied}/${files.length} copied...`);
          }
        } catch (err: any) {
          console.error(`Failed to copy ${file.name}: ${err.message}`);
        }
      }));
    }

    console.log(`\n✅ Migration Complete! Copied ${copied} files.`);
    process.exit(0);

  } catch (err: any) {
    console.error(`Error during migration: ${err.message}`);
    process.exit(1);
  }
}

migrate();
