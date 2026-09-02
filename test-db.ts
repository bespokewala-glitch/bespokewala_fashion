import dbConnect from './src/lib/mongoose';
import Product from './src/models/Product';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function run() {
  await dbConnect();
  const products = await Product.find({ name: /Lehenga/i }).select('name slug').limit(10).lean();
  console.log(products);
  process.exit(0);
}
run();
