const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/bespoken_fashion').then(async () => {
  const col = mongoose.connection.collection('Products');
  const products = await col.find({}).toArray();
  let updated = 0;

  for (const p of products) {
    const setFields = {};

    // Fix main images
    if (Array.isArray(p.images)) {
      const fixed = p.images.map(u =>
        typeof u === 'string' ? u.replace('/api/media?file=', '/api/media/') : u
      );
      if (JSON.stringify(fixed) !== JSON.stringify(p.images)) {
        setFields['images'] = fixed;
      }
    }

    // Fix reference images
    if (p.referenceImages) {
      const refs = Object.assign({}, p.referenceImages);
      let changed = false;
      for (const k of ['front', 'back', 'left', 'right']) {
        if (refs[k] && refs[k].includes('/api/media?file=')) {
          refs[k] = refs[k].replace('/api/media?file=', '/api/media/');
          changed = true;
        }
      }
      if (changed) setFields['referenceImages'] = refs;
    }

    if (Object.keys(setFields).length > 0) {
      const op = { '$set': setFields };
      await col.updateOne({ _id: p._id }, op);
      console.log('Fixed:', p.name);
      console.log('  New images:', JSON.stringify(setFields['images'] || p.images));
      updated++;
    }
  }

  console.log('\nUpdated', updated, 'product(s)');
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
