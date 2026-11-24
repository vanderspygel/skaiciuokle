import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addStars, spendStars, stageFor, updateStreak, recordLevelAnswer, markPlayed,
  checkAchievements, unlockedKinds, addFriend, switchFriend, friendStage, allFriends,
} from '../js/rewards.js';
import { migrate, defaultState, SCHEMA_VERSION } from '../js/storage.js';
import { testRating } from '../js/config.js';

test('išleidimas neatima augimo', () => {
  const s = defaultState();
  addStars(s, 20);
  assert.equal(stageFor(s.totalEarned).id, 'baby');
  assert.ok(spendStars(s, 20));
  assert.equal(s.stars, 0);
  assert.equal(stageFor(s.totalEarned).id, 'baby');
  assert.ok(!spendStars(s, 1));
});

test('addStars praneša apie naują etapą', () => {
  const s = defaultState();
  assert.equal(addStars(s, 10), null);
  assert.equal(addStars(s, 10).id, 'baby');
  assert.equal(addStars(s, 1000).id, 'big');
});

test('serijos premija auga: 5 iš eilės +1, 10 +2', () => {
  const s = defaultState();
  const bonuses = [];
  for (let i = 0; i < 10; i++) bonuses.push(updateStreak(s, true));
  assert.deepEqual(bonuses, [0, 0, 0, 0, 1, 0, 0, 0, 0, 2]);
  updateStreak(s, false);
  assert.equal(s.streak, 0);
  assert.equal(s.counters.bestStreak, 10);
});

test('lygis atrakinamas po 15 teisingų su ≥80 % tikslumu', () => {
  const s = defaultState();
  for (let i = 0; i < 14; i++) assert.equal(recordLevelAnswer(s, 1, true), null);
  assert.equal(recordLevelAnswer(s, 1, true).id, 2);
  assert.equal(s.progress.unlocked, 2);
});

test('mažas tikslumas lygio neatrakina', () => {
  const s = defaultState();
  for (let i = 0; i < 20; i++) recordLevelAnswer(s, 1, i % 2 === 0);
  assert.equal(s.progress.unlocked, 1);
  for (let i = 0; i < 20; i++) recordLevelAnswer(s, 1, true);
  assert.equal(s.progress.unlocked, 2);
});

test('atrakinti tipai kaupiasi', () => {
  const s = defaultState();
  assert.deepEqual(unlockedKinds(s), ['add']);
  s.progress.unlocked = 3;
  assert.deepEqual(unlockedKinds(s).sort(), ['add', 'sub']);
});

test('dienų serija', () => {
  const s = defaultState();
  markPlayed(s, '2026-07-01');
  markPlayed(s, '2026-07-01');
  markPlayed(s, '2026-07-02');
  markPlayed(s, '2026-07-03');
  assert.equal(s.days.streak, 3);
  markPlayed(s, '2026-07-06');
  assert.equal(s.days.streak, 1);
  assert.equal(s.days.best, 3);
  // Per mėnesio ribą.
  markPlayed(s, '2026-07-31');
  markPlayed(s, '2026-08-01');
  assert.equal(s.days.streak, 2);
});

test('pasiekimai suteikiami vieną kartą su premija', () => {
  const s = defaultState();
  s.counters.correct = 1;
  const first = checkAchievements(s, 1);
  assert.deepEqual(first.map(a => a.id), ['first']);
  assert.equal(s.stars, 2);
  assert.equal(checkAchievements(s, 2).length, 0);
});

test('kontrolinio įvertinimas', () => {
  assert.equal(testRating(1).stars, 3);
  assert.equal(testRating(0.85).stars, 2);
  assert.equal(testRating(0.5).stars, 1);
  assert.equal(testRating(0.3).stars, 0);
});

test('migracija užpildo trūkstamus laukus', () => {
  const s = migrate({ schemaVersion: 1, stars: 5, counters: { correct: 3 } });
  assert.equal(s.stars, 5);
  assert.equal(s.counters.correct, 3);
  assert.equal(s.counters.fast, 0);
  assert.equal(s.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrate(null).stars, 0);
});

// ---------- Du žaidimai ----------

test('žaidimai iki 10 ir iki 20 turi atskirą pažangą', async () => {
  const { GAMES } = await import('../js/config.js');
  const { gameProgress, unlockedLevels } = await import('../js/rewards.js');
  const s = defaultState();
  for (let i = 0; i < 15; i++) recordLevelAnswer(s, 1, true, GAMES[20]);
  assert.equal(gameProgress(s, GAMES[20]).unlocked, 2);
  assert.equal(s.progress.unlocked, 1);
  assert.deepEqual(unlockedLevels(s, GAMES[20]).map(l => l.title), ['Iki 20 be perėjimo', 'Sudėtis ir atimtis iki 20']);
  assert.deepEqual(unlockedKinds(s), ['add']);
});

test('seni duomenys gauna žaidimą iki 20 ir lieka žaidime iki 10', () => {
  const old = defaultState();
  delete old.progress20;
  delete old.prefs.game;
  old.progress.unlocked = 6;
  const s = migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(s.progress.unlocked, 6);
  assert.deepEqual(s.progress20, { unlocked: 1, levels: {} });
  assert.equal(s.prefs.game, 10);
});

test('senas išsaugojimas: padarėlis paveldi visą augimą', () => {
  const old = { schemaVersion: 1, monster: { name: 'Bubu', parts: {}, wear: {} }, stars: 30, totalEarned: 800 };
  const s = migrate(JSON.parse(JSON.stringify(old)));
  assert.equal(s.monster.grow, 800);
  assert.equal(s.monster.kind, 'monster');
  assert.ok(s.monster.uid);
  assert.deepEqual(s.friends, []);
  assert.equal(friendStage(s.monster, s).id, 'big');
});

test('auga tik aktyvus draugas, kiekvienas atskirai', () => {
  const s = defaultState();
  addFriend(s, { name: 'A', parts: {}, wear: {} });
  addStars(s, 300);
  const a = s.monster;
  addFriend(s, { name: 'B', parts: {}, wear: {} });
  assert.equal(s.monster.name, 'B');
  assert.equal(friendStage(s.monster, s).id, 'egg');
  assert.equal(addStars(s, 20).id, 'baby');
  assert.equal(a.grow, 300);
  assert.equal(s.monster.grow, 20);
  assert.equal(s.totalEarned, 320);
  assert.ok(switchFriend(s, a.uid));
  assert.equal(s.monster, a);
  assert.equal(s.friends.length, 1);
  assert.equal(s.friends[0].name, 'B');
  assert.equal(allFriends(s).length, 2);
  checkAchievements(s);
  assert.ok(s.badges.friend2);
});

test('daugiau augimo etapų po „Didelis“', () => {
  const s = defaultState();
  addFriend(s, { name: 'A', parts: {}, wear: {} });
  addStars(s, 700);
  assert.equal(friendStage(s.monster, s).id, 'big');
  // Aukščiausiems etapams reikia ir įgūdžių (economy.js).
  assert.equal(addStars(s, 500), null);
  s.progress.unlocked = 6;
  assert.equal(addStars(s, 1).id, 'strong');
  addStars(s, 5000);
  assert.equal(friendStage(s.monster, s).id, 'strong');
  s.records = { 't:10:horse': 1, 'm:20:cheetah': 1 };
  s.progress20.unlocked = 2;
  assert.equal(addStars(s, 1).id, 'legend');
});

test('kambariai: pirmasis visada yra, kiti sukuriami nupirkus', async () => {
  const { hasRoom, roomState, currentRoomId, ownedRooms } = await import('../js/rooms.js');
  const s = migrate({ schemaVersion: 1, room: { wallpaper: 'wall-dots', floor: 'floor-wood', items: [{ id: 'f-ball', x: 1, y: 2 }] }, prefs: {} });
  assert.deepEqual(s.rooms, {});
  assert.equal(currentRoomId(s), 'home');
  assert.equal(roomState(s, 'home').wallpaper, 'wall-dots');
  assert.ok(!hasRoom(s, 'kitchen'));
  s.prefs.room = 'kitchen';
  assert.equal(currentRoomId(s), 'home');
  s.owned.push('room:kitchen');
  assert.equal(currentRoomId(s), 'kitchen');
  assert.equal(roomState(s, 'kitchen').wallpaper, 'wall-kitchen');
  assert.deepEqual(roomState(s, 'kitchen').items.map(i => i.id), ['f-teapot', 'f-plates']);
  assert.equal(ownedRooms(s).length, 2);
});
