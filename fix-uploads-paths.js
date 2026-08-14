/**
 * fix-uploads-paths.js
 * Rewrites /uploads/... -> /api/media/uploads/... in Products collection
 */
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bespokewala_fashion');
  const products = db.collection('Products');
  const all = await products.find({}).toArray();
  let fixed = 0;

  for (const p of all) {
    let changed = false;
    const updates = {};

    const fixedImages = (p.images || []).map(u => {
      if (u && u.startsWith('/uploads/')) { changed = true; return '/api/media' + u; }
      return u;
    });
    if (changed) updates.images = fixedImages;

    if (p.referenceImages) {
      const refs = { ...p.referenceImages };
      let rc = false;
      for (const k of ['front', 'back', 'left', 'right']) {
        if (refs[k] && refs[k].startsWith('/uploads/')) {
          refs[k] = '/api/media' + refs[k];
          rc = true; changed = true;
        }
      }
      if (rc) updates.referenceImages = refs;
    }

    if (changed) {
      const setOp = { $set: updates };
      await products.updateOne({ _id: p._id }, setOp);
      console.log('Fixed: ' + p.name);
      fixed++;
    }
  }

  console.log('\nTotal fixed:', fixed, '/', all.length, 'products');
  await client.close();
}

run().catch(e => { console.error(e.message); process.exit(1); });
