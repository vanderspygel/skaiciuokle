import { h, svgEl } from '../ui.js';
import { monsterView, friendSVG } from '../monsterView.js';
import { friendStage, growOf, switchFriend, dateKey } from '../rewards.js';
import { STAGES } from '../config.js';
import { screen } from './common.js';

const HELLO = ['Labas!', 'Sveika!', 'Pažaidžiam?', 'Skaičiuojam?'];

export function render(ctx) {
  const s = ctx.state;
  const st = friendStage(s.monster, s);
  const mv = monsterView(ctx, { className: 'home-monster' });
  const growth = growthBar(s.monster, s);
  const idx = STAGES.indexOf(st);

  // Kiti draugai – mažyčiai; bakstelėjus žaidžiama su juo.
  const others = (s.friends || []).slice(0, 4);
  const friendsRow = others.length
    ? h('div.home-friends', null, others.map(f => h('button.btn.home-friend', {
      'aria-label': f.name,
      onclick: () => { switchFriend(s, f.uid); ctx.save(); ctx.go('home'); },
    }, svgEl(friendSVG(ctx, f)))))
    : null;

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
      h('div.home-sub', null, `${st.name} · ${idx + 1} iš ${STAGES.length}`),
      growth,
      friendsRow),
    h('nav.home-modes', null,
      big('🔢', 'Skaičiuoti', 'mode-practice', () => ctx.go('levels')),
      big('🧠', 'Mintinai', 'mode-mental', () => ctx.go('setup', { mode: 'mental' })),
      big('📝', 'Kontrolinis', 'mode-test', () => ctx.go('setup', { mode: 'test' })),
      big('✍️', 'Rašyti', 'mode-write', () => ctx.go('setup', { mode: 'write' }))),
    h('nav.home-more', null,
      small('🛍️', 'Parduotuvė', () => ctx.go('shop')),
      small('🏠', 'Kambarys', () => ctx.go('room')),
      small('👫', 'Draugai', () => ctx.go('friends')),
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

// Augimo juosta iki kito etapo (null, jei jau paskutinis).
export function growthBar(m, s) {
  const st = friendStage(m, s);
  const next = STAGES[STAGES.indexOf(st) + 1];
  if (!next) return h('div.growth', null, h('span', null, '👑 Legenda!'));
  const pct = Math.min(100, Math.round((growOf(m, s) - st.min) / (next.min - st.min) * 100));
  return h('div.growth', { title: `Iki etapo „${next.name}“` },
    h('span', null, st.emoji),
    h('div.growth-bar', null, h('div.growth-fill', { style: { width: pct + '%' } })),
    h('span', null, next.emoji));
}
