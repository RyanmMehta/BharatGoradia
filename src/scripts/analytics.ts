// Minimal analytics dispatcher (PRD §18). Provider is not yet selected, so events go to:
//   - window.plausible, if a Plausible-compatible script is added later;
//   - window.dataLayer, if a tag manager is added later;
//   - a DOM event, useful for testing.
// Only page and content identifiers are sent. Never pass names, addresses or message text.
type Props = Record<string, string | number>;

export function track(event: string, props: Props = {}): void {
  const w = window as unknown as {
    plausible?: (e: string, o: { props: Props }) => void;
    dataLayer?: unknown[];
  };
  const payload = { page: location.pathname, ...props };
  try {
    w.plausible?.(event, { props: payload });
    w.dataLayer?.push({ event, ...payload });
  } catch {
    /* analytics must never break the page */
  }
  document.dispatchEvent(new CustomEvent('site:track', { detail: { event, props: payload } }));
}

/** Delegated tracking for links/buttons marked with data-track="event" and optional data-track-id. */
export function initClickTracking(): void {
  document.addEventListener('click', (e) => {
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-track]');
    if (!el) return;
    track(el.dataset.track!, el.dataset.trackId ? { id: el.dataset.trackId } : {});
  });
}
