import { STATS_KEY, updateStats, type SpoilerStats, type StatEvent } from '../lib/stats';
import { matchesSpoilerPattern } from '../lib/imagePattern';

const MAX_IMAGE_BYTES = 4_000_000;
const MAX_SIDE = 192;

async function inspectImage(url: string): Promise<boolean> {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.startsWith('[') ||
      /^(?:0|10|127|169\.254|192\.168)\./.test(host) ||
      /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)) return false;

  const response = await fetch(parsed.href, {
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'error',
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok || !/^image\/(?:png|jpeg|webp|avif|gif)$/i.test(response.headers.get('content-type')?.split(';')[0] ?? '')) return false;
  if (Number(response.headers.get('content-length') ?? 0) > MAX_IMAGE_BYTES) return false;

  const reader = response.body?.getReader();
  if (!reader) return false;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_IMAGE_BYTES) { await reader.cancel(); return false; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const bitmap = await createImageBitmap(new Blob([bytes.buffer]));
  try {
    if (bitmap.width < 40 || bitmap.height < 40) return false;
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;
    context.drawImage(bitmap, 0, 0, width, height);
    return matchesSpoilerPattern(context.getImageData(0, 0, width, height));
  } finally {
    bitmap.close();
  }
}

export default defineBackground(() => {
  let writes = Promise.resolve();
  const imageChecks = new Map<string, Promise<boolean>>();

  browser.runtime.onMessage.addListener(message => {
    if (message?.type === 'gta6-image-check' && typeof message.url === 'string') {
      const url = message.url;
      if (url.length > 2048) return false;
      let check = imageChecks.get(url);
      if (!check) {
        check = inspectImage(url).catch(() => false);
        imageChecks.set(url, check);
        if (imageChecks.size > 250) imageChecks.delete(imageChecks.keys().next().value!);
      }
      return check;
    }
    if (message?.type !== 'gta6-stat' || !['hidden', 'feedbackSent'].includes(message.event)) return;
    const event = message.event as StatEvent;
    writes = writes.then(async () => {
      const result = await browser.storage.local.get(STATS_KEY);
      const now = new Date();
      const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      await browser.storage.local.set({
        [STATS_KEY]: updateStats(result[STATS_KEY] as SpoilerStats | undefined, event, day),
      });
    }).catch(() => {});
  });
});
