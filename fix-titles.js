const fs = require('fs');
const files = [
    'src/app/(storefront)/size-guide/page.tsx',
    'src/app/(storefront)/wishlist/layout.tsx',
    'src/app/(storefront)/track-order/page.tsx',
    'src/app/(storefront)/shipping/page.tsx',
    'src/app/(storefront)/register/layout.tsx',
    'src/app/(storefront)/products/[slug]/page.tsx',
    'src/app/(storefront)/products/page.tsx',
    'src/app/(storefront)/privacy-policy/page.tsx',
    'src/app/(storefront)/press/page.tsx',
    'src/app/(storefront)/login/layout.tsx',
    'src/app/(storefront)/faq/page.tsx',
    'src/app/(storefront)/contact/page.tsx',
    'src/app/(storefront)/checkout/page.tsx',
    'src/app/(storefront)/cart/page.tsx',
    'src/app/(storefront)/account/layout.tsx',
    'src/app/(storefront)/about/page.tsx',
    'src/app/(storefront)/terms-conditions/page.tsx'
];
for(let f of files) {
  if(fs.existsSync(f)) {
     let content = fs.readFileSync(f, 'utf8');
     // We replace | Bespokewala and anything after it up to the quote
     content = content.replace(/ \| Bespokewala(?: Fashion)?(?: [—\-] [^'"`\n]+)?/g, '');
     fs.writeFileSync(f, content);
     console.log('Fixed', f);
  }
}
