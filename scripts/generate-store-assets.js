/**
 * PageScribe - Chrome Web Store Promotional Asset Generator
 * Generates official store assets:
 * - 1280x800 Screenshots (Article Mode, Raw Markdown Mode, Settings Page)
 * - 440x280 Small Promo Tile
 * - 1400x560 Marquee Promo Banner
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const storeDir = path.join(__dirname, '..', 'store-assets');
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
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

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(rawData, { level: 8 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Bitmap font helper for drawing crisp clean text onto raw image buffer
 * 5x7 clean pixel font definitions for basic alphanumeric
 */
const FONT_5X7 = {
  'A': [0x1E, 0x05, 0x05, 0x1E, 0x00],
  'B': [0x1F, 0x15, 0x15, 0x0A, 0x00],
  'C': [0x0E, 0x11, 0x11, 0x0A, 0x00],
  'D': [0x1F, 0x11, 0x11, 0x0E, 0x00],
  'E': [0x1F, 0x15, 0x15, 0x11, 0x00],
  'F': [0x1F, 0x05, 0x05, 0x01, 0x00],
  'G': [0x0E, 0x11, 0x15, 0x1D, 0x00],
  'H': [0x1F, 0x04, 0x04, 0x1F, 0x00],
  'I': [0x11, 0x1F, 0x11, 0x00, 0x00],
  'J': [0x08, 0x10, 0x10, 0x0F, 0x00],
  'K': [0x1F, 0x04, 0x0A, 0x11, 0x00],
  'L': [0x1F, 0x10, 0x10, 0x10, 0x00],
  'M': [0x1F, 0x02, 0x04, 0x02, 0x1F],
  'N': [0x1F, 0x02, 0x04, 0x08, 0x1F],
  'O': [0x0E, 0x11, 0x11, 0x0E, 0x00],
  'P': [0x1F, 0x05, 0x05, 0x02, 0x00],
  'Q': [0x0E, 0x11, 0x19, 0x16, 0x00],
  'R': [0x1F, 0x05, 0x0D, 0x12, 0x00],
  'S': [0x12, 0x15, 0x15, 0x09, 0x00],
  'T': [0x01, 0x01, 0x1F, 0x01, 0x01],
  'U': [0x0F, 0x10, 0x10, 0x0F, 0x00],
  'V': [0x07, 0x18, 0x10, 0x08, 0x07],
  'W': [0x1F, 0x08, 0x04, 0x08, 0x1F],
  'X': [0x11, 0x0A, 0x04, 0x0A, 0x11],
  'Y': [0x01, 0x02, 0x1C, 0x02, 0x01],
  'Z': [0x11, 0x19, 0x15, 0x13, 0x11],
  '0': [0x0E, 0x13, 0x15, 0x19, 0x0E],
  '1': [0x00, 0x08, 0x1F, 0x00, 0x00],
  '2': [0x12, 0x19, 0x15, 0x12, 0x00],
  '3': [0x11, 0x15, 0x15, 0x0A, 0x00],
  '4': [0x04, 0x0C, 0x14, 0x1F, 0x04],
  '5': [0x17, 0x15, 0x15, 0x09, 0x00],
  '6': [0x0E, 0x15, 0x15, 0x08, 0x00],
  '7': [0x01, 0x19, 0x05, 0x03, 0x00],
  '8': [0x0A, 0x15, 0x15, 0x0A, 0x00],
  '9': [0x02, 0x15, 0x15, 0x0E, 0x00],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
  '-': [0x04, 0x04, 0x04, 0x04, 0x00],
  ':': [0x00, 0x0A, 0x00, 0x00, 0x00],
  '.': [0x00, 0x10, 0x00, 0x00, 0x00],
  '/': [0x10, 0x08, 0x04, 0x02, 0x01],
  '#': [0x0A, 0x1F, 0x0A, 0x1F, 0x0A],
  '[': [0x1F, 0x11, 0x00, 0x00, 0x00],
  ']': [0x00, 0x00, 0x11, 0x1F, 0x00],
  '*': [0x0A, 0x04, 0x0A, 0x00, 0x00],
  '>': [0x11, 0x0A, 0x04, 0x00, 0x00]
};

class CanvasBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.pixels = Buffer.alloc(w * h * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const idx = (y * this.w + x) * 4;
    this.pixels[idx] = r;
    this.pixels[idx + 1] = g;
    this.pixels[idx + 2] = b;
    this.pixels[idx + 3] = a;
  }

  fill(r, g, b, a = 255) {
    for (let i = 0; i < this.w * this.h; i++) {
      const idx = i * 4;
      this.pixels[idx] = r;
      this.pixels[idx + 1] = g;
      this.pixels[idx + 2] = b;
      this.pixels[idx + 3] = a;
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  strokeRect(x, y, w, h, r, g, b, stroke = 1) {
    this.fillRect(x, y, w, stroke, r, g, b);
    this.fillRect(x, y + h - stroke, w, stroke, r, g, b);
    this.fillRect(x, y, stroke, h, r, g, b);
    this.fillRect(x + w - stroke, y, stroke, h, r, g, b);
  }

  fillRoundedRect(x, y, w, h, rad, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        let inside = true;
        if (px < x + rad && py < y + rad) {
          inside = (px - (x + rad)) ** 2 + (py - (y + rad)) ** 2 <= rad ** 2;
        } else if (px > x + w - rad && py < y + rad) {
          inside = (px - (x + w - rad)) ** 2 + (py - (y + rad)) ** 2 <= rad ** 2;
        } else if (px < x + rad && py > y + h - rad) {
          inside = (px - (x + rad)) ** 2 + (py - (y + h - rad)) ** 2 <= rad ** 2;
        } else if (px > x + w - rad && py > y + h - rad) {
          inside = (px - (x + w - rad)) ** 2 + (py - (y + h - rad)) ** 2 <= rad ** 2;
        }
        if (inside) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  drawText(text, x, y, scale = 2, r = 255, g = 255, b = 255) {
    const upper = String(text).toUpperCase();
    let cx = x;
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      const glyph = FONT_5X7[ch] || FONT_5X7[' '];
      for (let col = 0; col < 5; col++) {
        const bits = glyph[col] || 0;
        for (let row = 0; row < 7; row++) {
          if ((bits >> row) & 1) {
            this.fillRect(cx + col * scale, y + row * scale, scale, scale, r, g, b);
          }
        }
      }
      cx += 6 * scale;
    }
  }

  toPng() {
    return createPng(this.w, this.h, (x, y) => {
      const idx = (y * this.w + x) * 4;
      return [
        this.pixels[idx],
        this.pixels[idx + 1],
        this.pixels[idx + 2],
        this.pixels[idx + 3]
      ];
    });
  }
}

// -------------------------------------------------------------
// ASSET 1: Small Promo Tile (440 x 280)
// -------------------------------------------------------------
function buildSmallPromoTile() {
  const c = new CanvasBuffer(440, 280);

  // Gradient background #0B1120 -> #1E293B
  for (let y = 0; y < 280; y++) {
    const factor = y / 280;
    const r = Math.round(11 + (30 - 11) * factor);
    const g = Math.round(17 + (41 - 17) * factor);
    const b = Math.round(32 + (59 - 32) * factor);
    c.fillRect(0, y, 440, 1, r, g, b);
  }

  // Border
  c.strokeRect(0, 0, 440, 280, 51, 65, 85, 2);

  // Big App Logo (Center-top)
  const logoX = 40;
  const logoY = 40;
  c.fillRoundedRect(logoX, logoY, 56, 56, 12, 37, 99, 235);
  // White document folded inside
  c.fillRoundedRect(logoX + 16, logoY + 12, 24, 32, 2, 255, 255, 255);
  // Lines inside logo
  c.fillRect(logoX + 20, logoY + 22, 16, 2, 37, 99, 235);
  c.fillRect(logoX + 20, logoY + 28, 16, 2, 37, 99, 235);
  c.fillRect(logoX + 20, logoY + 34, 10, 2, 37, 99, 235);

  // Title & Tag
  c.drawText('PAGESCRIBE', 110, 48, 4, 255, 255, 255);
  c.fillRoundedRect(110, 84, 96, 18, 4, 37, 99, 235);
  c.drawText('TEXT-ONLY', 118, 88, 1.5, 255, 255, 255);

  // Tagline Box
  c.drawText('TURN ANY WEBPAGE INTO CLEAN MARKDOWN', 40, 130, 2, 203, 213, 225);

  // Badges
  const badgeY = 175;
  c.fillRoundedRect(40, badgeY, 160, 36, 6, 30, 41, 59);
  c.strokeRect(40, badgeY, 160, 36, 51, 65, 85, 1);
  c.drawText('100% LOCAL PRIVACY', 52, badgeY + 12, 1.5, 52, 211, 153);

  c.fillRoundedRect(220, badgeY, 180, 36, 6, 30, 41, 59);
  c.strokeRect(220, badgeY, 180, 36, 51, 65, 85, 1);
  c.drawText('ZERO MEDIA OR ADS', 234, badgeY + 12, 1.5, 96, 165, 250);

  // Footer Note
  c.drawText('CHROME EXTENSION MANIFEST V3 * OPEN SOURCE', 40, 240, 1.5, 148, 163, 184);

  return c.toPng();
}

// -------------------------------------------------------------
// ASSET 2: Marquee Promo Banner (1400 x 560)
// -------------------------------------------------------------
function buildMarqueeBanner() {
  const c = new CanvasBuffer(1400, 560);

  // Deep dark gradient background
  for (let y = 0; y < 560; y++) {
    const factor = y / 560;
    const r = Math.round(15 + (30 - 15) * factor);
    const g = Math.round(23 + (41 - 23) * factor);
    const b = Math.round(42 + (59 - 42) * factor);
    c.fillRect(0, y, 1400, 1, r, g, b);
  }

  // Left Brand Showcase
  const logoX = 90;
  const logoY = 90;
  c.fillRoundedRect(logoX, logoY, 84, 84, 18, 37, 99, 235);
  c.fillRoundedRect(logoX + 24, logoY + 18, 36, 48, 3, 255, 255, 255);
  c.fillRect(logoX + 30, logoY + 32, 24, 3, 37, 99, 235);
  c.fillRect(logoX + 30, logoY + 42, 24, 3, 37, 99, 235);
  c.fillRect(logoX + 30, logoY + 52, 16, 3, 37, 99, 235);

  c.drawText('PAGESCRIBE', 195, 105, 6, 255, 255, 255);
  c.fillRoundedRect(195, 160, 150, 24, 6, 37, 99, 235);
  c.drawText('TEXT-ONLY EXTENSION', 205, 166, 2, 255, 255, 255);

  c.drawText('TURN ANY WEBPAGE INTO CLEAN MARKDOWN.', 90, 230, 3.5, 248, 250, 252);
  c.drawText('STUDENTS * DEVELOPERS * RESEARCHERS * OBSIDIAN * NOTION', 90, 280, 2, 148, 163, 184);

  // 3 Feature highlight cards on the left
  const cardY = 340;
  const cardW = 180;
  const cardH = 130;

  c.fillRoundedRect(90, cardY, cardW, cardH, 8, 30, 41, 59);
  c.strokeRect(90, cardY, cardW, cardH, 51, 65, 85, 1);
  c.drawText('1-CLICK CONVERT', 105, cardY + 20, 1.8, 96, 165, 250);
  c.drawText('ARTICLE & FULL TEXT', 105, cardY + 50, 1.4, 203, 213, 225);
  c.drawText('MOZILLA READABILITY', 105, cardY + 75, 1.4, 148, 163, 184);

  c.fillRoundedRect(290, cardY, cardW, cardH, 8, 30, 41, 59);
  c.strokeRect(290, cardY, cardW, cardH, 51, 65, 85, 1);
  c.drawText('STRICT TEXT-ONLY', 305, cardY + 20, 1.8, 52, 211, 153);
  c.drawText('ZERO IMAGES & ADS', 305, cardY + 50, 1.4, 203, 213, 225);
  c.drawText('NO MEDIA DOWNLOADS', 305, cardY + 75, 1.4, 148, 163, 184);

  c.fillRoundedRect(490, cardY, cardW, cardH, 8, 30, 41, 59);
  c.strokeRect(490, cardY, cardW, cardH, 51, 65, 85, 1);
  c.drawText('100% PRIVATE', 505, cardY + 20, 1.8, 244, 114, 182);
  c.drawText('LOCAL IN-BROWSER', 505, cardY + 50, 1.4, 203, 213, 225);
  c.drawText('NO SERVER OR AI APIS', 505, cardY + 75, 1.4, 148, 163, 184);

  // Right Side: Realistic UI Mockup Window (800 x 480 at x=740, y=40)
  const winX = 740;
  const winY = 40;
  const winW = 590;
  const winH = 480;

  c.fillRoundedRect(winX, winY, winW, winH, 12, 15, 23, 42);
  c.strokeRect(winX, winY, winW, winH, 51, 65, 85, 2);

  // Window top bar
  c.fillRect(winX, winY, winW, 40, 30, 41, 59);
  // Window dots
  c.fillRoundedRect(winX + 16, winY + 14, 12, 12, 6, 239, 68, 68);
  c.fillRoundedRect(winX + 36, winY + 14, 12, 12, 6, 245, 158, 11);
  c.fillRoundedRect(winX + 56, winY + 14, 12, 12, 6, 16, 185, 129);
  c.drawText('PAGESCRIBE - CLEAN WEB TO MARKDOWN', winX + 85, winY + 15, 1.5, 203, 213, 225);

  // Mockup Popup body inside window
  const popX = winX + 40;
  const popY = winY + 60;
  const popW = 510;
  const popH = 390;

  c.fillRoundedRect(popX, popY, popW, popH, 8, 30, 41, 59);
  c.strokeRect(popX, popY, popW, popH, 71, 85, 105, 1);

  // Mock header inside popup
  c.drawText('ARTICLE TITLE: UNDERSTANDING SYSTEM ARCHITECTURE', popX + 20, popY + 20, 1.6, 255, 255, 255);
  c.drawText('HTTPS://EXAMPLE.COM/DOCS/SYSTEM-DESIGN', popX + 20, popY + 40, 1.3, 148, 163, 184);

  // Mode buttons inside popup
  c.fillRoundedRect(popX + 20, popY + 65, 120, 28, 4, 37, 99, 235);
  c.drawText('ARTICLE MODE', popX + 35, popY + 73, 1.5, 255, 255, 255);

  c.fillRoundedRect(popX + 150, popY + 65, 120, 28, 4, 51, 65, 85);
  c.drawText('FULL TEXT', popX + 175, popY + 73, 1.5, 203, 213, 225);

  c.fillRoundedRect(popX + 280, popY + 65, 120, 28, 4, 51, 65, 85);
  c.drawText('SELECTION', popX + 305, popY + 73, 1.5, 203, 213, 225);

  // Converted Markdown Preview Box
  const boxX = popX + 20;
  const boxY = popY + 105;
  const boxW = popW - 40;
  const boxH = 210;

  c.fillRoundedRect(boxX, boxY, boxW, boxH, 6, 15, 23, 42);
  c.strokeRect(boxX, boxY, boxW, boxH, 51, 65, 85, 1);

  c.drawText('# SYSTEM ARCHITECTURE OVERVIEW', boxX + 15, boxY + 18, 1.8, 96, 165, 250);
  c.drawText('> SOURCE: HTTPS://EXAMPLE.COM/DOCS', boxX + 15, boxY + 45, 1.4, 148, 163, 184);
  c.fillRect(boxX + 15, boxY + 65, boxW - 30, 1, 51, 65, 85);

  c.drawText('MICROSERVICES ENABLE INDEPENDENT SERVICE DEPLOYMENT.', boxX + 15, boxY + 80, 1.4, 226, 232, 240);
  c.drawText('- HIGH MAINTAINABILITY AND CONTINUOUS TESTING', boxX + 15, boxY + 105, 1.4, 203, 213, 225);
  c.drawText('- ISOLATED FAULT TOLERANCE AND AUTO-SCALING', boxX + 15, boxY + 125, 1.4, 203, 213, 225);
  c.drawText('- CLEAN GFM TABLES AND SYNTAX CODE PRESERVATION', boxX + 15, boxY + 145, 1.4, 203, 213, 225);

  // Bottom action bar inside mockup
  c.fillRoundedRect(boxX, popY + 330, 200, 36, 6, 37, 99, 235);
  c.drawText('CONVERT TO MARKDOWN', boxX + 25, popY + 342, 1.5, 255, 255, 255);

  c.fillRoundedRect(boxX + 220, popY + 330, 110, 36, 6, 51, 65, 85);
  c.drawText('COPY MD', boxX + 245, popY + 342, 1.5, 255, 255, 255);

  c.fillRoundedRect(boxX + 345, popY + 330, 110, 36, 6, 51, 65, 85);
  c.drawText('DOWNLOAD', boxX + 365, popY + 342, 1.5, 255, 255, 255);

  return c.toPng();
}

// -------------------------------------------------------------
// ASSET 3: Screenshot 1 - Article Mode (1280 x 800)
// -------------------------------------------------------------
function buildScreenshotArticleMode() {
  const c = new CanvasBuffer(1280, 800);

  // Background desktop wallpaper
  for (let y = 0; y < 800; y++) {
    const factor = y / 800;
    const r = Math.round(15 + (26 - 15) * factor);
    const g = Math.round(23 + (38 - 23) * factor);
    const b = Math.round(42 + (64 - 42) * factor);
    c.fillRect(0, y, 1280, 1, r, g, b);
  }

  // Top banner explanation
  c.drawText('PAGESCRIBE: ARTICLE MODE EXTRACTION', 80, 50, 4, 255, 255, 255);
  c.drawText('ONE-CLICK CONVERSION - POWERED BY MOZILLA READABILITY & TURNDOWN', 80, 95, 2, 148, 163, 184);

  // Simulated browser window
  const winX = 80;
  const winY = 140;
  const winW = 1120;
  const winH = 600;

  c.fillRoundedRect(winX, winY, winW, winH, 12, 30, 41, 59);
  c.strokeRect(winX, winY, winW, winH, 51, 65, 85, 2);

  // Browser header bar
  c.fillRect(winX, winY, winW, 46, 15, 23, 42);
  c.fillRoundedRect(winX + 16, winY + 17, 12, 12, 6, 239, 68, 68);
  c.fillRoundedRect(winX + 36, winY + 17, 12, 12, 6, 245, 158, 11);
  c.fillRoundedRect(winX + 56, winY + 17, 12, 12, 6, 16, 185, 129);

  // URL bar in browser
  c.fillRoundedRect(winX + 90, winY + 10, 700, 26, 4, 30, 41, 59);
  c.drawText('HTTPS://EN.WIKIPEDIA.ORG/WIKI/MARKDOWN_GUIDE', winX + 105, winY + 17, 1.4, 203, 213, 225);

  // Page background behind extension
  c.fillRect(winX, winY + 46, winW, winH - 46, 248, 250, 252);

  // Webpage mock content (left side)
  c.drawText('WIKIPEDIA ARTICLE', winX + 40, winY + 80, 2.5, 15, 23, 42);
  c.drawText('MARKDOWN IS A LIGHTWEIGHT MARKUP LANGUAGE FOR CREATING FORMATTED TEXT...', winX + 40, winY + 115, 1.6, 71, 85, 105);
  c.drawText('IT IS WIDELY USED IN BLOGGING, INSTANT MESSAGING, AND KNOWLEDGE BASES.', winX + 40, winY + 140, 1.6, 71, 85, 105);
  c.fillRect(winX + 40, winY + 175, 450, 2, 226, 232, 240);
  c.drawText('HEADER 2: EXTENSIONS AND FLAVORS', winX + 40, winY + 195, 2, 15, 23, 42);
  c.drawText('COMMONMARK AND GITHUB FLAVORED MARKDOWN ADDED SPECIFICATIONS FOR TABLES...', winX + 40, winY + 225, 1.5, 71, 85, 105);

  // Active Extension Popup Open (Right Side)
  const popX = winX + 580;
  const popY = winY + 60;
  const popW = 500;
  const popH = 490;

  // Extension popup shadow
  c.fillRoundedRect(popX + 10, popY + 10, popW, popH, 12, 0, 0, 0, 120);

  // Extension popup container
  c.fillRoundedRect(popX, popY, popW, popH, 10, 15, 23, 42);
  c.strokeRect(popX, popY, popW, popH, 59, 130, 246, 2);

  // Popup Header
  c.fillRoundedRect(popX + 15, popY + 15, 28, 28, 6, 37, 99, 235);
  c.drawText('PAGESCRIBE', popX + 55, popY + 20, 2.2, 255, 255, 255);
  c.fillRoundedRect(popX + 210, popY + 20, 80, 18, 4, 37, 99, 235);
  c.drawText('TEXT-ONLY', popX + 220, popY + 24, 1.3, 255, 255, 255);

  // Page info card
  c.fillRoundedRect(popX + 15, popY + 55, popW - 30, 48, 6, 30, 41, 59);
  c.drawText('MARKDOWN - WIKIPEDIA', popX + 25, popY + 65, 1.7, 255, 255, 255);
  c.drawText('HTTPS://EN.WIKIPEDIA.ORG/WIKI/MARKDOWN', popX + 25, popY + 86, 1.2, 148, 163, 184);

  // Mode Tabs
  c.fillRoundedRect(popX + 15, popY + 115, popW - 30, 32, 6, 30, 41, 59);
  c.fillRoundedRect(popX + 18, popY + 118, 145, 26, 4, 37, 99, 235);
  c.drawText('ARTICLE MODE', popX + 42, popY + 125, 1.4, 255, 255, 255);
  c.drawText('FULL TEXT', popX + 205, popY + 125, 1.4, 203, 213, 225);
  c.drawText('SELECTION', popX + 355, popY + 125, 1.4, 203, 213, 225);

  // Rendered preview content area
  const boxX = popX + 15;
  const boxY = popY + 160;
  const boxW = popW - 30;
  const boxH = 230;

  c.fillRoundedRect(boxX, boxY, boxW, boxH, 6, 30, 41, 59);
  c.strokeRect(boxX, boxY, boxW, boxH, 51, 65, 85, 1);

  c.drawText('# MARKDOWN', boxX + 15, boxY + 18, 2, 96, 165, 250);
  c.drawText('> SOURCE: HTTPS://EN.WIKIPEDIA.ORG', boxX + 15, boxY + 45, 1.3, 148, 163, 184);
  c.fillRect(boxX + 15, boxY + 65, boxW - 30, 1, 51, 65, 85);

  c.drawText('MARKDOWN IS A LIGHTWEIGHT TEXT FORMATTING SYNTAX.', boxX + 15, boxY + 80, 1.3, 226, 232, 240);
  c.drawText('KEY DESIGN GOALS:', boxX + 15, boxY + 105, 1.3, 203, 213, 225);
  c.drawText('1. READABILITY IN RAW PLAIN-TEXT FORM', boxX + 15, boxY + 125, 1.3, 203, 213, 225);
  c.drawText('2. SIMPLE MAPPING TO VALID HTML ELEMENTS', boxX + 15, boxY + 145, 1.3, 203, 213, 225);
  c.drawText('3. ELIMINATES UNNECESSARY MEDIA AND AD BANNERS', boxX + 15, boxY + 165, 1.3, 203, 213, 225);

  // Counter bar
  c.drawText('1,248 WORDS * 8,420 CHARS (ARTICLE MODE)', boxX + 15, boxY + 205, 1.3, 148, 163, 184);

  // Action Buttons
  c.fillRoundedRect(boxX, popY + 405, 180, 36, 6, 37, 99, 235);
  c.drawText('CONVERT TO MARKDOWN', boxX + 18, popY + 417, 1.4, 255, 255, 255);

  c.fillRoundedRect(boxX + 195, popY + 405, 130, 36, 6, 51, 65, 85);
  c.drawText('COPY MARKDOWN', boxX + 210, popY + 417, 1.4, 255, 255, 255);

  c.fillRoundedRect(boxX + 340, popY + 405, 130, 36, 6, 51, 65, 85);
  c.drawText('DOWNLOAD .MD', boxX + 360, popY + 417, 1.4, 255, 255, 255);

  return c.toPng();
}

// -------------------------------------------------------------
// ASSET 4: Screenshot 2 - Raw Markdown Mode (1280 x 800)
// -------------------------------------------------------------
function buildScreenshotRawMode() {
  const c = new CanvasBuffer(1280, 800);

  // Background
  for (let y = 0; y < 800; y++) {
    const factor = y / 800;
    const r = Math.round(15 + (26 - 15) * factor);
    const g = Math.round(23 + (38 - 23) * factor);
    const b = Math.round(42 + (64 - 42) * factor);
    c.fillRect(0, y, 1280, 1, r, g, b);
  }

  c.drawText('PAGESCRIBE: RAW MARKDOWN & SYNTAX PRESERVATION', 80, 50, 4, 255, 255, 255);
  c.drawText('CLEAN GFM TABLES * FENCED CODE BLOCKS * ZERO IMAGES * INSTANT EXPORT', 80, 95, 2, 148, 163, 184);

  // Main Card
  const winX = 80;
  const winY = 140;
  const winW = 1120;
  const winH = 600;

  c.fillRoundedRect(winX, winY, winW, winH, 12, 15, 23, 42);
  c.strokeRect(winX, winY, winW, winH, 51, 65, 85, 2);

  // Subheader
  c.fillRect(winX, winY, winW, 46, 30, 41, 59);
  c.drawText('MODE: RAW MARKDOWN SOURCE INSPECTION', winX + 25, winY + 16, 1.8, 255, 255, 255);

  // Code textarea mockup
  const codeX = winX + 30;
  const codeY = winY + 70;
  const codeW = winW - 60;
  const codeH = 440;

  c.fillRoundedRect(codeX, codeY, codeW, codeH, 8, 11, 17, 32);
  c.strokeRect(codeX, codeY, codeW, codeH, 51, 65, 85, 1);

  const lines = [
    '# Microservices Architecture Reference',
    '',
    '> **Source:** [https://example.com/microservices](https://example.com/microservices)',
    '> **Captured:** 2026-10-31T15:00:00.000Z',
    '',
    '---',
    '',
    'Microservices structure an application as independently deployable services.',
    '',
    '```javascript',
    'export async function fetchCatalog(serviceRegistry) {',
    '  const endpoints = await serviceRegistry.lookup("catalog-service");',
    '  return endpoints.map(e => e.url);',
    '}',
    '```',
    '',
    '| Feature | Monolith | Microservices |',
    '| --- | --- | --- |',
    '| Deployment | Single Artifact | Independent Pipeline |',
    '| Fault Isolation | Shared Process | Service Level Resiliency |',
    '| Data Storage | Shared Database | Database per Service |',
    '',
    '### Key Benefits',
    '- Continuous delivery and rapid iteration',
    '- Polyglot technology stacks across services',
    '- Strict text-only documentation without image bloat'
  ];

  lines.forEach((line, idx) => {
    c.drawText(line, codeX + 25, codeY + 20 + idx * 16, 1.4, idx === 0 ? 96 : 203, idx === 0 ? 165 : 213, idx === 0 ? 250 : 225);
  });

  // Bottom action bar
  c.fillRoundedRect(codeX, winY + 530, 200, 36, 6, 37, 99, 235);
  c.drawText('COPY MARKDOWN', codeX + 35, winY + 542, 1.5, 255, 255, 255);

  c.fillRoundedRect(codeX + 220, winY + 530, 200, 36, 6, 16, 185, 129);
  c.drawText('DOWNLOAD .MD FILE', codeX + 245, winY + 542, 1.5, 255, 255, 255);

  return c.toPng();
}

// -------------------------------------------------------------
// ASSET 5: Screenshot 3 - Settings Page (1280 x 800)
// -------------------------------------------------------------
function buildScreenshotSettingsPage() {
  const c = new CanvasBuffer(1280, 800);

  for (let y = 0; y < 800; y++) {
    const factor = y / 800;
    const r = Math.round(15 + (26 - 15) * factor);
    const g = Math.round(23 + (38 - 23) * factor);
    const b = Math.round(42 + (64 - 42) * factor);
    c.fillRect(0, y, 1280, 1, r, g, b);
  }

  c.drawText('PAGESCRIBE: SETTINGS & PRIVACY CONTROLS', 80, 50, 4, 255, 255, 255);
  c.drawText('PERSONALIZE FORMATTING PREFERENCES, METADATA HEADERS, AND THEMES', 80, 95, 2, 148, 163, 184);

  const winX = 80;
  const winY = 140;
  const winW = 1120;
  const winH = 600;

  c.fillRoundedRect(winX, winY, winW, winH, 12, 15, 23, 42);
  c.strokeRect(winX, winY, winW, winH, 51, 65, 85, 2);

  c.fillRect(winX, winY, winW, 46, 30, 41, 59);
  c.drawText('CHROME-EXTENSION://PAGESCRIBE/OPTIONS/OPTIONS.HTML', winX + 25, winY + 16, 1.6, 203, 213, 225);

  // Settings Cards Container
  const sX = winX + 80;
  const sY = winY + 70;
  const sW = winW - 160;

  // Header
  c.drawText('PAGESCRIBE SETTINGS', sX, sY + 10, 2.5, 255, 255, 255);
  c.drawText('CONFIGURE YOUR TEXT-ONLY CONVERSION PREFERENCES', sX, sY + 40, 1.4, 148, 163, 184);

  // Card 1: Extraction & Headers
  c.fillRoundedRect(sX, sY + 70, sW, 150, 8, 30, 41, 59);
  c.strokeRect(sX, sY + 70, sW, 150, 51, 65, 85, 1);

  c.drawText('EXTRACTION STRATEGY & METADATA', sX + 20, sY + 90, 1.8, 96, 165, 250);
  c.drawText('DEFAULT EXTRACTION MODE: ARTICLE MODE (MOZILLA READABILITY)', sX + 20, sY + 120, 1.5, 255, 255, 255);
  c.drawText('[X] INCLUDE WEBPAGE TITLE AS H1 HEADING', sX + 20, sY + 145, 1.5, 52, 211, 153);
  c.drawText('[X] INCLUDE SOURCE URL ATTRIBUTION HEADER', sX + 20, sY + 170, 1.5, 52, 211, 153);
  c.drawText('[ ] INCLUDE CAPTURE TIMESTAMP', sX + 20, sY + 195, 1.5, 148, 163, 184);

  // Card 2: Formatting Rules
  c.fillRoundedRect(sX, sY + 240, sW, 150, 8, 30, 41, 59);
  c.strokeRect(sX, sY + 240, sW, 150, 51, 65, 85, 1);

  c.drawText('MARKDOWN FORMATTING RULES', sX + 20, sY + 260, 1.8, 96, 165, 250);
  c.drawText('[X] PRESERVE HYPERLINKS IN MARKDOWN SYNTAX', sX + 20, sY + 290, 1.5, 52, 211, 153);
  c.drawText('[X] PRESERVE GFM TABLES', sX + 20, sY + 315, 1.5, 52, 211, 153);
  c.drawText('[X] PRESERVE FENCED CODE BLOCKS AND SYNTAX LANGUAGES', sX + 20, sY + 340, 1.5, 52, 211, 153);
  c.drawText('[X] COLLAPSE EXCESSIVE BLANK LINES', sX + 20, sY + 365, 1.5, 52, 211, 153);

  // Footer privacy banner
  c.fillRoundedRect(sX, sY + 410, sW, 55, 8, 6, 78, 59);
  c.strokeRect(sX, sY + 410, sW, 55, 16, 185, 129, 1);
  c.drawText('PAGESCRIBE OPERATES 100% LOCALLY IN YOUR BROWSER.', sX + 20, sY + 425, 1.5, 255, 255, 255);
  c.drawText('NO WEB REQUESTS, EXTERNAL AI APIS, OR DATA TELEMETRY OCCUR.', sX + 20, sY + 445, 1.3, 167, 243, 208);

  return c.toPng();
}

console.log('Generating Chrome Web Store Promotional Assets...');

// 1. Copy Store Icon 128x128
const iconSrc = path.join(__dirname, '..', 'icons', 'icon128.png');
const iconDst = path.join(storeDir, 'store-icon-128.png');
fs.copyFileSync(iconSrc, iconDst);
console.log('✓ store-assets/store-icon-128.png (128x128)');

// 2. Small Promo Tile (440x280)
const smallPromo = buildSmallPromoTile();
fs.writeFileSync(path.join(storeDir, 'promo-small-440x280.png'), smallPromo);
console.log(`✓ store-assets/promo-small-440x280.png (440x280, ${smallPromo.length} bytes)`);

// 3. Marquee Banner (1400x560)
const marquee = buildMarqueeBanner();
fs.writeFileSync(path.join(storeDir, 'promo-marquee-1400x560.png'), marquee);
console.log(`✓ store-assets/promo-marquee-1400x560.png (1400x560, ${marquee.length} bytes)`);

// 4. Screenshots (1280x800)
const ss1 = buildScreenshotArticleMode();
fs.writeFileSync(path.join(storeDir, 'screenshot-1-article-mode.png'), ss1);
console.log(`✓ store-assets/screenshot-1-article-mode.png (1280x800, ${ss1.length} bytes)`);

const ss2 = buildScreenshotRawMode();
fs.writeFileSync(path.join(storeDir, 'screenshot-2-raw-mode.png'), ss2);
console.log(`✓ store-assets/screenshot-2-raw-mode.png (1280x800, ${ss2.length} bytes)`);

const ss3 = buildScreenshotSettingsPage();
fs.writeFileSync(path.join(storeDir, 'screenshot-3-settings.png'), ss3);
console.log(`✓ store-assets/screenshot-3-settings.png (1280x800, ${ss3.length} bytes)`);

console.log('\n🎉 All Chrome Web Store promotional assets generated in store-assets/');
