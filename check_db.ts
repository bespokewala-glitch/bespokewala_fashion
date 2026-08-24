import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string, { dbName: 'bespoken_fashion' });
  const db = mongoose.connection.db;
  const lehengas = await db.collection('Products').find({ name: /Lehenga/i }).toArray();
  for (let p of lehengas) {
      console.log(`- ${p.name} | Occasion: ${p.occasion} | Sizes: ${p.sizes}`);
  }
  process.exit(0);
}
run();
