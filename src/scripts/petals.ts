// A gentle shower of marigold petals when an enquiry is received. Decorative and brief
// (about 3 seconds, then removed). Skipped for reduced motion.
const COLORS = ['#e9a23b', '#f3b453', '#d98a1f', '#c4262c', '#f3d3a1'];

export function showerPetals(count = 18): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  Object.assign(layer.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: '90',
  });

  for (let i = 0; i < count; i++) {
    const petal = document.createElement('span');
    const size = 10 + Math.random() * 10;
    const left = 10 + Math.random() * 80;
    const drift = (Math.random() - 0.5) * 160;
    const spin = (Math.random() - 0.5) * 540;
    const duration = 2200 + Math.random() * 1400;
    Object.assign(petal.style, {
      position: 'absolute',
      top: '-24px',
      left: `${left}%`,
      width: `${size}px`,
      height: `${size * 0.62}px`,
      borderRadius: '60% 60% 60% 60% / 80% 80% 40% 40%',
      background: COLORS[i % COLORS.length],
      opacity: '0.95',
      boxShadow: 'inset -2px -2px 0 rgb(0 0 0 / 0.12)',
    });
    layer.append(petal);
    petal.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 0 },
        { opacity: 0.95, offset: 0.1 },
        { transform: `translate(${drift}px, ${window.innerHeight * 0.85}px) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration, delay: Math.random() * 600, easing: 'cubic-bezier(0.25, 0.6, 0.45, 1)', fill: 'both' },
    );
  }

  document.body.append(layer);
  window.setTimeout(() => layer.remove(), 4400);
}
