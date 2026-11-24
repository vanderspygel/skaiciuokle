import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseKey, summarize, byGroup, weakFacts, slowFacts, factGrid, cellLevel, recentTests, secondsText,
} from '../js/parent.js';
import { makeProblem, makeCompare, statKey } from '../js/math.js';

test('parseKey atpažįsta visų tipų raktus', () => {
  const cases = [
    [makeProblem('add', 3, 4), 'add', '3 + 4'],
    [makeProblem('sub', 9, 2), 'sub', '9 − 2'],
    [makeProblem('missAdd', 3, 4), 'missAdd', '3 + ? = 7'],
    [makeProblem('missSub', 9, 2), 'missSub', '? − 2 = 7'],
    [makeProblem('friend', 3, 0, 10), 'friend', '3 + ? = 10'],
    [makeProblem('friend', 14, 0, 20), 'friend', '14 + ? = 20'],
    [makeProblem('add', 13, 5), 'add', '13 + 5'],
  ];
  for (const [p, kind, text] of cases) {
    const r = parseKey(statKey(p));
    assert.equal(r.kind, kind, p.key);
    assert.equal(r.text, text, p.key);
  }
  assert.equal(parseKey(statKey(makeCompare())).kind, 'compare');
  assert.equal(parseKey('nesąmonė').kind, 'other');
});

const stats = {
  '3+4': { n: 4, err: 2, ms: 32000 },
  '5+5': { n: 5, err: 0, ms: 10000 },
  '9-2': { n: 3, err: 1, ms: 30000 },
  '8+2': { n: 2, err: 0, ms: 20000 },
  '6+1': { n: 1, err: 1, ms: 5000 },
  '3+?=7': { n: 2, err: 2, ms: 12000 },
  cmp: { n: 10, err: 3, ms: 40000 },
};

test('summarize ir byGroup', () => {
  const s = summarize(stats);
  assert.equal(s.n, 27);
  assert.equal(s.err, 9);
  assert.equal(summarize({}).accuracy, 0);
  const g = byGroup(stats);
  assert.deepEqual(g.map(x => x.id), ['add', 'sub', 'miss', 'compare']);
  assert.equal(g[0].n, 12);
  assert.equal(g[0].err, 3);
});

test('weakFacts: pagal klaidų dalį, be palyginimų ir per mažai bandytų', () => {
  const w = weakFacts(stats);
  assert.deepEqual(w.map(f => f.key), ['3+?=7', '3+4', '9-2']);
  assert.ok(!w.some(f => f.key === '6+1')); // tik 1 bandymas
});

test('slowFacts: lėti, net jei be klaidų', () => {
  const sl = slowFacts(stats);
  assert.deepEqual(sl.map(f => f.key), ['9-2', '8+2', '3+4', '3+?=7']);
});

test('factGrid ir cellLevel', () => {
  const add = factGrid(stats, '+', 10);
  assert.equal(add.length, 11);
  assert.equal(add[3][4].n, 4);
  assert.equal(add[5][6], null); // 5 + 6 > 10
  assert.equal(add[0][0].n, 0);
  const sub = factGrid(stats, '-', 10);
  assert.equal(sub[2][9], null); // 2 − 9 nėra
  assert.equal(sub[9][2].err, 1);
  assert.equal(cellLevel(null), 'none');
  assert.equal(cellLevel(add[0][0]), 'none');
  assert.equal(cellLevel(add[5][5]), 'good');
  assert.equal(cellLevel(add[8][2]), 'ok'); // be klaidų, bet 10 s
  assert.equal(cellLevel(sub[9][2]), 'weak');
  assert.equal(cellLevel(add[3][4]), 'weak');
  assert.equal(cellLevel(add[6][1]), 'bad');
});

test('recentTests ir secondsText', () => {
  const t = Array.from({ length: 15 }, (_, i) => ({ date: '2026-11-01', n: 10, ok: i % 11, speed: 'fox', rating: 1 }));
  const r = recentTests(t, 10);
  assert.equal(r.length, 10);
  assert.equal(r[9].ratio, 0.3);
  assert.equal(secondsText(6500), '6,5 s');
});
