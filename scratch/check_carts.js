const mongoose = require('mongoose');

async function checkDb() {
  await mongoose.connect('mongodb+srv://bespokewala_db_user:NbT61DBndL0c2pSL@bespokewala.7qvhr3k.mongodb.net/', { dbName: 'bespoken_fashion' });
  const carts = await mongoose.connection.collection('carts').find({}).toArray();
  console.log(JSON.stringify(carts, null, 2));
  process.exit(0);
}

checkDb();
