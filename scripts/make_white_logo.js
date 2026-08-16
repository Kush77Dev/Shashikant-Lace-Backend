import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createWhiteLogo() {
  const inputPath = path.join(process.cwd(), 'assets', 'logo.png');
  const outputPath = path.join(process.cwd(), 'assets', 'logo_white.png');

  if (!fs.existsSync(inputPath)) return;

  const buffer = fs.readFileSync(inputPath);
  
  // PNG signature check
  if (buffer.readUInt32BE(0) !== 0x89504e47) {
    console.error('Not a valid PNG file');
    return;
  }

  let offset = 8;
  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    
    if (type === 'IHDR') {
      width = buffer.readUInt32BE(offset + 8);
      height = buffer.readUInt32BE(offset + 12);
      bitDepth = buffer[offset + 16];
      colorType = buffer[offset + 17];
    } else if (type === 'IDAT') {
      idatChunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }

  if (colorType !== 6 || bitDepth !== 8) {
    // Fallback: copy original if not standard 8-bit RGBA
    fs.copyFileSync(inputPath, outputPath);
    console.log('Copied original logo as fallback.');
    return;
  }

  const compressedData = Buffer.concat(idatChunks);
  const decompressed = zlib.inflateSync(compressedData);

  const bytesPerPixel = 4;
  const scanlineLength = 1 + width * bytesPerPixel;
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * scanlineLength;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * bytesPerPixel;
      const alpha = decompressed[px + 3];
      if (alpha > 0) {
        // Change color to pure white while preserving alpha
        decompressed[px] = 255;     // R
        decompressed[px + 1] = 255; // G
        decompressed[px + 2] = 255; // B
      }
    }
  }

  const recompressed = zlib.deflateSync(decompressed);

  // Helper CRC32
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function calcCRC(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(typeStr, dataBuf) {
    const typeBuf = Buffer.from(typeStr, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(dataBuf.length, 0);
    const combined = Buffer.concat([typeBuf, dataBuf]);
    const crcVal = calcCRC(combined);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([lenBuf, combined, crcBuf]);
  }

  // Build new PNG
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = bitDepth;
  ihdrData[9] = colorType;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', recompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const newPng = Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outputPath, newPng);
  console.log(`✅ Created white transparent logo at ${outputPath} (${newPng.length} bytes)`);
}

createWhiteLogo();
