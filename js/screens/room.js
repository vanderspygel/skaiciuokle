// Kambariai: daiktus ir draugus galima tempti, padėtys išsaugomos.
// Nutempus ant kito kambario mygtuko – daiktas ar draugas persikelia ten.

import { h, toast } from '../ui.js';
import { allFriends } from '../rewards.js';
import { ROOM_BY_ID, ownedRooms, roomState, currentRoomId, friendRoom } from '../rooms.js';
import { ITEM_BY_ID, ITEMS, isOwned } from '../catalog.js';
import { monsterView } from '../monsterView.js';
import { topBar, screen } from './common.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function render(ctx, params = {}) {
  const s = ctx.state;
  const roomId = params.room && ROOM_BY_ID[params.room] ? params.room : currentRoomId(s);
  if (s.prefs.room !== roomId) { s.prefs.room = roomId; ctx.save(); }
  const R = roomState(s, roomId);
  const info = ROOM_BY_ID[roomId];
  const room = h('div.room');
  const wall = h('div.room-wall');
  const floor = h('div.room-floor');
  room.append(wall, floor);

  function applyDecor() {
    wall.className = 'room-wall ' + R.wallpaper;
    floor.className = 'room-floor ' + R.floor;
  }
  applyDecor();

  // Tempimas pirštu. Grąžina true per onTap, jei nepajudinta.
  // Kito kambario mygtukas po pirštu (jei yra).
  function tabUnder(node, ev) {
    node.style.pointerEvents = 'none';
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    node.style.pointerEvents = '';
    const tab = el && el.closest('[data-room]');
    return tab && tab.dataset.room !== roomId ? tab : null;
  }

  function draggable(node, pos, { minY = 30, onTap, onDrop } = {}) {
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
        if (onDrop) {
          const t = tabUnder(node, ev);
          tabBar.querySelectorAll('.drop-hover').forEach(x => x !== t && x.classList.remove('drop-hover'));
          if (t) t.classList.add('drop-hover');
        }
      };
      const up = ev => {
        node.classList.remove('dragging');
        const t = onDrop && moved && ev && ev.type === 'pointerup' ? tabUnder(node, ev) : null;
        tabBar.querySelectorAll('.drop-hover').forEach(x => x.classList.remove('drop-hover'));
        if (t) { onDrop(t.dataset.room); return cleanup(); }
        cleanup();
        if (moved) ctx.save();
        else if (onTap) onTap();
      };
      const cleanup = () => {
        node.removeEventListener('pointermove', move);
        node.removeEventListener('pointerup', up);
        node.removeEventListener('pointercancel', up);
      };
      node.addEventListener('pointermove', move);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
    });
  }

  const tabBar = h('div.room-tabs');
  const relocated = (what, to) => {
    ctx.save();
    toast(h('div.badge-toast', null, h('span.badge-toast-icon', null, ROOM_BY_ID[to].icon), h('div', null, h('b', null, what), h('div', null, `→ ${ROOM_BY_ID[to].name}`))));
    ctx.go('room', { room: roomId });
  };

  // Daiktai.
  for (const it of R.items) {
    const item = ITEM_BY_ID[it.id];
    if (!item) continue;
    const node = item.kind === 'emoji'
      ? h('div.room-item', { 'aria-label': item.name }, item.emoji)
      : h('div.room-item.room-rug', { 'aria-label': item.name }, h('div.rug.' + item.kind));
    node.style.setProperty('--s', item.size || 1);
    draggable(node, it, {
      minY: item.kind === 'emoji' ? 20 : 62,
      onTap: () => { node.classList.remove('wobble'); void node.offsetWidth; node.classList.add('wobble'); },
      onDrop: to => {
        R.items.splice(R.items.indexOf(it), 1);
        roomState(s, to).items.push({ ...it, x: 20 + Math.random() * 60, y: item.kind === 'emoji' ? 60 + Math.random() * 30 : 80 });
        relocated(item.name, to);
      },
    });
    room.append(node);
  }

  // Draugai, gyvenantys šiame kambaryje (aktyvaus padėtis – s.room.monster).
  let greeter = null;
  allFriends(s).forEach((f, i) => {
    if (friendRoom(s, f) !== roomId) return;
    const active = f === s.monster;
    const pos = active ? s.room.monster : (f.pos || (f.pos = { x: 15 + (i * 17) % 70, y: 60 + (i * 7) % 30 }));
    const fv = monsterView(ctx, { className: 'room-monster', interactive: false, monster: f });
    const fnode = h('div.room-item.room-monster-wrap', null, fv.el);
    const lines = active ? ['Mano kambarys!', 'Jauku!', 'Hi hi!', 'Gražu!'] : ['Labas!', `Aš ${f.name}!`, 'Pažaidžiam?', 'Hi hi!'];
    draggable(fnode, pos, {
      minY: 45,
      onTap: () => { fv.react(Math.random() < 0.5 ? 'spin' : 'jump'); fv.say(lines[Math.floor(Math.random() * 4)], 1400); },
      onDrop: to => { f.room = to; relocated(f.name, to); },
    });
    room.append(fnode);
    if (active || !greeter) greeter = fv;
  });

  // Sienų ir grindų keitimas iš nupirktų.
  const decorBar = h('div.room-decor');
  function drawDecor() {
    decorBar.textContent = '';
    const owned = ITEMS.filter(i => i.cat === 'decor' && isOwned(s, i));
    for (const d of owned) {
      const active = R[d.slot === 'wall' ? 'wallpaper' : 'floor'] === d.id;
      decorBar.append(h('button.btn.decor-btn.decor-swatch.' + d.id + (active ? '.selected' : ''), {
        'aria-label': d.name,
        onclick: () => { R[d.slot === 'wall' ? 'wallpaper' : 'floor'] = d.id; ctx.save(); applyDecor(); drawDecor(); },
      }));
    }
  }
  drawDecor();

  // Kambarių mygtukai: perjungti ir nutempti daiktą ar draugą.
  for (const r of ownedRooms(s)) {
    tabBar.append(h('button.btn.room-tab' + (r.id === roomId ? '.active' : ''), {
      'data-room': r.id, 'aria-label': r.name,
      onclick: () => { if (r.id !== roomId) ctx.go('room', { room: r.id }); },
    }, h('span.room-tab-icon', null, r.icon), h('span.room-tab-label', null, r.name)));
  }
  tabBar.append(h('button.btn.room-tab.room-tab-add', { 'aria-label': 'Naujas kambarys', onclick: () => ctx.go('shop', { tab: 'rooms' }) },
    h('span.room-tab-icon', null, '➕'), h('span.room-tab-label', null, 'Naujas')));

  const empty = !R.items.length
    ? h('div.room-empty', null, roomId === 'home' ? 'Kambarys dar tuščias. ' : 'Nutempk čia draugą ant mygtuko viršuje arba ',
      h('button.btn.btn-primary', { onclick: () => ctx.go('shop', { tab: 'furniture' }) }, 'Į parduotuvę 🛍️'))
    : null;

  const el = screen('room',
    topBar(ctx, { title: roomId === 'home' && !(s.friends || []).length ? `${s.monster.name} kambarys` : info.name }),
    tabBar,
    h('div.room-wrap', null, room, empty),
    h('div.room-tools', null, h('span.room-hint', null, ownedRooms(s).length > 1 ? '👆 Tempk. Ant kito kambario – persikels' : '👆 Tempk daiktus'), decorBar));

  const t = setTimeout(() => greeter && greeter.say(params.fresh ? 'Valio, naujas kambarys!' : 'Sveika atvykusi!', 1600), 400);
  return { el, destroy() { clearTimeout(t); } };
}
