const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || 'bespokewala_fashion' }).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'Products');
  
  const allColl = await Product.distinct('collectionName');
  console.log("All distinct collectionNames:", allColl);
  const allCats = await Product.distinct('category');
  console.log("All distinct categories:", allCats);
  const allSubcats = await Product.distinct('subcategory');
  console.log("All distinct subcategories:", allSubcats);
  
  process.exit(0);
});
