const CONTROL = 'input, textarea, select, option, button, label, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="tab"], [role="switch"], [role="textbox"], [role="searchbox"], [role="combobox"]';
const PAGE_UI = 'form, nav, [role="search"], [role="navigation"], [role="toolbar"], [role="tablist"], [role="menu"], [role="menubar"], [role="banner"]';
const CONTENT_CARD = 'article, [role="article"], yt-official-card-view-model, yt-lockup-view-model, ytd-rich-grid-media, ytd-video-renderer, ytd-history-video-renderer, ytd-compact-video-renderer, ytm-shorts-lockup-view-model-v2';
const ESSENTIAL_DESCENDANT = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"], form, nav, [role="search"], [role="navigation"], [role="toolbar"], [role="tablist"]';

export function isProtectedMatch(element: Element): boolean {
  if (element.closest(CONTROL)) return true;
  if (element.closest(PAGE_UI)) return true;
  const header = element.closest('header');
  return Boolean(header && !header.closest(CONTENT_CARD));
}

export function containsEssentialUi(element: Element): boolean {
  return element.matches(CONTROL) || element.matches(PAGE_UI) ||
    Boolean(element.querySelector(ESSENTIAL_DESCENDANT));
}

export function safeRemovalTarget(target: Element, match: Element): Element | undefined {
  if (!target.contains(match)) return;
  let candidate = target;
  while (containsEssentialUi(candidate)) {
    const child = [...candidate.children].find(element => element === match || element.contains(match));
    if (!child) return;
    candidate = child;
  }
  return candidate;
}
