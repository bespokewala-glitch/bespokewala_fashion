/**
 * backfill-thumbnails.js
 *
 * One-time script: pre-generates thumbnail + medium webp variants for every
 * image in GCS uploads/ that is missing its variant.
 *
 * Run once from your local machine (not Vercel) where memory is not limited:
 *   node backfill-thumbnails.js
 *
 * Safe to run multiple times — it skips images that already have variants.
 * Does NOT modify MongoDB. Does NOT delete any GCS objects.
 */

require('dotenv').config();
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');

// ─── Config ───────────────────────────────────────────────────────────────────
const PROJECT_ID    = process.env.GOOGLE_CLOUD_PROJECT_ID;
const CLIENT_EMAIL  = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const PRIVATE_KEY   = (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const BUCKET_NAME   = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'bespokewala-storage';

const VARIANTS = [
  { name: 'thumbnail', width: 600,  quality: 80 },
  { name: 'medium',    width: 1000, quality: 85 },
];

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    console.error('❌ Missing GCS credentials in .env');
    process.exit(1);
  }

  const storage = new Storage({
    projectId: PROJECT_ID,
    credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
  });
  const bucket = storage.bucket(BUCKET_NAME);

  console.log(`\n🔍 Listing all files in gs://${BUCKET_NAME}/uploads/ ...\n`);

  // Get all files in uploads/
  const [allFiles] = await bucket.getFiles({ prefix: 'uploads/' });
  
  // Filter to image files only (skip already-generated variants, skip directories)
  const imageFiles = allFiles.filter(f => {
    const name = f.name;
    const ext  = '.' + name.split('.').pop().toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) && !name.includes('_variants/');
  });

  console.log(`📦 Found ${imageFiles.length} original image(s) in uploads/\n`);

  let skipped  = 0;
  let generated = 0;
  let errors   = 0;

  for (let i = 0; i < imageFiles.length; i++) {
    const file    = imageFiles[i];
    const gcsKey  = file.name; // e.g. "uploads/1786453431393-g43-1.png"
    const label   = `[${i + 1}/${imageFiles.length}]`;

    console.log(`${label} Processing: ${gcsKey}`);

    // Check which variants are missing
    const missingVariants = [];
    for (const v of VARIANTS) {
      const variantPath = `_variants/${v.name}/${gcsKey}.webp`;
      const [exists] = await bucket.file(variantPath).exists();
      if (!exists) {
        missingVariants.push({ ...v, variantPath });
      }
    }

    if (missingVariants.length === 0) {
      console.log(`  ✓ All variants exist — skipping`);
      skipped++;
      continue;
    }

    // Download original once
    let originalBuffer;
    try {
      [originalBuffer] = await file.download();
    } catch (err) {
      console.error(`  ❌ Failed to download: ${err.message}`);
      errors++;
      continue;
    }

    // Generate each missing variant
    for (const v of missingVariants) {
      try {
        const optimized = await sharp(originalBuffer)
          .resize(v.width, null, { withoutEnlargement: true })
          .webp({ quality: v.quality })
          .toBuffer();

        await bucket.file(v.variantPath).save(optimized, {
          contentType: 'image/webp',
          metadata: { cacheControl: 'public, max-age=31536000, immutable' },
        });

        console.log(`  ✅ Generated ${v.name}: ${v.variantPath} (${optimized.length} bytes)`);
        generated++;
      } catch (err) {
        console.error(`  ❌ Failed to generate ${v.name}: ${err.message}`);
        errors++;
      }
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Done.`);
  console.log(`   Processed: ${imageFiles.length} original images`);
  console.log(`   Skipped (already had variants): ${skipped}`);
  console.log(`   Variants generated: ${generated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`─────────────────────────────────────────\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
