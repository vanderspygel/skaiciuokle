import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize, recognizeDigit, recognizeNumber, splitDigits, buildTemplates,
  getDefaultTemplates, addSample, packCloud, unpackCloud, N, REJECT_DISTANCE,
} from '../js/handwriting.js';
import { mulberry32 } from '../js/math.js';

// Pavyzdžiai „ranka“: tie patys skaitmenys, bet kitaip nupiešti (kitas dydis,
// pasvirimas, drebanti ranka) – kad testas nebūtų vien šablonų kopija.
const line = (x1, y1, x2, y2, n = 12) => Array.from({ length: n + 1 }, (_, i) => [x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]);
const arc = (cx, cy, rx, ry, a0, a1, n = 30) => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
  return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
});

const HAND = {
  0: [arc(100, 100, 45, 70, -80, 285)],
  1: [[...line(80, 70, 110, 30), ...line(110, 30, 108, 170)]],
  2: [[...arc(100, 70, 40, 40, 200, 395), ...line(137, 85, 62, 170), ...line(62, 170, 145, 168)]],
  3: [[...arc(100, 65, 35, 32, 210, 440), ...arc(100, 130, 40, 36, 265, 495)]],
  4: [[...line(110, 30, 62, 120), ...line(62, 120, 150, 118)], line(128, 70, 126, 175)],
  5: [[...line(140, 30, 80, 30), ...line(80, 30, 76, 95), ...arc(105, 125, 40, 42, 230, 500)]],
  6: [[...arc(160, 130, 80, 100, 262, 182), ...arc(115, 135, 38, 38, 180, 535)]],
  7: [[...line(60, 30, 140, 32), ...line(140, 32, 95, 170)], line(90, 100, 135, 98)],
  8: [[...arc(100, 60, 30, 32, 95, 455), ...arc(100, 128, 38, 38, 265, 625)]],
  9: [[...arc(100, 65, 35, 34, 5, 365), ...line(135, 65, 128, 170)]],
};

function jitter(gesture, rng, amount, dx = 0, scale = 1) {
  return gesture.map(s => s.map(([x, y]) => [x * scale + dx + (rng() - 0.5) * amount, y * scale + (rng() - 0.5) * amount]));
}

test('normalize grąžina 32 taškus', () => {
  const c = normalize(HAND[3]);
  assert.equal(c.length, N);
  assert.equal(normalize([]), null);
});

test('visi skaitmenys 0–9 turi numatytųjų šablonų', () => {
  const digits = new Set(getDefaultTemplates().map(t => t.digit));
  assert.equal(digits.size, 10);
});

test('ranka nupiešti skaitmenys atpažįstami (su drebėjimu ir kitu dydžiu)', () => {
  const tpl = buildTemplates();
  const rng = mulberry32(4);
  const misses = [];
  for (let round = 0; round < 5; round++) {
    for (const [digit, g] of Object.entries(HAND)) {
      const scale = 0.6 + rng() * 1.2;
      const r = recognizeDigit(jitter(g, rng, 6, rng() * 200, scale), tpl);
      if (r.digit !== Number(digit)) misses.push(`${digit}→${r.digit}`);
      assert.ok(r.distance < REJECT_DISTANCE, `${digit}: atstumas ${r.distance.toFixed(2)}`);
    }
  }
  assert.ok(misses.length <= 2, `klaidos: ${misses.join(', ')}`);
});

test('„10“ skaidomas į du skaitmenis', () => {
  const one = HAND[1];
  const zero = HAND[0].map(s => s.map(([x, y]) => [x + 110, y]));
  const groups = splitDigits([...one, ...zero]);
  assert.equal(groups.length, 2);
  const r = recognizeNumber([...one, ...zero], buildTemplates());
  assert.equal(r.value, 10);
});

test('dviejų brūkšnių skaitmuo (4, 7) lieka vienas', () => {
  assert.equal(splitDigits(HAND[4]).length, 1);
  assert.equal(splitDigits(HAND[7]).length, 1);
  assert.equal(recognizeNumber(HAND[4], buildTemplates()).value, 4);
});

test('daugiau nei du skaitmenys – neaišku', () => {
  const g = [line(0, 0, 0, 100), line(100, 0, 100, 100), line(200, 0, 200, 100)];
  assert.equal(recognizeNumber(g, buildTemplates()).value, null);
});

test('vaiko pavyzdys išmokomas', () => {
  // Neįprastas „4“ – trikampis su kotu.
  const weird4 = [[...line(50, 0, 0, 60), ...line(0, 60, 60, 60), ...line(60, 60, 50, 0)], line(50, 0, 50, 100)];
  const samples = {};
  addSample(samples, 4, weird4);
  const r = recognizeDigit(jitter(weird4, mulberry32(1), 4), buildTemplates(samples));
  assert.equal(r.digit, 4);
});

test('pavyzdžių glaudinimas ir riba', () => {
  const c = normalize(HAND[8]);
  const back = unpackCloud(packCloud(c));
  assert.equal(back.length, N);
  assert.ok(Math.abs(back[5].x - c[5].x) < 0.001);
  const samples = {};
  for (let i = 0; i < 10; i++) addSample(samples, 8, HAND[8]);
  assert.equal(samples[8].length, 6);
});
