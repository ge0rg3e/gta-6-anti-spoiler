const GAME_QUERY = /^(?:gta\s*(?:6|vi)|grand\s+thef(?:t)?\s+auto\s+(?:6|vi))$/i;

const ENGINES: { host: RegExp; path: RegExp; parameter: string; platform: string }[] = [
  { host: /(?:^|\.)google\.[a-z]{2,3}(?:\.[a-z]{2})?$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'Google' },
  { host: /(?:^|\.)bing\.com$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'Bing' },
  { host: /(?:^|\.)duckduckgo\.com$/i, path: /^\/(?:html\/?)?$/i, parameter: 'q', platform: 'DuckDuckGo' },
  { host: /^search\.brave\.com$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'Brave Search' },
  { host: /(?:^|\.)search\.yahoo\.com$/i, path: /^\/search\/?$/i, parameter: 'p', platform: 'Yahoo' },
  { host: /(?:^|\.)startpage\.com$/i, path: /^\/(?:sp\/)?search\/?$/i, parameter: 'query', platform: 'Startpage' },
  { host: /(?:^|\.)ecosia\.org$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'Ecosia' },
  { host: /(?:^|\.)qwant\.com$/i, path: /^\/(?:search\/?)?$/i, parameter: 'q', platform: 'Qwant' },
  { host: /(?:^|\.)yandex\.(?:com|ru)$/i, path: /^\/search\/?$/i, parameter: 'text', platform: 'Yandex' },
  { host: /(?:^|\.)baidu\.com$/i, path: /^\/s\/?$/i, parameter: 'wd', platform: 'Baidu' },
  { host: /(?:^|\.)youtube\.com$/i, path: /^\/results\/?$/i, parameter: 'search_query', platform: 'YouTube' },
  { host: /(?:^|\.)tiktok\.com$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'TikTok' },
  { host: /(?:^|\.)reddit\.com$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'Reddit' },
  { host: /(?:^|\.)(?:x|twitter)\.com$/i, path: /^\/search\/?$/i, parameter: 'q', platform: 'X' },
  { host: /(?:^|\.)twitch\.tv$/i, path: /^\/search\/?$/i, parameter: 'term', platform: 'Twitch' },
  { host: /(?:^|\.)pinterest\.com$/i, path: /^\/search\/pins\/?$/i, parameter: 'q', platform: 'Pinterest' },
];

export function exactSpoilerSearchPlatform(url: URL): string | undefined {
  const engine = ENGINES.find(({ host, path }) => host.test(url.hostname) && path.test(url.pathname));
  if (!engine) return;
  const query = url.searchParams.get(engine.parameter)?.trim().replace(/\s+/g, ' ') ?? '';
  return GAME_QUERY.test(query) ? engine.platform : undefined;
}

export function isExactSpoilerSearch(url: URL): boolean {
  return exactSpoilerSearchPlatform(url) !== undefined;
}
