// Content readiness check (PRD §19, AC-03, AC-12, AC-14).
//   npm run check:content            report what still blocks launch (always exits 0)
//   SITE_MODE=launch npm run build   runs this first and stops the build if anything blocks launch
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const launch = process.env.SITE_MODE === 'launch' || process.argv.includes('--launch');
const root = new URL('..', import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const collection = (name) => {
  const dir = join(root, 'src/content', name);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => ({ id: f.replace(/\.json$/, ''), ...read(`src/content/${name}/${f}`) }));
};

const blockers = [];
const notes = [];
const block = (msg) => blockers.push(msg);
const note = (msg) => notes.push(msg);

// Site settings and contact destinations
const settings = read('src/data/settings.json');
// Facebook and YouTube are optional: an empty link hides them, so they need no confirmation.
const hidden = (key) => ['facebook', 'youtube'].includes(key) && !settings[key]?.url;
const phoneHidden = !settings.phone?.show;
for (const [key, ok] of Object.entries(settings.confirmed ?? {}))
  if (!ok && !hidden(key) && !(key === 'phone' && phoneHidden)) block(`Settings: "${key}" has not been confirmed by the owner.`);
if (/example\.(com|org)$/i.test(settings.email)) block('Settings: email address is still a placeholder.');
const genericProfile = /^https?:\/\/(www\.)?(instagram|facebook|youtube)\.com\/?$/i;
if (!settings.instagram?.url || genericProfile.test(settings.instagram.url)) block('Settings: Instagram link is not a specific profile.');
for (const [key, label] of [
  ['facebook', 'Facebook'],
  ['youtube', 'YouTube'],
]) {
  const url = settings[key]?.url;
  if (!url) note(`Settings: no ${label} link, so ${label} is not shown.`);
  else if (genericProfile.test(url)) block(`Settings: ${label} link is not a specific page.`);
}
if (settings.phone?.show && !settings.phone?.tel) block('Settings: telephone is switched on but has no number.');

// Collections
const all = Object.fromEntries(
  ['photos', 'videos', 'services', 'awards', 'testimonials', 'press'].map((n) => [n, collection(n)]),
);
const isLive = (c, e) => {
  if (e.status !== 'published' || e.placeholder) return false;
  if (c === 'photos' || c === 'videos') return e.rights === 'approved';
  if (c === 'awards') return e.evidence?.wordingApproved && e.evidence?.sources?.length > 0;
  if (c === 'testimonials') return e.approval?.approved;
  return true;
};
for (const [c, entries] of Object.entries(all)) {
  for (const e of entries) {
    if (e.status !== 'published') continue;
    if (e.placeholder) block(`${c}/${e.id}: published placeholder (replace it or set it to draft).`);
    else if (!isLive(c, e)) {
      if (c === 'awards') note(`${c}/${e.id}: published but hidden until evidence is added and wording is approved.`);
      else if (c === 'testimonials') note(`${c}/${e.id}: published but hidden until the quote is approved.`);
      else note(`${c}/${e.id}: published but hidden until permission to use is approved.`);
    }
  }
}

// Homepage selections
const home = read('src/data/homepage.json');
if (home.hero?.placeholder) block('Homepage: the opening portrait is a placeholder.');
const checkRefs = (label, c, ids, min, max) => {
  const live = (ids ?? []).filter((id) => {
    const e = all[c].find((x) => x.id === id);
    if (!e) {
      block(`Homepage ${label}: "${id}" does not exist.`);
      return false;
    }
    return isLive(c, e);
  });
  if (live.length < min) note(`Homepage ${label}: ${live.length} ready for the public (target ${min}${max ? `–${max}` : '+'}).`);
};
checkRefs('photos', 'photos', home.artistPhotos, 6, 8);
checkRefs('videos', 'videos', home.featuredVideos, 3, 3);
checkRefs('awards', 'awards', home.awards, 1, 4);
checkRefs('testimonials', 'testimonials', home.testimonials, 3);
if (home.introVideo && !all.videos.some((v) => v.id === home.introVideo)) block(`Homepage: introduction video "${home.introVideo}" does not exist.`);
const liveServices = all.services.filter((s) => isLive('services', s)).length;
if (liveServices === 0) block('Services: no approved service descriptions are published.');

console.log(`Content check (${launch ? 'launch' : 'prototype'} mode)\n`);
if (blockers.length) console.log(`Launch blockers (${blockers.length}):\n` + blockers.map((b) => `  ✗ ${b}`).join('\n') + '\n');
if (notes.length) console.log(`Notes (${notes.length}):\n` + notes.map((n) => `  • ${n}`).join('\n') + '\n');
if (!blockers.length && !notes.length) console.log('Everything is ready for launch.');
if (launch && blockers.length) {
  console.error('Launch build stopped: resolve the blockers above, or build in prototype mode.');
  process.exit(1);
}
