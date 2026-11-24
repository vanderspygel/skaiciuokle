// Visi žaidimo nustatymai vienoje vietoje.

// Skaičių ribos. Norint pereiti iki 20 – pakeisti čia.
export const LIMITS = { maxNumber: 10, maxResult: 10 };

// Įprasto skaičiavimo lygiai.
// kinds: kokių tipų užduotys; visual: ar rodyti dešimties rėmelį.
// Atsakymai visada renkami skaičių mygtukais 0–10 (palyginimas – dviem mygtukais).
export const LEVELS = [
  { id: 1, title: 'Sudėtis iki 5', icon: '➕', kinds: ['add'], limits: { maxNumber: 5, maxResult: 5 }, visual: true },
  { id: 2, title: 'Sudėtis iki 10', icon: '➕', kinds: ['add'], visual: true },
  { id: 3, title: 'Atimtis iki 10', icon: '➖', kinds: ['sub'], visual: true },
  { id: 4, title: 'Sudėtis ir atimtis', icon: '🔢', kinds: ['add', 'sub'], visual: false },
  { id: 5, title: 'Kas pasislėpė?', icon: '❓', kinds: ['add', 'sub', 'missAdd', 'missSub'], visual: false },
  { id: 6, title: 'Draugai ir palyginimas', icon: '🤝', kinds: ['add', 'sub', 'missAdd', 'missSub', 'friend', 'compare'], visual: false },
];

// Kitas lygis atrakinamas, kai lygyje surinkta UNLOCK_CORRECT teisingų
// ir paskutinių UNLOCK_WINDOW atsakymų tikslumas ≥ UNLOCK_ACCURACY.
export const UNLOCK_CORRECT = 15;
export const UNLOCK_WINDOW = 20;
export const UNLOCK_ACCURACY = 0.8;

// Laiko lygiai (sekundės vienam veiksmui).
export const SPEEDS = [
  { id: 'turtle', name: 'Vėžlys', emoji: '🐢', seconds: 40, stars: 2 },
  { id: 'rabbit', name: 'Kiškis', emoji: '🐇', seconds: 30, stars: 2 },
  { id: 'fox', name: 'Lapė', emoji: '🦊', seconds: 20, stars: 3 },
  { id: 'horse', name: 'Žirgas', emoji: '🐎', seconds: 15, stars: 3 },
  { id: 'cheetah', name: 'Gepardas', emoji: '🐆', seconds: 10, stars: 3 },
];

// Rašymo režime už teisingą atsakymą (rašyti sunkiau nei bakstelėti).
export const WRITE_STARS = 2;

export const STREAK_BONUS_EVERY = 5;
export const STREAK_BONUS = 2;
export const FAST_BONUS = 1;

// Draugo augimas pagal žvaigždutes, uždirbtas kol žaidė būtent su juo (monster.grow).
// ~40–50 ⭐ per dieną → „Didelis“ per ~2–3 savaites, „Legenda“ per ~3–4 mėnesius.
// Etapų id 'egg', 'baby', 'teen', 'big' ir jų ribos palikti kaip anksčiau.
// fx: papildomas papuošimas po padarėliu ar aplink jį (žr. monster.js stageFx).
export const STAGES = [
  { id: 'egg', name: 'Kiaušinis', emoji: '🥚', min: 0, scale: 0.55 },
  { id: 'baby', name: 'Mažylis', emoji: '🐣', min: 15, scale: 0.66 },
  { id: 'kid', name: 'Vaikas', emoji: '🌱', min: 100, scale: 0.76 },
  { id: 'teen', name: 'Paauglys', emoji: '🌿', min: 250, scale: 0.86 },
  { id: 'big', name: 'Didelis', emoji: '🌳', min: 700, scale: 0.95 },
  { id: 'strong', name: 'Stipruolis', emoji: '💪', min: 1200, scale: 1, fx: 'glow' },
  { id: 'super', name: 'Superžvaigždė', emoji: '⭐', min: 2000, scale: 1, fx: 'sparkle' },
  { id: 'magic', name: 'Stebuklingas', emoji: '🌈', min: 3000, scale: 1, fx: 'rainbow' },
  { id: 'legend', name: 'Legenda', emoji: '👑', min: 4500, scale: 1, fx: 'legend' },
];

// Kontrolinio rezultatas → žvaigždutės ir reakcija.
export function testRating(ratio) {
  if (ratio >= 1) return { stars: 3, emoji: '🤩', text: 'Puiku! Viskas teisingai!' };
  if (ratio >= 0.8) return { stars: 2, emoji: '😊', text: 'Labai gerai!' };
  if (ratio >= 0.5) return { stars: 1, emoji: '🙂', text: 'Gerai!' };
  return { stars: 0, emoji: '🤗', text: 'Treniruojamės toliau! 💪' };
}

// Kontrolinio premija: 3 ⭐ rezultatas su 20 užduočių = 30 ⭐.
export function testBonus(ratingStars, count) {
  return Math.round(ratingStars * count / 2);
}
