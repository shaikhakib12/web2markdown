const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// 1. Copy Readability.js and ensure globalThis export
let readabilityContent = fs.readFileSync(
  path.join(__dirname, '..', 'node_modules', '@mozilla', 'readability', 'Readability.js'),
  'utf8'
);
// Ensure global export in browser/window/worker
if (!readabilityContent.includes('globalThis.Readability')) {
  readabilityContent += `\nif (typeof globalThis !== 'undefined') { globalThis.Readability = Readability; }\n`;
}
fs.writeFileSync(path.join(libDir, 'readability.js'), readabilityContent, 'utf8');
console.log('✓ Copied and wrapped readability.js to lib/');

// 2. Copy turndown.js
const turndownContent = fs.readFileSync(
  path.join(__dirname, '..', 'node_modules', 'turndown', 'dist', 'turndown.js'),
  'utf8'
);
fs.writeFileSync(path.join(libDir, 'turndown.js'), turndownContent, 'utf8');
console.log('✓ Copied turndown.js to lib/');

// 3. Copy turndown-plugin-gfm.js
const gfmContent = fs.readFileSync(
  path.join(__dirname, '..', 'node_modules', 'turndown-plugin-gfm', 'dist', 'turndown-plugin-gfm.js'),
  'utf8'
);
fs.writeFileSync(path.join(libDir, 'turndown-plugin-gfm.js'), gfmContent, 'utf8');
console.log('✓ Copied turndown-plugin-gfm.js to lib/');
