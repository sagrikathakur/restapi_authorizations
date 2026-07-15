const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'solar-system3D', 'image');
const destDir = path.join(__dirname, 'assets');

const filesToCopy = ['saturn_ring.png', 'uranus_ring.png'];

console.log('Copying assets...');
filesToCopy.forEach(file => {
  const srcFile = path.join(srcDir, file);
  const destFile = path.join(destDir, file);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, destFile);
    console.log(`Successfully copied ${file} to assets/`);
  } else {
    console.error(`Source file not found: ${srcFile}`);
  }
});
