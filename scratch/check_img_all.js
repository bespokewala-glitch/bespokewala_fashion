const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.useDb('bespoken_fashion');
  // text search across all indexed fields or just fetch all and filter in memory since it's a small script
  const products = await db.collection('products').find({}).toArray();
  const matched = products.filter(p => JSON.stringify(p).includes('1788422235720'));
  console.log(JSON.stringify(matched, null, 2));
  process.exit(0);
});
