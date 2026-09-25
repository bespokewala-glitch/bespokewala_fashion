require('dotenv').config();
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
const bucket = storage.bucket('bespokewala-public-product-images');

const filesToRename = [
  { old: '1787139329276-WhatsApp_Image_2026-07-24_at_12.55.38_PM.jpeg', new: '1790254826229-bridal_model_showcase.jpeg' },
  { old: '1787139341712-WhatsApp_Image_2026-07-24_at_12.56.18_PM.jpeg', new: '1790254826497-bridal_product_1.jpeg' },
  { old: '1787139351218-WhatsApp_Image_2026-07-24_at_12.56.33_PM.jpeg', new: '1790254826671-bridal_product_2.jpeg' },
  { old: '1787139362167-WhatsApp_Image_2026-07-24_at_12.57.07_PM.jpeg', new: '1790254826838-bridal_product_3.jpeg' },
  { old: '1787139376476-WhatsApp_Image_2026-07-24_at_12.56.48_PM.jpeg', new: '1790254826972-bridal_product_4.jpeg' },
];

async function main() {
  for (const { old: oldFilename, new: newFilename } of filesToRename) {
    const oldFile = bucket.file(`uploads/${oldFilename}`);
    const newFile = bucket.file(`uploads/${newFilename}`);
    
    try {
      const [exists] = await oldFile.exists();
      if (exists) {
        // Copy to the new filename instead of move, just in case
        await oldFile.copy(newFile);
        console.log(`Copied in GCS (public bucket): ${oldFilename} -> ${newFilename}`);
      } else {
        console.log(`File not found in public bucket: ${oldFilename}`);
        // Let's try to copy it from bespokewala-storage!
        const otherBucket = storage.bucket('bespokewala-storage');
        const otherFile = otherBucket.file(`uploads/${newFilename}`);
        const [otherExists] = await otherFile.exists();
        if (otherExists) {
            console.log(`Copying from bespokewala-storage to public bucket...`);
            const buffer = await otherFile.download();
            await newFile.save(buffer[0]);
            console.log(`Copied from storage bucket to public bucket: ${newFilename}`);
        } else {
            console.log(`Could not find file in ANY bucket`);
        }
      }
    } catch (e) {
      console.error('Error renaming in GCS public bucket:', e.message);
    }
  }
  
  console.log('Done');
}

main().catch(console.error);
