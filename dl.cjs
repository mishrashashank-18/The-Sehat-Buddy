const fs = require('fs');
const path = require('path');
const https = require('https');

const filepath = path.join(__dirname, 'src', 'assets', 'images', 'hero-main.jpg');

https.get('https://picsum.photos/seed/family/1000/750', (res) => {
  if (res.statusCode === 301 || res.statusCode === 302) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(fs.createWriteStream(filepath));
    });
  } else {
    res.pipe(fs.createWriteStream(filepath));
  }
});
