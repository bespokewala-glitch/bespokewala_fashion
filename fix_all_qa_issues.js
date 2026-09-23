/**
 * fix_all_qa_issues.js
 * 
 * Fixes:
 * 1. Product typo: "Champagne Rose Herita0" → find correct name
 * 2. Jewellery collection card links (via HomepageSection CuratedGrid data)
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'bespoken_fashion';

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;

  // ══════════════════════════════════════════════════════
  // ISSUE 1: Find the "Herita0" product typo
  // ══════════════════════════════════════════════════════
  console.log('═══ ISSUE 1: Product Typo Search ═══');
  
  // Search for products with "Herita0" or similar patterns
  const Products = db.collection('Products');
  
  const typoProducts = await Products.find({
    $or: [
      { name: /Herita0/i },
      { name: /Herita[^g]/i },  // Herita followed by non-g (to catch Herita0)
      { name: /Heritage/i },
    ]
  }).toArray();
  
  console.log(`Found ${typoProducts.length} products matching Heritage/Herita0:`);
  typoProducts.forEach(p => {
    console.log(`  - name: "${p.name}" | slug: "${p.slug}" | id: ${p._id}`);
  });
  
  // Also search for Champagne Rose
  const champagneProducts = await Products.find({
    name: /champagne rose/i
  }).toArray();
  
  console.log(`\nFound ${champagneProducts.length} products matching "Champagne Rose":`);
  champagneProducts.forEach(p => {
    console.log(`  - name: "${p.name}" | slug: "${p.slug}" | id: ${p._id}`);
  });

  // Search for any product with "0" at the end (potential typo)
  const zeroEndProducts = await Products.find({
    name: /\d$/
  }).toArray();
  console.log(`\nFound ${zeroEndProducts.length} products with numeric endings:`);
  zeroEndProducts.forEach(p => {
    console.log(`  - name: "${p.name}" | slug: "${p.slug}"`);
  });

  // ══════════════════════════════════════════════════════
  // ISSUE 6: Jewellery Collection Cards
  // ══════════════════════════════════════════════════════
  console.log('\n═══ ISSUE 6: Jewellery Collection Cards ═══');
  
  const HomepageSections = db.collection('homepagesections');
  
  // Check all sections for the jewellery page
  const jewellerySections = await HomepageSections.find({ page: 'jewellery' }).toArray();
  
  console.log(`Found ${jewellerySections.length} sections for jewellery page:`);
  jewellerySections.forEach(s => {
    console.log(`\n  sectionType: "${s.sectionType}"`);
    if (s.content) {
      console.log('  content:', JSON.stringify(s.content, null, 2));
    }
  });
  
  // Also check for 'jewellery/all'
  const jewelleryAllSections = await HomepageSections.find({ page: { $regex: /jewellery/i } }).toArray();
  console.log(`\nAll jewellery-related sections: ${jewelleryAllSections.length}`);
  jewelleryAllSections.forEach(s => {
    console.log(`  page: "${s.page}", sectionType: "${s.sectionType}"`);
  });

  // ══════════════════════════════════════════════════════
  // Show all distinct product names starting with "Ch"
  // ══════════════════════════════════════════════════════
  console.log('\n═══ All products with "Champagne" or "Heritage" ═══');
  const allHeritage = await Products.find({
    $or: [
      { name: /champagne/i },
      { name: /heritage/i },
      { name: /herita/i }
    ]
  }, { projection: { name: 1, slug: 1, _id: 1 } }).toArray();
  
  allHeritage.forEach(p => {
    console.log(`  "${p.name}" (slug: ${p.slug})`);
  });

  await mongoose.disconnect();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
