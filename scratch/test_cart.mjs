import { SignJWT } from 'jose';
import http from 'http';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-development-only';
const key = new TextEncoder().encode(secretKey);

async function testCart() {
  const token = await new SignJWT({
    id: '64b4c1234567890123456789', // fake ObjectId
    email: 'test@example.com',
    role: 'user',
    name: 'Test User',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key);

  const data = JSON.stringify({
    items: [
      {
        id: "ruby-crystal-choker-dangle-earrings-default",
        productSlug: "ruby-crystal-choker-dangle-earrings",
        name: "Ruby Crystal Choker & Dangle Earrings",
        price: 2600,
        image: "/assets/products/jewellery/jewellery1_main.png",
        quantity: 1
      }
    ]
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/cart',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth-token=${token}`,
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', body);
    });
  });

  req.on('error', (e) => {
    console.error('Request Error:', e);
  });

  req.write(data);
  req.end();
}

testCart();
