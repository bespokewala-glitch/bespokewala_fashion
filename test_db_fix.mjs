import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/bespokewala';

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'Products');

async function run() {
  await mongoose.connect(uri);
  const products = await Product.find({ category: "new-arrivals" }).select('name productType category subcategory isNewArrival').lean();
  
  console.log(`Found ${products.length} products with category: new-arrivals`);
  products.forEach(p => console.log(`- [${p.productType}] ${p.name} | Sub: ${p.subcategory} | isNewArrival: ${p.isNewArrival}`));
  
  await mongoose.disconnect();
}

run().catch(console.dir);
