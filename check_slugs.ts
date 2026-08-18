import dbConnect from './src/lib/mongoose.js';
import Product from './src/models/Product.js';

async function checkDuplicates() {
  await dbConnect();
  
  const products = await Product.find({}, 'name slug productType category').lean();
  
  const slugMap = new Map();
  const duplicateSlugs = [];
  
  for (const p of products) {
    if (slugMap.has(p.slug)) {
      duplicateSlugs.push({ slug: p.slug, id1: slugMap.get(p.slug)._id, id2: p._id, name1: slugMap.get(p.slug).name, name2: p.name });
    } else {
      slugMap.set(p.slug, p);
    }
  }
  
  console.log(`Found ${duplicateSlugs.length} duplicate slugs.`);
  if (duplicateSlugs.length > 0) {
    console.log(duplicateSlugs);
  }
  process.exit(0);
}

checkDuplicates();
