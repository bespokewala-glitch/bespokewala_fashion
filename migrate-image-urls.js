/**
 * migrate-image-urls.js
 * ─────────────────────
 * ONE-TIME migration: rewrites ALL stale direct GCS URLs in MongoDB
 * to the authenticated /api/media/ proxy format.
 *
 * Stale formats handled:
 *   https://storage.googleapis.com/bespokewala-storage/uploads/foo.png
 *   /api/media?file=uploads/foo.png     (old query-param format)
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node migrate-image-urls.js
 */

require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB  = process.env.MONGODB_DB || 'bespokewala_fashion';
const GCS_BASE    = 'https://storage.googleapis.com/bespokewala-storage/';

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env');
  process.exit(1);
}

/** Rewrite a single URL string to proxy format. Returns the fixed URL or null if unchanged. */
function fixUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Already correct — nothing to do
  if (trimmed.startsWith('/api/media/')) return null;

  // Legacy query-param format: /api/media?file=uploads/foo.png
  if (trimmed.startsWith('/api/media?file=')) {
    return `/api/media/${trimmed.replace('/api/media?file=', '')}`;
  }

  // Stale direct GCS URL: https://storage.googleapis.com/bespokewala-storage/...
  if (trimmed.startsWith(GCS_BASE)) {
    const key = trimmed.slice(GCS_BASE.length);
    if (key && !key.startsWith('http')) {
      return `/api/media/${key}`;
    }
  }

  return null; // no change needed
}

/** Fix an array of image URLs, returns new array + change count */
function fixArray(arr) {
  if (!Array.isArray(arr)) return { fixed: arr, changes: 0 };
  let changes = 0;
  const fixed = arr.map(url => {
    const rewritten = fixUrl(url);
    if (rewritten !== null) { changes++; return rewritten; }
    return url;
  });
  return { fixed, changes };
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log(`Connected to MongoDB: ${MONGODB_DB}\n`);

  const db = client.db(MONGODB_DB);

  // 1. Products
  console.log('Migrating Products...');
  const products = db.collection('Products');
  const allProducts = await products.find({}).toArray();
  let productFixed = 0;

  for (const prod of allProducts) {
    const updates = {};
    let changed = false;

    const { fixed: fixedImages, changes: imgChanges } = fixArray(prod.images);
    if (imgChanges > 0) { updates.images = fixedImages; changed = true; }

    if (prod.referenceImages && typeof prod.referenceImages === 'object') {
      const fixedRefs = { ...prod.referenceImages };
      let refChanged = false;
      for (const key of ['front', 'back', 'left', 'right']) {
        const rewritten = fixUrl(fixedRefs[key]);
        if (rewritten !== null) { fixedRefs[key] = rewritten; refChanged = true; changed = true; }
      }
      if (refChanged) updates.referenceImages = fixedRefs;
    }

    if (changed) {
      await products.updateOne({ _id: prod._id }, { $set: updates });
      console.log(`  Fixed product: ${prod.name}`);
      productFixed++;
    }
  }
  console.log(`  ${productFixed} / ${allProducts.length} products updated\n`);

  // 2. Orders (item.image in line items)
  console.log('Migrating orders...');
  const orders = db.collection('orders');
  const allOrders = await orders.find({}).toArray();
  let ordersFixed = 0;

  for (const order of allOrders) {
    if (!Array.isArray(order.items)) continue;
    let changed = false;
    const fixedItems = order.items.map(item => {
      const rewritten = fixUrl(item.image);
      if (rewritten !== null) { changed = true; return { ...item, image: rewritten }; }
      return item;
    });
    if (changed) {
      await orders.updateOne({ _id: order._id }, { $set: { items: fixedItems } });
      console.log(`  Fixed order: ${order._id}`);
      ordersFixed++;
    }
  }
  console.log(`  ${ordersFixed} / ${allOrders.length} orders updated\n`);

  // 3. Campaigns
  console.log('Migrating campaigns (herocampaigns)...');
  const campaigns = db.collection('herocampaigns');
  const allCampaigns = await campaigns.find({}).toArray();
  let campaignsFixed = 0;

  for (const camp of allCampaigns) {
    const rewritten = fixUrl(camp.videoUrl);
    if (rewritten !== null) {
      await campaigns.updateOne({ _id: camp._id }, { $set: { videoUrl: rewritten } });
      console.log(`  Fixed campaign: ${camp.title}`);
      campaignsFixed++;
    }
  }
  console.log(`  ${campaignsFixed} / ${allCampaigns.length} campaigns updated\n`);

  // 4. HomepageSections (deep scan all string fields)
  console.log('Migrating homepage sections...');
  const sections = db.collection('homepagesections');
  const allSections = await sections.find({}).toArray();
  let sectionsFixed = 0;

  for (const section of allSections) {
    const data = section.data;
    if (!data || typeof data !== 'object') continue;

    let changed = false;
    const fixedData = JSON.parse(JSON.stringify(data));

    function scanAndFix(obj) {
      if (!obj || typeof obj !== 'object') return;
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string') {
          const rewritten = fixUrl(val);
          if (rewritten !== null) { obj[key] = rewritten; changed = true; }
        } else if (Array.isArray(val)) {
          val.forEach((item, i) => {
            if (typeof item === 'string') {
              const rewritten = fixUrl(item);
              if (rewritten !== null) { val[i] = rewritten; changed = true; }
            } else { scanAndFix(item); }
          });
        } else if (typeof val === 'object') {
          scanAndFix(val);
        }
      }
    }

    scanAndFix(fixedData);
    if (changed) {
      await sections.updateOne({ _id: section._id }, { $set: { data: fixedData } });
      console.log(`  Fixed section: ${section.page}/${section.section}`);
      sectionsFixed++;
    }
  }
  console.log(`  ${sectionsFixed} / ${allSections.length} sections updated\n`);

  // 5. MenuImages
  console.log('Migrating menu images...');
  const menuImages = db.collection('menuimages');
  const allMenuImages = await menuImages.find({}).toArray();
  let menuFixed = 0;

  for (const menu of allMenuImages) {
    const { fixed: fixedUrls, changes } = fixArray(menu.imageUrls);
    if (changes > 0) {
      await menuImages.updateOne({ _id: menu._id }, { $set: { imageUrls: fixedUrls } });
      console.log(`  Fixed menu images: ${menu.category}`);
      menuFixed++;
    }
  }
  console.log(`  ${menuFixed} / ${allMenuImages.length} menu image docs updated\n`);

  await client.close();
  console.log('Migration complete! All stale GCS URLs have been rewritten to /api/media/ proxy format.');
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
