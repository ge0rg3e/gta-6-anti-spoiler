const YOUTUBE_GRID_ITEM = 'ytd-rich-item-renderer, ytd-grid-video-renderer, .ytGridShelfViewModelGridShelfItem';
const YOUTUBE_SHELF = 'ytd-reel-shelf-renderer, ytd-rich-shelf-renderer, horizontal-shelf-view-model, grid-shelf-view-model';
const YOUTUBE_CARD = 'yt-lockup-view-model, ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytd-history-video-renderer, ytd-reel-item-renderer, ytd-rich-grid-slim-media, ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2';

function isYoutube(hostname: string): boolean {
  return hostname === 'youtube.com' || hostname.endsWith('.youtube.com');
}

export function removalTarget(target: Element, hostname: string): Element {
  if (isYoutube(hostname)) {
    return target.closest(YOUTUBE_GRID_ITEM) ?? target;
  }
  return target;
}

export function removeInPlace(target: Element): () => void {
  const marker = target.ownerDocument.createComment('GTA 6 Anti-Spoiler');
  target.replaceWith(marker);
  return () => {
    if (marker.parentNode) marker.replaceWith(target);
  };
}

function hideInPlace(target: Element): () => void {
  const style = target.getAttribute('style');
  const marker = target.getAttribute('data-gta6-removed');
  if (target instanceof HTMLElement) target.style.setProperty('display', 'none', 'important');
  target.setAttribute('data-gta6-removed', '');
  return () => {
    if (style === null) target.removeAttribute('style');
    else target.setAttribute('style', style);
    if (marker === null) target.removeAttribute('data-gta6-removed');
    else target.setAttribute('data-gta6-removed', marker);
  };
}

export function removeWithEmptyShelf(item: Element, hostname: string): () => void {
  if (!isYoutube(hostname)) return removeInPlace(item);

  const shelf = item.closest(YOUTUBE_SHELF);
  const restoreItem = hideInPlace(item);
  const hasVisibleCards = shelf && [...shelf.querySelectorAll(YOUTUBE_CARD)]
    .some(card => !card.closest('[data-gta6-removed]'));
  const restoreShelf = shelf && !hasVisibleCards ? hideInPlace(shelf) : undefined;
  return () => {
    restoreShelf?.();
    restoreItem();
  };
}
