// Ženkliukų kolekcija: atrakinti spalvoti, užrakinti – šešėliai.

import { h, modal } from '../ui.js';
import { ACHIEVEMENTS } from '../rewards.js';
import { resetAll } from '../storage.js';
import { topBar, screen, gateStep } from './common.js';

// Tėvų ataskaita – ta pati apsauga, kad vaikas netyčia neatsidarytų.
function openParentGate(ctx) {
  let close;
  const box = h('div.gate');
  gateStep(box, {
    text: 'Ataskaita tėvams. Išspręsk:',
    onPass: () => { close(); ctx.go('parent'); },
    onCancel: () => close(),
  });
  close = modal(box);
}

// Pradėti iš naujo. Apsaugota tėvų užduotimi (sudėtis/atimtis iki 100),
// paskui dar kartą paklausiama, ar tikrai.
function openReset(ctx) {
  let close;
  const box = h('div.gate');

  function askTask() {
    gateStep(box, { text: 'Kad pradėtum iš naujo, išspręsk:', onPass: confirmStep, onCancel: () => close() });
  }

  function confirmStep() {
    const s = ctx.state;
    const badges = Object.keys(s.badges).length;
    box.textContent = '';
    box.append(
      h('div.gate-title', null, 'Ar tikrai?'),
      h('p.gate-text', null, `Bus ištrinta viskas: padarėlis ${s.monster ? `„${s.monster.name}“` : ''}, ${s.stars} ⭐ (iš viso uždirbta ${s.totalEarned}), ${badges} ženkliukai, lygiai, kambarys ir išmokta rašysena.`),
      h('p.gate-text', null, h('b', null, 'Atkurti nebus galima.')),
      h('div.gate-buttons', null,
        h('button.btn.btn-secondary.btn-big', { onclick: () => close() }, 'Atšaukti'),
        h('button.btn.btn-danger.btn-big', {
          onclick: () => {
            ctx.state = resetAll();
            ctx.pendingStages = [];
            close();
            ctx.go('create', { first: true });
          },
        }, 'Ištrinti viską')));
  }

  askTask();
  close = modal(box);
}

export function render(ctx) {
  const s = ctx.state;
  const got = ACHIEVEMENTS.filter(a => s.badges[a.id]).length;

  const cards = ACHIEVEMENTS.map(a => {
    const has = !!s.badges[a.id];
    return h('button.btn.badge-card' + (has ? '.has' : '.locked'), {
      onclick: () => {
        let close;
        close = modal(h('div.badge-detail', null,
          h('div.badge-icon.big' + (has ? '' : '.shadow'), null, a.icon),
          h('div.badge-name', null, a.name),
          h('div.badge-desc', null, a.desc),
          h('div.badge-reward', null, has ? `Gauta! +${a.reward} ⭐` : `Premija: ${a.reward} ⭐`),
          h('button.btn.btn-primary.btn-big', { onclick: () => close() }, 'Gerai')));
      },
    }, h('div.badge-icon' + (has ? '' : '.shadow'), null, a.icon), h('div.badge-name', null, a.name));
  });

  const c = s.counters;
  const el = screen('badges',
    topBar(ctx, {
      title: 'Ženkliukai',
      extra: h('div.topbar-extra', null,
        h('button.btn.reset-btn', { 'aria-label': 'Tėvams', onclick: () => openParentGate(ctx) }, '👪 Tėvams'),
        h('button.btn.reset-btn', { 'aria-label': 'Pradėti iš naujo', onclick: () => openReset(ctx) }, '🔄 Iš naujo')),
    }),
    h('div.badges-summary', null,
      h('div.stat', null, h('b', null, `${got}/${ACHIEVEMENTS.length}`), h('span', null, 'ženkliukų')),
      h('div.stat', null, h('b', null, c.correct), h('span', null, 'teisingų')),
      h('div.stat', null, h('b', null, s.days.streak || 0), h('span', null, 'dienų iš eilės')),
      h('div.stat', null, h('b', null, s.totalEarned), h('span', null, 'iš viso ⭐'))),
    h('div.badge-grid', null, cards));
  return { el };
}
