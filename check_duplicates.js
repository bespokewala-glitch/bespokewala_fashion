const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('bespoken_fashion');
  
  // Check for duplicate slugs
  const pipeline = [
    { $group: { _id: "$slug", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ];
  const duplicates = await db.collection('Products').aggregate(pipeline).toArray();
  console.log(`Found ${duplicates.length} duplicate slugs:`);
  duplicates.forEach(d => {
    console.log(`  slug="${d._id}", count=${d.count}, ids=${d.ids.join(', ')}`);
  });

  // Also check total product count
  const total = await db.collection('Products').countDocuments({});
  console.log(`\nTotal products in collection: ${total}`);

  // Check lehenga-specific duplicates
  const lehengaDups = await db.collection('Products').aggregate([
    { $match: { subcategory: 'lehenga' } },
    { $group: { _id: "$slug", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  console.log(`\nLehenga duplicate slugs: ${lehengaDups.length}`);
  
  process.exit(0);
}

run().catch(console.dir);
