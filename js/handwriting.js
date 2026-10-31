// Ranka rašytų skaitmenų atpažinimas be interneto.
// Naudojamas „$P“ taškų debesų atpažinimo metodas (Vatavu, Anthony, Wobbrock, 2012):
// piešinys paverčiamas 32 taškais ir lyginamas su pavyzdžiais. Brūkšnių tvarka
// ir kryptis nesvarbi. Pavyzdžiai – numatytieji (žemiau) ir vaiko paties parašyti.
// Jokių priklausomybių nuo UI.

export const N = 32;

// ---------- $P algoritmas ----------

// stroke = [[x, y], ...]; gesture = [stroke, ...]
function flatten(gesture) {
  const pts = [];
  gesture.forEach((stroke, id) => stroke.forEach(([x, y]) => pts.push({ x, y, id })));
  return pts;
}

function pathLength(pts) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id === pts[i - 1].id) d += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return d;
}

function resample(points, n) {
  const pts = points.map(p => ({ ...p }));
  const I = pathLength(pts) / (n - 1);
  const out = [pts[0]];
  if (I === 0) {
    while (out.length < n) out.push({ ...pts[0] });
    return out;
  }
  let D = 0;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].id !== pts[i - 1].id) continue;
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (D + d >= I && d > 0) {
      const t = (I - D) / d;
      const q = { x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x), y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y), id: pts[i].id };
      out.push(q);
      pts.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function scaleAndCenter(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  const scaled = pts.map(p => ({ x: (p.x - minX) / size, y: (p.y - minY) / size, id: p.id }));
  let cx = 0, cy = 0;
  for (const p of scaled) { cx += p.x; cy += p.y; }
  cx /= scaled.length; cy /= scaled.length;
  return scaled.map(p => ({ x: p.x - cx, y: p.y - cy, id: p.id }));
}

// Piešinys → normalizuotas 32 taškų debesis.
export function normalize(gesture) {
  const pts = flatten(gesture.filter(s => s.length));
  if (!pts.length) return null;
  return scaleAndCenter(resample(pts, N));
}

function cloudDistance(a, b, start) {
  const matched = new Array(N).fill(false);
  let sum = 0;
  let i = start;
  do {
    let min = Infinity, index = -1;
    for (let j = 0; j < N; j++) {
      if (matched[j]) continue;
      const d = (a[i].x - b[j].x) ** 2 + (a[i].y - b[j].y) ** 2;
      if (d < min) { min = d; index = j; }
    }
    matched[index] = true;
    const weight = 1 - ((i - start + N) % N) / N;
    sum += weight * Math.sqrt(min);
    i = (i + 1) % N;
  } while (i !== start);
  return sum;
}

export function cloudMatch(a, b) {
  const step = Math.floor(Math.pow(N, 0.5));
  let min = Infinity;
  for (let i = 0; i < N; i += step) {
    min = Math.min(min, cloudDistance(a, b, i), cloudDistance(b, a, i));
  }
  return min;
}

// ---------- Numatytieji pavyzdžiai ----------
// Koordinatės: x 0–60, y 0–100 (y žemyn). L – atkarpa, A – lankas (laipsniais, 0° = dešinė, 90° = žemyn).

function L(x1, y1, x2, y2, n = 10) {
  const out = [];
  for (let i = 0; i <= n; i++) out.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]);
  return out;
}

function A(cx, cy, rx, ry, a0, a1, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + (a1 - a0) * i / n) * Math.PI / 180;
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return out;
}

const S = (...parts) => parts.flat(); // vienas brūkšnys iš kelių dalių

const DEFAULTS = {
  0: [
    [A(30, 50, 28, 48, -90, 270)],
    [A(30, 50, 20, 48, -100, 260)],
  ],
  1: [
    [L(30, 0, 30, 100)],
    [S(L(10, 28, 32, 0), L(32, 0, 32, 100))],
    [S(L(4, 42, 34, 0), L(34, 0, 34, 100))],
    [S(L(12, 25, 32, 0), L(32, 0, 32, 100)), L(14, 100, 50, 100)],
  ],
  2: [
    [S(A(30, 28, 26, 26, 190, 400), L(50, 45, 4, 100), L(4, 100, 58, 100))],
    [S(A(30, 30, 26, 28, 200, 380), L(55, 40, 4, 100), L(4, 100, 58, 96))],
  ],
  3: [
    [S(A(28, 26, 24, 24, 200, 450), A(28, 75, 26, 25, 270, 500))],
    [S(L(6, 2, 54, 2), L(54, 2, 26, 42), A(28, 72, 28, 28, 270, 500))],
  ],
  4: [
    [S(L(34, 0, 4, 62), L(4, 62, 60, 62)), L(46, 30, 46, 100)],
    [S(L(10, 0, 4, 55), L(4, 55, 58, 55)), L(46, 0, 46, 100)],
    [S(L(42, 100, 42, 0), L(42, 0, 4, 64), L(4, 64, 60, 64))],
  ],
  5: [
    [S(L(50, 0, 10, 0), L(10, 0, 8, 44), A(28, 68, 26, 30, 235, 500))],
    [S(L(10, 0, 8, 44), A(28, 68, 26, 30, 235, 500)), L(10, 0, 52, 0)],
  ],
  6: [
    [S(A(54, 70, 48, 66, 260, 180), A(30, 74, 24, 24, 180, 540))],
    [S(L(44, 0, 10, 60), A(30, 74, 22, 24, 200, 560))],
  ],
  7: [
    [S(L(4, 2, 56, 2), L(56, 2, 22, 100))],
    [S(L(4, 2, 56, 2), L(56, 2, 22, 100)), L(22, 50, 54, 50)],
    [S(L(4, 14, 4, 2), L(4, 2, 56, 2), L(56, 2, 26, 100))],
  ],
  8: [
    [S(A(30, 25, 20, 24, 90, 450), A(30, 74, 26, 26, 270, 630))],
    [S(A(30, 25, 22, 24, 0, 360)), A(30, 74, 26, 26, 270, 630)],
  ],
  9: [
    [S(A(30, 25, 24, 24, 0, 360), L(54, 25, 50, 100))],
    [S(A(30, 25, 24, 24, 0, 360), L(54, 25, 54, 60), A(30, 60, 24, 40, 0, 120))],
    [S(A(30, 25, 24, 24, -10, 360), L(53, 22, 30, 100))],
  ],
};

let defaultTemplates = null;
export function getDefaultTemplates() {
  if (!defaultTemplates) {
    defaultTemplates = [];
    for (const [digit, list] of Object.entries(DEFAULTS)) {
      for (const g of list) defaultTemplates.push({ digit: Number(digit), cloud: normalize(g), own: false });
    }
  }
  return defaultTemplates;
}

// ---------- Vaiko pavyzdžiai (saugomi kompaktiškai) ----------

// Debesis → [x, y, id, ...] sveikais skaičiais (×1000).
export function packCloud(cloud) {
  const out = [];
  for (const p of cloud) out.push(Math.round(p.x * 1000), Math.round(p.y * 1000), p.id);
  return out;
}

export function unpackCloud(arr) {
  const cloud = [];
  for (let i = 0; i < arr.length; i += 3) cloud.push({ x: arr[i] / 1000, y: arr[i + 1] / 1000, id: arr[i + 2] });
  return cloud;
}

export const MAX_SAMPLES = 6;

// samples: { '3': [packed, ...], ... }
export function addSample(samples, digit, gesture) {
  const cloud = normalize(gesture);
  if (!cloud) return false;
  const list = samples[digit] || (samples[digit] = []);
  list.push(packCloud(cloud));
  while (list.length > MAX_SAMPLES) list.shift();
  return true;
}

export function buildTemplates(samples = {}) {
  const own = [];
  for (const [digit, list] of Object.entries(samples)) {
    for (const packed of list) own.push({ digit: Number(digit), cloud: unpackCloud(packed), own: true });
  }
  return [...getDefaultTemplates(), ...own];
}

// ---------- Atpažinimas ----------

// Riba, virš kurios piešinys laikomas neaiškiu. Išmatuota: aiškūs skaitmenys
// ~0,1–0,6, kitokių proporcijų (platūs, siauri) ~1,5–2,0 – bet vis tiek atpažįstami
// teisingai; keverzonės ~1,3–2,6. Riba atlaidi, nes vaikas mato, ką programa
// perskaitė, ir tik tada spaudžia „Tikrinti“ – „nesupratau“ erzina labiau.
export const REJECT_DISTANCE = 2.3;

// Vienas skaitmuo. Grąžina { digit, distance, ranked }.
export function recognizeDigit(gesture, templates) {
  const cloud = normalize(gesture);
  if (!cloud) return null;
  const best = {};
  for (const t of templates) {
    let d = cloudMatch(cloud, t.cloud);
    if (t.own) d *= 0.9; // vaiko pačios rašysena šiek tiek svarbesnė
    if (best[t.digit] === undefined || d < best[t.digit]) best[t.digit] = d;
  }
  const ranked = Object.entries(best).map(([digit, distance]) => ({ digit: Number(digit), distance })).sort((a, b) => a.distance - b.distance);
  return { digit: ranked[0].digit, distance: ranked[0].distance, ranked };
}

function bbox(stroke) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of stroke) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return { minX, maxX, minY, maxY };
}

// Piešinio dydis (didesnė kraštinė). Labai mažas – tikriausiai atsitiktinis bakstelėjimas.
export function gestureSize(gesture) {
  const pts = gesture.flat();
  if (!pts.length) return 0;
  const b = bbox(pts);
  return Math.max(b.maxX - b.minX, b.maxY - b.minY);
}
export const MIN_SIZE = 20;

// Sugrupuoja brūkšnius į skaitmenis pagal horizontalią padėtį
// (persidengiantys ar labai arti esantys brūkšniai – tas pats skaitmuo).
export function splitDigits(gesture) {
  const strokes = gesture.filter(s => s.length);
  if (!strokes.length) return [];
  const all = bbox(strokes.flat());
  const height = Math.max(all.maxY - all.minY, 1);
  const gap = height * 0.12;
  const items = strokes.map(s => ({ s, b: bbox(s) })).sort((a, b) => a.b.minX - b.b.minX);
  const groups = [];
  for (const it of items) {
    const g = groups[groups.length - 1];
    if (g && it.b.minX <= g.maxX + gap) {
      g.strokes.push(it.s);
      g.maxX = Math.max(g.maxX, it.b.maxX);
    } else {
      groups.push({ strokes: [it.s], maxX: it.b.maxX });
    }
  }
  return groups.map(g => g.strokes);
}

// Visas skaičius (pvz., „10“). Grąžina { value, digits, groups } arba { value: null }.
export function recognizeNumber(gesture, templates, max = 10) {
  if (gestureSize(gesture) < MIN_SIZE) return { value: null, groups: [] };
  const groups = splitDigits(gesture);
  if (!groups.length || groups.length > 2) return { value: null, groups };
  const results = groups.map(g => recognizeDigit(g, templates));
  if (results.some(r => !r || r.distance > REJECT_DISTANCE)) return { value: null, groups, results };
  let digits = results.map(r => r.digit);
  // Dviženklis: pirmas skaitmuo turi būti 1 (iki 10 – tik „10“). Jei pirmas
  // panašus į 1 kaip antras variantas – pasitikim juo.
  if (digits.length === 2 && digits[0] !== 1) {
    const one = results[0].ranked.find(r => r.digit === 1);
    if (one && one.distance < results[0].distance * 1.4) digits[0] = 1;
  }
  if (digits.length === 2 && max <= 10 && digits[1] !== 0) {
    const zero = results[1].ranked.find(r => r.digit === 0);
    if (zero && zero.distance < results[1].distance * 1.4) digits[1] = 0;
  }
  const value = Number(digits.join(''));
  if (value > max) return { value: null, groups, results };
  return { value, digits, groups, results };
}
