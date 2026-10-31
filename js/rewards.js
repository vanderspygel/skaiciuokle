// Žvaigždutės, lygių atrakinimas, augimas, dienų serija, pasiekimai.
// Gryna logika, dirba su būsenos objektu (be UI).

import {
  LEVELS, STAGES, UNLOCK_CORRECT, UNLOCK_WINDOW, UNLOCK_ACCURACY,
  STREAK_BONUS, STREAK_BONUS_EVERY,
} from './config.js';

export function stageIndex(totalEarned) {
  let idx = 0;
  STAGES.forEach((s, i) => { if (totalEarned >= s.min) idx = i; });
  return idx;
}

export function stageFor(totalEarned) {
  return STAGES[stageIndex(totalEarned)];
}

// Prideda žvaigždučių. Išleidimas augimo neatima, todėl totalEarned tik auga.
// Grąžina naują etapą, jei padarėlis paaugo.
export function addStars(state, n) {
  if (!n) return null;
  const before = stageIndex(state.totalEarned);
  state.stars += n;
  state.totalEarned += n;
  const after = stageIndex(state.totalEarned);
  return after > before ? STAGES[after] : null;
}

export function spendStars(state, n) {
  if (state.stars < n) return false;
  state.stars -= n;
  return true;
}

// Teisingų iš eilės serija ir jos premija. Grąžina premijos dydį.
export function updateStreak(state, correctFirstTry) {
  if (!correctFirstTry) {
    state.streak = 0;
    return 0;
  }
  state.streak += 1;
  if (state.streak > state.counters.bestStreak) state.counters.bestStreak = state.streak;
  return state.streak % STREAK_BONUS_EVERY === 0 ? STREAK_BONUS : 0;
}

// ---------- Lygiai ----------

export function levelProgress(state, levelId) {
  const p = state.progress.levels[levelId] || (state.progress.levels[levelId] = { correct: 0, recent: [] });
  return p;
}

// Įrašo atsakymą lygyje; grąžina naujai atrakintą lygį arba null.
export function recordLevelAnswer(state, levelId, correctFirstTry) {
  const p = levelProgress(state, levelId);
  if (correctFirstTry) p.correct += 1;
  p.recent.push(correctFirstTry ? 1 : 0);
  if (p.recent.length > UNLOCK_WINDOW) p.recent.shift();
  if (levelId === state.progress.unlocked && levelId < LEVELS.length && canUnlockNext(p)) {
    state.progress.unlocked = levelId + 1;
    return LEVELS[levelId];
  }
  return null;
}

export function accuracy(p) {
  if (!p.recent.length) return 0;
  return p.recent.reduce((a, b) => a + b, 0) / p.recent.length;
}

export function canUnlockNext(p) {
  return p.correct >= UNLOCK_CORRECT && accuracy(p) >= UNLOCK_ACCURACY;
}

// Užduočių tipai iš visų atrakintų lygių (mintinai ir kontroliniam).
export function unlockedKinds(state) {
  const kinds = new Set();
  for (const l of LEVELS) if (l.id <= state.progress.unlocked) l.kinds.forEach(k => kinds.add(k));
  return [...kinds];
}

// ---------- Dienos ----------

export function dateKey(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function dayDiff(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// Pažymi, kad šiandien žaista. Praleidus dieną serija prasideda iš naujo –
// bet padarėlis dėl to niekada neliūdi.
export function markPlayed(state, today = dateKey()) {
  const d = state.days;
  if (d.last === today) return;
  if (d.last && dayDiff(d.last, today) === 1) d.streak += 1;
  else d.streak = 1;
  d.last = today;
  d.total = (d.total || 0) + 1;
  if (d.streak > d.best) d.best = d.streak;
}

// ---------- Pasiekimai ----------

export const ACHIEVEMENTS = [
  { id: 'first', icon: '👣', name: 'Pirmas žingsnis', desc: 'Pirmas teisingas atsakymas', reward: 2, check: s => s.counters.correct >= 1 },
  { id: 'streak5', icon: '🔥', name: 'Serija 5', desc: '5 teisingi iš eilės', reward: 3, check: s => s.counters.bestStreak >= 5 },
  { id: 'streak10', icon: '🔥', name: 'Serija 10', desc: '10 teisingų iš eilės', reward: 5, check: s => s.counters.bestStreak >= 10 },
  { id: 'streak20', icon: '🌋', name: 'Serija 20', desc: '20 teisingų iš eilės', reward: 10, check: s => s.counters.bestStreak >= 20 },
  { id: 'fast10', icon: '⚡', name: 'Greitukas', desc: '10 greitų atsakymų mintinai', reward: 5, check: s => s.counters.fast >= 10 },
  { id: 'fast50', icon: '🚀', name: 'Raketa', desc: '50 greitų atsakymų mintinai', reward: 15, check: s => s.counters.fast >= 50 },
  { id: 'test1', icon: '📝', name: 'Pirmas kontrolinis', desc: 'Atlikai kontrolinį', reward: 3, check: s => s.counters.tests >= 1 },
  { id: 'perfect', icon: '💯', name: 'Be klaidų', desc: 'Kontrolinis be klaidų', reward: 10, check: s => s.counters.perfectTests >= 1 },
  { id: 'cheetah', icon: '🐆', name: 'Gepardas', desc: 'Kontrolinis Geparde be klaidų', reward: 25, check: s => s.counters.perfectCheetah >= 1 },
  { id: 'c100', icon: '💪', name: 'Šimtukas', desc: '100 teisingų atsakymų', reward: 5, check: s => s.counters.correct >= 100 },
  { id: 'c500', icon: '🏅', name: 'Penki šimtai', desc: '500 teisingų atsakymų', reward: 15, check: s => s.counters.correct >= 500 },
  { id: 'c1000', icon: '🏆', name: 'Tūkstantis', desc: '1000 teisingų atsakymų', reward: 30, check: s => s.counters.correct >= 1000 },
  { id: 'days3', icon: '📅', name: 'Kasdienis 3', desc: '3 dienas iš eilės', reward: 5, check: s => s.days.best >= 3 },
  { id: 'days7', icon: '🗓️', name: 'Kasdienis 7', desc: '7 dienas iš eilės', reward: 10, check: s => s.days.best >= 7 },
  { id: 'days14', icon: '🌈', name: 'Kasdienis 14', desc: '14 dienų iš eilės', reward: 20, check: s => s.days.best >= 14 },
  { id: 'hunter', icon: '🔍', name: 'Klaidų medžiotojas', desc: 'Pataisei visas kontrolinio klaidas', reward: 5, check: s => s.counters.mistakesCleared >= 1 },
  { id: 'level6', icon: '🎓', name: 'Visi lygiai', desc: 'Atrakinai visus lygius', reward: 15, check: s => s.progress.unlocked >= LEVELS.length },
  { id: 'designer', icon: '🎨', name: 'Dizaineris', desc: 'Nupirkai 10 daiktų', reward: 10, check: s => s.counters.purchases >= 10 },
  { id: 'snack', icon: '🍪', name: 'Smaližius', desc: 'Pavaišinai padarėlį 5 kartus', reward: 3, check: s => s.counters.fed >= 5 },
  { id: 'hatch', icon: '🐣', name: 'Išsiritau!', desc: 'Padarėlis išsirito', reward: 3, check: s => stageIndex(s.totalEarned) >= 1 },
  { id: 'grown', icon: '🌟', name: 'Užaugau!', desc: 'Padarėlis užaugo didelis', reward: 20, check: s => stageIndex(s.totalEarned) >= STAGES.length - 1 },
];

// Patikrina pasiekimus; naujiems prideda premiją. Grąžina naujų sąrašą.
// Premija gali atrakinti kitus pasiekimus (pvz., „Užaugau!“), todėl kartojam.
export function checkAchievements(state, now = Date.now()) {
  const earned = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of ACHIEVEMENTS) {
      if (state.badges[a.id] || !a.check(state)) continue;
      state.badges[a.id] = now;
      addStars(state, a.reward);
      earned.push(a);
      changed = true;
    }
  }
  return earned;
}
