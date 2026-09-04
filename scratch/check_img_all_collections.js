const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.useDb('bespoken_fashion');
  const collections = await db.listCollections().toArray();
  for (let coll of collections) {
    const docs = await db.collection(coll.name).find({}).toArray();
    const matched = docs.filter(p => JSON.stringify(p).includes('1788422235720'));
    if (matched.length > 0) {
      console.log('Found in collection:', coll.name);
      console.log(JSON.stringify(matched, null, 2));
    }
  }
  process.exit(0);
});
