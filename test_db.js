const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://bespokewala_db_user:NbT61DBndL0c2pSL@bespokewala.7qvhr3k.mongodb.net/bespoken_fashion').then(async () => {
  const products = await mongoose.connection.collection('Products').find({
    $or: [{ occasion: /sangeet/i }, { subcategory: /sangeet/i }, { name: /sangeet/i }]
  }).toArray();
  
  console.log('PRODUCTS:', JSON.stringify(products.map(p => ({ slug: p.slug, occasion: p.occasion, subcategory: p.subcategory })), null, 2));
  process.exit(0);
});
