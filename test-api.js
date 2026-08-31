const { GET } = require('./.next/server/app/api/products/route.js');

async function run() {
  const req = {
    nextUrl: new URL('http://localhost:3000/api/products?productType=couture&category=womens&slug3=cocktail')
  };
  const res = await GET(req);
  const json = await res.json();
  console.log(`API returned ${json.length} products`);
}

run().catch(console.error);
