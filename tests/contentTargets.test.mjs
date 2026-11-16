import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import { youtubeContentTarget } from '../lib/contentTargets.ts';

test('YouTube home selects only the matching video, even before the grid fills', () => {
  const window = new Window({ url: 'https://www.youtube.com/' });
  const document = window.document;
  document.body.innerHTML = `
    <ytd-rich-grid-renderer>
      <yt-lockup-view-model id="spoiler">
        <a href="/watch?v=one"><img alt="GTA 6 trailer"></a>
        <h3>GTA 6 trailer</h3>
      </yt-lockup-view-model>
    </ytd-rich-grid-renderer>`;
  const grid = document.querySelector('ytd-rich-grid-renderer');
  const spoiler = document.querySelector('#spoiler');
  const phrase = /\bgta\s*6\b/i;

  assert.equal(youtubeContentTarget(spoiler.querySelector('h3'), phrase), spoiler);
  assert.equal(youtubeContentTarget(spoiler.querySelector('img'), phrase), spoiler);
  assert.equal(youtubeContentTarget(grid, phrase), undefined);

  const ordinary = document.createElement('yt-lockup-view-model');
  ordinary.innerHTML = '<h3>Cooking dinner</h3><a href="/watch?v=two"><img alt="Dinner"></a>';
  grid.append(ordinary);

  assert.equal(youtubeContentTarget(ordinary.querySelector('h3'), phrase), undefined);
  assert.equal(youtubeContentTarget(grid, phrase), undefined);
  window.happyDOM.abort();
});

test('YouTube hides a matching thumbnail before its title arrives', () => {
  const window = new Window({ url: 'https://www.youtube.com/' });
  window.document.body.innerHTML = `
    <ytd-rich-grid-renderer>
      <yt-lockup-view-model id="card"><a href="/watch?v=one"><img alt="GTA 6 trailer"></a><h3></h3></yt-lockup-view-model>
    </ytd-rich-grid-renderer>`;
  const card = window.document.querySelector('#card');
  assert.equal(youtubeContentTarget(card.querySelector('img'), /\bgta\s*6\b/i), card);
  window.happyDOM.abort();
});

test('YouTube History removes the complete matching entry, not only its title', () => {
  const window = new Window({ url: 'https://www.youtube.com/feed/history' });
  const document = window.document;
  document.body.innerHTML = `
    <ytd-browse page-subtype="history">
      <ytd-item-section-renderer>
        <yt-lockup-view-model id="spoiler">
          <a href="/watch?v=one"><img alt=""></a>
          <h3>Grand Theft Auto VI: An Extended Look</h3>
        </yt-lockup-view-model>
        <yt-lockup-view-model id="ordinary">
          <a href="/watch?v=two"><img alt=""></a>
          <h3>Cooking dinner</h3>
        </yt-lockup-view-model>
      </ytd-item-section-renderer>
    </ytd-browse>`;
  const phrase = /grand theft auto vi/i;
  const spoiler = document.querySelector('#spoiler');
  const ordinary = document.querySelector('#ordinary');

  assert.equal(youtubeContentTarget(spoiler.querySelector('h3'), phrase), spoiler);
  assert.equal(youtubeContentTarget(spoiler.querySelector('img'), phrase), spoiler);
  assert.equal(youtubeContentTarget(ordinary.querySelector('h3'), phrase), undefined);
  assert.equal(youtubeContentTarget(document.querySelector('ytd-browse'), phrase), undefined);
  window.happyDOM.abort();
});

test('YouTube search covers the full matching result but leaves unrelated thumbnails visible', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  const document = window.document;
  document.body.innerHTML = `
    <ytd-search>
      <yt-lockup-view-model id="matching">
        <a href="/watch?v=one"><img alt="GTA 6 thumbnail"></a>
        <div><h3>GTA 6 news</h3><p>Details</p></div>
      </yt-lockup-view-model>
      <yt-lockup-view-model id="unrelated">
        <a href="/watch?v=two"><img alt="Xbox thumbnail"></a>
        <div><h3>Xbox news</h3><p>Related to GTA 6</p></div>
      </yt-lockup-view-model>
    </ytd-search>`;
  const phrase = /\bgta\s*6\b/i;
  const matching = document.querySelector('#matching');
  const unrelated = document.querySelector('#unrelated');

  assert.equal(youtubeContentTarget(matching.querySelector('h3'), phrase), matching);
  assert.equal(youtubeContentTarget(matching.querySelector('img'), phrase), matching);
  assert.equal(youtubeContentTarget(unrelated.querySelector('p'), phrase), undefined);
  assert.equal(youtubeContentTarget(document.querySelector('ytd-search'), phrase), undefined);
  window.happyDOM.abort();
});

test('YouTube game panel is handled as one result', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  const document = window.document;
  document.body.innerHTML = `
    <ytd-search><yt-official-card-view-model>
      <header><h2>Grand Theft Auto VI</h2></header>
      <yt-lockup-view-model><h3>GTA 6 trailer</h3><img alt="Trailer"></yt-lockup-view-model>
    </yt-official-card-view-model></ytd-search>`;
  const panel = document.querySelector('yt-official-card-view-model');

  assert.equal(youtubeContentTarget(panel.querySelector('h2'), /grand theft auto vi/i), panel);
  assert.equal(youtubeContentTarget(panel.querySelector('img'), /grand theft auto vi/i), panel);
  window.happyDOM.abort();
});

test('YouTube Shorts shelf covers only matching Shorts', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  const document = window.document;
  document.body.innerHTML = `
    <horizontal-shelf-view-model>
      <yt-lockup-view-model id="spoiler">
        <a href="/shorts/one"><img alt=""></a>
        <h3>GTA 6 map</h3>
      </yt-lockup-view-model>
      <yt-lockup-view-model id="ordinary">
        <a href="/shorts/two"><img alt=""></a>
        <h3>Racing game clip</h3>
      </yt-lockup-view-model>
      <ytd-rich-grid-slim-media id="label-only">
        <a href="/shorts/three" aria-label="Grand Theft Auto VI trailer"><img alt=""></a>
      </ytd-rich-grid-slim-media>
    </horizontal-shelf-view-model>`;
  const phrase = /\b(?:gta\s*6|grand theft auto vi)\b/i;

  assert.equal(youtubeContentTarget(document.querySelector('#spoiler img'), phrase), document.querySelector('#spoiler'));
  assert.equal(youtubeContentTarget(document.querySelector('#ordinary h3'), phrase), undefined);
  assert.equal(youtubeContentTarget(document.querySelector('#label-only a'), phrase), document.querySelector('#label-only'));
  window.happyDOM.abort();
});

test('YouTube grid shelf covers the complete Shorts card', () => {
  const window = new Window({ url: 'https://www.youtube.com/results?search_query=gta+6' });
  const document = window.document;
  document.body.innerHTML = `
    <grid-shelf-view-model>
      <div class="ytGridShelfViewModelGridShelfItem">
        <ytm-shorts-lockup-view-model-v2 id="spoiler">
          <ytm-shorts-lockup-view-model>
            <a href="/shorts/one"><img alt=""></a>
            <h3><a href="/shorts/one">GTA 6 leak explained</a></h3>
          </ytm-shorts-lockup-view-model>
        </ytm-shorts-lockup-view-model-v2>
      </div>
      <div class="ytGridShelfViewModelGridShelfItem">
        <ytm-shorts-lockup-view-model-v2 id="ordinary">
          <ytm-shorts-lockup-view-model>
            <a href="/shorts/two"><img alt=""></a>
            <h3><a href="/shorts/two">Cooking dinner</a></h3>
          </ytm-shorts-lockup-view-model>
        </ytm-shorts-lockup-view-model-v2>
      </div>
    </grid-shelf-view-model>`;
  const phrase = /\bgta\s*6\b/i;
  const spoiler = document.querySelector('#spoiler');

  assert.equal(youtubeContentTarget(spoiler.querySelector('img'), phrase), spoiler);
  assert.equal(youtubeContentTarget(spoiler.querySelector('h3'), phrase), spoiler);
  assert.equal(youtubeContentTarget(document.querySelector('#ordinary h3'), phrase), undefined);
  assert.equal(youtubeContentTarget(document.querySelector('grid-shelf-view-model'), phrase), undefined);
  window.happyDOM.abort();
});
