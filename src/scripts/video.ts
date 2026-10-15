// Video facades (PRD H-03, §14). Nothing from YouTube loads until the visitor presses Play.
// Without JavaScript the facade is an ordinary link to the source, so playback still works.
// Only one video plays at a time.
import { track } from './analytics';

const YT_ORIGIN = 'https://www.youtube-nocookie.com';
let initialised = false;

function pauseOthers(except: HTMLElement) {
  document.querySelectorAll<HTMLElement>('[data-video-card]').forEach((card) => {
    if (card === except) return;
    card.querySelectorAll('video').forEach((v) => v.pause());
    card.querySelectorAll('iframe').forEach((f) =>
      f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), YT_ORIGIN),
    );
  });
}

function showProblem(card: HTMLElement, message: string) {
  const status = card.querySelector<HTMLElement>('[data-video-status]');
  if (status) status.textContent = message;
}

function play(card: HTMLElement) {
  const stage = card.querySelector<HTMLElement>('[data-video-stage]');
  const { provider, youtubeId, fileUrl, captionsUrl, title = 'Video', id = '' } = card.dataset;
  if (!stage) return;

  pauseOthers(card);

  if (provider === 'youtube' && youtubeId) {
    const params = new URLSearchParams({
      autoplay: '1',
      rel: '0',
      playsinline: '1',
      cc_load_policy: '1',
      enablejsapi: '1',
      origin: location.origin,
    });
    const iframe = document.createElement('iframe');
    iframe.src = `${YT_ORIGIN}/embed/${encodeURIComponent(youtubeId)}?${params}`;
    iframe.title = `Video player: ${title}`;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.addEventListener('load', () => {
      // Ask the player to report state changes so we can pause other videos when this one resumes.
      iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id }), YT_ORIGIN);
    });
    stage.replaceChildren(iframe);
    iframe.focus();
  } else if (provider === 'file' && fileUrl) {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = fileUrl;
    video.setAttribute('aria-label', `Video player: ${title}`);
    if (captionsUrl) {
      const trackEl = document.createElement('track');
      trackEl.kind = 'captions';
      trackEl.srclang = 'en';
      trackEl.label = 'English';
      trackEl.src = captionsUrl;
      trackEl.default = true;
      video.append(trackEl);
    }
    video.addEventListener('play', () => pauseOthers(card));
    video.addEventListener('error', () =>
      showProblem(card, 'Sorry, this video could not be played here. You can open it using the link below.'),
    );
    stage.replaceChildren(video);
    video.focus();
    video.play().catch(() => {
      /* autoplay blocked: the visible controls let the visitor start it */
    });
  } else {
    return;
  }

  // If the network is down the embedded player cannot load; say so plainly.
  if (!navigator.onLine) {
    showProblem(card, 'You appear to be offline, so the video cannot load. Please try again when you are connected.');
  }
  track('video_start', { id });
}

export function initVideos(): void {
  if (initialised) return;
  initialised = true;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const facade = (e.target as Element | null)?.closest<HTMLElement>('[data-video-facade]');
    const card = facade?.closest<HTMLElement>('[data-video-card]');
    if (!facade || !card) return;
    e.preventDefault();
    play(card);
  });

  window.addEventListener('message', (e) => {
    if (e.origin !== YT_ORIGIN || typeof e.data !== 'string') return;
    let data: { event?: string; info?: unknown };
    try {
      data = JSON.parse(e.data);
    } catch {
      return;
    }
    const playing =
      (data.event === 'onStateChange' && data.info === 1) ||
      (data.event === 'infoDelivery' && (data.info as { playerState?: number } | null)?.playerState === 1);
    if (!playing) return;
    const frame = [...document.querySelectorAll('iframe')].find((f) => f.contentWindow === e.source);
    const card = frame?.closest<HTMLElement>('[data-video-card]');
    if (card) pauseOthers(card);
  });
}
