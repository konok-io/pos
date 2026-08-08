// Script to convert SVG to ICO
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public/icon.svg');
const icoPath = path.join(__dirname, 'public/icon.ico');

// ICO file sizes (standard Windows icon sizes)
const sizes = [16, 24, 32, 48, 64, 128, 256];

async function convertToIco() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Generate PNG files for each size
    const pngBuffers = [];
    
    for (const size of sizes) {
      const pngBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();
      pngBuffers.push({ size, buffer: pngBuffer });
    }
    
    // Create ICO file
    // ICO header
    const header = Buffer.alloc(6);
    header.writeUInt16LE(0, 0);      // Reserved
    header.writeUInt16LE(1, 2);      // Type (1 = ICO)
    header.writeUInt16LE(pngBuffers.length, 4);  // Number of images
    
    // Directory entries and image data
    const entries = [];
    let dataOffset = 6 + (pngBuffers.length * 16);  // After header and directory
    
    for (const { size, buffer } of pngBuffers) {
      const entry = Buffer.alloc(16);
      entry.writeUInt8(size < 256 ? size : 0, 0);  // Width
      entry.writeUInt8(size < 256 ? size : 0, 1);  // Height
      entry.writeUInt8(0, 2);        // Color palette
      entry.writeUInt8(0, 3);        // Reserved
      entry.writeUInt16LE(1, 4);     // Color planes
      entry.writeUInt16LE(32, 6);    // Bits per pixel
      entry.writeUInt32LE(buffer.length, 8);  // Size of image data
      entry.writeUInt32LE(dataOffset, 12);  // Offset of image data
      
      entries.push(entry);
      dataOffset += buffer.length;
    }
    
    // Combine all parts
    const icoBuffer = Buffer.concat([
      header,
      ...entries,
      ...pngBuffers.map(p => p.buffer)
    ]);
    
    // Write ICO file
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('✅ Icon converted successfully: public/icon.ico');
    
  } catch (error) {
    console.error('❌ Error converting icon:', error);
    process.exit(1);
  }
}

convertToIco();
