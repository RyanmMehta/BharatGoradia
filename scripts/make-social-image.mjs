// Regenerates public/og-default.png, the default social sharing image (1200×630).
// Run: node scripts/make-social-image.mjs "Name" "Descriptor"
import sharp from 'sharp';

const [name = 'Bharat Goradia', descriptor = 'Bollywood Artist Promotion & Celebrity Events'] = process.argv.slice(2);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#F7F1E6"/>
  <rect width="1200" height="8" fill="#A3171D"/>
  <path d="M860 630V250C860 160 950 110 1010 80c60 30 150 80 150 170v380z" fill="#7A0E13"/>
  <path d="M840 630V270C840 180 930 130 990 100c60 30 150 80 150 170v360" fill="none" stroke="#E9A23B" stroke-width="4"/>
  <text x="80" y="170" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="5" fill="#A3171D">V INTERNATIONAL PRESENTS</text>
  <text x="76" y="300" font-family="Georgia, serif" font-size="130" fill="#1B1512">${esc(name.split(' ')[0])}</text>
  <text x="76" y="420" font-family="Georgia, serif" font-size="130" fill="#A3171D">${esc(name.split(' ').slice(1).join(' '))}</text>
  <rect x="80" y="466" width="6" height="96" fill="#E9A23B"/>
  <text x="108" y="503" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="700" fill="#1B1512">${esc(descriptor.split(' & ')[0])}</text>
  <text x="108" y="547" font-family="Helvetica, Arial, sans-serif" font-size="32" font-weight="700" fill="#1B1512">${descriptor.includes(' & ') ? '&amp; ' + esc(descriptor.split(' & ').slice(1).join(' & ')) : ''}</text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile('public/og-default.png');
console.log('Wrote public/og-default.png');
