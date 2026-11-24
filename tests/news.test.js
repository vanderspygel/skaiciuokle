import test from 'node:test';
import assert from 'node:assert/strict';
import { NEWS, LATEST_NEWS, newsToShow, markNewsSeen } from '../js/news.js';
import { migrate, defaultState } from '../js/storage.js';

test('naujienos: kiekvienas įrašas turi unikalų id ir punktus', () => {
  const ids = new Set(NEWS.map(n => n.id));
  assert.equal(ids.size, NEWS.length);
  for (const n of NEWS) {
    assert.ok(n.items.length > 0);
    for (const it of n.items) assert.ok(it.icon && it.title && it.text);
  }
});

test('naujienos: senam išsaugojimui rodomos vieną kartą', () => {
  const old = defaultState();
  delete old.newsSeen;
  old.monster = { name: 'Bumbulis', parts: {} };
  const s = migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(newsToShow(s), LATEST_NEWS);
  markNewsSeen(s);
  assert.equal(newsToShow(migrate(JSON.parse(JSON.stringify(s)))), null);
});

test('naujienos: naujam žaidėjui nerodomos', () => {
  const s = defaultState();
  assert.equal(newsToShow(s), null);
  s.monster = { name: 'Bumbulis', parts: {} };
  assert.equal(newsToShow(migrate(JSON.parse(JSON.stringify(s)))), null);
});
