import assert from 'node:assert/strict';
import test from 'node:test';
import { exactSpoilerSearchPlatform, isExactSpoilerSearch } from '../lib/searchWarning.ts';

test('warns on exact game-name searches across common search engines', () => {
  for (const address of [
    'https://www.google.com/search?q=gta+6',
    'https://www.google.ro/search?q=GTA%20VI',
    'https://www.bing.com/search?q=grand+theft+auto+vi',
    'https://duckduckgo.com/?q=GTA+6',
    'https://search.brave.com/search?q=gta+vi',
    'https://search.yahoo.com/search?p=grand+thef+auto+vi',
    'https://www.ecosia.org/search?q=GTA+6',
    'https://www.startpage.com/sp/search?query=grand+theft+auto+6',
    'https://www.qwant.com/?q=gta+6',
    'https://yandex.com/search/?text=gta+vi',
    'https://www.baidu.com/s?wd=gta+6',
    'https://www.youtube.com/results?search_query=gta+6',
    'https://www.tiktok.com/search?q=gta+vi',
    'https://www.reddit.com/search/?q=grand+theft+auto+vi',
    'https://x.com/search?q=gta+6',
    'https://www.twitch.tv/search?term=gta+vi',
    'https://www.pinterest.com/search/pins/?q=gta+6',
  ]) {
    assert.equal(isExactSpoilerSearch(new URL(address)), true, address);
  }
});

test('leaves related searches and ordinary site searches alone', () => {
  for (const address of [
    'https://www.google.com/search?q=gta+6+release+date',
    'https://www.google.com/search?q=how+to+avoid+gta+6+spoilers',
    'https://www.google.com/search?q=gta+5',
    'https://www.google.com/url?q=gta+6',
    'https://example.com/search?q=gta+6',
    'https://www.youtube.com/results?search_query=gta+6+gameplay',
  ]) {
    assert.equal(isExactSpoilerSearch(new URL(address)), false, address);
  }
});

test('returns the platform for a matching search', () => {
  assert.equal(exactSpoilerSearchPlatform(new URL('https://www.youtube.com/results?search_query=gta+6')), 'YouTube');
  assert.equal(exactSpoilerSearchPlatform(new URL('https://www.google.com/search?q=gta+6')), 'Google');
  assert.equal(exactSpoilerSearchPlatform(new URL('https://example.com/search?q=gta+6')), undefined);
});
