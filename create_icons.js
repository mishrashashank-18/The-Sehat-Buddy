const fs = require('fs');
const path = require('path');

const icons = {
  'flask.svg': \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <!-- Flask Outline -->
    <path d="M 40 10 L 60 10 L 60 35 L 85 80 A 10 10 0 0 1 75 95 L 25 95 A 10 10 0 0 1 15 80 L 40 35 Z" fill="none" stroke="#2C3E50" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <!-- Flask Lip -->
    <rect x="35" y="8" width="30" height="6" rx="3" fill="#2C3E50"/>
    <!-- Purple Liquid -->
    <path d="M 33 48 L 67 48 L 82.5 76 A 7 7 0 0 1 75 88 L 25 88 A 7 7 0 0 1 17.5 76 Z" fill="#800080"/>
    <!-- Bubbles -->
    <circle cx="45" cy="80" r="3" fill="white"/>
    <circle cx="55" cy="70" r="4" fill="white"/>
    <circle cx="40" cy="60" r="5" fill="white"/>
  </svg>\,
  'surgery.svg': \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <!-- Scalpel/Scissors Cross -->
    <!-- Handle 1 -->
    <circle cx="30" cy="80" r="10" fill="none" stroke="#E74C3C" stroke-width="6"/>
    <!-- Blade 1 -->
    <path d="M 37 73 L 80 20 L 85 25 Z" fill="#E74C3C"/>
    <!-- Handle 2 -->
    <circle cx="70" cy="80" r="10" fill="none" stroke="#E74C3C" stroke-width="6"/>
    <!-- Blade 2 -->
    <path d="M 63 73 L 20 20 L 15 25 Z" fill="#E74C3C"/>
    <!-- Pivot -->
    <circle cx="50" cy="50" r="4" fill="#2C3E50"/>
  </svg>\,
  'elderly.svg': \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <!-- Walking Cane -->
    <path d="M 60 90 L 60 40 A 15 15 0 0 0 30 40 L 30 50" fill="none" stroke="#E67E22" stroke-width="6" stroke-linecap="round"/>
    <rect x="25" y="47" width="10" height="6" rx="2" fill="#E67E22"/>
    <!-- Heart shape background minimal -->
    <path d="M 50 30 A 10 10 0 0 0 30 30 A 10 10 0 0 0 50 50 A 10 10 0 0 0 70 30 A 10 10 0 0 0 50 30" fill="#F39C12" opacity="0.3"/>
    <!-- Glasses -->
    <circle cx="40" cy="65" r="8" fill="none" stroke="#E67E22" stroke-width="3"/>
    <circle cx="65" cy="65" r="8" fill="none" stroke="#E67E22" stroke-width="3"/>
    <path d="M 48 65 L 57 65" fill="none" stroke="#E67E22" stroke-width="3"/>
  </svg>\,
  'women.svg': \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <!-- Female Symbol -->
    <circle cx="50" cy="40" r="20" fill="none" stroke="#E0457B" stroke-width="6"/>
    <path d="M 50 60 L 50 90 M 35 75 L 65 75" fill="none" stroke="#E0457B" stroke-width="6" stroke-linecap="round"/>
    <!-- Flower Accent -->
    <circle cx="65" cy="25" r="5" fill="#FDE8EF"/>
    <circle cx="75" cy="25" r="5" fill="#FDE8EF"/>
    <circle cx="70" cy="20" r="5" fill="#FDE8EF"/>
    <circle cx="70" cy="30" r="5" fill="#FDE8EF"/>
    <circle cx="70" cy="25" r="3" fill="#E0457B"/>
  </svg>\,
  'kid.svg': \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <!-- Baby Face -->
    <circle cx="50" cy="50" r="35" fill="#EAF6F2" stroke="#1E9E6A" stroke-width="4"/>
    <!-- Hair lock -->
    <path d="M 40 15 Q 50 5 60 15 Q 55 25 50 20 Q 45 25 40 15 Z" fill="#1E9E6A"/>
    <!-- Eyes -->
    <circle cx="35" cy="45" r="4" fill="#1E9E6A"/>
    <circle cx="65" cy="45" r="4" fill="#1E9E6A"/>
    <!-- Smile -->
    <path d="M 40 65 Q 50 75 60 65" fill="none" stroke="#1E9E6A" stroke-width="4" stroke-linecap="round"/>
    <!-- Pacifier/Cheeks -->
    <circle cx="30" cy="55" r="5" fill="#FBD9E7" opacity="0.6"/>
    <circle cx="70" cy="55" r="5" fill="#FBD9E7" opacity="0.6"/>
  </svg>\
};

const dir = path.join('src', 'assets', 'images', 'icons');
for (const [filename, content] of Object.entries(icons)) {
  fs.writeFileSync(path.join(dir, filename), content);
}
console.log('SVGs created successfully.');
