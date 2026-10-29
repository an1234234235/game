import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Minimal pure Node PNG generator
function createPng(width, height, getPixel) {
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(height * rowSize);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData);

  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }

  const table = (() => {
    let c;
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c;
    }
    return t;
  })();

  function chunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcVal = crc32(crcBuf);
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  // PNG Header
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', deflated);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// Draw Lanternfall golden lantern emblem
function renderLanternPixel(x, y, w, h, isMaskable = false) {
  const nx = (x / w) * 2 - 1; // -1 to 1
  const ny = (y / h) * 2 - 1;

  // Background
  const distCenter = Math.sqrt(nx * nx + ny * ny);

  // Border & background dark emerald / slate
  let r = 17, g = 23, b = 22, a = 255;

  if (distCenter < 0.88) {
    // Ambient lantern glow gradient
    const glow = Math.max(0, 1 - distCenter / 0.8);
    r = Math.min(255, Math.floor(17 + 70 * glow));
    g = Math.min(255, Math.floor(23 + 60 * glow));
    b = Math.min(255, Math.floor(22 + 25 * glow));
  }

  // Outer gold rim
  if (distCenter > 0.82 && distCenter < 0.90 && !isMaskable) {
    r = 213; g = 182; b = 108; // Gold #d5b66c
  }

  // Lantern shape in center
  const scale = isMaskable ? 0.45 : 0.55;
  const lx = nx / scale;
  const ly = ny / scale;

  // Lantern cap / roof (trapezoid at top)
  if (ly >= -0.65 && ly <= -0.4 && Math.abs(lx) <= (ly + 0.65) * 1.5 + 0.15) {
    r = 226; g = 199; b = 123;
  }
  // Lantern ring on top
  if (ly >= -0.85 && ly < -0.65 && Math.abs(lx) <= 0.15) {
    r = 213; g = 182; b = 108;
  }
  // Lantern glass body
  if (ly > -0.4 && ly < 0.45 && Math.abs(lx) < 0.45) {
    // Glass frame struts
    if (Math.abs(lx) > 0.38 || Math.abs(lx) < 0.05) {
      r = 180; g = 150; b = 90;
    } else {
      // Fire inside lantern
      const flameDist = Math.sqrt(lx * lx + (ly - 0.05) * (ly - 0.05));
      if (flameDist < 0.28) {
        const fireIntensity = Math.max(0, 1 - flameDist / 0.28);
        r = 255;
        g = Math.floor(220 * fireIntensity + 100);
        b = Math.floor(80 * fireIntensity);
      } else {
        r = 50; g = 58; b = 48;
      }
    }
  }
  // Lantern base
  if (ly >= 0.45 && ly <= 0.65 && Math.abs(lx) <= 0.5 - (ly - 0.45) * 0.5) {
    r = 213; g = 182; b = 108;
  }

  return [r, g, b, a];
}

const outDir = path.resolve(process.cwd(), 'public');

// 1. Generate 192x192
const pwa192 = createPng(192, 192, (x, y, w, h) => renderLanternPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), pwa192);

// 2. Generate 512x512
const pwa512 = createPng(512, 512, (x, y, w, h) => renderLanternPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), pwa512);

// 3. Generate maskable 512x512
const maskable512 = createPng(512, 512, (x, y, w, h) => renderLanternPixel(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'maskable-icon-512x512.png'), maskable512);

// 4. Generate apple-touch-icon 180x180
const apple180 = createPng(180, 180, (x, y, w, h) => renderLanternPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), apple180);

console.log('Successfully generated PWA PNG icons!');
