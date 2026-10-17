// "Pause animation" control for the decorative lights and diya flame (WCAG 2.2.2).
// The choice is remembered on this device. Hidden when the visitor prefers reduced motion,
// because nothing animates then.
export function initMotionToggle(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const label = button?.querySelector<HTMLElement>('[data-motion-label]');
  if (!button || !label) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const render = () => {
    const paused = root.classList.contains('decor-paused');
    button.dataset.paused = String(paused);
    label.textContent = paused ? 'Play animation' : 'Pause animation';
  };

  button.hidden = false;
  render();
  button.addEventListener('click', () => {
    const paused = root.classList.toggle('decor-paused');
    try {
      localStorage.setItem('decor-paused', paused ? '1' : '0');
    } catch {
      /* storage unavailable: the choice lasts for this page only */
    }
    render();
  });
}
