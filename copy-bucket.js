/**
 * copy-bucket.js
 * ──────────────
 * Copies ALL files from the old private bucket (bespokewala-storage)
 * to the new public bucket (bespokewala-public-product-images).
 *
 * Safe to run multiple times — skips files that already exist in the destination.
 *
 * Usage:
 *   node copy-bucket.js
 *
 * Estimated time: ~10-30 min for 7,000+ files depending on network speed.
 */

require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

// ─── Config ──────────────────────────────────────────────────────────────────
const PROJECT_ID   = process.env.GOOGLE_CLOUD_PROJECT_ID;
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const PRIVATE_KEY  = (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n');

const SRC_BUCKET   = process.env.GOOGLE_CLOUD_BUCKET_NAME    || 'bespokewala-storage';
const DEST_BUCKET  = process.env.NEW_PUBLIC_BUCKET_NAME       || 'bespokewala-public-product-images';

// How many files to copy in parallel (keep low to avoid rate-limiting)
const CONCURRENCY = 10;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error('❌ Missing GCS credentials in .env');
    process.exit(1);
  }

  if (SRC_BUCKET === DEST_BUCKET) {
    console.error('❌ Source and destination buckets are the same. Check .env');
    process.exit(1);
  }

  const storage = new Storage({
    projectId: PROJECT_ID,
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  });

  const src  = storage.bucket(SRC_BUCKET);
  const dest = storage.bucket(DEST_BUCKET);

  console.log(`\n📦 Source:      gs://${SRC_BUCKET}`);
  console.log(`📦 Destination: gs://${DEST_BUCKET}`);
  console.log(`🔁 Concurrency: ${CONCURRENCY}\n`);

  // 1. List all files in source bucket
  console.log('🔍 Listing all files in source bucket...');
  const [allFiles] = await src.getFiles();
  console.log(`   Found ${allFiles.length} file(s)\n`);

  if (allFiles.length === 0) {
    console.log('Source bucket is empty. Nothing to copy.');
    return;
  }

  // 2. List all files already in destination (for skip-if-exists check)
  console.log('🔍 Listing files already in destination bucket...');
  const [destFiles] = await dest.getFiles();
  const destSet = new Set(destFiles.map(f => f.name));
  console.log(`   Found ${destSet.size} existing file(s) — these will be skipped\n`);

  let copied  = 0;
  let skipped = 0;
  let errors  = 0;

  // 3. Copy in batches of CONCURRENCY
  for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
    const batch = allFiles.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (file) => {
      const name = file.name;

      if (destSet.has(name)) {
        skipped++;
        return;
      }

      try {
        await file.copy(dest.file(name));
        // Make the copied file publicly readable
        await dest.file(name).makePublic().catch(() => {
          // Non-fatal: bucket-level public access may already be set
        });
        copied++;
        if (copied % 50 === 0 || copied <= 5) {
          console.log(`  ✅ [${copied + skipped + errors}/${allFiles.length}] Copied: ${name}`);
        }
      } catch (err) {
        errors++;
        console.error(`  ❌ Failed to copy "${name}": ${err.message}`);
      }
    }));
  }

  console.log('\n─────────────────────────────────────────────');
  console.log(`✅ Done.`);
  console.log(`   Total files in source:  ${allFiles.length}`);
  console.log(`   Copied:                 ${copied}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Errors:                 ${errors}`);
  console.log('─────────────────────────────────────────────\n');

  if (errors > 0) {
    console.warn(`⚠️  ${errors} file(s) failed to copy. Re-run the script to retry them.`);
  } else {
    console.log('🎉 All files copied successfully!');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
