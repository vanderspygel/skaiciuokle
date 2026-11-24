// Tėvų ataskaita: kas sekasi, kas ne. Gryna logika (be UI), dirba su
// state.stats ({ raktas: { n, err, ms } }), kurį pildo math.js recordResult.

// Užduoties raktas → tipas ir žmogui skaitomas tekstas.
//  "3+4" → add, "5-2" → sub, "3+?=7" → missAdd, "?-2=5" → missSub,
//  "draugas:3" / "draugas20:14" → friend, "cmp" → compare.
export function parseKey(key) {
  let m;
  if (key === 'cmp') return { kind: 'compare', text: 'Palyginimas (kuris didesnis?)' };
  if ((m = /^draugas(\d*):(\d+)$/.exec(key))) {
    const target = m[1] ? Number(m[1]) : 10;
    return { kind: 'friend', a: Number(m[2]), text: `${m[2]} + ? = ${target}` };
  }
  if ((m = /^(\d+)\+\?=(\d+)$/.exec(key))) return { kind: 'missAdd', text: `${m[1]} + ? = ${m[2]}` };
  if ((m = /^\?-(\d+)=(\d+)$/.exec(key))) return { kind: 'missSub', text: `? − ${m[1]} = ${m[2]}` };
  if ((m = /^(\d+)\+(\d+)$/.exec(key))) return { kind: 'add', a: Number(m[1]), b: Number(m[2]), text: `${m[1]} + ${m[2]}` };
  if ((m = /^(\d+)-(\d+)$/.exec(key))) return { kind: 'sub', a: Number(m[1]), b: Number(m[2]), text: `${m[1]} − ${m[2]}` };
  return { kind: 'other', text: key };
}

// Užduočių grupės ataskaitoje.
export const KIND_GROUPS = [
  { id: 'add', title: 'Sudėtis', kinds: ['add'] },
  { id: 'sub', title: 'Atimtis', kinds: ['sub'] },
  { id: 'miss', title: 'Kas pasislėpė?', kinds: ['missAdd', 'missSub'] },
  { id: 'friend', title: 'Draugiški skaičiai', kinds: ['friend'] },
  { id: 'compare', title: 'Palyginimas', kinds: ['compare'] },
];

const pct = (part, whole) => (whole ? part / whole : 0);

// Bendra suvestinė: bandymai, klaidos, tikslumas, vidutinis laikas.
export function summarize(stats) {
  let n = 0, err = 0, ms = 0;
  for (const s of Object.values(stats || {})) { n += s.n; err += s.err; ms += s.ms; }
  return { n, err, accuracy: pct(n - err, n), avgMs: n ? ms / n : 0 };
}

// Suvestinė pagal užduočių grupes (tik tos, kuriose buvo bandymų).
export function byGroup(stats) {
  const out = KIND_GROUPS.map(g => ({ ...g, n: 0, err: 0, ms: 0 }));
  for (const [key, s] of Object.entries(stats || {})) {
    const kind = parseKey(key).kind;
    const g = out.find(x => x.kinds.includes(kind));
    if (!g) continue;
    g.n += s.n; g.err += s.err; g.ms += s.ms;
  }
  return out.filter(g => g.n > 0).map(g => ({
    id: g.id, title: g.title, n: g.n, err: g.err,
    accuracy: pct(g.n - g.err, g.n), avgMs: g.ms / g.n,
  }));
}

// Visos užduotys su bent minTries bandymų, kaip sąrašas.
function factList(stats, minTries) {
  return Object.entries(stats || {})
    .filter(([key, s]) => key !== 'cmp' && s.n >= minTries)
    .map(([key, s]) => ({ key, ...parseKey(key), n: s.n, err: s.err, errRate: s.err / s.n, avgMs: s.ms / s.n }));
}

// Sunkiausios užduotys: daugiausia klaidų (dalis), paskui – lėčiausios.
// Rodomos tik tos, kuriose buvo bent viena klaida.
export function weakFacts(stats, { minTries = 2, limit = 10 } = {}) {
  return factList(stats, minTries)
    .filter(f => f.err > 0)
    .sort((x, y) => y.errRate - x.errRate || y.err - x.err || y.avgMs - x.avgMs)
    .slice(0, limit);
}

// Lėčiausiai išsprendžiamos užduotys (net jei be klaidų) – dar neautomatizuotos.
export function slowFacts(stats, { minTries = 2, limit = 6, minMs = 6000 } = {}) {
  return factList(stats, minTries)
    .filter(f => f.avgMs >= minMs)
    .sort((x, y) => y.avgMs - x.avgMs)
    .slice(0, limit);
}

// Lentelė sudėčiai / atimčiai iki max: eilutės a, stulpeliai b.
// Langelis: null (tokios užduoties nėra), { n: 0 } (nebandyta) arba statistika.
export function factGrid(stats, op, max = 10) {
  const rows = [];
  for (let a = 0; a <= max; a++) {
    const row = [];
    for (let b = 0; b <= max; b++) {
      const valid = op === '+' ? a + b <= max : b <= a;
      if (!valid) { row.push(null); continue; }
      const s = (stats || {})[op === '+' ? `${a}+${b}` : `${a}-${b}`];
      row.push(s && s.n ? { n: s.n, err: s.err, errRate: s.err / s.n, avgMs: s.ms / s.n } : { n: 0 });
    }
    rows.push(row);
  }
  return rows;
}

// Langelio spalvos lygis: 'none' (nebandyta), 'good', 'ok', 'weak', 'bad'.
export function cellLevel(cell) {
  if (!cell || !cell.n) return 'none';
  if (cell.errRate === 0) return cell.avgMs > 8000 ? 'ok' : 'good';
  if (cell.errRate <= 0.25) return 'ok';
  if (cell.errRate <= 0.5) return 'weak';
  return 'bad';
}

// Kontrolinių eiga: paskutiniai count, nuo seniausio.
export function recentTests(tests, count = 10) {
  return (tests || []).slice(-count).map(t => ({ ...t, ratio: pct(t.ok, t.n) }));
}

export function secondsText(ms) {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`;
}

export function percentText(ratio) {
  return `${Math.round(ratio * 100)} %`;
}
