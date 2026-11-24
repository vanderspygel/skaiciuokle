// Žvaigždučių ekonomikos modelis: kiek per dieną uždirbama ir per kiek dienų
// nuperkama visa parduotuvė. Paleisti: node scripts/simulate.mjs
//
// Dienos aprašytos raundais (apie 10–15 min žaidimo). pts – vidutiniai užduoties
// taškai, mastery – vidutinis įvaldymo daugiklis, ok – teisingi iš 10 (ar iš n).

import { roundStars, modeMult, repeatMult, QUEST_STARS } from '../js/economy.js';
import { ITEMS } from '../js/catalog.js';

const DAYS = {
  // Tik lengvi kartojimai: tas pats lygis, jau išmokti faktai iki 10.
  easy: [
    ...Array.from({ length: 8 }, (_, i) => ({ mode: 'practice', pts: 2, mastery: 0.5, ok: 10, repeat: i })),
  ],
  // Įprasta diena: šiek tiek iki 20, mintinai Žirgu, vienas kontrolinis.
  normal: [
    { mode: 'practice', pts: 4, mastery: 1.2, ok: 8 },
    { mode: 'practice', pts: 4, mastery: 1.2, ok: 8, repeat: 1 },
    { mode: 'mental', speed: 'horse', pts: 2.5, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'horse', pts: 2.5, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'horse', pts: 2.5, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'horse', pts: 2.5, mastery: 1, ok: 9 },
    { mode: 'test', speed: 'horse', pts: 2.25, mastery: 0.75, ok: 9 },
  ],
  // Sunki diena: iki 20 per dešimtį, Gepardas.
  hard: [
    { mode: 'practice', pts: 5, mastery: 1.5, ok: 8 },
    { mode: 'practice', pts: 5, mastery: 1.5, ok: 8, repeat: 1 },
    { mode: 'mental', speed: 'cheetah', pts: 4, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'cheetah', pts: 4, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'cheetah', pts: 4, mastery: 1, ok: 9 },
    { mode: 'mental', speed: 'cheetah', pts: 4, mastery: 1, ok: 9 },
    { mode: 'test', speed: 'cheetah', pts: 4, mastery: 1, ok: 10 },
  ],
};

const STREAK_PER_ROUND = 1; // augančios serijos priedas, vidutiniškai

export function shopTotal() {
  return ITEMS.filter(i => !i.consumable && i.price > 0).reduce((a, i) => a + i.price, 0);
}

export function simulate(kind) {
  const rounds = DAYS[kind];
  let perDay = QUEST_STARS;
  for (const r of rounds) {
    const n = r.n || 10;
    perDay += roundStars({
      points: r.ok * r.pts * r.mastery,
      mult: modeMult(r.mode, r.speed),
      ok: r.ok,
      total: n,
      repeat: repeatMult(r.repeat || 0),
    }) + STREAK_PER_ROUND;
  }
  const total = shopTotal();
  return { kind, perDay, total, days: Math.ceil(total / perDay) };
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  for (const k of Object.keys(DAYS)) {
    const r = simulate(k);
    console.log(`${k.padEnd(7)} ${String(r.perDay).padStart(4)} ⭐/d.  visa parduotuvė (${r.total} ⭐) per ~${r.days} d.`);
  }
}
