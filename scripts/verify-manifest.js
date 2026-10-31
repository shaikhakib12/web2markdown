/**
 * PageScribe - Manifest V3 & Extension Integrity Verifier
 * Validates compliance with Chrome Web Store Manifest V3 guidelines.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const manifestPath = path.join(rootDir, 'manifest.json');

console.log('--- Verifying PageScribe Manifest V3 & Distribution Assets ---');

const errors = [];
const warnings = [];

// 1. Read manifest.json
let manifest;
try {
  const content = fs.readFileSync(manifestPath, 'utf8');
  manifest = JSON.parse(content);
  console.log('✓ manifest.json is valid JSON');
} catch (e) {
  errors.push(`Failed to parse manifest.json: ${e.message}`);
}

if (manifest) {
  // 2. Validate manifest_version
  if (manifest.manifest_version !== 3) {
    errors.push(`Invalid manifest_version: expected 3, got ${manifest.manifest_version}`);
  } else {
    console.log('✓ manifest_version is 3');
  }

  // 3. Validate name (max 45 chars)
  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Manifest name is missing or invalid.');
  } else if (manifest.name.length > 45) {
    errors.push(`Manifest name exceeds 45 characters: "${manifest.name}" (${manifest.name.length} chars)`);
  } else {
    console.log(`✓ Name: "${manifest.name}" (${manifest.name.length}/45 chars)`);
  }

  // 4. Validate version format
  if (!manifest.version || !/^\d+(\.\d+){1,3}$/.test(manifest.version)) {
    errors.push(`Invalid version format: "${manifest.version}". Expected 1 to 4 dot-separated integers.`);
  } else {
    console.log(`✓ Version: ${manifest.version}`);
  }

  // 5. Validate description (max 132 chars)
  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('Manifest description is missing.');
  } else if (manifest.description.length > 132) {
    errors.push(`Manifest description exceeds 132 characters (${manifest.description.length}/132 chars)`);
  } else {
    console.log(`✓ Description: "${manifest.description}" (${manifest.description.length}/132 chars)`);
  }

  // 6. Check icons exist on disk
  if (!manifest.icons) {
    errors.push('Manifest icons object is missing.');
  } else {
    for (const [size, relPath] of Object.entries(manifest.icons)) {
      const fullPath = path.join(rootDir, relPath);
      if (!fs.existsSync(fullPath)) {
        errors.push(`Icon file missing: icons/${size} -> ${relPath}`);
      } else {
        const stats = fs.statSync(fullPath);
        if (stats.size === 0) {
          errors.push(`Icon file is 0 bytes: ${relPath}`);
        } else {
          console.log(`✓ Icon ${size}x${size} exists: ${relPath} (${stats.size} bytes)`);
        }
      }
    }
  }

  // 7. Check action & default_popup
  if (!manifest.action || !manifest.action.default_popup) {
    errors.push('manifest.action.default_popup is missing.');
  } else {
    const popupPath = path.join(rootDir, manifest.action.default_popup);
    if (!fs.existsSync(popupPath)) {
      errors.push(`Default popup file missing: ${manifest.action.default_popup}`);
    } else {
      console.log(`✓ Action default popup exists: ${manifest.action.default_popup}`);
    }
  }

  // 8. Check background service worker
  if (!manifest.background || !manifest.background.service_worker) {
    errors.push('manifest.background.service_worker is missing.');
  } else {
    const swPath = path.join(rootDir, manifest.background.service_worker);
    if (!fs.existsSync(swPath)) {
      errors.push(`Background service worker file missing: ${manifest.background.service_worker}`);
    } else {
      console.log(`✓ Service worker exists: ${manifest.background.service_worker}`);
    }
  }

  // 9. Check options page
  if (manifest.options_ui && manifest.options_ui.page) {
    const optPath = path.join(rootDir, manifest.options_ui.page);
    if (!fs.existsSync(optPath)) {
      errors.push(`Options page file missing: ${manifest.options_ui.page}`);
    } else {
      console.log(`✓ Options UI page exists: ${manifest.options_ui.page}`);
    }
  }

  // 10. Check permissions
  const validPermissions = [
    'activeTab', 'scripting', 'storage', 'contextMenus', 'downloads'
  ];
  if (Array.isArray(manifest.permissions)) {
    for (const perm of manifest.permissions) {
      if (!validPermissions.includes(perm)) {
        warnings.push(`Uncommon or custom permission declared: ${perm}`);
      }
    }
    console.log(`✓ Permissions declared (${manifest.permissions.length}): ${manifest.permissions.join(', ')}`);
  }

  // 11. Check HTML files for remote script tags (CSP violation check)
  const htmlFiles = [
    path.join(rootDir, 'popup', 'popup.html'),
    path.join(rootDir, 'options', 'options.html')
  ];

  for (const file of htmlFiles) {
    if (fs.existsSync(file)) {
      const htmlContent = fs.readFileSync(file, 'utf8');
      const relName = path.relative(rootDir, file);

      // Check for remote scripts
      const remoteMatches = htmlContent.match(/<script[^>]+src=["'](https?:|\/\/)[^"']+["']/gi);
      if (remoteMatches) {
        errors.push(`Forbidden remote script tag found in ${relName}: ${remoteMatches.join(', ')}`);
      } else {
        console.log(`✓ No remote executable scripts in ${relName}`);
      }

      // Check all local script src references exist
      const localMatches = htmlContent.matchAll(/<script[^>]+src=["']([^"']+)["']/gi);
      for (const match of localMatches) {
        const scriptSrc = match[1];
        if (!scriptSrc.startsWith('http') && !scriptSrc.startsWith('//')) {
          const resolvedScriptPath = path.resolve(path.dirname(file), scriptSrc);
          if (!fs.existsSync(resolvedScriptPath)) {
            errors.push(`Script reference in ${relName} not found on disk: ${scriptSrc} (resolved to ${resolvedScriptPath})`);
          } else {
            console.log(`  - Local dependency verified: ${scriptSrc}`);
          }
        }
      }
    }
  }
}

// 12. Check bundled libraries in lib/
const requiredLibs = ['readability.js', 'turndown.js', 'turndown-plugin-gfm.js'];
for (const lib of requiredLibs) {
  const libPath = path.join(rootDir, 'lib', lib);
  if (!fs.existsSync(libPath)) {
    errors.push(`Required local library missing in lib/: ${lib}`);
  } else {
    const size = fs.statSync(libPath).size;
    console.log(`✓ Bundled vendor library present: lib/${lib} (${(size / 1024).toFixed(1)} KB)`);
  }
}

console.log('--------------------------------------------------------------');
if (warnings.length > 0) {
  console.log('Warnings:');
  warnings.forEach(w => console.warn(`  ! ${w}`));
}

if (errors.length > 0) {
  console.error('VERIFICATION FAILED with errors:');
  errors.forEach(e => console.error(`  ✖ ${e}`));
  process.exit(1);
} else {
  console.log('🎉 ALL MANIFEST V3 & ASSET CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
