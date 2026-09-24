import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/bespokewala';

const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema, 'Products');

async function run() {
  await mongoose.connect(uri);
  const p1 = await Product.findOne({ name: 'Jet Black Shimmer Dinner Suit' }).lean();
  console.log("Product 1:", JSON.stringify(p1, null, 2));
  
  const p2 = await Product.findOne({ name: 'Royal Blue Sapphire V-Neck Set' }).lean();
  console.log("Product 2:", JSON.stringify(p2, null, 2));

  const p3 = await Product.findOne({ name: 'Burgundy Gold Lehenga' }).lean();
  console.log("Product 3:", JSON.stringify(p3, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.dir);
