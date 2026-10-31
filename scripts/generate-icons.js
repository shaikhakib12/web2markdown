const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // deflate
  ihdrData[11] = 0; // filter method
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines (Filter byte 0x00 + RGBA per pixel)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatData);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Draws the PageScribe Icon:
 * Vibrant rounded blue square badge with a sleek white document & quill / text lines
 */
function renderPageScribeIcon(x, y, size) {
  const radius = size * 0.22;
  const margin = size * 0.08;
  const cx = size / 2;
  const cy = size / 2;

  // Check if inside rounded rectangle
  function inRoundedRect(px, py, rx, ry, rw, rh, rad) {
    if (px < rx || px > rx + rw || py < ry || py > ry + rh) return false;
    // corners
    if (px < rx + rad && py < ry + rad) {
      const dx = px - (rx + rad), dy = py - (ry + rad);
      return (dx * dx + dy * dy) <= rad * rad;
    }
    if (px > rx + rw - rad && py < ry + rad) {
      const dx = px - (rx + rw - rad), dy = py - (ry + rad);
      return (dx * dx + dy * dy) <= rad * rad;
    }
    if (px < rx + rad && py > ry + rh - rad) {
      const dx = px - (rx + rad), dy = py - (ry + rh - rad);
      return (dx * dx + dy * dy) <= rad * rad;
    }
    if (px > rx + rw - rad && py > ry + rh - rad) {
      const dx = px - (rx + rw - rad), dy = py - (ry + rh - rad);
      return (dx * dx + dy * dy) <= rad * rad;
    }
    return true;
  }

  // Base background: outside = transparent
  if (!inRoundedRect(x, y, margin, margin, size - 2 * margin, size - 2 * margin, radius)) {
    return [0, 0, 0, 0];
  }

  // Gradient blue background from #2563EB to #1D4ED8
  const factor = y / size;
  const bgR = Math.round(37 + (29 - 37) * factor);
  const bgG = Math.round(99 + (78 - 99) * factor);
  const bgB = Math.round(235 + (216 - 235) * factor);

  // Draw Document Glyph (White folded page inside)
  const docX = size * 0.26;
  const docY = size * 0.22;
  const docW = size * 0.48;
  const docH = size * 0.56;
  const fold = size * 0.14;

  const inDoc = (x >= docX && x <= docX + docW && y >= docY && y <= docY + docH);
  const inFoldCutout = (x > docX + docW - fold && y < docY + fold && (x - (docX + docW - fold)) + (docY + fold - y) > fold);

  if (inDoc && !inFoldCutout) {
    // Fold flap highlight
    if (x >= docX + docW - fold && y <= docY + fold) {
      return [203, 213, 225, 255]; // Soft slate fold
    }

    // Inside document: draw horizontal text scribe lines
    const line1Y = docY + docH * 0.38;
    const line2Y = docY + docH * 0.54;
    const line3Y = docY + docH * 0.70;
    const lineH = Math.max(1, size * 0.045);

    const isLine1 = (y >= line1Y && y <= line1Y + lineH && x >= docX + docW * 0.20 && x <= docX + docW * 0.80);
    const isLine2 = (y >= line2Y && y <= line2Y + lineH && x >= docX + docW * 0.20 && x <= docX + docW * 0.80);
    const isLine3 = (y >= line3Y && y <= line3Y + lineH && x >= docX + docW * 0.20 && x <= docX + docW * 0.55);

    if (isLine1 || isLine2 || isLine3) {
      return [37, 99, 235, 255]; // Blue line inside white doc
    }

    return [255, 255, 255, 255]; // White paper
  }

  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createPng(size, size, (x, y, w, h) => renderPageScribeIcon(x, y, size));
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(iconPath, png);
  console.log(`✓ Generated icons/icon${size}.png (${png.length} bytes)`);
});
