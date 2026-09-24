require('dotenv').config();
const mongoose = require('mongoose');
const { Storage } = require('@google-cloud/storage');

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n');

const storage = new Storage({
  projectId,
  credentials: {
    client_email: clientEmail,
    private_key: privateKey,
  },
});
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

async function renameFileInGCS(oldUrl, newNameBase) {
  if (!oldUrl) return oldUrl;
  
  // Extract filename from /api/media/uploads/filename.ext or /uploads/filename.ext
  const match = oldUrl.match(/uploads\/(.+)$/);
  if (!match) return oldUrl;
  
  const oldFilename = match[1];
  if (!oldFilename.includes('WhatsApp')) return oldUrl; // already renamed
  
  const ext = oldFilename.split('.').pop();
  // We'll generate a safe new filename
  const newFilename = `${Date.now()}-${newNameBase}.${ext}`;
  const oldFile = bucket.file(`uploads/${oldFilename}`);
  const newFile = bucket.file(`uploads/${newFilename}`);
  
  try {
    const [exists] = await oldFile.exists();
    if (exists) {
      await oldFile.move(newFile);
      console.log(`Renamed in GCS: ${oldFilename} -> ${newFilename}`);
    } else {
      console.log(`File not found in GCS: ${oldFilename} (Skipping GCS rename, updating DB anyway)`);
    }
  } catch (e) {
    console.error('Error renaming in GCS:', e.message);
  }
  
  return oldUrl.replace(oldFilename, newFilename);
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI + process.env.MONGODB_DB);
  console.log('Connected to DB');
  
  const hsCollection = mongoose.connection.collection('homepagesections');
  const sections = await hsCollection.find().toArray();
  
  for (const doc of sections) {
    let updated = false;
    const strDoc = JSON.stringify(doc);
    if (!strDoc.includes('WhatsApp')) continue;
    
    // We only know of SplitShowcase and CoutureProcess containing WhatsApp images.
    if (doc.sectionType === 'SplitShowcase') {
      const content = doc.content;
      if (content.modelImage && content.modelImage.includes('WhatsApp')) {
         content.modelImage = await renameFileInGCS(content.modelImage, 'bridal_model_showcase');
         updated = true;
      }
      if (content.products) {
         for (let i = 0; i < content.products.length; i++) {
            if (content.products[i].image && content.products[i].image.includes('WhatsApp')) {
               content.products[i].image = await renameFileInGCS(content.products[i].image, `bridal_product_${i+1}`);
               updated = true;
            }
         }
      }
    } else if (doc.sectionType === 'CoutureProcess') {
      if (doc.content.mainMedia && doc.content.mainMedia.includes('WhatsApp')) {
         doc.content.mainMedia = await renameFileInGCS(doc.content.mainMedia, 'couture_process_video');
         updated = true;
      }
    } else {
      // General replace if there are other strings (deep replace would be complex, but for now this covers known sections)
    }
    
    if (updated) {
       await hsCollection.updateOne({ _id: doc._id }, { $set: { content: doc.content } });
       console.log(`Updated DB for section ${doc._id} (${doc.sectionType})`);
    }
  }
  
  mongoose.disconnect();
  console.log('Done');
}

main().catch(console.error);
