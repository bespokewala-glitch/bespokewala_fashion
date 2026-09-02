import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import dbConnect from './src/lib/mongoose';
import Product from './src/models/Product';
import { preWarmMany } from './src/lib/preWarmVariants';

async function run() {
  await dbConnect();
  const products = await Product.find({}).select('_id slug images referenceImages').lean();
  console.log(`Starting backfill for ${products.length} products...`);
  
  let warmed = 0;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const urls = [
      ...(Array.isArray(product.images) ? product.images : []),
      product.referenceImages?.front,
      product.referenceImages?.back,
      product.referenceImages?.left,
      product.referenceImages?.right,
    ].filter(Boolean) as string[];

    if (urls.length > 0) {
      await preWarmMany(urls);
      warmed += urls.length;
    }
    console.log(`[${i+1}/${products.length}] Processed ${product.slug} (${urls.length} images)`);
  }
  console.log(`\n✅ DONE! Processed ${products.length} products, generated variants for ${warmed} images.`);
  process.exit(0);
}
run();
