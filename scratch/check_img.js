const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.useDb('bespoken_fashion');
  const products = await db.collection('Products').find({}).toArray();
  const matched = products.filter(p => JSON.stringify(p).includes('1788422235720'));
  console.log('Matches in Products:', JSON.stringify(matched, null, 2));
  process.exit(0);
});
