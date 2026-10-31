// Parduotuvė: rūbai, kūno dalys, baldai, sienos ir grindys, skanėstai.

import { h, svgEl, modal, confetti } from '../ui.js';
import { CATEGORIES, itemsIn, isOwned } from '../catalog.js';
import { monsterSVG, COLORS, WEAR } from '../monster.js';
import { spendStars } from '../rewards.js';
import { monsterView } from '../monsterView.js';
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

  function isActive(item) {
    if (item.cat === 'clothes') return s.monster.wear && s.monster.wear[WEAR[item.id].slot] === item.id;
    if (item.cat === 'parts') return s.monster.parts[item.part] === item.opt;
    if (item.cat === 'decor') return s.room[item.slot === 'wall' ? 'wallpaper' : 'floor'] === item.id;
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
      s.room[item.slot === 'wall' ? 'wallpaper' : 'floor'] = item.id;
    }
    ctx.save();
    mv.refresh();
    mv.react('spin');
  }

  function buy(item) {
    if (!spendStars(s, item.price)) return false;
    if (item.consumable) {
      s.counters.fed += 1;
    } else {
      s.owned.push(item.id);
      s.counters.purchases += 1;
      if (item.cat === 'furniture') {
        s.room.items.push({ uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), id: item.id, x: 15 + Math.random() * 70, y: item.kind === 'emoji' ? 55 + Math.random() * 35 : 80 });
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
      const verb = item.consumable ? 'Pavaišinti' : 'Pirkti';
      actions.push(h('button.btn.btn-primary.btn-big', {
        disabled: missing > 0,
        onclick: () => {
          if (!buy(item)) return;
          close();
          confetti(30);
          if (item.consumable) feed(item);
          else if (item.cat !== 'furniture') use(item);
          else mv.say('Jau kambaryje!');
          draw();
        },
      }, `${verb} už ${item.price} ⭐`));
      if (missing > 0) actions.push(h('div.sheet-missing', null, `Dar trūksta ${missing} ⭐`));
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
