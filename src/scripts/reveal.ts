// Once-only image reveal (PRD §12). Elements are revealed the first time they enter the
// viewport and never animate again when scrolling back.
export function initReveal(): void {
  const w = window as unknown as { __revealReady?: boolean };
  w.__revealReady = true;
  if (!document.documentElement.classList.contains('motion-ok')) return;
  const items = document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)');
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  items.forEach((el) => io.observe(el));
}
