const { MongoClient } = require('mongodb');
async function run() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('bespokewala');
  
  // Test Sangeet Query
  const query = {
    productType: { $in: [new RegExp('^couture$', 'i')] },
    category: { $in: [new RegExp('^womens$', 'i')] },
    $and: [
      {
        $or: [
          { subcategory: { $in: [new RegExp('^sangeet$', 'i')] } },
          { collectionName: { $in: [new RegExp('^sangeet$', 'i')] } },
          { occasion: { $in: [new RegExp('^sangeet$', 'i')] } }
        ]
      }
    ]
  };
  const products = await db.collection('products').find(query).toArray();
  console.log('Query result count:', products.length);
  products.forEach(p => console.log('Found:', p.name, '| Sub:', p.subcategory, '| Occasion:', p.occasion, '| Collection:', p.collectionName));
  
  process.exit(0);
}
run();
