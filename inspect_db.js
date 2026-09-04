require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('bespoken_fashion');
  const col = db.collection('Products');
  
  // 1. Check for any duplicate _ids (impossible in Mongo but verify)
  const total = await col.countDocuments();
  console.log('Total products:', total);
  
  // 2. Find duplicate slugs
  const dupSlugs = await col.aggregate([
    { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log('\nDuplicate SLUGS:', dupSlugs.length);
  if (dupSlugs.length) console.log(JSON.stringify(dupSlugs, null, 2));
  
  // 3. Find lehenga-relevant products
  const lehengaProducts = await col.find({
    $or: [
      { subcategory: /lehenga/i },
      { name: /lehenga/i },
      { collectionName: /lehenga/i }
    ]
  }).project({ name: 1, slug: 1, subcategory: 1, category: 1, productType: 1 }).toArray();
  console.log('\nLehenga-related products:', lehengaProducts.length);
  for (const p of lehengaProducts) {
    console.log(`  ${p.name} | sub:${p.subcategory} | cat:${p.category} | type:${p.productType}`);
  }
  
  // 4. Check existing indexes
  const indexes = await col.indexes();
  console.log('\nIndexes:', indexes.map(i => ({ name: i.name, key: i.key, unique: i.unique })));

  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
