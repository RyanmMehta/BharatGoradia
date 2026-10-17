// "Lights switch on": on the first page of a visit, each bulb lights in turn from the left
// edge of the screen to the right over about 1.5 seconds, then twinkles as normal.
// The head script in BaseLayout decides whether the intro plays (motion allowed, not paused,
// first page this session) and removes it after 2.5s if this script never runs.
const SWEEP_SECONDS = 1.4;

export function initLights(): void {
  const root = document.documentElement;
  if (!root.classList.contains('lights-intro')) return;
  const units = document.querySelectorAll<SVGGElement>('.lights .unit');
  const width = window.innerWidth || 1;
  units.forEach((unit) => {
    const x = unit.getBoundingClientRect().left;
    const t = Math.min(Math.max(x / width, 0), 1.05) * SWEEP_SECONDS;
    unit.style.setProperty('--on', `${t.toFixed(3)}s`);
  });
  root.classList.add('lights-ready');
}
