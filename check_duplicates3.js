require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('bespoken_fashion');
  const collection = db.collection('Products');
  
  const pipeline = [
    { $group: { _id: '$name', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
    { $match: { count: { $gt: 1 } } }
  ];
  const duplicates = await collection.aggregate(pipeline).toArray();
  for (const dup of duplicates) {
    console.log(`\nName: ${dup._id}`);
    const doc1 = dup.docs[0];
    const doc2 = dup.docs[1];
    console.log(`Doc1 (_id: ${doc1._id}): images: ${doc1.images?.length}, refImages: ${Object.keys(doc1.referenceImages || {}).length}`);
    console.log(`Doc2 (_id: ${doc2._id}): images: ${doc2.images?.length}, refImages: ${Object.keys(doc2.referenceImages || {}).length}`);
    // Just delete doc2 if it's identical or we don't care
  }
  process.exit(0);
}
run();
