const fs = require('fs');
const path = require('path');

const directoriesToScan = [
  'd:\\fashion-ecommerce\\src\\components\\track-order',
  'd:\\fashion-ecommerce\\src\\components\\shipping',
  'd:\\fashion-ecommerce\\src\\components\\size-guide',
  'd:\\fashion-ecommerce\\src\\components\\press',
  'd:\\fashion-ecommerce\\src\\components\\legal',
  'd:\\fashion-ecommerce\\src\\components\\about'
];

function processDirectory(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let newContent = content;
      
      const aTagRegex = /<a(\s+[^>]*)?href=(["'`])(\/[^"'`]*)\2([^>]*)>/gi;
      
      if (newContent.match(aTagRegex)) {
        newContent = newContent.replace(aTagRegex, (match, beforeHref, quote, hrefVal, afterHref) => {
          return `<Link${beforeHref || ' '}href=${quote}${hrefVal}${quote}${afterHref || ''}>`;
        });
        
        // Also need to add import Link from 'next/link' if not present
        if (!newContent.includes('import Link from')) {
          newContent = `import Link from 'next/link';\n` + newContent;
        }
        
        // Find matching </a> and replace with </Link>
        // This is tricky, but since we know these files, we can just replace all </a> with </Link> for internal links manually.
        // Actually, it's safer to just replace all </a> with </Link> if we replaced any <a> with <Link>. But what if there are external <a> tags?
        // Let's use a simpler approach: just find instances of internal links and replace them manually.
      }

      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log('Processed:', fullPath);
      }
    }
  }
}

processDirectory(directoriesToScan[0]);
processDirectory(directoriesToScan[1]);
processDirectory(directoriesToScan[2]);
processDirectory(directoriesToScan[3]);
processDirectory(directoriesToScan[4]);
processDirectory(directoriesToScan[5]);
