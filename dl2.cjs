const fs = require('fs');
const path = require('path');
const https = require('https');

const download = (url, filepath) => {
  https.get(url, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      https.get(res.headers.location, (res2) => {
        res2.pipe(fs.createWriteStream(filepath));
      });
    } else {
      res.pipe(fs.createWriteStream(filepath));
    }
  });
};

download('https://picsum.photos/seed/doctor2/300/300', path.join(__dirname, 'src', 'assets', 'images', 'doctor-2.jpg'));
download('https://picsum.photos/seed/family2/1000/750', path.join(__dirname, 'src', 'assets', 'images', 'hero-family.jpg'));
