// Programos pradžia: būsena, ekranų perjungimas, apdovanojimai.

import { load, save, requestPersist } from './storage.js';
import { addStars, checkAchievements, markPlayed, dateKey, stageIndex, stageFor } from './rewards.js';
import { h, toast, confetti, modal } from './ui.js';
import { monsterView } from './monsterView.js';

import * as home from './screens/home.js';
import * as create from './screens/create.js';
import * as levels from './screens/levels.js';
import * as quiz from './screens/quiz.js';
import * as setup from './screens/setup.js';
import * as results from './screens/results.js';
import * as shop from './screens/shop.js';
import * as room from './screens/room.js';
import * as badges from './screens/badges.js';

const SCREENS = { home, create, levels, quiz, setup, results, shop, room, badges };

const root = document.getElementById('app');
let current = null;

const ctx = {
  state: load(),
  pendingStages: [],
  lastVisitDay: null,

  save() { save(this.state); },

  go(name, params = {}) {
    if (current && current.destroy) {
      try { current.destroy(); } catch (e) { console.warn(e); }
    }
    root.textContent = '';
    const screen = SCREENS[name].render(this, params);
    current = screen;
    root.append(screen.el);
    root.dataset.screen = name;
    window.scrollTo(0, 0);
  },

  // Prideda žvaigždučių, tikrina augimą ir pasiekimus.
  reward(n) {
    const grown = addStars(this.state, n);
    if (grown) this.pendingStages.push(grown);
    this.checkBadges();
    this.updateStarCounters();
    this.save();
  },

  // Kviesti po bet kokio skaitiklio pakeitimo.
  checkBadges() {
    const before = this.state.totalEarned;
    const earned = checkAchievements(this.state);
    for (const a of earned) {
      toast(h('div.badge-toast', null,
        h('span.badge-toast-icon', null, a.icon),
        h('div', null, h('b', null, 'Naujas ženkliukas!'), h('div', null, a.name), h('div.small', null, `+${a.reward} ⭐`))));
      confetti(18, { x: window.innerWidth / 2, y: 80 });
    }
    if (earned.length) {
      // Pasiekimų premija gali užauginti padarėlį.
      if (stageIndex(this.state.totalEarned) > stageIndex(before)) {
        this.pendingStages.push(stageFor(this.state.totalEarned));
      }
      this.updateStarCounters();
      this.save();
    }
  },

  played() {
    markPlayed(this.state, dateKey());
  },

  updateStarCounters() {
    document.querySelectorAll('[data-stars]').forEach(el => { el.textContent = this.state.stars; });
  },

  // Šventinė animacija, kai padarėlis paauga. Rodoma ramiu momentu.
  showCelebrations(done) {
    const stage = this.pendingStages.pop();
    this.pendingStages = [];
    if (!stage) { done && done(); return; }
    const mv = monsterView(this, { className: 'celebrate-monster', interactive: false });
    const name = this.state.monster.name;
    const text = stage.id === 'baby' ? `${name} išsirito!` : `${name} paaugo!`;
    let close;
    const content = h('div.celebrate', null,
      h('div.celebrate-title', null, 'Valio!'),
      mv.el,
      h('div.celebrate-text', null, text),
      h('div.celebrate-stage', null, `Dabar – ${stage.name.toLowerCase()}`),
      h('button.btn.btn-primary.btn-big', { onclick: () => close() }, 'Šaunu!'));
    close = modal(content, { className: 'modal-celebrate', onClose: done });
    setTimeout(() => { mv.react('cheer'); confetti(40); }, 300);
    setTimeout(() => confetti(30, { x: window.innerWidth * 0.25, y: window.innerHeight * 0.3 }), 900);
    setTimeout(() => confetti(30, { x: window.innerWidth * 0.75, y: window.innerHeight * 0.3 }), 1300);
  },
};

// Grįžimo pasisveikinimas: padarėlis tiesiog džiaugiasi.
ctx.lastVisitDay = ctx.state.days.last;

window.__ctx = ctx; // derinimui

function start() {
  requestPersist();
  ctx.go(ctx.state.monster ? 'home' : 'create', { first: !ctx.state.monster });
}

// Neleidžiam dvigubo bakstelėjimo priartinimo ir gestų priartinimo iOS.
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW klaida', e));
  });
  // Atėjus naujai versijai – perkraunam tik ramiame ekrane, kad nepertrauktume žaidimo.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && (root.dataset.screen === 'home' || root.dataset.screen === 'create')) location.reload();
  });
}

start();
