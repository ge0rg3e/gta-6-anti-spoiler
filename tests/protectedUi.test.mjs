import assert from 'node:assert/strict';
import test from 'node:test';
import { Window } from 'happy-dom';
import { containsEssentialUi, isProtectedMatch, safeRemovalTarget } from '../lib/protectedUi.ts';

test('keeps search inputs, suggestions, and page navigation', () => {
  const window = new Window();
  window.document.body.innerHTML = `
    <header><form role="search"><input value="GTA 6"><div id="suggestion">GTA 6</div></form></header>
    <nav><a id="navigation">GTA 6 news</a></nav>
    <div role="tablist"><button id="tab">GTA 6</button></div>`;

  for (const selector of ['input', '#suggestion', '#navigation', '#tab']) {
    assert.equal(isProtectedMatch(window.document.querySelector(selector)), true);
  }
  assert.equal(containsEssentialUi(window.document.querySelector('header')), true);
  window.happyDOM.abort();
});

test('still removes matching result cards and article headlines', () => {
  const window = new Window();
  window.document.body.innerHTML = `
    <article id="story"><header><h2>GTA 6 trailer</h2></header><p>Details</p></article>
    <div id="result" class="result"><a href="/news"><h3>GTA 6 news</h3></a></div>`;

  assert.equal(isProtectedMatch(window.document.querySelector('#story h2')), false);
  assert.equal(containsEssentialUi(window.document.querySelector('#story')), false);
  assert.equal(isProtectedMatch(window.document.querySelector('#result h3')), false);
  assert.equal(containsEssentialUi(window.document.querySelector('#result')), false);
  window.happyDOM.abort();
});

test('does not remove a container that holds an editable control', () => {
  const window = new Window();
  window.document.body.innerHTML = '<div id="panel"><h2>GTA 6</h2><input aria-label="Search"></div>';
  assert.equal(containsEssentialUi(window.document.querySelector('#panel')), true);
  assert.equal(safeRemovalTarget(window.document.querySelector('#panel'), window.document.querySelector('h2')), window.document.querySelector('h2'));
  window.happyDOM.abort();
});
