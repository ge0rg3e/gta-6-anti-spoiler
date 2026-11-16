import { youtubeContentTarget } from '../lib/contentTargets';
import { containsEssentialUi, isProtectedMatch, safeRemovalTarget } from '../lib/protectedUi';
import { removeWithEmptyShelf, removalTarget } from '../lib/remove';

const ENABLED_KEY = 'spoilerBlockerEnabled';
const SPOILER = /\b(?:gta[\s\u00a0._:-]*(?:6|vi)|grand[\s\u00a0-]+theft[\s\u00a0-]+auto[\s\u00a0-]+(?:6|vi))\b/i;
const IGNORED = 'head, script, style, noscript, template, textarea, input, option, svg, [contenteditable], [data-gta6-placeholder]';
const CONTENT_CONTAINER = 'article, [role="article"], li, [role="listitem"], [class*="card"], [class*="post"], [class*="result"], [class*="story"]';
const IMAGE_ATTRIBUTES = ['alt', 'title', 'aria-label', 'src', 'srcset', 'data-src'];

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: true,
  runAt: 'document_start',
  main() {
    let enabled = true;
    let storageChanged = false;
    const isYoutube = location.hostname === 'youtube.com' || location.hostname.endsWith('.youtube.com');
    let observer: MutationObserver | undefined;
    let rootObserver: MutationObserver | undefined;
    const pending = new Set<Node>();
    const blocked = new Map<Element, () => void>();
    const counted = new WeakSet<Element>();
    const checkedImages = new WeakMap<HTMLImageElement, string>();
    const imageQueue: Array<{ image: HTMLImageElement; url: string }> = [];
    let activeImageChecks = 0;
    let scheduled = false;
    function record(): void {
      void browser.runtime.sendMessage({ type: 'gta6-stat', event: 'hidden' }).catch(() => {});
    }

    function isIgnored(element: Element): boolean {
      return Boolean(element.closest(IGNORED)) || isProtectedMatch(element);
    }

    function visualCardFor(element: Element): Element | undefined {
      let candidate: Element | undefined;
      let ancestor = element.parentElement;

      for (let depth = 0; ancestor && depth < 9; depth++, ancestor = ancestor.parentElement) {
        if (ancestor === document.body || ancestor === document.documentElement) break;
        if (containsEssentialUi(ancestor)) break;

        const bounds = ancestor.getBoundingClientRect();
        const images = [...ancestor.querySelectorAll('img, video, canvas')].filter(media => {
          const size = media.getBoundingClientRect();
          return size.width >= 50 || size.height >= 50;
        });
        const imageCount = images.length || ancestor.querySelectorAll('img, video, canvas').length;

        if ((bounds.width > 560 && bounds.width !== 0) || imageCount > 1 ||
            (ancestor.textContent?.length ?? 0) > 1800 || ancestor.querySelectorAll('a').length > 10) break;

        if (imageCount === 1) candidate = ancestor;
      }

      return candidate;
    }

    function googleResultFor(element: Element): Element | undefined {
      if (!element.closest('#search, #rhs')) return;
      let candidate: Element | undefined;
      let ancestor = element.parentElement;

      for (let depth = 0; ancestor && depth < 10; depth++, ancestor = ancestor.parentElement) {
        if (ancestor.id === 'search' || ancestor.id === 'rhs') break;
        const width = ancestor.getBoundingClientRect().width;
        if ((width > 950 && width !== 0) || (ancestor.textContent?.length ?? 0) > 2500 ||
            ancestor.querySelectorAll('a').length > 14 || ancestor.querySelectorAll('h3').length > 1) break;
        if (ancestor.querySelectorAll('h3').length === 1) candidate = ancestor;
      }

      return candidate;
    }

    function targetFor(element: Element): Element | undefined {
      if (isYoutube) {
        const videoTarget = youtubeContentTarget(element, SPOILER);
        if (videoTarget !== null) return videoTarget;
      }

      const article = element.closest('article, [role="article"]');
      if (article) return article;

      if (element.closest('#search, #rhs')) {
        const link = element.closest('a[href]');
        if (link && link.querySelector('img, video, canvas') &&
            link.getBoundingClientRect().width < 850 && (link.textContent?.length ?? 0) < 1600) {
          return link;
        }
      }

      const googleResult = googleResultFor(element);
      if (googleResult) return googleResult;

      const visualCard = visualCardFor(element);
      if (visualCard) return visualCard;

      const container = element.closest(CONTENT_CONTAINER);
      if (container && container !== document.documentElement && container !== document.body) {
        const isArticle = container.matches('article, [role="article"]');
        if (isArticle || ((container.textContent?.length ?? 0) < 3000 && container.querySelectorAll('a').length < 15)) {
          return container;
        }
      }

      const block = element.closest('h1, h2, h3, h4, h5, h6, p, blockquote, figure, a, div');
      if (block && block !== document.body && block !== document.documentElement) {
        if (block.tagName !== 'DIV' || (block.textContent?.length ?? 0) < 1500) return block;
      }
      return element;
    }

    function replace(original: Element, match: Element): void {
      if (!original.parentNode) return;
      // Keep YouTube's own card element in its grid. Replacing it with a div
      // breaks selectors and layout on channel Home, Videos, and Playlists.
      let target = original.matches('img, video, canvas, svg') ? original.parentElement : original;
      if (target === document.body || target === document.documentElement) target = original;
      if (!target || blocked.has(target) || target.closest('[data-gta6-placeholder]')) return;
      const item = safeRemovalTarget(removalTarget(target, location.hostname), match);
      if (!item || blocked.has(item) || !item.parentNode) return;
      blocked.set(item, removeWithEmptyShelf(item, location.hostname));
      if (!counted.has(item)) {
        counted.add(item);
        record();
      }
    }

    function visualTargetFor(image: HTMLImageElement): Element | undefined {
      if (isYoutube) {
        const card = image.closest('ytm-shorts-lockup-view-model-v2, ytd-rich-item-renderer, ytd-grid-video-renderer, yt-lockup-view-model, ytd-rich-grid-media, ytd-compact-video-renderer, ytd-video-renderer, ytd-history-video-renderer, ytd-reel-item-renderer, ytd-rich-grid-slim-media, ytm-shorts-lockup-view-model');
        if (card) return card;
      }
      return targetFor(image);
    }

    function pumpImageChecks(): void {
      while (enabled && activeImageChecks < 4 && imageQueue.length) {
        const { image, url } = imageQueue.shift()!;
        if (!image.isConnected || (image.currentSrc || image.src) !== url) continue;
        activeImageChecks++;
        void browser.runtime.sendMessage({ type: 'gta6-image-check', url }).then(matched => {
          if (!enabled || matched !== true || !image.isConnected ||
              (image.currentSrc || image.src) !== url || isIgnored(image)) return;
          const target = visualTargetFor(image);
          if (target?.isConnected) replace(target, image);
        }).catch(() => {}).finally(() => {
          activeImageChecks--;
          pumpImageChecks();
        });
      }
    }

    function inspectImage(image: HTMLImageElement): void {
      if (isIgnored(image) || image.closest('[data-gta6-removed]')) return;
      const bounds = image.getBoundingClientRect();
      if (bounds.width < 60 || bounds.height < 50) return;
      const url = image.currentSrc || image.src;
      if (!url || checkedImages.get(image) === url) return;
      checkedImages.set(image, url);
      imageQueue.push({ image, url });
      pumpImageChecks();
    }

    function restore(): void {
      for (const undo of blocked.values()) undo();
      blocked.clear();
    }

    function scan(root: Node): void {
      if (!enabled || !root.isConnected) return;
      const matches: Node[] = [];

      if (root.nodeType === Node.TEXT_NODE) {
        if (SPOILER.test(root.textContent || '') && root.parentElement && !isIgnored(root.parentElement)) matches.push(root);
      } else if (root instanceof Element) {
        if (isIgnored(root)) return;
        if (root instanceof HTMLImageElement) inspectImage(root);
        for (const image of root.querySelectorAll('img')) inspectImage(image);
        const candidates = [root, ...root.querySelectorAll('img, video, [title], [aria-label]')];
        for (const element of candidates) {
          if (element === document.documentElement || element === document.body) continue;
          if (!isIgnored(element) && IMAGE_ATTRIBUTES.some(attribute => SPOILER.test(element.getAttribute(attribute) || ''))) matches.push(element);
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (SPOILER.test(node.textContent || '') && node.parentElement && !isIgnored(node.parentElement)) matches.push(node);
        }
      }

      for (const match of matches) {
        if (!match.isConnected) continue;
        const element = match instanceof Element ? match : match.parentElement;
        if (!element || isIgnored(element)) continue;
        const target = targetFor(element);
        if (target?.isConnected) replace(target, element);
      }
    }

    function schedule(node: Node): void {
      pending.add(node);
      if (scheduled) return;
      scheduled = true;
      const flush = () => {
        scheduled = false;
        for (const item of pending) scan(item);
        pending.clear();
      };
      queueMicrotask(flush);
    }

    function start(): void {
      if (!document.documentElement || observer) return;
      observer = new MutationObserver(records => {
        for (const record of records) {
          if (record.type === 'childList') {
            for (const node of record.addedNodes) {
              if (isYoutube) scan(node);
              else schedule(node);
            }
          } else {
            if (isYoutube) scan(record.target);
            else schedule(record.target);
          }
        }
      });
      observer.observe(document.documentElement, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: IMAGE_ATTRIBUTES,
      });
      if (isYoutube) scan(document.documentElement);
      else schedule(document.documentElement);
    }

    function waitForRoot(): void {
      if (rootObserver) return;
      rootObserver = new MutationObserver(() => {
        if (!document.documentElement) return;
        rootObserver?.disconnect();
        rootObserver = undefined;
        if (enabled) start();
      });
      rootObserver.observe(document, { childList: true });
    }

    function syncState(): void {
      if (!enabled) restore();
      if (enabled) {
        start();
        if (document.documentElement) {
          if (isYoutube) scan(document.documentElement);
          else schedule(document.documentElement);
        }
        else waitForRoot();
      } else {
        observer?.disconnect();
        observer = undefined;
        rootObserver?.disconnect();
        rootObserver = undefined;
        pending.clear();
        imageQueue.length = 0;
      }
    }

    syncState();
    browser.storage.local.get(ENABLED_KEY).then(result => {
      if (storageChanged) return;
      const storedEnabled = result[ENABLED_KEY] !== false;
      if (storedEnabled !== enabled) {
        enabled = storedEnabled;
        syncState();
      }
    });

    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[ENABLED_KEY]) return;
      storageChanged = true;
      enabled = changes[ENABLED_KEY].newValue !== false;
      syncState();
    });

    window.addEventListener('yt-navigate-finish', () => {
      if (enabled && document.documentElement) scan(document.documentElement);
    });
    document.addEventListener('load', event => {
      if (enabled && event.target instanceof HTMLImageElement) inspectImage(event.target);
    }, true);
  },
});
