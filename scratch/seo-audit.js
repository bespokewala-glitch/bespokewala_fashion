const BASE_URL = 'http://localhost:3000';
const URLS_TO_TEST = [
  '/',
  '/products',
  '/products/couture',
  '/products/couture/womens',
  '/products/couture/mens',
  '/products/couture/bridal',
  '/products/couture/womens/lehenga',
  '/products/couture/womens/saree',
  '/products/couture/womens/draped-saree',
  '/products/footwear',
  '/products/jewellery',
];

async function fetchSitemapUrls() {
  try {
    const res = await fetch(`${BASE_URL}/sitemap.xml`);
    if (!res.ok) return [];
    const text = await res.text();
    const matches = [...text.matchAll(/<loc>(.*?)<\/loc>/g)];
    return matches.map(m => m[1]);
  } catch {
    return [];
  }
}

async function auditUrl(urlPath) {
  const url = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return { url: urlPath, status: res.status, error: res.statusText };
    }
    const html = await res.text();
    
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || 
                      html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"/i);
    const description = descMatch ? descMatch[1] : '';
    
    const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)];
    const h1s = h1Matches.map(m => m[1].trim());
    
    const canMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i) ||
                     html.match(/<link[^>]*href="([^"]*)"[^>]*rel="canonical"/i);
    const canonical = canMatch ? canMatch[1] : '';
    
    const robMatch = html.match(/<meta[^>]*name="robots"[^>]*content="([^"]*)"/i);
    const robots = robMatch ? robMatch[1] : '';
    
    const schemaMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    const schemas = schemaMatches.map(m => {
      try { return JSON.parse(m[1]); } catch { return 'INVALID_JSON'; }
    });
    
    return {
      url: urlPath,
      status: res.status,
      title,
      description,
      h1Count: h1s.length,
      h1: h1s[0] || '',
      canonical,
      robots,
      schemaCount: schemas.length,
      schemaTypes: schemas.map(s => s['@type'] || (Array.isArray(s) ? s.map(ss => ss['@type']).join(',') : 'unknown'))
    };
  } catch (err) {
    return { url: urlPath, status: 'ERROR', error: err.message };
  }
}

async function run() {
  console.log('Fetching sitemap...');
  let sitemapUrls = await fetchSitemapUrls();
  console.log(`Found ${sitemapUrls.length} URLs in sitemap`);
  
  if (sitemapUrls.length === 0) {
    console.log('Sitemap empty or 404, fetching some products to audit...');
    try {
      const res = await fetch(`${BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        const products = data.products || data || [];
        products.slice(0, 5).forEach(p => URLS_TO_TEST.push(`/products/${p.slug}`));
      }
    } catch {}
  } else {
    const toAdd = sitemapUrls.filter(u => u.includes('/products/')).slice(0, 10);
    URLS_TO_TEST.push(...toAdd.map(u => u.replace('https://www.bespokewala.com', '')));
  }

  const results = [];
  const uniqueUrls = [...new Set(URLS_TO_TEST)];
  
  for (const u of uniqueUrls) {
    console.log(`Auditing ${u}...`);
    results.push(await auditUrl(u));
  }
  
  const reportPath = 'scratch/seo_audit_results.json';
  require('fs').writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    sitemapCount: sitemapUrls.length,
    results
  }, null, 2));
  console.log(`Done. Saved to ${reportPath}`);
}

run();
