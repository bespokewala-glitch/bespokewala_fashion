const mongoose = require('mongoose');
const { NextRequest } = require('next/server');
const dbConnect = require('./src/lib/mongoose').default;

async function testApi() {
  // We cannot easily require the TS API route directly in Node.
  // Let's just execute the EXACT same Mongoose query that the API route builds.
  await mongoose.connect('mongodb://localhost:27017/bespokewala');
  const Product = require('./src/models/Product').default;

  const searchParams = new URLSearchParams('productType=couture&category=womens&slug3=cocktail');
  
  const query = {};
  query.productType = searchParams.get('productType');
  query.category = searchParams.get('category');
  
  const slug3 = searchParams.get('slug3');
  const buildInQuery = (val) => {
    const arr = val.split(',').map(v => v.trim()).filter(Boolean);
    if (arr.length === 0) return undefined;
    return { $in: arr.map(item => new RegExp(`^${item.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')) };
  };

  if (slug3 && slug3.toLowerCase() !== 'all') {
    const slug3Query = buildInQuery(slug3);
    if (slug3Query) {
      if (!query.$and) query.$and = [];
      query.$and.push({
        $or: [
          { subcategory: slug3Query },
          { collectionName: slug3Query },
          { occasion: slug3Query }
        ]
      });
    }
  }

  console.log("Query:", JSON.stringify(query, null, 2));
  const products = await Product.find(query).lean();
  console.log("Local API would return:", products.length, "products.");
  process.exit(0);
}

testApi();
