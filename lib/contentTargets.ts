const YOUTUBE_VIDEO_CARD = 'yt-lockup-view-model, ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytd-history-video-renderer, ytd-reel-item-renderer, ytd-rich-grid-slim-media, ytm-shorts-lockup-view-model';
const YOUTUBE_SURFACE = 'ytd-rich-grid-renderer, ytd-watch-next-secondary-results-renderer, #related, ytd-search, ytd-browse[page-subtype="history"], ytd-reel-shelf-renderer, horizontal-shelf-view-model, grid-shelf-view-model';

// null means the match is outside a video surface. undefined means it is on
// that surface, but does not belong to matching video content.
export function youtubeContentTarget(element: Element, spoiler: RegExp): Element | null | undefined {
  if (!element.closest(YOUTUBE_SURFACE)) return null;

  const officialCard = element.closest('yt-official-card-view-model');
  const officialTitle = officialCard?.querySelector('h1, h2, h3')?.textContent ?? '';
  if (officialCard && spoiler.test(officialTitle)) return officialCard;

  // The new Shorts grid nests a lockup inside this outer card. Cover the outer
  // element so its thumbnail, title, and menu are all hidden together.
  const card = element.closest('ytm-shorts-lockup-view-model-v2') ?? element.closest(YOUTUBE_VIDEO_CARD);
  if (!card) return undefined;
  const titleNode = card.querySelector('h3, #video-title, a[title], a[href^="/shorts/"][aria-label]');
  const title = titleNode?.textContent?.trim() || titleNode?.getAttribute('title') || titleNode?.getAttribute('aria-label') || '';
  if (spoiler.test(title)) return card;
  const thumbnail = card.querySelector('img[alt], a[href^="/watch"][aria-label], a[href^="/shorts/"][aria-label]');
  const thumbnailLabel = thumbnail?.getAttribute('alt') || thumbnail?.getAttribute('aria-label') || '';
  return spoiler.test(thumbnailLabel) ? card : undefined;
}
