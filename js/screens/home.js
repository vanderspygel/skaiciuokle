import { h } from '../ui.js';
import { monsterView } from '../monsterView.js';
import { stageFor, dateKey } from '../rewards.js';
import { STAGES } from '../config.js';
import { screen } from './common.js';

const HELLO = ['Labas!', 'Sveika!', 'Pažaidžiam?', 'Skaičiuojam?'];

export function render(ctx) {
  const s = ctx.state;
  const st = stageFor(s.totalEarned);
  const mv = monsterView(ctx, { className: 'home-monster' });

  // Kiek liko iki kito etapo.
  const idx = STAGES.indexOf(st);
  const nextStage = STAGES[idx + 1];
  let growth = null;
  if (nextStage) {
    const pct = Math.min(100, Math.round((s.totalEarned - st.min) / (nextStage.min - st.min) * 100));
    growth = h('div.growth', { title: 'Augimas' },
      h('span', null, st.id === 'egg' ? '🥚' : '🌱'),
      h('div.growth-bar', null, h('div.growth-fill', { style: { width: pct + '%' } })),
      h('span', null, st.id === 'egg' ? '🐣' : '🌳'));
  }

  const big = (icon, label, cls, onclick) =>
    h('button.btn.btn-mode.' + cls, { onclick }, h('span.btn-mode-icon', null, icon), h('span', null, label));
  const small = (icon, label, onclick) =>
    h('button.btn.btn-small-tile', { onclick }, h('span.tile-icon', null, icon), h('span', null, label));

  const el = screen('home',
    h('header.topbar', null,
      h('button.btn.btn-icon', { 'aria-label': 'Padarėlio išvaizda', onclick: () => ctx.go('create') }, '✏️'),
      h('div.topbar-title'),
      h('div.star-pill.star-pill-big', null, h('span', { 'data-stars': '' }, s.stars), ' ⭐')),
    h('section.home-stage', null,
      mv.el,
      h('div.home-name', null, s.monster.name),
      h('div.home-sub', null, st.name),
      growth),
    h('nav.home-modes', null,
      big('🔢', 'Skaičiuoti', 'mode-practice', () => ctx.go('levels')),
      big('🧠', 'Mintinai', 'mode-mental', () => ctx.go('setup', { mode: 'mental' })),
      big('📝', 'Kontrolinis', 'mode-test', () => ctx.go('setup', { mode: 'test' })),
      big('✍️', 'Rašyti', 'mode-write', () => ctx.go('setup', { mode: 'write' }))),
    h('nav.home-more', null,
      small('🛍️', 'Parduotuvė', () => ctx.go('shop')),
      small('🏠', 'Kambarys', () => ctx.go('room')),
      small('🏅', 'Ženkliukai', () => ctx.go('badges'))));

  // Pasisveikinimas. Jei ilgai nežaidė – tiesiog džiaugiasi.
  const today = dateKey();
  const greeting = ctx.lastVisitDay && ctx.lastVisitDay !== today && !ctx._greeted
    ? 'Valio, tu grįžai! 💛'
    : HELLO[Math.floor(Math.random() * HELLO.length)];
  ctx._greeted = true;
  const t1 = setTimeout(() => { mv.react('jump'); mv.say(greeting, 2200); }, 400);
  const t2 = setTimeout(() => ctx.showCelebrations(() => mv.refresh()), 300);

  return { el, destroy() { clearTimeout(t1); clearTimeout(t2); } };
}
