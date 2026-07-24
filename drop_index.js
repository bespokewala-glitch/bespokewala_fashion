const { MongoClient } = require('mongodb');

async function dropIndex() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('bespoken_fashion');
    const collection = database.collection('Taxonomies');
    
    // Drop the old index
    await collection.dropIndex('slug_1');
    console.log('Successfully dropped slug_1 index');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index slug_1 not found, it might have been already dropped.');
    } else {
      console.error('Error dropping index:', err);
    }
  } finally {
    await client.close();
  }
}

dropIndex();
