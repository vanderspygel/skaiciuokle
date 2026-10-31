import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addStars, spendStars, stageFor, updateStreak, recordLevelAnswer, markPlayed,
  checkAchievements, unlockedKinds,
} from '../js/rewards.js';
import { migrate, defaultState, SCHEMA_VERSION } from '../js/storage.js';
import { testRating, testBonus } from '../js/config.js';

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

test('serijos premija kas 5 teisingus', () => {
  const s = defaultState();
  const bonuses = [];
  for (let i = 0; i < 10; i++) bonuses.push(updateStreak(s, true));
  assert.deepEqual(bonuses, [0, 0, 0, 0, 2, 0, 0, 0, 0, 2]);
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

test('kontrolinio įvertinimas ir premija', () => {
  assert.equal(testRating(1).stars, 3);
  assert.equal(testRating(0.85).stars, 2);
  assert.equal(testRating(0.5).stars, 1);
  assert.equal(testRating(0.3).stars, 0);
  assert.equal(testBonus(3, 20), 30);
  assert.equal(testBonus(3, 10), 15);
});

test('migracija užpildo trūkstamus laukus', () => {
  const s = migrate({ schemaVersion: 1, stars: 5, counters: { correct: 3 } });
  assert.equal(s.stars, 5);
  assert.equal(s.counters.correct, 3);
  assert.equal(s.counters.fast, 0);
  assert.equal(s.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrate(null).stars, 0);
});
