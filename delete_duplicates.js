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
    const doc2 = dup.docs[1];
    console.log(`Deleting duplicate: ${dup._id} (${doc2._id})`);
    await collection.deleteOne({ _id: doc2._id });
  }
  console.log('Done deleting duplicates.');
  process.exit(0);
}
run();
