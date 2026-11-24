import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  problemPoints, masteryFactor, ratingMult, repeatMult, streakBonus, roundStars, roundGems,
  modeMult, gatedStageIndex, hasSkill, recordBest, itemLock, requiredStage, questFor, questEvent,
  QUESTS, DREAM,
} from '../js/economy.js';
import { makeProblem, makeCompare } from '../js/math.js';
import { addStars, friendStage, maxStage } from '../js/rewards.js';
import { defaultState, migrate } from '../js/storage.js';
import { ITEMS, ITEM_BY_ID } from '../js/catalog.js';
import { STAGES } from '../js/config.js';

const fresh = () => {
  const s = defaultState();
  s.monster = { uid: 'a', kind: 'monster', name: 'A', parts: {}, wear: {}, grow: 0, reached: 0 };
  return s;
};

test('užduoties taškai: sunkiau – daugiau', () => {
  assert.equal(problemPoints(makeProblem('add', 3, 4)), 2);
  assert.equal(problemPoints(makeProblem('sub', 9, 4)), 2);
  assert.equal(problemPoints(makeProblem('missAdd', 3, 4)), 3);
  assert.equal(problemPoints(makeProblem('friend', 3, 0, 10)), 3);
  assert.equal(problemPoints(makeCompare()), 3);
  assert.equal(problemPoints(makeProblem('add', 13, 4)), 3); // iki 20 be perėjimo
  assert.equal(problemPoints(makeProblem('add', 8, 5)), 5); // per dešimtį
  assert.equal(problemPoints(makeProblem('sub', 13, 5)), 5);
  assert.equal(problemPoints(makeProblem('sub', 17, 4)), 3);
  assert.equal(problemPoints(makeProblem('missSub', 13, 5)), 5); // ? − 5 = 8
  assert.equal(problemPoints(makeProblem('friend', 14, 0, 20)), 5);
});

test('įvaldymas: išmokta moka perpus, nauja – daugiau', () => {
  assert.equal(masteryFactor(undefined), 1.5);
  assert.equal(masteryFactor({ n: 2, err: 0, ms: 4000 }), 1.5);
  assert.equal(masteryFactor({ n: 10, err: 5, ms: 50000 }), 1.5);
  assert.equal(masteryFactor({ n: 10, err: 0, ms: 25000 }), 0.5);
  assert.equal(masteryFactor({ n: 10, err: 0, ms: 60000 }), 1); // lėtai – dar ne išmokta
  assert.equal(masteryFactor({ n: 4, err: 0, ms: 8000 }), 1);
});

test('daugikliai: greitis, įvertinimas, kartojimas, serija', () => {
  assert.equal(modeMult('mental', 'fox'), 1);
  assert.equal(modeMult('mental', 'horse'), 1.5);
  assert.equal(modeMult('test', 'falcon'), 2.5);
  assert.equal(modeMult('write'), 1.5);
  assert.equal(modeMult('practice'), 1);
  assert.deepEqual([10, 9, 8, 7, 6, 5, 4, 3, 0].map(ok => ratingMult(ok, 10)), [1.5, 1, 1, 0.8, 0.8, 0.6, 0.6, 0.4, 0.4]);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 9].map(repeatMult), [1, 1, 1, 0.8, 0.8, 0.8, 0.6, 0.6]);
  assert.deepEqual([1, 4, 5, 10, 15, 20, 25].map(streakBonus), [0, 0, 1, 2, 3, 3, 3]);
  assert.equal(roundStars({ points: 0, ok: 0, total: 10 }), 1); // niekada mažiau nei 1
});

test('pavyzdiniai raundai iš plano', () => {
  // Lapė, išmokti faktai iki 10, 10/10
  assert.equal(roundStars({ points: 10 * 2 * 0.5, mult: 1, ok: 10, total: 10 }), 15);
  // Žirgas, iki 20 mišinys (~4 taškai), 9/10
  assert.equal(roundStars({ points: 9 * 4, mult: 1.5, ok: 9, total: 10 }), 54);
  // Gepardas iki 10 mišinys (~2,5), 10/10
  assert.equal(roundStars({ points: 10 * 2.5, mult: 2, ok: 10, total: 10 }), 75);
});

test('deimantai tik už sunkų darbą', () => {
  assert.equal(roundGems({ mode: 'mental', speed: 'fox', game: 10, ok: 10, total: 10 }), 0);
  assert.equal(roundGems({ mode: 'mental', speed: 'cheetah', game: 10, ok: 9, total: 10 }), 1);
  assert.equal(roundGems({ mode: 'mental', speed: 'cheetah', game: 10, ok: 8, total: 10 }), 0);
  assert.equal(roundGems({ mode: 'mental', speed: 'horse', game: 20, ok: 9, total: 10 }), 1);
  assert.equal(roundGems({ mode: 'mental', speed: 'horse', game: 10, ok: 10, total: 10 }), 0);
  assert.equal(roundGems({ mode: 'test', speed: 'horse', ok: 20, total: 20 }), 1);
  assert.equal(roundGems({ mode: 'test', speed: 'fox', ok: 20, total: 20 }), 0);
});

test('aukščiausiems etapams reikia įgūdžio, bet pasiekto etapo neatimam', () => {
  const s = fresh();
  addStars(s, 1500);
  assert.equal(friendStage(s.monster, s).id, 'big'); // Stipruoliui reikia visų lygių iki 10
  s.progress.unlocked = 6;
  assert.equal(friendStage(s.monster, s).id, 'strong');
  addStars(s, 1);
  assert.equal(s.monster.reached, STAGES.findIndex(x => x.id === 'strong'));
  s.progress.unlocked = 1; // net jei kažkas pasikeistų, etapas lieka
  assert.equal(friendStage(s.monster, s).id, 'strong');
  assert.equal(gatedStageIndex(5000, s, 0), STAGES.findIndex(x => x.id === 'big'));
});

test('įgūdis iš kontrolinio leidžia paaugti', () => {
  const s = fresh();
  s.progress.unlocked = 6;
  addStars(s, 2500);
  assert.equal(friendStage(s.monster, s).id, 'strong');
  assert.ok(!hasSkill(s, 'testHorse'));
  recordBest(s, 't', 10, 'fox', 10, 10);
  assert.ok(!hasSkill(s, 'testHorse'));
  recordBest(s, 't', 10, 'cheetah', 10, 10);
  assert.ok(hasSkill(s, 'testHorse'));
  assert.equal(addStars(s, 1).id, 'super');
});

test('seni draugai išlaiko savo etapą', () => {
  const old = defaultState();
  delete old.records;
  old.totalEarned = 5000;
  old.monster = { kind: 'monster', name: 'Senas', parts: {}, wear: {} };
  old.tests = [{ date: '2026-11-20', n: 10, speed: 'horse', ok: 10, rating: 3, game: 10 }];
  const s = migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(friendStage(s.monster, s).id, 'legend');
  assert.ok(hasSkill(s, 'testHorse'));
  assert.equal(s.gems, 0);
});

test('svajonių prekės: kaina + deimantai + įgūdis', () => {
  const ids = Object.keys(DREAM);
  for (const id of ids) assert.ok(ITEM_BY_ID[id] && ITEM_BY_ID[id].dream, id);
  const gems = ids.reduce((a, id) => a + DREAM[id].gems, 0);
  assert.ok(gems >= 20 && gems <= 30, `deimantų iš viso ${gems}`);
  const crown = ITEM_BY_ID['hat-crown'];
  const s = fresh();
  addStars(s, 5000);
  s.progress.unlocked = 6;
  recordBest(s, 't', 10, 'horse', 10, 10);
  const lock = itemLock(s, crown, maxStage(s));
  assert.ok(!lock.ok && lock.skill && !lock.stage);
  recordBest(s, 'm', 10, 'horse', 10, 10);
  assert.ok(itemLock(s, crown, maxStage(s)).ok);
});

test('užrakinta prekė parodo ir trūkstamą augimo įgūdį', () => {
  const s = defaultState();
  s.monster = { uid: 'a', kind: 'monster', parts: {}, wear: {}, grow: 2500, reached: 0 };
  const crown = ITEM_BY_ID['hat-crown'];
  const lock = itemLock(s, crown, maxStage(s));
  // Augimo užtenka, bet „Stipruoliui“ ir „Superžvaigždei“ trūksta įgūdžių.
  assert.equal(lock.stage.id, 'super');
  assert.deepEqual(lock.gates.map(g => g.text), ['Atrakink visus lygius iki 10', 'Kontrolinis be klaidų 🐎 Žirgu ar greičiau']);
});

test('parduotuvės pakopos atsidaro su augimu', () => {
  assert.equal(requiredStage(ITEM_BY_ID['f-balloons']), 'egg');
  assert.equal(requiredStage(ITEM_BY_ID['room:kitchen']), 'kid');
  assert.equal(requiredStage(ITEM_BY_ID['room:yard']), 'big');
  assert.equal(requiredStage(ITEM_BY_ID['room:space']), 'magic');
  assert.equal(requiredStage(ITEM_BY_ID['t-cake']), 'egg');
  const s = fresh();
  assert.ok(itemLock(s, ITEM_BY_ID['f-balloons'], maxStage(s)).ok);
  assert.ok(!itemLock(s, ITEM_BY_ID['f-sofa'], maxStage(s)).ok);
});

test('dienos užduotis: viena per dieną, nesikartoja savaitę', () => {
  const s = defaultState();
  const seen = new Set();
  for (let d = 1; d <= 7; d++) seen.add(questFor(s, `2026-12-0${d}`).id);
  assert.equal(seen.size, 7);
  const q = questFor(s, '2026-12-07');
  assert.equal(questFor(s, '2026-12-07'), q);
});

test('dienos užduotis atliekama ir premija tik kartą', () => {
  const s = defaultState();
  s.quest = { date: '2026-12-01', id: 'rounds3', n: 0, done: false };
  const e = { type: 'round', mode: 'practice', ok: 8, total: 10 };
  assert.equal(questEvent(s, '2026-12-01', e), null);
  assert.equal(questEvent(s, '2026-12-01', e), null);
  assert.equal(questEvent(s, '2026-12-01', e).id, 'rounds3');
  assert.equal(questEvent(s, '2026-12-01', e), null);
  s.quest = { date: '2026-12-02', id: 'twoModes', n: 0, done: false };
  questEvent(s, '2026-12-02', e);
  assert.equal(questEvent(s, '2026-12-02', e), null);
  assert.equal(questEvent(s, '2026-12-02', { type: 'test', mode: 'test', ok: 5, total: 10 }).id, 'twoModes');
  assert.ok(QUESTS.length >= 8);
});

test('visa parduotuvė – maždaug mėnuo įprasto žaidimo', async () => {
  const { simulate } = await import('../scripts/simulate.mjs');
  const normal = simulate('normal');
  const easy = simulate('easy');
  const hard = simulate('hard');
  assert.ok(normal.perDay >= 200 && normal.perDay <= 320, `įprasta diena ${normal.perDay}`);
  assert.ok(normal.days >= 25 && normal.days <= 38, `dienų ${normal.days}`);
  assert.ok(easy.perDay < normal.perDay * 0.6, 'lengvi kartojimai moka daug mažiau');
  assert.ok(hard.perDay > normal.perDay * 1.4, 'sunkus darbas moka daugiau');
  assert.ok(ITEMS.length > 100);
});
