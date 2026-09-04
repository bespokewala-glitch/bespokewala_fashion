require('dotenv').config();
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('bespoken_fashion');
  const collection = db.collection('Products');
  
  const pipeline = [
    { $group: { _id: '$name', count: { $sum: 1 }, docs: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ];
  const duplicates = await collection.aggregate(pipeline).toArray();
  console.log('Duplicate names count:', duplicates.length);
  if (duplicates.length > 0) {
    console.log('Sample duplicates:', JSON.stringify(duplicates.slice(0, 5), null, 2));
  }
  process.exit(0);
}
run();
