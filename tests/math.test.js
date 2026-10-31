import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  makeProblem, enumerateFacts, makeCompare, makeChoices, checkAnswer,
  Scheduler, recordResult, factWeight, mulberry32, pickWeighted, problemText,
} from '../js/math.js';

const L10 = { maxNumber: 10, maxResult: 10 };
const L5 = { maxNumber: 5, maxResult: 5 };

test('sudėties faktai neviršija ribų', () => {
  const facts = enumerateFacts('add', L10);
  assert.equal(facts.length, 66);
  for (const f of facts) {
    assert.ok(f.a >= 0 && f.b >= 0 && f.a <= 10 && f.b <= 10);
    assert.ok(f.answer <= 10);
    assert.equal(f.answer, f.a + f.b);
  }
  for (const f of enumerateFacts('add', L5)) assert.ok(f.answer <= 5);
});

test('atimties rezultatas niekada neneigiamas', () => {
  const facts = enumerateFacts('sub', L10);
  assert.equal(facts.length, 66);
  for (const f of facts) {
    assert.ok(f.answer >= 0);
    assert.ok(f.a <= 10);
    assert.equal(f.answer, f.a - f.b);
  }
});

test('trūkstamo skaičiaus užduotys', () => {
  const p = makeProblem('missAdd', 3, 4);
  assert.deepEqual(p.parts, [3, '+', '?', '=', 7]);
  assert.equal(p.answer, 4);
  const q = makeProblem('missSub', 7, 2);
  assert.deepEqual(q.parts, ['?', '−', 2, '=', 5]);
  assert.equal(q.answer, 7);
  for (const f of enumerateFacts('missSub', L10)) assert.ok(f.answer <= 10 && f.parts[4] >= 0);
});

test('draugiški skaičiai iki 10', () => {
  const facts = enumerateFacts('friend', L10);
  assert.equal(facts.length, 11);
  for (const f of facts) assert.equal(f.a + f.answer, 10);
});

test('ribos konfigūruojamos (iki 20)', () => {
  const facts = enumerateFacts('add', { maxNumber: 20, maxResult: 20 });
  assert.ok(facts.some(f => f.answer === 20));
  assert.ok(facts.every(f => f.answer <= 20));
});

test('palyginime reikšmės niekada nelygios ir ribose', () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 500; i++) {
    const p = makeCompare(rng, L10);
    assert.notEqual(p.left.value, p.right.value);
    for (const side of [p.left, p.right]) assert.ok(side.value >= 0 && side.value <= 10);
    assert.equal(p.answer, p.left.value > p.right.value ? 'left' : 'right');
    assert.ok(checkAnswer(p, p.answer));
  }
});

test('atsakymų variantai: unikalūs, yra teisingas, artimi', () => {
  const rng = mulberry32(7);
  for (const f of [...enumerateFacts('add', L10), ...enumerateFacts('sub', L10), ...enumerateFacts('missAdd', L10)]) {
    const ch = makeChoices(f, 4, rng, L10);
    assert.equal(ch.length, 4, problemText(f));
    assert.equal(new Set(ch).size, 4);
    assert.ok(ch.includes(f.answer));
    for (const c of ch) assert.ok(c >= 0 && c <= 10);
  }
  // Mažose ribose (1 lygis) – 3 variantai, visi ≤ 5.
  for (const f of enumerateFacts('add', L5)) {
    const ch = makeChoices(f, 3, rng, L5);
    assert.equal(ch.length, 3);
    assert.ok(ch.every(c => c >= 0 && c <= 5));
  }
});

test('variantuose dažniausiai yra ±1', () => {
  const rng = mulberry32(3);
  const p = makeProblem('add', 3, 4);
  for (let i = 0; i < 50; i++) {
    const ch = makeChoices(p, 4, rng, L10);
    assert.ok(ch.includes(6) && ch.includes(8));
  }
});

test('ta pati užduotis nekartojama du kartus iš eilės', () => {
  const s = new Scheduler({ kinds: ['add'], limits: { maxNumber: 2, maxResult: 2 }, rng: mulberry32(11) });
  let prev = null;
  for (let i = 0; i < 300; i++) {
    const p = s.next();
    assert.notEqual(p.key, prev);
    prev = p.key;
    s.report(p, i % 3 !== 0);
  }
});

test('klaidinga užduotis grįžta po 2–4 kitų', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const s = new Scheduler({ kinds: ['add', 'sub'], limits: L10, rng: mulberry32(seed) });
    const wrong = s.next();
    s.report(wrong, false);
    const seen = [];
    for (let i = 0; i < 6; i++) {
      const p = s.next();
      seen.push(p.key);
      s.report(p, true);
    }
    const pos = seen.indexOf(wrong.key);
    assert.ok(pos >= 2 && pos <= 4, `seed ${seed}: pozicija ${pos}`);
  }
});

test('svoriai: daugiau klaidų ir lėčiau → didesnis svoris', () => {
  const p = makeProblem('sub', 8, 5);
  const good = { n: 10, err: 0, ms: 10 * 3000 };
  const bad = { n: 10, err: 5, ms: 10 * 3000 };
  const slow = { n: 10, err: 0, ms: 10 * 15000 };
  assert.ok(factWeight(p, bad) > factWeight(p, good));
  assert.ok(factWeight(p, slow) > factWeight(p, good));
});

test('adaptyvumas: sunkus faktas pasirodo dažniau', () => {
  const stats = {};
  for (const f of enumerateFacts('sub', L10)) stats[f.key] = { n: 10, err: 0, ms: 10 * 3000 };
  stats['8-5'] = { n: 10, err: 7, ms: 10 * 12000 };
  const s = new Scheduler({ kinds: ['sub'], limits: L10, stats, rng: mulberry32(5) });
  let hits = 0;
  const N = 2000;
  for (let i = 0; i < N; i++) {
    const p = s.next();
    if (p.key === '8-5') hits++;
  }
  // Be adaptyvumo būtų ~1/66 ≈ 30 kartų.
  assert.ok(hits > 150, `8−5 pasirodė ${hits} kartų`);
});

test('recordResult kaupia bandymus, klaidas ir laiką', () => {
  const stats = {};
  const p = makeProblem('add', 2, 3);
  recordResult(stats, p, true, 2000);
  recordResult(stats, p, false, 4000);
  assert.deepEqual(stats['2+3'], { n: 2, err: 1, ms: 6000 });
  const c = makeCompare(mulberry32(1));
  recordResult(stats, c, true, 1000);
  assert.equal(stats.cmp.n, 1);
});

test('pickWeighted gerbia svorius', () => {
  const rng = mulberry32(9);
  let a = 0;
  for (let i = 0; i < 1000; i++) if (pickWeighted(['a', 'b'], [9, 1], rng) === 'a') a++;
  assert.ok(a > 850 && a < 950);
});

test('mišrūs tipai visi pasirodo', () => {
  const s = new Scheduler({ kinds: ['add', 'sub', 'missAdd', 'missSub', 'friend', 'compare'], limits: L10, rng: mulberry32(2) });
  const kinds = new Set();
  for (let i = 0; i < 300; i++) kinds.add(s.next().kind);
  assert.equal(kinds.size, 6);
});
