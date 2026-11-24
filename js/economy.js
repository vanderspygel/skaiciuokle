// Žvaigždučių ekonomika: kiek moka užduotys, deimantai, dienos užduotis,
// įgūdžiai (užraktai) ir parduotuvės pakopos. Gryna logika, be UI.
//
// Raundo žvaigždutės = Σ(užduoties taškai × įvaldymas) × greitis × įvertinimas × kartojimas.
// Lengvi, jau išmokti dalykai moka mažai, sunkūs ir nauji – daug.

import { SPEEDS, STAGES, GAMES } from './config.js';
import { averageMs } from './math.js';

// ---------- Užduoties taškai ----------

const crosses = (op, a, b) => (op === '+' ? (a % 10) + (b % 10) > 10 : (a % 10) < (b % 10));

// 2 – sudėtis/atimtis iki 10; 3 – „kas pasislėpė“, palyginimas, draugai iki 10, iki 20 be perėjimo;
// 5 – iki 20 per dešimtį, „kas pasislėpė“ ir draugai iki 20.
export function problemPoints(p) {
  if (!p) return 0;
  if (p.kind === 'compare') return 3;
  if (p.kind === 'friend') return p.target > 10 ? 5 : 3;
  const teen = (p.op === '+' ? p.a + p.b : p.a) > 10;
  if (p.kind === 'missAdd' || p.kind === 'missSub') return teen ? 5 : 3;
  if (!teen) return 2;
  return crosses(p.op, p.a, p.b) ? 5 : 3;
}

// Įvaldymas pagal sukauptą statistiką (prieš šį atsakymą):
// išmokta (5+ bandymai, ≤10 % klaidų, greičiau nei 4 s) ×0,5; nauja ar dažnai klystama ×1,5.
export function masteryFactor(stat) {
  if (!stat || stat.n < 3) return 1.5;
  const errRate = stat.err / stat.n;
  if (errRate > 0.3) return 1.5;
  if (stat.n >= 5 && errRate <= 0.1 && averageMs(stat) < 4000) return 0.5;
  return 1;
}

// ---------- Daugikliai ----------

export function speedIndex(id) {
  return SPEEDS.findIndex(s => s.id === id);
}

export function speedMult(id) {
  const sp = SPEEDS.find(s => s.id === id);
  return sp ? sp.mult : 1;
}

export const WRITE_MULT = 1.5;

export function modeMult(mode, speedId) {
  if (mode === 'mental' || mode === 'test') return speedMult(speedId);
  if (mode === 'write') return WRITE_MULT;
  return 1;
}

// Įvertinimas švelnus: niekada neatima visko.
export function ratingMult(ok, total) {
  const r = total ? ok / total : 0;
  if (r >= 1) return 1.5;
  if (r >= 0.8) return 1;
  if (r >= 0.6) return 0.8;
  if (r >= 0.4) return 0.6;
  return 0.4;
}

// Kartojimas – tai mokymasis: tas pats lygis tą pačią dieną 1–3 kartus moka pilnai,
// 4–6 – ×0,8, toliau – ×0,6 (ne mažiau). Tik „Skaičiuoti“ režime.
export function repeatMult(roundsBefore) {
  if (roundsBefore < 3) return 1;
  if (roundsBefore < 6) return 0.8;
  return 0.6;
}

// Augantis serijos priedas: 5 iš eilės +1, 10 +2, 15 ir daugiau – +3 (kas 5).
export function streakBonus(streak) {
  if (!streak || streak % 5 !== 0) return 0;
  return Math.min(3, streak / 5);
}

// Raundo žvaigždutės (bent 1).
export function roundStars({ points, mult = 1, ok, total, repeat = 1 }) {
  return Math.max(1, Math.round(points * mult * ratingMult(ok, total) * repeat));
}

// Deimantai už sunkų darbą (ne daugiau kaip 1 už raundą).
export function roundGems({ mode, speed, game, ok, total }) {
  const si = speedIndex(speed);
  if (mode === 'mental' && total && ok / total >= 0.9) {
    if (si >= speedIndex('cheetah')) return 1;
    if (game === 20 && si >= speedIndex('horse')) return 1;
  }
  if (mode === 'test' && total && ok === total && si >= speedIndex('horse')) return 1;
  return 0;
}

// ---------- Šiandiena ----------

export function today(state, date) {
  if (!state.today || state.today.date !== date) state.today = { date, rounds: {} };
  return state.today;
}

export function practiceKey(game, level) {
  return `${game}:${level}`;
}

// ---------- Geriausi rezultatai (įgūdžiams) ----------
// state.records: { 'm:<žaidimas>:<greitis>': geriausia dalis, 't:<žaidimas>:<greitis>': ... }

export function recordBest(state, kind, game, speed, ok, total) {
  if (!total) return;
  state.records = state.records || {};
  const k = `${kind}:${game}:${speed}`;
  const r = ok / total;
  if (!(state.records[k] >= r)) state.records[k] = r;
}

function bestAt(state, kind, minSpeed, ratio, game = null) {
  const min = speedIndex(minSpeed);
  return Object.entries(state.records || {}).some(([k, v]) => {
    const [kk, g, sp] = k.split(':');
    return kk === kind && (!game || Number(g) === game) && speedIndex(sp) >= min && v >= ratio;
  });
}

// Įgūdžiai: naudojami svajonių prekėms ir aukščiausiems augimo etapams.
export const SKILLS = {
  levels10: { text: 'Atrakink visus lygius iki 10', check: s => ((s.progress && s.progress.unlocked) || 1) >= GAMES[10].levels.length },
  level20_2: { text: 'Atrakink 2-ą lygį iki 20', check: s => ((s.progress20 && s.progress20.unlocked) || 1) >= 2 },
  round10Horse: { text: 'Mintinai 10 iš 10 🐎 Žirgu ar greičiau', check: s => bestAt(s, 'm', 'horse', 1) },
  testHorse: { text: 'Kontrolinis be klaidų 🐎 Žirgu ar greičiau', check: s => bestAt(s, 't', 'horse', 1) },
  round9Cheetah: { text: 'Mintinai 9 iš 10 🐆 Gepardu ar greičiau', check: s => bestAt(s, 'm', 'cheetah', 0.9) },
  round9Cheetah20: { text: 'Iki 20 mintinai 9 iš 10 🐆 Gepardu', check: s => bestAt(s, 'm', 'cheetah', 0.9, 20) },
  days14: { text: 'Žaisk 14 dienų', check: s => ((s.days && s.days.total) || 0) >= 14 },
};

export function hasSkill(state, id) {
  const sk = SKILLS[id];
  return !sk || sk.check(state);
}

// ---------- Augimo etapai su įgūdžiais ----------

// Etapas pagal augimą; aukščiausiems reikia ir įgūdžio (STAGES[i].gate).
// reached – jau pasiektas etapas: jo niekada neatimam.
export function gatedStageIndex(grow, state, reached = 0) {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (grow < STAGES[i].min) break;
    if (i > reached && STAGES[i].gate && state && !hasSkill(state, STAGES[i].gate)) break;
    idx = i;
  }
  return Math.max(idx, Math.min(reached, STAGES.length - 1));
}

// ---------- Svajonių prekės ir pakopos ----------

// Svajonių prekės: žvaigždutės + deimantai + įgūdis. price – nauja kaina (jei nurodyta).
export const DREAM = {
  'room:space': { price: 350, gems: 6, skill: 'round9Cheetah' },
  'room:castle': { price: 250, gems: 5, skill: 'levels10' },
  'friend:unicorn': { price: 160, gems: 4, skill: 'testHorse' },
  'hat-crown': { price: 120, gems: 3, skill: 'round10Horse' },
  'f-rocket': { gems: 3, skill: 'level20_2' },
  'f-castle': { gems: 2, skill: 'level20_2' },
  'part:color:rainbow': { gems: 3, skill: 'days14' },
  'part:top:unicorn': { gems: 2, skill: 'days14' },
};

// Kambariai atsidaro su augimu.
const ROOM_STAGE = { 'room:bedroom': 'kid', 'room:kitchen': 'kid', 'room:yard': 'big', 'room:castle': 'super', 'room:space': 'magic' };

// Kokio etapo (bent vieno draugo) reikia, kad prekę būtų galima pirkti.
export function requiredStage(item) {
  if (item.consumable && item.cat === 'treats') return 'egg';
  if (ROOM_STAGE[item.id]) return ROOM_STAGE[item.id];
  if (item.gems) return 'super';
  if (item.price <= 25) return 'egg';
  if (item.price <= 60) return 'kid';
  if (item.price <= 140) return 'big';
  return 'super';
}

export function stageNumber(id) {
  return STAGES.findIndex(s => s.id === id);
}

// Ar prekė atrakinta: etapas ir įgūdis. Grąžina { ok, stage?, skill? } – ko trūksta.
export function itemLock(state, item, maxStageIdx) {
  const need = stageNumber(requiredStage(item));
  const lock = {};
  if (maxStageIdx < need) {
    lock.stage = STAGES[need];
    // Etapams iki reikiamo gali trūkti ir įgūdžio, ne tik augimo – parodom, kurio.
    lock.gates = STAGES.slice(maxStageIdx + 1, need + 1)
      .filter(st => st.gate && !hasSkill(state, st.gate) && st.gate !== item.skill)
      .map(st => SKILLS[st.gate]);
  }
  if (item.skill && !hasSkill(state, item.skill)) lock.skill = SKILLS[item.skill];
  lock.ok = !lock.stage && !lock.skill;
  return lock;
}

// ---------- Dienos užduotis ----------

export const QUEST_STARS = 20;
export const QUEST_GEMS = 1;

const isRound = e => e.type === 'round' || e.type === 'test';

export const QUESTS = [
  { id: 'rounds3', text: 'Sužaisk 3 raundus', goal: 3, on: e => (isRound(e) ? 1 : 0) },
  { id: 'perfect', text: 'Gauk 10 iš 10 bet kuriame raunde', goal: 1, on: e => (e.type === 'round' && e.total >= 10 && e.ok === e.total ? 1 : 0) },
  { id: 'horse', text: 'Sužaisk raundą mintinai 🐎 Žirgu ar greičiau', goal: 1, on: e => (e.type === 'round' && e.mode === 'mental' && speedIndex(e.speed) >= speedIndex('horse') ? 1 : 0) },
  { id: 'iki20', text: 'Sužaisk raundą „Iki 20“', goal: 1, on: e => (isRound(e) && e.game === 20 ? 1 : 0) },
  { id: 'test8', text: 'Kontrolinis: bent 8 iš 10 teisingai', goal: 1, on: e => (e.type === 'test' && e.ok / e.total >= 0.8 ? 1 : 0) },
  { id: 'write10', text: 'Parašyk ranka 10 teisingų atsakymų', goal: 10, on: e => (e.type === 'written' ? 1 : 0) },
  { id: 'streak10', text: 'Atsakyk 10 kartų iš eilės teisingai', goal: 1, on: e => (e.type === 'streak' && e.streak >= 10 ? 1 : 0) },
  { id: 'twoModes', text: 'Pažaisk dviem skirtingais būdais', goal: 2, on: (e, q) => {
    if (!isRound(e)) return 0;
    q.modes = q.modes || [];
    if (q.modes.includes(e.mode)) return 0;
    q.modes.push(e.mode);
    return 1;
  } },
  { id: 'topLevel', text: 'Sužaisk naujausią atrakintą lygį', goal: 1, on: e => (e.type === 'round' && e.mode === 'practice' && e.level && e.level === e.topLevel ? 1 : 0) },
];

export const QUEST_BY_ID = Object.fromEntries(QUESTS.map(q => [q.id, q]));

function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) x = Math.imul(x ^ str.charCodeAt(i), 16777619);
  return x >>> 0;
}

// Šiandienos užduotis: ne ta, kuri buvo per paskutines 7 dienas.
export function questFor(state, date) {
  if (state.quest && state.quest.date === date && QUEST_BY_ID[state.quest.id]) return state.quest;
  const recent = state.questHistory || [];
  const pool = QUESTS.filter(q => !recent.includes(q.id));
  const list = pool.length ? pool : QUESTS;
  const q = list[hash(date) % list.length];
  state.quest = { date, id: q.id, n: 0, done: false };
  state.questHistory = [...recent, q.id].slice(-7);
  return state.quest;
}

// Įvykis (raundas, kontrolinis, parašytas atsakymas, serija). Grąžina užduotį, jei ji ką tik atlikta.
export function questEvent(state, date, e) {
  const q = questFor(state, date);
  if (q.done) return null;
  const def = QUEST_BY_ID[q.id];
  q.n = Math.min(def.goal, q.n + def.on(e, q));
  if (q.n >= def.goal) {
    q.done = true;
    return def;
  }
  return null;
}
