const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.useDb('bespoken_fashion');
  const product = await db.collection('Products').findOne({ slug: 'floral-embroidered-lehenga-set' });
  console.log('Product found:', product ? 'Yes' : 'No');
  
  const allSlugs = await db.collection('Products').find({}, { projection: { slug: 1 } }).toArray();
  const slugMatches = allSlugs.filter(p => p.slug && p.slug.includes('lehenga'));
  console.log('Slugs with lehenga:', slugMatches.map(p => p.slug).slice(0, 5));
  
  process.exit(0);
});
