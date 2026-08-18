const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('bespoken_fashion');
  const products = await db.collection('Products').find({ name: { $in: ['Pastel Blossom Lehenga', 'Burgundy Velvet Suit', 'Blue Floral Lehenga', 'Wine Classic Sherwani'] } }).toArray();
  console.log(products.map(p => ({ name: p.name, slug: p.slug })));
  process.exit(0);
}

run().catch(console.dir);
