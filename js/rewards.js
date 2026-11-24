// Žvaigždutės, lygių atrakinimas, augimas, dienų serija, pasiekimai.
// Gryna logika, dirba su būsenos objektu (be UI).

import {
  LEVELS, GAMES, STAGES, UNLOCK_CORRECT, UNLOCK_WINDOW, UNLOCK_ACCURACY,
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

// ---------- Draugai ----------
// state.monster – draugas, su kuriuo dabar žaidžiama (jis auga);
// state.friends – kiti draugai (jie laukia ir neauga).
// Kiekvienas draugas auga atskirai: monster.grow = žvaigždutės, uždirbtos su juo.

export function allFriends(state) {
  return [state.monster, ...(state.friends || [])].filter(Boolean);
}

export function growOf(monster, state) {
  if (!monster) return state ? state.totalEarned : 0;
  return typeof monster.grow === 'number' ? monster.grow : 0;
}

export function friendStage(monster, state) {
  return stageFor(growOf(monster, state));
}

// Padaro kitą draugą aktyviu (su juo žaidžiama, jis auga).
export function switchFriend(state, uid) {
  const i = (state.friends || []).findIndex(f => f.uid === uid);
  if (i < 0) return false;
  const next = state.friends[i];
  state.friends.splice(i, 1);
  if (state.monster) {
    // Kambaryje draugai pasikeičia vietomis.
    const pos = state.room.monster;
    state.room.monster = next.pos || { x: 30, y: 72 };
    state.monster.pos = pos;
    state.friends.unshift(state.monster);
  }
  delete next.pos;
  state.monster = next;
  return true;
}

// Naujas draugas tampa aktyviu; ankstesnis eina pas kitus draugus.
export function addFriend(state, friend) {
  friend.uid = friend.uid || 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  friend.grow = friend.grow || 0;
  if (state.monster) {
    // Ankstesnis draugas pasitraukia į šoną, kad kambaryje nesusidėtų vienas ant kito.
    const n = state.friends.length;
    state.monster.pos = { x: [18, 82, 30, 70, 10, 90, 40, 60][n % 8], y: 62 + (n * 11) % 30 };
    state.room.monster = { x: 50, y: 72 };
    state.friends.unshift(state.monster);
  }
  state.monster = friend;
  return friend;
}

// Prideda žvaigždučių. Išleidimas augimo neatima: totalEarned ir monster.grow tik auga.
// Auga tik aktyvus draugas. Grąžina naują etapą, jei jis paaugo.
export function addStars(state, n) {
  if (!n) return null;
  const m = state.monster;
  const before = stageIndex(growOf(m, state));
  state.stars += n;
  state.totalEarned += n;
  if (m) m.grow = growOf(m) + n;
  const after = stageIndex(growOf(m, state));
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

// Kiekvienas žaidimas („Iki 10“, „Iki 20“) turi savo pažangą.
export function gameProgress(state, game = GAMES[10]) {
  return state[game.progressKey] || (state[game.progressKey] = { unlocked: 1, levels: {} });
}

export function levelProgress(state, levelId, game = GAMES[10]) {
  const gp = gameProgress(state, game);
  const p = gp.levels[levelId] || (gp.levels[levelId] = { correct: 0, recent: [] });
  return p;
}

// Įrašo atsakymą lygyje; grąžina naujai atrakintą lygį arba null.
export function recordLevelAnswer(state, levelId, correctFirstTry, game = GAMES[10]) {
  const gp = gameProgress(state, game);
  const p = levelProgress(state, levelId, game);
  if (correctFirstTry) p.correct += 1;
  p.recent.push(correctFirstTry ? 1 : 0);
  if (p.recent.length > UNLOCK_WINDOW) p.recent.shift();
  if (levelId === gp.unlocked && levelId < game.levels.length && canUnlockNext(p)) {
    gp.unlocked = levelId + 1;
    return game.levels[levelId];
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

// Atrakinti žaidimo lygiai – iš jų renkamos užduotys mintinai ir kontroliniam.
export function unlockedLevels(state, game = GAMES[10]) {
  const n = gameProgress(state, game).unlocked;
  return game.levels.filter(l => l.id <= n);
}

export function unlockedKinds(state, game = GAMES[10]) {
  return [...new Set(unlockedLevels(state, game).flatMap(l => l.kinds))];
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
  { id: 'level20', icon: '🎖️', name: 'Visi lygiai iki 20', desc: 'Atrakinai visus lygius iki 20', reward: 20, check: s => gameProgress(s, GAMES[20]).unlocked >= GAMES[20].levels.length },
  { id: 'designer', icon: '🎨', name: 'Dizaineris', desc: 'Nupirkai 10 daiktų', reward: 10, check: s => s.counters.purchases >= 10 },
  { id: 'teacher', icon: '🧑‍🏫', name: 'Mokytoja', desc: 'Išmokei padarėlį visų 10 skaitmenų', reward: 5, check: s => Object.keys(s.handwriting.samples).filter(d => s.handwriting.samples[d].length).length >= 10 },
  { id: 'writer', icon: '✍️', name: 'Rašytoja', desc: '20 teisingų parašytų atsakymų', reward: 10, check: s => s.counters.written >= 20 },
  { id: 'writer100', icon: '📜', name: 'Raštininkė', desc: '100 teisingų parašytų atsakymų', reward: 20, check: s => s.counters.written >= 100 },
  { id: 'snack', icon: '🍪', name: 'Smaližius', desc: 'Pavaišinai padarėlį 5 kartus', reward: 3, check: s => s.counters.fed >= 5 },
  { id: 'hatch', icon: '🐣', name: 'Išsiritau!', desc: 'Padarėlis išsirito', reward: 3, check: s => maxStage(s) >= 1 },
  { id: 'grown', icon: '🌟', name: 'Užaugau!', desc: 'Padarėlis užaugo didelis', reward: 20, check: s => maxStage(s) >= stageId('big') },
  { id: 'friend2', icon: '🤝', name: 'Naujas draugas', desc: 'Susiradai antrą draugą', reward: 5, check: s => allFriends(s).length >= 2 },
  { id: 'friends4', icon: '👫', name: 'Draugų būrys', desc: 'Turi 4 draugus', reward: 15, check: s => allFriends(s).length >= 4 },
  { id: 'friends8', icon: '🎉', name: 'Didelė šeima', desc: 'Turi 8 draugus', reward: 30, check: s => allFriends(s).length >= 8 },
  { id: 'twoGrown', icon: '🌳', name: 'Du dideli', desc: 'Du draugai užaugo dideli', reward: 20, check: s => allFriends(s).filter(f => stageIndex(growOf(f)) >= stageId('big')).length >= 2 },
  { id: 'super', icon: '⭐', name: 'Superžvaigždė', desc: 'Draugas tapo superžvaigžde', reward: 25, check: s => maxStage(s) >= stageId('super') },
  { id: 'legend', icon: '👑', name: 'Legenda', desc: 'Draugas tapo legenda', reward: 50, check: s => maxStage(s) >= stageId('legend') },
];

function stageId(id) {
  return STAGES.findIndex(st => st.id === id);
}

function maxStage(s) {
  const all = allFriends(s);
  if (!all.length) return stageIndex(s.totalEarned);
  return Math.max(...all.map(f => stageIndex(growOf(f))));
}

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
