const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

async function inspectImages() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const db = process.env.MONGODB_DB || 'bespoken_fashion';

  await mongoose.connect(`${uri}/${db}`);
  console.log('Connected to MongoDB:', `${uri}/${db}`);

  const Product = mongoose.connection.collection('products');
  const products = await Product.find({}).project({ name: 1, images: 1, referenceImages: 1 }).toArray();

  console.log(`\nTotal products: ${products.length}\n`);
  for (const p of products) {
    console.log(`Product: ${p.name}`);
    console.log('  images:', JSON.stringify(p.images));
    if (p.referenceImages) {
      console.log('  referenceImages:', JSON.stringify(p.referenceImages));
    }
    console.log('');
  }

  await mongoose.disconnect();
}

inspectImages().catch(console.error);
