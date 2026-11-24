// Matematikos variklis: užduočių generavimas, adaptyvus parinkimas,
// atsakymų variantai. Jokių priklausomybių nuo UI ar naršyklės.

export const DEFAULT_LIMITS = Object.freeze({ maxNumber: 10, maxResult: 10 });

export const KINDS = ['add', 'sub', 'missAdd', 'missSub', 'friend', 'compare'];

// Atsitiktinių skaičių generatorius su sėkla (testams).
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Užduočių kūrimas ----------

// Sukuria užduotį iš tipo ir dviejų skaičių.
//  add:     a + b = ?
//  sub:     a − b = ?
//  missAdd: a + ? = c      (b = c − a)
//  missSub: ? − b = c      (a = b + c)
//  friend:  a + ? = 10     (draugiški skaičiai; arba iki 20)
export function makeProblem(kind, a, b, friendTarget = 10) {
  switch (kind) {
    case 'add':
      return { kind, key: `${a}+${b}`, a, b, op: '+', answer: a + b, parts: [a, '+', b, '=', '?'] };
    case 'sub':
      return { kind, key: `${a}-${b}`, a, b, op: '-', answer: a - b, parts: [a, '−', b, '=', '?'] };
    case 'missAdd': {
      const c = a + b;
      return { kind, key: `${a}+?=${c}`, a, b, op: '+', answer: b, parts: [a, '+', '?', '=', c] };
    }
    case 'missSub': {
      const c = a - b;
      return { kind, key: `?-${b}=${c}`, a, b, op: '-', answer: a, parts: ['?', '−', b, '=', c] };
    }
    case 'friend':
      return { kind, key: friendTarget === 10 ? `draugas:${a}` : `draugas${friendTarget}:${a}`, a, b: friendTarget - a, op: '+', answer: friendTarget - a, target: friendTarget, parts: [a, '+', '?', '=', friendTarget] };
    default:
      throw new Error(`Nežinomas tipas: ${kind}`);
  }
}

// Faktų atrankos žaidimui iki 20 (a, b – kaip makeProblem).
//  teen:        rezultatas ar mažinamasis didesnis už 10;
//  teenNoCross: be perėjimo per dešimtį (13 + 4, 17 − 4);
//  teenCross:   per dešimtį (8 + 5, 13 − 5).
// Atimtyje atimamasis ne didesnis už 10 – pirmokams dviženklis atimamasis per sunku.
const crosses = (op, a, b) => (op === '+' ? (a % 10) + (b % 10) > 10 : (a % 10) < (b % 10));
const isTeen = (op, a, b) => (op === '+' ? a + b > 10 && Math.min(a, b) <= 10 : a > 10 && b <= 10);
export const FACT_FILTERS = {
  teen: (op, a, b) => isTeen(op, a, b),
  teenNoCross: (op, a, b) => isTeen(op, a, b) && !crosses(op, a, b),
  teenCross: (op, a, b) => isTeen(op, a, b) && crosses(op, a, b),
};

// Visi galimi faktai (a, b) tipui pagal ribas (ir pasirinktą atranką).
export function enumerateFacts(kind, limits = DEFAULT_LIMITS, filter = null, friendTarget = null) {
  const keep = filter ? FACT_FILTERS[filter] : null;
  if (filter && !keep) throw new Error(`Nežinoma atranka: ${filter}`);
  const { maxNumber, maxResult } = limits;
  const out = [];
  if (kind === 'add' || kind === 'missAdd') {
    for (let a = 0; a <= maxNumber; a++)
      for (let b = 0; b <= maxNumber; b++)
        if (a + b <= maxResult && (!keep || keep('+', a, b))) out.push(makeProblem(kind, a, b));
  } else if (kind === 'sub' || kind === 'missSub') {
    for (let a = 0; a <= maxNumber; a++)
      for (let b = 0; b <= a; b++)
        if (a - b <= maxResult && (!keep || keep('-', a, b))) out.push(makeProblem(kind, a, b));
  } else if (kind === 'friend') {
    const target = Math.min(friendTarget || 10, maxResult);
    // Iki 20 – nuo 10 (14 + ? = 20), mažesni skaičiai čia per sunkūs.
    for (let a = target > 10 ? 10 : 0; a <= target; a++) out.push(makeProblem('friend', a, 0, target));
  }
  return out;
}

// Palyginimas: kuris reiškinys didesnis? Reikšmės niekada nelygios.
export function makeCompare(rng = Math.random, limits = DEFAULT_LIMITS) {
  const expr = () => {
    const op = rng() < 0.5 ? '+' : '-';
    if (op === '+') {
      const a = randInt(rng, 0, Math.min(limits.maxNumber, limits.maxResult));
      const b = randInt(rng, 0, Math.min(limits.maxNumber, limits.maxResult - a));
      return { a, b, op, value: a + b, text: `${a} + ${b}` };
    }
    const a = randInt(rng, 1, limits.maxNumber);
    const b = randInt(rng, 0, a);
    return { a, b, op, value: a - b, text: `${a} − ${b}` };
  };
  const left = expr();
  let right = expr();
  for (let i = 0; i < 50 && right.value === left.value; i++) right = expr();
  if (right.value === left.value) {
    // Retas atvejis – pataisom ranka.
    right = left.value > 0 ? { a: left.value - 1, b: 0, op: '+', value: left.value - 1, text: `${left.value - 1} + 0` }
                           : { a: 1, b: 0, op: '+', value: 1, text: '1 + 0' };
  }
  return {
    kind: 'compare',
    key: `cmp:${left.text}|${right.text}`,
    statKey: 'cmp',
    left, right,
    answer: left.value > right.value ? 'left' : 'right',
  };
}

// Statistikos raktas: palyginimai kaupiami kartu.
export function statKey(problem) {
  return problem.statKey || problem.key;
}

// ---------- Statistika ir svoriai ----------

export const TARGET_MS = 6000;

// Įrašo atsakymą į statistiką: bandymai, klaidos, bendras laikas (vidurkiui).
export function recordResult(stats, problem, correct, ms) {
  const k = statKey(problem);
  const s = stats[k] || (stats[k] = { n: 0, err: 0, ms: 0 });
  s.n += 1;
  if (!correct) s.err += 1;
  s.ms += Math.max(0, Math.min(ms || 0, 60000));
  return s;
}

export function averageMs(stat) {
  return stat && stat.n ? stat.ms / stat.n : 0;
}

// Svoris: daugiau klaidų ir ilgesnis atsakymo laikas → dažniau.
export function factWeight(problem, stat) {
  let base = 1;
  if (problem.kind === 'add' || problem.kind === 'sub') {
    if (problem.b === 0) base = 0.3;
    else if (problem.kind === 'sub' && problem.a === problem.b) base = 0.5;
  }
  if (problem.kind === 'missAdd' || problem.kind === 'missSub') {
    if (problem.b === 0 || problem.answer === 0) base = 0.4;
  }
  if (!stat || !stat.n) return base * 1.5;
  const errRate = (stat.err + 0.5) / (stat.n + 1);
  const slow = Math.min(3, Math.max(0.5, averageMs(stat) / TARGET_MS));
  return base * (0.4 + 4 * errRate) * slow;
}

export function pickWeighted(items, weights, rng = Math.random) {
  let total = 0;
  for (const w of weights) total += w;
  if (total <= 0) return items[Math.floor(rng() * items.length)];
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

// ---------- Planuoklė ----------

function hasNoKinds(sources) {
  return !sources || !sources.length || sources.every(src => !src.kinds || !src.kinds.length);
}

// Parenka kitą užduotį:
//  • svertinis atsitiktinumas pagal statistiką;
//  • neteisingai atsakyta užduotis grįžta po 2–4 kitų;
//  • ta pati užduotis du kartus iš eilės nekartojama.
export class Scheduler {
  // sources: [{ kinds, limits, filter, friendTarget }] – keli lygiai kartu
  // (mintinai ir kontroliniam). Paprastai užtenka kinds + limits.
  constructor({ kinds, limits = DEFAULT_LIMITS, sources = null, stats = {}, rng = Math.random }) {
    if (!sources) sources = [{ kinds, limits }];
    if (hasNoKinds(sources)) throw new Error('Reikia bent vieno užduočių tipo');
    kinds = [...new Set(sources.flatMap(src => src.kinds))];
    if (!kinds.length) throw new Error('Reikia bent vieno užduočių tipo');
    this.kinds = kinds;
    // Palyginimui – didžiausios ribos iš lygių, kuriuose jis yra.
    const cmp = sources.filter(src => src.kinds.includes('compare')).map(src => src.limits || DEFAULT_LIMITS);
    this.limits = cmp.length
      ? cmp.reduce((m, l) => (l.maxNumber + l.maxResult > m.maxNumber + m.maxResult ? l : m))
      : (sources[0].limits || DEFAULT_LIMITS);
    this.stats = stats;
    this.rng = rng;
    this.served = 0;
    this.lastKey = null;
    this.recent = [];
    this.retries = [];
    this.facts = {};
    for (const k of this.kinds) {
      if (k === 'compare') continue;
      const seen = new Map();
      for (const src of sources) {
        if (!src.kinds.includes(k)) continue;
        for (const f of enumerateFacts(k, src.limits || DEFAULT_LIMITS, src.filter, src.friendTarget)) {
          if (!seen.has(f.key)) seen.set(f.key, f);
        }
      }
      this.facts[k] = [...seen.values()];
    }
  }

  next() {
    const idx = this.served + 1;
    const dueIdx = this.retries.findIndex(r => r.due <= idx && r.problem.key !== this.lastKey);
    let problem;
    if (dueIdx >= 0) {
      problem = this.retries.splice(dueIdx, 1)[0].problem;
    } else {
      problem = this._pickFresh();
    }
    this.served = idx;
    this.lastKey = problem.key;
    this.recent.push(problem.key);
    if (this.recent.length > 4) this.recent.shift();
    return problem;
  }

  // Po atsakymo: klaidingą užduotį suplanuojam pakartoti.
  report(problem, correct) {
    if (correct) return;
    if (this.retries.some(r => r.problem.key === problem.key)) return;
    const gap = randInt(this.rng, 2, 4);
    this.retries.push({ problem, due: this.served + gap + 1 });
  }

  _kindWeight(kind) {
    if (kind === 'compare') return 1;
    const facts = this.facts[kind];
    if (!facts.length) return 0;
    let sum = 0;
    for (const f of facts) sum += factWeight(f, this.stats[f.key]);
    return sum / facts.length;
  }

  _pickFresh() {
    const kindWeights = this.kinds.map(k => this._kindWeight(k));
    for (let attempt = 0; attempt < 20; attempt++) {
      const kind = pickWeighted(this.kinds, kindWeights, this.rng);
      if (kind === 'compare') {
        const p = makeCompare(this.rng, this.limits);
        if (p.key !== this.lastKey) return p;
        continue;
      }
      const facts = this.facts[kind].filter(f => f.key !== this.lastKey);
      if (!facts.length) continue;
      const weights = facts.map(f => {
        let w = factWeight(f, this.stats[f.key]);
        if (this.recent.includes(f.key)) w *= 0.25;
        return w;
      });
      return pickWeighted(facts, weights, this.rng);
    }
    // Atsarginis kelias (pvz., tik vienas faktas).
    const kind = this.kinds.find(k => k === 'compare' || this.facts[k].length);
    return kind === 'compare' ? makeCompare(this.rng, this.limits) : this.facts[kind][0];
  }
}

// ---------- Atsakymų variantai ----------

// Klaidingi variantai artimi teisingam: ±1, ±2, sukeisti veiksmai.
export function makeChoices(problem, count = 4, rng = Math.random, limits = DEFAULT_LIMITS) {
  if (problem.kind === 'compare') return ['left', 'right'];
  const ans = problem.answer;
  const max = Math.max(limits.maxResult, limits.maxNumber, ans);
  const ok = v => Number.isInteger(v) && v >= 0 && v <= max && v !== ans;

  const near = [ans - 1, ans + 1].filter(ok);
  const other = [ans - 2, ans + 2];
  // Sukeistas veiksmas: a+b vietoj a−b ir atvirkščiai.
  if (problem.kind === 'add') other.push(Math.abs(problem.a - problem.b));
  if (problem.kind === 'sub') other.push(problem.a + problem.b);
  if (problem.kind === 'missAdd') other.push(problem.parts[4], problem.a);
  if (problem.kind === 'missSub') other.push(problem.parts[4] - problem.b, problem.parts[4]);
  if (problem.kind === 'friend') other.push(problem.a);

  const picked = [];
  const add = v => { if (ok(v) && !picked.includes(v)) picked.push(v); };
  shuffle(near, rng).forEach(add);
  shuffle(other, rng).forEach(add);
  let guard = 0;
  while (picked.length < count - 1 && guard++ < 100) add(randInt(rng, 0, max));
  return shuffle([ans, ...picked.slice(0, count - 1)], rng);
}

// Užduotis tėvams (apsauga nuo atsitiktinio ištrynimo): dviženkliai skaičiai iki 100.
export function makeGateProblem(rng = Math.random) {
  if (rng() < 0.5) {
    const a = randInt(rng, 12, 88);
    const b = randInt(rng, 11, 100 - a);
    return { text: `${a} + ${b}`, answer: a + b };
  }
  const a = randInt(rng, 31, 99);
  const b = randInt(rng, 11, a - 11);
  return { text: `${a} − ${b}`, answer: a - b };
}

export function checkAnswer(problem, value) {
  return value === problem.answer;
}

// Užduoties tekstas (klaidų sąrašui ir pan.).
export function problemText(problem) {
  if (problem.kind === 'compare') return `${problem.left.text}  ?  ${problem.right.text}`;
  return problem.parts.join(' ');
}

export function answerText(problem, value) {
  if (value === null || value === undefined) return '—';
  if (problem.kind === 'compare') {
    return value === 'left' ? problem.left.text : problem.right.text;
  }
  return String(value);
}
