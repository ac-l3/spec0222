const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');
const outputDir = path.join(__dirname, 'public', 'images', 'optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all PNG files
const imageFiles = fs.readdirSync(imagesDir)
  .filter(file => file.endsWith('.png') && !file.startsWith('optimized-') && !file.startsWith('compressed-'));

console.log(`Found ${imageFiles.length} PNG files to optimize`);

// Process each image
async function processImages() {
  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(outputDir, file);
    
    console.log(`Optimizing: ${file}`);
    
    try {
      await sharp(inputPath)
        .resize(1200) // Resize to max width of 1200px
        .png({ quality: 80, compressionLevel: 9 }) // High compression
        .toFile(outputPath);
      
      // Get file sizes for comparison
      const originalSize = fs.statSync(inputPath).size;
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);
      
      console.log(`${file}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (${reduction}% reduction)`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }
}

processImages().then(() => {
  console.log('Image optimization complete!');
}); 