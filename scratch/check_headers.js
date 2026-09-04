const https = require('https');

https.get('https://storage.googleapis.com/bespokewala-public-product-images/_variants/large/uploads/1785933648727-g1-1.png.webp', (res) => {
  console.log('Headers:', res.headers);
  process.exit(0);
});
