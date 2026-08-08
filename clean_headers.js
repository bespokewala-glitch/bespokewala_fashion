const fs = require('fs');
const path = require('path');

const targetDir = 'd:\\fashion-ecommerce\\src\\app\\(storefront)';

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') && fullPath !== path.join(targetDir, 'layout.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Remove imports
      const newContent = content
        .replace(/import\s+Header\s+from\s+['"]@\/components\/layout\/Header['"];?\n?/g, '')
        .replace(/import\s+Footer\s+from\s+['"]@\/components\/layout\/Footer['"];?\n?/g, '')
        // Remove <Header /> and <Footer /> instances
        .replace(/<Header\s*\/>\n?/g, '')
        .replace(/<Footer\s*\/>\n?/g, '');

      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Cleaned:', fullPath);
      }
    }
  }
}

processDirectory(targetDir);
console.log('Done cleaning Header/Footer');
