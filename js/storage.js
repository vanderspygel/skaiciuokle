// Duomenų saugojimas localStorage. Viena versijuota struktūra.

const KEY = 'skaiciuokle';
export const SCHEMA_VERSION = 1;

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: Date.now(),
    monster: null, // aktyvus draugas: { uid, kind, name, parts: {...}, wear: {...}, grow }
    friends: [], // kiti draugai (ta pati forma + pos kambaryje)
    stars: 0,
    totalEarned: 0,
    owned: [],
    room: { wallpaper: 'wall-cream', floor: 'floor-wood', items: [], monster: { x: 50, y: 72 } },
    progress: { unlocked: 1, levels: {} },
    stats: {},
    streak: 0,
    counters: { correct: 0, fast: 0, bestStreak: 0, purchases: 0, tests: 0, perfectTests: 0, perfectCheetah: 0, mistakesCleared: 0, fed: 0, written: 0 },
    handwriting: { samples: {} }, // vaiko rašysenos pavyzdžiai: { '3': [suglaudintas debesis, ...] }
    days: { last: null, streak: 0, best: 0, total: 0 },
    tests: [],
    badges: {},
    prefs: { lastSpeed: 'turtle', lastTestCount: 10, lastInput: 'pad' },
  };
}

// Užpildo trūkstamus laukus numatytomis reikšmėmis (atsparu senesniems duomenims).
function fillDefaults(target, defaults) {
  for (const k of Object.keys(defaults)) {
    const d = defaults[k];
    if (!(k in target) || target[k] === undefined) target[k] = d;
    else if (d && typeof d === 'object' && !Array.isArray(d) && target[k] && typeof target[k] === 'object') {
      fillDefaults(target[k], d);
    }
  }
  return target;
}

// Migracijos: kiekviena funkcija perkelia iš versijos N į N+1.
const MIGRATIONS = {
  // 1: s => { ...; s.schemaVersion = 2; return s; },
};

export function migrate(data) {
  if (!data || typeof data !== 'object') return defaultState();
  let s = data;
  let v = s.schemaVersion || 0;
  while (v < SCHEMA_VERSION) {
    const m = MIGRATIONS[v];
    if (m) s = m(s);
    v += 1;
    s.schemaVersion = v;
  }
  return repair(fillDefaults(s, defaultState()));
}

// Draugų laukai, kurių nebuvo senesnėse versijose (be schemos keitimo).
// Senas padarėlis paveldi visą augimą (totalEarned), todėl neprapuola nė vienas etapas.
function repair(s) {
  if (!Array.isArray(s.friends)) s.friends = [];
  const fix = (m, i) => {
    if (!m || typeof m !== 'object') return;
    if (typeof m.grow !== 'number') m.grow = i === 0 ? (s.totalEarned || 0) : 0;
    if (!m.kind) m.kind = 'monster';
    if (!m.uid) m.uid = 'f' + i + Date.now().toString(36);
    if (!m.wear) m.wear = {};
  };
  fix(s.monster, 0);
  s.friends = s.friends.filter(f => f && f.parts);
  s.friends.forEach((f, i) => fix(f, i + 1));
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('Nepavyko nuskaityti duomenų', e);
    return defaultState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('Nepavyko išsaugoti duomenų', e);
    return false;
  }
}

// Ištrina visą progresą (padarėlį, žvaigždutes, pasiekimus, rašyseną).
export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    console.warn('Nepavyko ištrinti duomenų', e);
  }
  return defaultState();
}

export async function requestPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (!already) await navigator.storage.persist();
    }
  } catch (e) {
    // Nepalaikoma – nieko tokio.
  }
}
