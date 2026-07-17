const { MongoClient } = require('mongodb'); 
async function run() { 
  const client = new MongoClient('mongodb://localhost:27017'); 
  await client.connect(); 
  const adminDb = client.db('admin'); 
  const dbs = await adminDb.admin().listDatabases(); 
  for (let dbInfo of dbs.databases) { 
    const db = client.db(dbInfo.name); 
    const colls = await db.listCollections().toArray(); 
    for (let coll of colls) { 
      const count = await db.collection(coll.name).countDocuments(); 
      if (count > 0 && dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
        console.log(`DB: ${dbInfo.name}, Collection: ${coll.name}, Count: ${count}`);
      }
    } 
  } 
  await client.close(); 
} 
run().catch(console.dir);
