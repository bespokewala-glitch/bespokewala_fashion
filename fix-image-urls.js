const mongoose = require('mongoose');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

async function fixImageUrls() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const db = process.env.MONGODB_DB || 'bespoken_fashion';

  await mongoose.connect(`${uri}/${db}`);
  console.log('Connected to MongoDB');

  const Product = mongoose.connection.collection('products');

  // Find all products with old ?file= URL format
  const products = await Product.find({
    $or: [
      { images: { $regex: '/api/media\\?file=' } },
      { 'referenceImages.front': { $regex: '/api/media\\?file=' } },
      { 'referenceImages.back': { $regex: '/api/media\\?file=' } },
      { 'referenceImages.left': { $regex: '/api/media\\?file=' } },
      { 'referenceImages.right': { $regex: '/api/media\\?file=' } },
    ]
  }).toArray();

  console.log(`Found ${products.length} products with old URL format`);

  for (const product of products) {
    const updates = {};

    // Fix main images array
    if (product.images && Array.isArray(product.images)) {
      const fixedImages = product.images.map(url =>
        typeof url === 'string' ? url.replace('/api/media?file=', '/api/media/') : url
      );
      updates.images = fixedImages;
      console.log(`  ${product.name}: fixed ${product.images.length} main image(s)`);
    }

    // Fix reference images
    if (product.referenceImages) {
      const fixedRefs = { ...product.referenceImages };
      for (const key of ['front', 'back', 'left', 'right']) {
        if (fixedRefs[key] && typeof fixedRefs[key] === 'string') {
          fixedRefs[key] = fixedRefs[key].replace('/api/media?file=', '/api/media/');
        }
      }
      updates.referenceImages = fixedRefs;
    }

    await Product.updateOne({ _id: product._id }, { $set: updates });
    console.log(`  Updated: ${product.name}`);
  }

  console.log('\nDone! All product image URLs have been fixed.');
  await mongoose.disconnect();
}

fixImageUrls().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
