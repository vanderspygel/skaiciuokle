// Programos pradžia: būsena, ekranų perjungimas, apdovanojimai.

import { load, save, requestPersist } from './storage.js';
import { addStars, addGems, checkAchievements, markPlayed, dateKey, friendStage } from './rewards.js';
import { questEvent, QUEST_STARS, QUEST_GEMS } from './economy.js';
import { h, toast, confetti, modal } from './ui.js';
import { monsterView } from './monsterView.js';
import { newsToShow, markNewsSeen } from './news.js';

import * as home from './screens/home.js';
import * as create from './screens/create.js';
import * as levels from './screens/levels.js';
import * as quiz from './screens/quiz.js';
import * as setup from './screens/setup.js';
import * as results from './screens/results.js';
import * as shop from './screens/shop.js';
import * as room from './screens/room.js';
import * as badges from './screens/badges.js';
import * as teach from './screens/teach.js';
import * as friends from './screens/friends.js';
import * as parent from './screens/parent.js';

const SCREENS = { home, create, levels, quiz, setup, results, shop, room, badges, teach, friends, parent };

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

  addGems(n) {
    addGems(this.state, n);
    this.updateStarCounters();
    this.save();
  },

  // Dienos užduoties įvykis; atlikus – premija ir pranešimas.
  quest(e) {
    const done = questEvent(this.state, dateKey(), e);
    if (!done) return;
    toast(h('div.badge-toast', null,
      h('span.badge-toast-icon', null, '🎯'),
      h('div', null, h('b', null, 'Dienos užduotis atlikta!'), h('div', null, done.text), h('div.small', null, `+${QUEST_STARS} ⭐ +${QUEST_GEMS} 💎`))));
    confetti(24, { x: window.innerWidth / 2, y: 80 });
    addGems(this.state, QUEST_GEMS);
    this.reward(QUEST_STARS);
  },

  // Kviesti po bet kokio skaitiklio pakeitimo.
  checkBadges() {
    const before = friendStage(this.state.monster, this.state);
    const earned = checkAchievements(this.state);
    for (const a of earned) {
      toast(h('div.badge-toast', null,
        h('span.badge-toast-icon', null, a.icon),
        h('div', null, h('b', null, 'Naujas ženkliukas!'), h('div', null, a.name), h('div.small', null, `+${a.reward} ⭐`))));
      confetti(18, { x: window.innerWidth / 2, y: 80 });
    }
    if (earned.length) {
      // Pasiekimų premija gali užauginti padarėlį.
      const after = friendStage(this.state.monster, this.state);
      if (after.min > before.min) this.pendingStages.push(after);
      this.updateStarCounters();
      this.save();
    }
  },

  played() {
    markPlayed(this.state, dateKey());
  },

  updateStarCounters() {
    document.querySelectorAll('[data-stars]').forEach(el => { el.textContent = this.state.stars; });
    document.querySelectorAll('[data-gems]').forEach(el => { el.textContent = this.state.gems || 0; });
  },

  // Šventinė animacija, kai padarėlis paauga. Rodoma ramiu momentu.
  showCelebrations(done) {
    const stage = this.pendingStages.pop();
    this.pendingStages = [];
    if (!stage) { done && done(); return; }
    const mv = monsterView(this, { className: 'celebrate-monster', interactive: false });
    const name = this.state.monster.name;
    const text = stage.id === 'baby' ? `${name} išsirito!` : stage.fx ? `${name} tapo dar šaunesnis!` : `${name} paaugo!`;
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

// Naujienos po atnaujinimo: sąrašas → „Pirmyn!“ → „Ar viską perskaitei?“
// „Ne“ grąžina į sąrašą, „Taip“ uždaro ir žaidžiam. Rodoma vieną kartą.
ctx.showNews = function showNews(done) {
  const news = newsToShow(this.state);
  if (!news) { done && done(); return false; }
  let close;
  const box = h('div.news');
  const list = () => {
    box.replaceChildren(
      h('div.news-title', null, '🎉 ', news.title),
      h('ul.news-list', null, news.items.map(it => h('li.news-item', null,
        h('span.news-icon', { 'aria-hidden': 'true' }, it.icon),
        h('div', null, h('b.news-item-title', null, it.title), ' ', h('span', null, it.text))))),
      h('button.btn.btn-primary.btn-big.news-go', { onclick: ask }, 'Pirmyn!'));
    const scroller = box.closest('.modal-box');
    if (scroller) scroller.scrollTop = 0;
  };
  const ask = () => {
    box.replaceChildren(
      h('div.news-ask', null, 'Ar viską perskaitei?'),
      h('div.news-answers', null,
        h('button.btn.btn-primary.btn-big', { onclick: () => {
          markNewsSeen(this.state);
          this.save();
          close();
          confetti(30);
        } }, 'Taip 👍'),
        h('button.btn.btn-secondary.btn-big', { onclick: list }, 'Ne')));
    const scroller = box.closest('.modal-box');
    if (scroller) scroller.scrollTop = 0;
  };
  list();
  close = modal(box, { className: 'modal-news', onClose: done });
  return true;
};

// Grįžimo pasisveikinimas: padarėlis tiesiog džiaugiasi.
ctx.lastVisitDay = ctx.state.days.last;

window.__ctx = ctx; // derinimui

function start() {
  requestPersist();
  ctx.go(ctx.state.monster ? 'home' : 'create', { first: !ctx.state.monster });
  ctx.showNews();
}

// Neleidžiam dvigubo bakstelėjimo priartinimo ir gestų priartinimo iOS.
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW klaida', e));
  });
  // Atėjus naujai versijai – perkraunam, bet ne užduoties ar mokymo viduryje
  // (tada nauja versija įsijungs kitą kartą grįžus į pagrindinį ekraną).
  const hadController = !!navigator.serviceWorker.controller;
  let updateReady = false;
  const busy = () => ['quiz', 'teach', 'create'].includes(root.dataset.screen);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    if (busy()) updateReady = true;
    else location.reload();
  });
  new MutationObserver(() => { if (updateReady && !busy()) location.reload(); })
    .observe(root, { attributes: true, attributeFilter: ['data-screen'] });
}

start();
