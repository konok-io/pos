const fs = require('fs');
const path = require('path');

function copyDir(src, dst) {
  fs.mkdirSync(dst, {recursive: true});
  fs.readdirSync(src).forEach(f => {
    const srcPath = path.join(src, f);
    const dstPath = path.join(dst, f);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  });
}

// Copy assets to dist
if (fs.existsSync('public/api')) copyDir('public/api', 'dist/api');
if (fs.existsSync('public/fonts')) copyDir('public/fonts', 'dist/fonts');
if (fs.existsSync('public/favicon.svg')) fs.copyFileSync('public/favicon.svg', 'dist/favicon.svg');
if (fs.existsSync('.htaccess')) fs.copyFileSync('.htaccess', 'dist/.htaccess');
if (fs.existsSync('public/icon.ico')) fs.copyFileSync('public/icon.ico', 'dist/icon.ico');
if (fs.existsSync('public/icon.svg')) fs.copyFileSync('public/icon.svg', 'dist/icon.svg');

// Copy built index.html to root (for production server)
if (fs.existsSync('dist/src/index.html')) {
  fs.copyFileSync('dist/src/index.html', 'index.html');
}

console.log('Post-build assets copied');
