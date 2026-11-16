import { canSendFeedback, FEEDBACK_CONSENT_KEY, FEEDBACK_ENABLED_KEY } from '../lib/feedbackSettings';

const SPOILER = /\b(?:gta[\s\u00a0._:-]*(?:6|vi)|grand[\s\u00a0-]+theft[\s\u00a0-]+auto[\s\u00a0-]+(?:6|vi))\b/i;
const CARDS = 'yt-lockup-view-model, ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytm-shorts-lockup-view-model-v2';

export default defineContentScript({
  matches: ['*://www.youtube.com/*'],
  runAt: 'document_start',
  main() {
    if (window !== window.top) return;
    let script: HTMLScriptElement | undefined;
    let injection: Promise<void> | undefined;
    let enabled = false;
    let optedIn = false;
    let requested = false;
    let storageChanged = false;
    let scheduled = false;
    let observer: MutationObserver | undefined;
    let rootObserver: MutationObserver | undefined;
    const attempted = new Set<string>();

    function scan(): void {
      if (!enabled || !script) return;
      const surface = location.pathname === '/' ? 'ytd-rich-grid-renderer' :
        location.pathname === '/watch' ? '#related' : undefined;
      if (!surface) return;
      for (const card of document.querySelectorAll(`${surface} ${CARDS}`)) {
        const title = card.querySelector('h3, #video-title')?.textContent ?? '';
        if (!SPOILER.test(title)) continue;
        const link = card.querySelector<HTMLAnchorElement>('a[href*="/watch?v="], a[href^="/shorts/"]');
        if (!link) continue;
        const url = new URL(link.href);
        const id = url.searchParams.get('v') ?? url.pathname.split('/').pop();
        if (!id || attempted.has(id)) continue;
        attempted.add(id);
        script.dispatchEvent(new CustomEvent('gta6-feedback-request', { detail: { id } }));
      }
    }

    function schedule(): void {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => { scheduled = false; scan(); }, 250);
    }

    function observe(): void {
      if (observer || rootObserver) return;
      const root = document.documentElement;
      if (!root) {
        rootObserver = new MutationObserver(() => {
          if (!document.documentElement) return;
          rootObserver?.disconnect();
          rootObserver = undefined;
          if (enabled) observe();
        });
        rootObserver.observe(document, { childList: true });
        return;
      }
      observer = new MutationObserver(schedule);
      observer.observe(root, { subtree: true, childList: true, characterData: true });
      schedule();
    }

    async function activate(): Promise<void> {
      if (!injection) {
        injection = injectScript('/youtube-feedback-main.js', { keepInDom: true }).then(({ script: injected }) => {
          script = injected;
          injected.addEventListener('gta6-feedback-result', event => {
            if (!(event instanceof CustomEvent) || !event.detail?.ok) return;
            void browser.runtime.sendMessage({ type: 'gta6-stat', event: 'feedbackSent' }).catch(() => {});
          });
        }).catch(() => { injection = undefined; });
      }
      await injection;
      if (enabled && script) observe();
    }

    function sync(): void {
      if (enabled) void activate();
      else {
        observer?.disconnect();
        observer = undefined;
        rootObserver?.disconnect();
        rootObserver = undefined;
      }
    }

    browser.storage.local.get([FEEDBACK_ENABLED_KEY, FEEDBACK_CONSENT_KEY]).then(result => {
      if (storageChanged) return;
      optedIn = result[FEEDBACK_CONSENT_KEY] === true;
      requested = result[FEEDBACK_ENABLED_KEY] === true;
      enabled = canSendFeedback(result);
      sync();
    });
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || (!changes[FEEDBACK_ENABLED_KEY] && !changes[FEEDBACK_CONSENT_KEY])) return;
      storageChanged = true;
      if (changes[FEEDBACK_CONSENT_KEY]) optedIn = changes[FEEDBACK_CONSENT_KEY].newValue === true;
      if (changes[FEEDBACK_ENABLED_KEY]) requested = changes[FEEDBACK_ENABLED_KEY].newValue === true;
      enabled = optedIn && requested;
      sync();
    });
  },
});
