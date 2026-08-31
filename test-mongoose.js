const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/bespokewala');
  
  const ProductSchema = new mongoose.Schema({
    name: String,
    subcategory: String,
    collectionName: String,
    occasion: String,
    productType: String,
    category: String,
  }, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

  // Clear products
  await Product.deleteMany({ name: /^TEST_/ });

  // Insert test products
  await Product.create({
    name: 'TEST_SANGEET_PRODUCT',
    productType: 'couture',
    category: 'womens',
    subcategory: 'suits',
    collectionName: '',
    occasion: 'cocktail' // Matches occasion
  });

  await Product.create({
    name: 'TEST_POOJA_PRODUCT',
    productType: 'couture',
    category: 'womens',
    subcategory: 'suits',
    collectionName: '',
    occasion: 'pooja' // Should not match
  });

  const productQuery = {};
  
  const buildInQuery = (val) => {
    const arr = val.split(',').map(v => v.trim()).filter(Boolean);
    if (arr.length === 0) return undefined;
    return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) };
  };

  productQuery.productType = buildInQuery('couture');
  productQuery.category = buildInQuery('womens');

  const slug3 = 'cocktail';
  const slug3Query = buildInQuery(slug3);
  
  if (!productQuery.$and) productQuery.$and = [];
  productQuery.$and.push({
    $or: [
      { subcategory: slug3Query },
      { collectionName: slug3Query },
      { occasion: slug3Query }
    ]
  });

  const results = await Product.find(productQuery).lean();
  console.log(`Found ${results.length} products`);
  results.forEach(p => console.log(`- ${p.name} | sub: ${p.subcategory} | coll: ${p.collectionName} | occ: ${p.occasion}`));

  process.exit(0);
}

run();
