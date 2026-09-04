const mongoose = require('mongoose');
require('dotenv').config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  require('./src/models/Product'); // Load the model
  const Product = mongoose.models.Product;
  
  try {
    const rawProduct = await Product.findOne({ slug: 'floral-embroidered-lehenga-set' }).lean();
    console.log('rawProduct exists?', !!rawProduct);
    if (rawProduct) {
      console.log('rawProduct _id:', rawProduct._id);
    }
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
