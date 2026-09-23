/**
 * apply_all_fixes.js
 * 
 * Applies all DB fixes for QA issues:
 * 1. Fix "Champagne Rose Heritage" → "Champagne Rose Heritage Lehenga" 
 * 2. Add individual links to jewellery CuratedGrid collection cards
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'bespoken_fashion';

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const Products = db.collection('Products');
  const HomepageSections = db.collection('homepagesections');

  // ══════════════════════════════════════════════════════
  // FIX 1: Correct the product name "Champagne Rose Heritage" → "Champagne Rose Heritage Lehenga"
  // ══════════════════════════════════════════════════════
  console.log('═══ FIX 1: Correcting Product Name ═══');
  
  const typoProduct = await Products.findOne({ slug: 'champagne-rose-heritage-lehenga' });
  if (typoProduct) {
    console.log(`Found product: "${typoProduct.name}" (id: ${typoProduct._id})`);
    
    const result = await Products.updateOne(
      { _id: typoProduct._id },
      { 
        $set: { 
          name: 'Champagne Rose Heritage Lehenga',
          // Also fix the SEO title if it contains the truncated name
          'seo.title': typoProduct.seo?.title?.includes('Herita0') 
            ? typoProduct.seo.title.replace(/Herita0/g, 'Heritage Lehenga')
            : (typoProduct.seo?.title?.includes('Champagne Rose Heritage') && !typoProduct.seo?.title?.includes('Lehenga')
               ? typoProduct.seo.title.replace('Champagne Rose Heritage', 'Champagne Rose Heritage Lehenga')
               : typoProduct.seo?.title),
        } 
      }
    );
    console.log(`✅ Updated product name. Modified count: ${result.modifiedCount}`);
    
    // Verify the update
    const updated = await Products.findOne({ _id: typoProduct._id });
    console.log(`   Verified new name: "${updated.name}"`);
  } else {
    console.log('❌ Product with slug "champagne-rose-heritage-lehenga" not found');
  }

  // ══════════════════════════════════════════════════════
  // FIX 6: Add individual links to jewellery CuratedGrid collection cards
  // The cards need links to their respective collection search pages.
  // Based on the collection names, the correct links should be:
  //   Royal Bridal Kundan → /products/jewellery?q=Royal+Bridal+Kundan
  //   Emerald Heritage    → /products/jewellery?q=Emerald+Heritage
  //   Maroon Ruby Royale  → /products/jewellery?q=Maroon+Ruby+Royale  
  //   Mint Green Elegance → /products/jewellery?q=Mint+Green+Elegance
  // BUT: a better approach is to link to collectionName-filtered pages
  // Let's first check what collectionNames exist in the DB for jewellery
  // ══════════════════════════════════════════════════════
  console.log('\n═══ Checking Jewellery Product Collection Names ═══');
  
  const jewelleryCollections = await Products.distinct('collectionName', { 
    productType: { $regex: /jewellery/i } 
  });
  console.log('Distinct collectionNames for jewellery:', jewelleryCollections);
  
  // Also check by category
  const jewelleryByCategory = await Products.distinct('collectionName', { 
    category: { $regex: /jewellery/i } 
  });
  console.log('Distinct collectionNames by category:', jewelleryByCategory);

  // Check products matching these collection card names
  const collectionNames = ['Royal Bridal Kundan', 'Emerald Heritage', 'Maroon Ruby Royale', 'Mint Green Elegance'];
  for (const cname of collectionNames) {
    const count = await Products.countDocuments({ 
      collectionName: { $regex: new RegExp(cname, 'i') }
    });
    const countName = await Products.countDocuments({ 
      name: { $regex: new RegExp(cname.replace(/\s+/g, '.*'), 'i') }
    });
    console.log(`  "${cname}": ${count} by collectionName, ${countName} by name`);
  }

  // ══════════════════════════════════════════════════════
  // Now update the CuratedGrid to add links for each collection card
  // We'll link to /products/jewellery/all?q=<title> as a safe fallback
  // ══════════════════════════════════════════════════════
  console.log('\n═══ FIX 6: Adding Links to Jewellery CuratedGrid Cards ═══');
  
  const jewellerySection = await HomepageSections.findOne({ 
    page: 'jewellery', 
    sectionType: 'CuratedGrid' 
  });
  
  if (jewellerySection) {
    console.log('Found CuratedGrid section for jewellery page');
    console.log('Current items:', JSON.stringify(jewellerySection.content.items, null, 2));
    
    // Map each collection title to its unique destination link
    // Since these are jewellery bridal collection names, link to collectionName-filtered pages
    const linkMap = {
      'Royal Bridal Kundan': '/products/jewellery/all?q=Royal+Bridal+Kundan',
      'Emerald Heritage': '/products/jewellery/all?q=Emerald+Heritage',
      'Maroon Ruby Royale': '/products/jewellery/all?q=Maroon+Ruby+Royale',
      'Mint Green Elegance': '/products/jewellery/all?q=Mint+Green+Elegance',
    };
    
    const updatedItems = jewellerySection.content.items.map(item => ({
      ...item,
      link: linkMap[item.title] || `/products/jewellery/all?q=${encodeURIComponent(item.title)}`
    }));
    
    console.log('\nUpdated items with links:', JSON.stringify(updatedItems, null, 2));
    
    const result = await HomepageSections.updateOne(
      { _id: jewellerySection._id },
      { $set: { 'content.items': updatedItems } }
    );
    console.log(`✅ Updated CuratedGrid items. Modified count: ${result.modifiedCount}`);
  } else {
    console.log('❌ CuratedGrid section for jewellery not found');
  }

  await mongoose.disconnect();
  console.log('\n✅ All fixes applied');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
