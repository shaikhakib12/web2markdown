/**
 * PageScribe - Release Packaging Script
 * Packages the production Chrome Extension into a clean, store-compliant ZIP.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ZipArchive } = require('archiver');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('=== Packaging PageScribe for Chrome Web Store ===\n');

// 1. Run manifest and asset verification
console.log('Step 1: Running verification checks...');
try {
  execSync('node scripts/verify-manifest.js', { stdio: 'inherit', cwd: rootDir });
} catch (e) {
  console.error('\n✖ Packaging aborted due to verification errors.');
  process.exit(1);
}

// 2. Prepare dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Read version from manifest.json
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
const version = manifest.version || '1.0.0';
const zipFileName = `pagescribe-v${version}.zip`;
const zipFilePath = path.join(distDir, zipFileName);

// Remove existing zip if present
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
}

console.log(`\nStep 2: Creating distribution archive: dist/${zipFileName}`);

const output = fs.createWriteStream(zipFilePath);
const archive = new ZipArchive({
  zlib: { level: 9 } // Maximum compression
});

let totalEntries = 0;

archive.on('entry', (entry) => {
  totalEntries++;
  console.log(`  + [ZIP] ${entry.name}`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Archive warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', (err) => {
  throw err;
});

output.on('close', () => {
  const sizeBytes = archive.pointer();
  const sizeKb = (sizeBytes / 1024).toFixed(2);

  // Compute SHA256
  const fileBuffer = fs.readFileSync(zipFilePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  const hexSha256 = hashSum.digest('hex');

  console.log('\n--------------------------------------------------------------');
  console.log(`✓ Package created successfully: dist/${zipFileName}`);
  console.log(`✓ Total Files: ${totalEntries}`);
  console.log(`✓ Package Size: ${sizeKb} KB (${sizeBytes} bytes)`);
  console.log(`✓ SHA-256 Checksum: ${hexSha256}`);
  console.log('--------------------------------------------------------------');

  // Write release info metadata file
  const releaseInfo = {
    name: 'PageScribe',
    version: version,
    filename: zipFileName,
    sizeBytes: sizeBytes,
    sizeFormatted: `${sizeKb} KB`,
    fileCount: totalEntries,
    sha256: hexSha256,
    buildTime: new Date().toISOString(),
    manifestVersion: 3
  };

  fs.writeFileSync(path.join(distDir, 'RELEASE_INFO.json'), JSON.stringify(releaseInfo, null, 2), 'utf8');
  console.log('✓ Release metadata saved to dist/RELEASE_INFO.json');
  console.log('\n🎉 Ready for Chrome Developer Dashboard upload!');
});

archive.pipe(output);

// 3. Append strictly required distribution files

// Manifest
archive.file(path.join(rootDir, 'manifest.json'), { name: 'manifest.json' });

// Popup files
archive.file(path.join(rootDir, 'popup', 'popup.html'), { name: 'popup/popup.html' });
archive.file(path.join(rootDir, 'popup', 'popup.css'), { name: 'popup/popup.css' });
archive.file(path.join(rootDir, 'popup', 'popup.js'), { name: 'popup/popup.js' });

// Options files
archive.file(path.join(rootDir, 'options', 'options.html'), { name: 'options/options.html' });
archive.file(path.join(rootDir, 'options', 'options.css'), { name: 'options/options.css' });
archive.file(path.join(rootDir, 'options', 'options.js'), { name: 'options/options.js' });

// Icons
archive.file(path.join(rootDir, 'icons', 'icon16.png'), { name: 'icons/icon16.png' });
archive.file(path.join(rootDir, 'icons', 'icon48.png'), { name: 'icons/icon48.png' });
archive.file(path.join(rootDir, 'icons', 'icon128.png'), { name: 'icons/icon128.png' });

// Bundled libraries
archive.file(path.join(rootDir, 'lib', 'readability.js'), { name: 'lib/readability.js' });
archive.file(path.join(rootDir, 'lib', 'turndown.js'), { name: 'lib/turndown.js' });
archive.file(path.join(rootDir, 'lib', 'turndown-plugin-gfm.js'), { name: 'lib/turndown-plugin-gfm.js' });

// Core runtime scripts (exclude developer build scripts)
archive.file(path.join(rootDir, 'scripts', 'background.js'), { name: 'scripts/background.js' });
archive.file(path.join(rootDir, 'scripts', 'content.js'), { name: 'scripts/content.js' });
archive.file(path.join(rootDir, 'scripts', 'converter.js'), { name: 'scripts/converter.js' });
archive.file(path.join(rootDir, 'scripts', 'sanitizer.js'), { name: 'scripts/sanitizer.js' });

// Finalize archive
archive.finalize();
