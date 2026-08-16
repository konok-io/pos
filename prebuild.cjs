const fs = require('fs');
const path = require('path');

fs.mkdirSync('public/api', {recursive: true});
fs.readdirSync('api').forEach(f => {
  if (f !== 'README.md' && f !== 'database.sql') {
    const src = path.join('api', f);
    const dst = path.join('public/api', f);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dst, {recursive: true});
    } else {
      fs.copyFileSync(src, dst);
    }
  }
});
console.log('API files copied to public/api');
