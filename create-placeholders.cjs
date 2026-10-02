const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'assets', 'images');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1x1 transparent PNG base64
const dummyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const files = [
  'hero-family.jpg',
  'doctor-hero.jpg',
  'doctor-1.jpg',
  'doctor-2.jpg',
  'doctor-3.jpg',
  'doctor-4.jpg',
  'article-1.jpg',
  'article-2.jpg',
  'article-3.jpg',
  'article-4.jpg'
];

files.forEach(file => {
  fs.writeFileSync(path.join(dir, file), dummyPng);
});

console.log('Placeholder images created.');
