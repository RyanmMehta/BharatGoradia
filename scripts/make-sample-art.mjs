// Generates the abstract "stage light" sample artwork used in place of real photos and video
// covers until approved media is added. Deliberately abstract: it must never pass for a real photo.
// Run: node scripts/make-sample-art.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const palettes = [
  ['#1a0f22', '#5a1446', '#ff8fb5'],
  ['#120b19', '#3d1752', '#ffb23f'],
  ['#21082a', '#8a1554', '#ffd89a'],
  ['#0f0b14', '#14403f', '#3dd6c3'],
  ['#1c0a1f', '#6b1630', '#ffb23f'],
  ['#0d0a15', '#2c1a5c', '#ff7aa8'],
];

function rand(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function art({ w, h, seed, palette }) {
  const r = rand(seed * 7919 + 13);
  const [top, bottom, light] = palettes[palette % palettes.length];
  const beams = Array.from({ length: 3 }, (_, i) => {
    const x = w * (0.2 + 0.3 * i + (r() - 0.5) * 0.15);
    const spread = w * (0.18 + r() * 0.12);
    return `<polygon points="${x - w * 0.015},0 ${x + w * 0.015},0 ${x + spread},${h} ${x - spread},${h}" fill="url(#beam)" opacity="${(0.2 + r() * 0.2).toFixed(2)}"/>`;
  }).join('');
  const bokeh = Array.from({ length: 14 }, () => {
    const cx = (r() * w).toFixed(0);
    const cy = (h * (0.45 + r() * 0.55)).toFixed(0);
    const rad = (Math.min(w, h) * (0.012 + r() * 0.035)).toFixed(0);
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${light}" opacity="${(0.12 + r() * 0.3).toFixed(2)}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2d6" stop-opacity=".6"/><stop offset="1" stop-color="#fff6e3" stop-opacity="0"/></linearGradient>
<radialGradient id="glow" cx=".5" cy="1" r=".75"><stop offset="0" stop-color="${light}" stop-opacity=".55"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
${beams}
<rect width="${w}" height="${h}" fill="url(#glow)"/>
${bokeh}
<rect width="${w}" height="${h}" filter="url(#grain)" opacity=".07"/>
</svg>
`;
}

const out = (path, opts) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, art(opts));
};

for (let i = 1; i <= 6; i++)
  out(`src/assets/photos/placeholder-photo-${i}/image.svg`, { w: 1500, h: i === 2 ? 1875 : 1000, seed: i + 10, palette: i });
console.log('Sample artwork written.');
