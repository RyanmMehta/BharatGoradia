// Regenerates public/og-default.png, the default social sharing image (1200×630).
// Run: node scripts/make-social-image.mjs "Name" "Descriptor"
import sharp from 'sharp';

const [name = 'Bharat Goradia', descriptor = 'Bollywood Artist Promotion & Celebrity Events'] = process.argv.slice(2);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#FAF7F0"/>
  <rect x="28" y="28" width="1144" height="574" fill="none" stroke="#A98445" stroke-width="2"/>
  <rect x="90" y="250" width="90" height="4" fill="#A98445"/>
  <text x="90" y="230" font-family="Georgia, serif" font-size="92" font-weight="700" fill="#202020">${esc(name)}</text>
  <text x="90" y="330" font-family="Georgia, serif" font-size="44" fill="#6E2032">${esc(descriptor)}</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
console.log('Wrote public/og-default.png');
