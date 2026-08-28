import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

/**
 * Generates assets/logo_white.png — a pure-white, alpha-preserved version
 * of assets/logo.png, for use on dark backgrounds (email header, invoice
 * header, dark-mode navbar).
 *
 * Uses `pngjs` for decoding/encoding so PNG scanline filtering (Sub/Up/
 * Average/Paeth) is handled correctly. An earlier hand-rolled version of
 * this script edited raw (still-filtered) IDAT bytes directly, which
 * corrupted almost every pixel and produced visible RGB speckling in the
 * output logo.
 */
function createWhiteLogo() {
  const inputPath = path.join(process.cwd(), 'assets', 'logo.png');
  const outputPath = path.join(process.cwd(), 'assets', 'logo_white.png');

  if (!fs.existsSync(inputPath)) {
    console.error('Source logo not found at', inputPath);
    return;
  }

  const src = fs.readFileSync(inputPath);
  const png = PNG.sync.read(src);

  const { width, height, data } = png; // data is a fully decoded RGBA buffer

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    const alpha = data[idx + 3];
    if (alpha > 0) {
      data[idx] = 255;     // R
      data[idx + 1] = 255; // G
      data[idx + 2] = 255; // B
      // alpha untouched — preserves the original silhouette/anti-aliasing
    }
  }

  const outPng = new PNG({ width, height });
  data.copy(outPng.data);

  const outBuffer = PNG.sync.write(outPng);
  fs.writeFileSync(outputPath, outBuffer);
  console.log(`✅ Created white transparent logo at ${outputPath} (${outBuffer.length} bytes)`);
}

createWhiteLogo();
