// Kambarys: daiktus galima tempti, padėtys išsaugomos.

import { h } from '../ui.js';
import { ITEM_BY_ID, ITEMS, isOwned } from '../catalog.js';
import { monsterView } from '../monsterView.js';
import { topBar, screen } from './common.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function render(ctx) {
  const s = ctx.state;
  const room = h('div.room');
  const wall = h('div.room-wall');
  const floor = h('div.room-floor');
  room.append(wall, floor);

  function applyDecor() {
    wall.className = 'room-wall ' + s.room.wallpaper;
    floor.className = 'room-floor ' + s.room.floor;
  }
  applyDecor();

  // Tempimas pirštu. Grąžina true per onTap, jei nepajudinta.
  function draggable(node, pos, { minY = 30, onTap } = {}) {
    const place = () => {
      node.style.left = pos.x + '%';
      node.style.top = pos.y + '%';
      if (!node.classList.contains('room-rug')) node.style.zIndex = 10 + Math.round(pos.y);
    };
    place();
    node.addEventListener('pointerdown', e => {
      e.preventDefault();
      node.setPointerCapture(e.pointerId);
      const rect = room.getBoundingClientRect();
      const sx = e.clientX, sy = e.clientY, x0 = pos.x, y0 = pos.y;
      let moved = false;
      node.classList.add('dragging');
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        pos.x = clamp(x0 + dx / rect.width * 100, 4, 96);
        pos.y = clamp(y0 + dy / rect.height * 100, minY, 99);
        place();
      };
      const up = () => {
        node.classList.remove('dragging');
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
        if (moved) ctx.save();
        else if (onTap) onTap();
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  // Daiktai.
  for (const it of s.room.items) {
    const item = ITEM_BY_ID[it.id];
    if (!item) continue;
    const node = item.kind === 'emoji'
      ? h('div.room-item', { 'aria-label': item.name }, item.emoji)
      : h('div.room-item.room-rug', { 'aria-label': item.name }, h('div.rug.' + item.kind));
    node.style.setProperty('--s', item.size || 1);
    draggable(node, it, { minY: item.kind === 'emoji' ? 20 : 62, onTap: () => { node.classList.remove('wobble'); void node.offsetWidth; node.classList.add('wobble'); } });
    room.append(node);
  }

  // Padarėlis.
  const mv = monsterView(ctx, { className: 'room-monster', interactive: false });
  const mnode = h('div.room-item.room-monster-wrap', null, mv.el);
  draggable(mnode, s.room.monster, { minY: 45, onTap: () => { mv.react(Math.random() < 0.5 ? 'spin' : 'jump'); mv.say(['Mano kambarys!', 'Jauku!', 'Hi hi!', 'Gražu!'][Math.floor(Math.random() * 4)], 1400); } });
  room.append(mnode);

  // Sienų ir grindų keitimas iš nupirktų.
  const decorBar = h('div.room-decor');
  function drawDecor() {
    decorBar.textContent = '';
    const owned = ITEMS.filter(i => i.cat === 'decor' && isOwned(s, i));
    for (const d of owned) {
      const active = s.room[d.slot === 'wall' ? 'wallpaper' : 'floor'] === d.id;
      decorBar.append(h('button.btn.decor-btn.decor-swatch.' + d.id + (active ? '.selected' : ''), {
        'aria-label': d.name,
        onclick: () => { s.room[d.slot === 'wall' ? 'wallpaper' : 'floor'] = d.id; ctx.save(); applyDecor(); drawDecor(); },
      }));
    }
  }
  drawDecor();

  const empty = !s.room.items.length
    ? h('div.room-empty', null, 'Kambarys dar tuščias. ',
      h('button.btn.btn-primary', { onclick: () => ctx.go('shop', { tab: 'furniture' }) }, 'Į parduotuvę 🛍️'))
    : null;

  const el = screen('room',
    topBar(ctx, { title: `${s.monster.name} kambarys` }),
    h('div.room-wrap', null, room, empty),
    h('div.room-tools', null, h('span.room-hint', null, '👆 Tempk daiktus'), decorBar));

  setTimeout(() => mv.say('Sveika atvykusi!', 1600), 400);
  return { el };
}
