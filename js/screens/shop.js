// Parduotuvė: rūbai, kūno dalys, baldai, sienos ir grindys, skanėstai.

import { h, svgEl, modal, confetti } from '../ui.js';
import { CATEGORIES, itemsIn, isOwned, friendGrants } from '../catalog.js';
import { monsterSVG, COLORS, WEAR, randomParts } from '../monster.js';
import { spendStars, addFriend } from '../rewards.js';
import { monsterView } from '../monsterView.js';
import { roomState, currentRoomId, ROOM_BY_ID } from '../rooms.js';
import { topBar, screen } from './common.js';

export function render(ctx, { tab: initialTab } = {}) {
  const s = ctx.state;
  let tab = initialTab || 'clothes';
  const tabBar = h('div.tabs.shop-tabs');
  const grid = h('div.shop-grid');
  const mv = monsterView(ctx, { className: 'shop-monster' });

  // Peržiūrai visada rodom užaugusį padarėlį, kad matytųsi drabužiai.
  function previewMonster(item) {
    const m = JSON.parse(JSON.stringify(s.monster));
    m.wear = m.wear || {};
    if (item.cat === 'clothes') m.wear[WEAR[item.id].slot] = item.id;
    if (item.cat === 'parts') m.parts[item.part] = item.opt;
    return m;
  }

  function preview(item, big = false) {
    if (item.cat === 'friends') {
      if (!item.parts) return h('div.item-preview.emoji' + (big ? '.big' : ''), null, item.emoji);
      return h('div.item-preview' + (big ? '.big' : ''), null, svgEl(monsterSVG({ parts: item.parts, wear: item.wear || {} })));
    }
    if (item.cat === 'clothes' || (item.cat === 'parts' && item.part !== 'color')) {
      return h('div.item-preview' + (big ? '.big' : ''), null, svgEl(monsterSVG(previewMonster(item))));
    }
    if (item.cat === 'parts') {
      const c = COLORS[item.opt];
      return h('div.item-preview' + (big ? '.big' : ''), null,
        big ? svgEl(monsterSVG(previewMonster(item)))
          : h('span.swatch', { style: { background: c.grad ? `linear-gradient(135deg, ${c.grad.join(',')})` : c.main, borderColor: c.dark } }));
    }
    if (item.cat === 'decor') return h('div.item-preview.decor-swatch.' + item.id + (big ? '.big' : ''));
    if (item.kind && item.kind.startsWith('rug')) return h('div.item-preview' + (big ? '.big' : ''), null, h('div.rug.' + item.kind));
    return h('div.item-preview.emoji' + (big ? '.big' : ''), null, item.emoji);
  }

  // Baldai, sienos ir grindys keliauja į paskutinį aplankytą kambarį.
  const curRoom = () => roomState(s, currentRoomId(s));

  function isActive(item) {
    if (item.cat === 'clothes') return s.monster.wear && s.monster.wear[WEAR[item.id].slot] === item.id;
    if (item.cat === 'parts') return s.monster.parts[item.part] === item.opt;
    if (item.cat === 'decor') return curRoom()[item.slot === 'wall' ? 'wallpaper' : 'floor'] === item.id;
    return false;
  }

  function use(item) {
    if (item.cat === 'clothes') {
      s.monster.wear = s.monster.wear || {};
      const slot = WEAR[item.id].slot;
      s.monster.wear[slot] = s.monster.wear[slot] === item.id ? null : item.id;
    } else if (item.cat === 'parts') {
      s.monster.parts[item.part] = item.opt;
    } else if (item.cat === 'decor') {
      curRoom()[item.slot === 'wall' ? 'wallpaper' : 'floor'] = item.id;
    }
    ctx.save();
    mv.refresh();
    mv.react('spin');
  }

  // Naujas draugas: kiaušinis su pasirinktos rūšies išvaizda; po to – vardas ir išvaizda.
  function buyFriend(item) {
    if (!spendStars(s, item.price)) return false;
    if (!item.repeat) s.owned.push(item.id);
    for (const g of friendGrants(item)) if (!s.owned.includes(g)) s.owned.push(g);
    s.counters.purchases += 1;
    addFriend(s, {
      kind: item.kind,
      name: item.names[Math.floor(Math.random() * item.names.length)],
      parts: item.parts ? { ...item.parts } : randomParts(s.owned),
      wear: { ...(item.wear || {}) },
    });
    ctx.updateStarCounters();
    ctx.save();
    ctx.checkBadges();
    ctx.go('create', { newFriend: true });
    return true;
  }

  function buy(item) {
    if (item.cat === 'friends') return buyFriend(item);
    if (!spendStars(s, item.price)) return false;
    if (item.consumable) {
      s.counters.fed += 1;
    } else {
      s.owned.push(item.id);
      s.counters.purchases += 1;
      for (const g of item.grants || []) if (!s.owned.includes(g)) s.owned.push(g);
      if (item.cat === 'rooms') roomState(s, item.room);
      if (item.cat === 'furniture') {
        curRoom().items.push({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), id: item.id, x: 15 + Math.random() * 70, y: item.kind === 'emoji' ? 55 + Math.random() * 35 : 80 });
      }
    }
    ctx.updateStarCounters();
    ctx.save();
    ctx.checkBadges();
    return true;
  }

  function feed(item) {
    const food = h('div.food-fly', null, item.emoji);
    mv.el.append(food);
    setTimeout(() => { food.remove(); mv.react('eat'); mv.say(['Skanu!', 'Mmm!', 'Ačiū!', 'Nam nam!'][Math.floor(Math.random() * 4)], 1600); }, 700);
  }

  function openItem(item) {
    const owned = isOwned(s, item) && !item.consumable;
    const missing = item.price - s.stars;
    let close;
    const actions = [];
    if (!owned) {
      const verb = item.cat === 'friends' ? 'Gauti kiaušinį' : item.consumable ? 'Pavaišinti' : 'Pirkti';
      actions.push(h('button.btn.btn-primary.btn-big', {
        disabled: missing > 0,
        onclick: () => {
          if (item.cat === 'friends') { close(); buy(item); return; }
          if (!buy(item)) return;
          close();
          confetti(30);
          if (item.consumable) feed(item);
          else if (item.cat === 'rooms') { ctx.go('room', { room: item.room, fresh: true }); return; }
          else if (item.cat !== 'furniture') use(item);
          else mv.say('Jau kambaryje!');
          draw();
        },
      }, `${verb} už ${item.price} ⭐`));
      if (missing > 0) actions.push(h('div.sheet-missing', null, `Dar trūksta ${missing} ⭐`));
    } else if (item.cat === 'friends') {
      actions.push(h('button.btn.btn-primary.btn-big', { onclick: () => { close(); ctx.go('friends'); } }, 'Pas draugus 👫'));
    } else if (item.cat === 'rooms') {
      actions.push(h('button.btn.btn-primary.btn-big', { onclick: () => { close(); ctx.go('room', { room: item.room }); } }, 'Eiti ten 🏡'));
    } else if (item.cat === 'furniture') {
      actions.push(h('button.btn.btn-primary.btn-big', { onclick: () => { close(); ctx.go('room'); } }, 'Į kambarį 🏠'));
    } else {
      const active = isActive(item);
      const label = item.cat === 'clothes' ? (active ? 'Nusirengti' : 'Apsirengti') : (active ? 'Naudojama ✔' : 'Naudoti');
      actions.push(h('button.btn.btn-primary.btn-big', {
        disabled: active && item.cat !== 'clothes',
        onclick: () => { use(item); close(); draw(); },
      }, label));
    }
    actions.push(h('button.btn.btn-secondary.btn-big', { onclick: () => close() }, 'Atgal'));
    close = modal(h('div.sheet', null,
      preview(item, true),
      h('div.sheet-name', null, item.name),
      item.group ? h('div.sheet-group', null, item.group) : null,
      item.cat === 'rooms' ? h('div.sheet-group', null, 'Naujas kambarys tavo name. Ten gali gyventi draugai ir stovėti baldai.') : null,
      item.cat === 'furniture' || item.cat === 'decor' ? h('div.sheet-group', null, `Keliaus į: ${ROOM_BY_ID[currentRoomId(s)].icon} ${ROOM_BY_ID[currentRoomId(s)].name}`) : null,
      item.cat === 'friends' ? h('div.sheet-group', null, item.repeat ? 'Susikurk dar vieną padarėlį! Jis augs atskirai.' : 'Iš kiaušinio išsiris naujas draugas. Jis augs atskirai.') : null,
      h('div.sheet-actions', null, actions)), { className: 'modal-sheet' });
  }

  function drawTabs() {
    tabBar.textContent = '';
    for (const c of CATEGORIES) {
      tabBar.append(h('button.tab' + (c.id === tab ? '.active' : ''), {
        onclick: () => { tab = c.id; drawTabs(); draw(); },
      }, h('span.tab-icon', null, c.icon), h('span.tab-label', null, c.title)));
    }
  }

  function draw() {
    grid.textContent = '';
    for (const item of itemsIn(tab)) {
      const owned = isOwned(s, item) && !item.consumable;
      const afford = s.stars >= item.price;
      grid.append(h('button.btn.shop-card' + (owned ? '.owned' : '') + (!owned && !afford ? '.dim' : '') + (isActive(item) ? '.active' : ''), {
        onclick: () => openItem(item),
      },
        preview(item),
        h('div.shop-name', null, item.name),
        h('div.shop-price', null, owned ? '✔' : `${item.price} ⭐`)));
    }
  }

  drawTabs();
  draw();

  const el = screen('shop',
    topBar(ctx, { title: 'Parduotuvė' }),
    h('div.shop-layout', null,
      h('aside.shop-side', null, mv.el),
      h('section.shop-main', null, tabBar, grid)));
  return { el };
}
