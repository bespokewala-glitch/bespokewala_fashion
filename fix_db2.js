const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('bespoken_fashion');
  const sections = db.collection('homepagesections');

  await sections.updateOne(
    { _id: new ObjectId('6a60f052d4fa28c075d7284b') },
    { $set: { 'content.title': 'The Classical Fine Jewellery', 'content.subtitle': 'The Hand Bracelets' } }
  );

  console.log('Fixed DB entries');
  process.exit(0);
}

run().catch(console.dir);
