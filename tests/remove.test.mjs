import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import { removeInPlace, removeWithEmptyShelf, removalTarget } from '../lib/remove.ts';

test('remove mode hides a YouTube grid item without detaching it from YouTube', () => {
  const window = new Window({ url: 'https://www.youtube.com/@TGG_/videos' });
  globalThis.HTMLElement = window.HTMLElement;
  window.document.body.innerHTML = `
    <ytd-rich-grid-renderer>
      <ytd-rich-item-renderer id="first"><yt-lockup-view-model><h3>GTA 6</h3></yt-lockup-view-model></ytd-rich-item-renderer>
      <ytd-rich-item-renderer id="second"><yt-lockup-view-model><h3>Cooking</h3></yt-lockup-view-model></ytd-rich-item-renderer>
    </ytd-rich-grid-renderer>`;
  const grid = window.document.querySelector('ytd-rich-grid-renderer');
  const first = window.document.querySelector('#first');
  const second = window.document.querySelector('#second');
  const card = first.querySelector('yt-lockup-view-model');

  const target = removalTarget(card, window.location.hostname);
  assert.equal(target, first);
  const restore = removeWithEmptyShelf(target, window.location.hostname);
  assert.deepEqual([...grid.children], [first, second]);
  assert.equal(first.style.display, 'none');
  assert.equal(first.isConnected, true);

  restore();
  assert.deepEqual([...grid.children], [first, second]);
  assert.equal(first.style.display, '');
  window.happyDOM.abort();
});

test('remove mode leaves other sites scoped to the selected element', () => {
  const window = new Window({ url: 'https://example.com/' });
  window.document.body.innerHTML = '<article><h2>GTA 6</h2></article><article><h2>Other</h2></article>';
  const first = window.document.querySelector('article');
  assert.equal(removalTarget(first, window.location.hostname), first);
  const restore = removeInPlace(first);
  assert.equal(window.document.querySelectorAll('article').length, 1);
  restore();
  assert.equal(window.document.querySelectorAll('article').length, 2);
  window.happyDOM.abort();
});

test('remove mode removes an empty Shorts shelf, including its heading and Show more control', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  globalThis.HTMLElement = window.HTMLElement;
  window.document.body.innerHTML = `
    <grid-shelf-view-model id="shelf">
      <h2>Shorts</h2>
      <div class="ytGridShelfViewModelGridShelfItem" id="one"><ytm-shorts-lockup-view-model-v2><h3>GTA 6 trailer</h3></ytm-shorts-lockup-view-model-v2></div>
      <div class="ytGridShelfViewModelGridShelfItem" id="two"><ytm-shorts-lockup-view-model-v2><h3>GTA 6 map</h3></ytm-shorts-lockup-view-model-v2></div>
      <button>Show more</button>
    </grid-shelf-view-model>
    <article id="other">Unrelated result</article>`;
  const shelf = window.document.querySelector('#shelf');
  const first = window.document.querySelector('#one');
  const second = window.document.querySelector('#two');
  const undoFirst = removeWithEmptyShelf(first, window.location.hostname);
  assert.equal(shelf.style.display, '');
  const undoSecond = removeWithEmptyShelf(second, window.location.hostname);
  assert.equal(shelf.style.display, 'none');
  assert.equal(shelf.isConnected, true);
  assert.equal(window.document.querySelector('#other')?.textContent, 'Unrelated result');

  undoFirst();
  undoSecond();
  assert.deepEqual([...shelf.querySelectorAll('.ytGridShelfViewModelGridShelfItem')], [first, second]);
  assert.equal(shelf.isConnected, true);
  assert.equal(shelf.style.display, '');
  window.happyDOM.abort();
});

test('remove mode keeps a Shorts shelf when an unrelated Short remains', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  globalThis.HTMLElement = window.HTMLElement;
  window.document.body.innerHTML = `
    <horizontal-shelf-view-model id="shelf">
      <yt-lockup-view-model id="spoiler"><h3>GTA 6</h3></yt-lockup-view-model>
      <yt-lockup-view-model id="ordinary"><h3>Cooking</h3></yt-lockup-view-model>
    </horizontal-shelf-view-model>`;
  const shelf = window.document.querySelector('#shelf');
  const undo = removeWithEmptyShelf(window.document.querySelector('#spoiler'), window.location.hostname);
  assert.equal(shelf.isConnected, true);
  assert.equal(shelf.querySelector('#ordinary')?.textContent, 'Cooking');
  undo();
  window.happyDOM.abort();
});

test('removing an empty shelf does not hide YouTube continuation controls', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  globalThis.HTMLElement = window.HTMLElement;
  window.document.body.innerHTML = `
    <ytd-rich-section-renderer id="section">
      <ytd-rich-shelf-renderer id="shelf">
        <yt-lockup-view-model id="spoiler"><h3>GTA 6</h3></yt-lockup-view-model>
      </ytd-rich-shelf-renderer>
      <ytd-continuation-item-renderer id="loader">Loading more</ytd-continuation-item-renderer>
    </ytd-rich-section-renderer>`;
  const undo = removeWithEmptyShelf(window.document.querySelector('#spoiler'), window.location.hostname);
  assert.equal(window.document.querySelector('#shelf').style.display, 'none');
  assert.equal(window.document.querySelector('#section').style.display, '');
  assert.equal(window.document.querySelector('#loader').style.display, '');
  undo();
  window.happyDOM.abort();
});
