import { feedbackTokensByVideo, notInterestedToken } from '../lib/youtubeFeedbackData';

type YoutubeWindow = Window & {
  ytInitialData?: unknown;
  ytcfg?: { get(key: string): unknown };
};

export default defineUnlistedScript(() => {
  const script = document.currentScript;
  if (!script) return;
  const page = window as YoutubeWindow;
  let cachedData: unknown;
  let cachedTokens = new Map<string, string>();

  function tokenFor(id: string): string | undefined {
    if (page.ytInitialData !== cachedData) {
      cachedData = page.ytInitialData;
      cachedTokens = feedbackTokensByVideo(cachedData);
    }
    const initialToken = cachedTokens.get(id);
    if (initialToken) return initialToken;

    // YouTube adds later recommendations without changing ytInitialData.
    // Their card model can still carry the same menu command.
    for (const card of document.querySelectorAll('yt-lockup-view-model, ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytm-shorts-lockup-view-model-v2')) {
      const link = card.querySelector<HTMLAnchorElement>('a[href*="/watch?v="], a[href^="/shorts/"]');
      if (!link) continue;
      const url = new URL(link.href);
      if ((url.searchParams.get('v') ?? url.pathname.split('/').pop()) !== id) continue;
      const model = card as Element & { data?: unknown; __data?: unknown };
      const data = model.data ?? model.__data;
      const direct = notInterestedToken(data);
      if (direct) return direct;
      const nested = feedbackTokensByVideo(data).get(id);
      if (nested) return nested;
    }
  }

  async function sendFeedback(id: string): Promise<boolean> {
    if (location.pathname !== '/' && location.pathname !== '/watch') return false;
    const token = tokenFor(id);
    const config = page.ytcfg;
    const context = config?.get('INNERTUBE_CONTEXT');
    const version = config?.get('INNERTUBE_CONTEXT_CLIENT_VERSION');
    const cookie = document.cookie.split('; ').find(value => value.startsWith('SAPISID='))?.slice(8) ??
      document.cookie.split('; ').find(value => value.startsWith('__Secure-3PAPISID='))?.slice(18);
    if (!token || !context || !version || !cookie) return false;

    const timestamp = Math.floor(Date.now() / 1000);
    const bytes = new TextEncoder().encode(`${timestamp} ${decodeURIComponent(cookie)} ${location.origin}`);
    const digest = await crypto.subtle.digest('SHA-1', bytes);
    const hash = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const authorization = ['SAPISIDHASH', 'SAPISID1PHASH', 'SAPISID3PHASH']
      .map(prefix => `${prefix} ${timestamp}_${hash}_u`).join(' ');

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'authorization': authorization,
      'x-origin': location.origin,
      'x-youtube-client-name': String(config?.get('INNERTUBE_CONTEXT_CLIENT_NAME') ?? 1),
      'x-youtube-client-version': String(version),
      'x-goog-authuser': String(config?.get('SESSION_INDEX') ?? 0),
      'x-youtube-bootstrap-logged-in': 'true',
    };
    const visitor = (context as { client?: { visitorData?: string } }).client?.visitorData;
    if (visitor) headers['x-goog-visitor-id'] = visitor;

    const response = await fetch('/youtubei/v1/feedback?prettyPrint=false', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ context, feedbackTokens: [token], isFeedbackTokenUnencrypted: false, shouldMerge: false }),
    });
    return response.ok;
  }

  script.addEventListener('gta6-feedback-request', event => {
    if (!(event instanceof CustomEvent) || typeof event.detail?.id !== 'string') return;
    const id = event.detail.id;
    void sendFeedback(id).then(ok => {
      script.dispatchEvent(new CustomEvent('gta6-feedback-result', { detail: { id, ok } }));
    }).catch(() => {
      script.dispatchEvent(new CustomEvent('gta6-feedback-result', { detail: { id, ok: false } }));
    });
  });
});
