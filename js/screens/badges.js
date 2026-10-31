// Ženkliukų kolekcija: atrakinti spalvoti, užrakinti – šešėliai.

import { h, modal } from '../ui.js';
import { ACHIEVEMENTS } from '../rewards.js';
import { makeGateProblem } from '../math.js';
import { resetAll } from '../storage.js';
import { topBar, screen } from './common.js';

// Pradėti iš naujo. Apsaugota tėvų užduotimi (sudėtis/atimtis iki 100),
// paskui dar kartą paklausiama, ar tikrai.
function openReset(ctx) {
  let close;
  const box = h('div.gate');

  function askTask(wrong) {
    const task = makeGateProblem();
    const input = h('input.gate-input', {
      type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 3,
      autocomplete: 'off', 'aria-label': 'Atsakymas',
    });
    const submit = () => {
      if (Number(input.value.trim()) === task.answer && input.value.trim() !== '') confirmStep();
      else askTask(true);
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    box.textContent = '';
    box.append(
      h('div.gate-title', null, '🔒 Tik tėvams'),
      h('p.gate-text', null, 'Kad pradėtum iš naujo, išspręsk:'),
      h('div.gate-task', null, `${task.text} =`),
      input,
      wrong ? h('p.gate-wrong', null, 'Neteisingai – štai kita užduotis.') : null,
      h('div.gate-buttons', null,
        h('button.btn.btn-secondary.btn-big', { onclick: () => close() }, 'Atšaukti'),
        h('button.btn.btn-primary.btn-big', { onclick: submit }, 'Toliau')));
    setTimeout(() => input.focus(), 50);
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

  askTask(false);
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
      extra: h('button.btn.reset-btn', { 'aria-label': 'Pradėti iš naujo', onclick: () => openReset(ctx) }, '🔄 Iš naujo'),
    }),
    h('div.badges-summary', null,
      h('div.stat', null, h('b', null, `${got}/${ACHIEVEMENTS.length}`), h('span', null, 'ženkliukų')),
      h('div.stat', null, h('b', null, c.correct), h('span', null, 'teisingų')),
      h('div.stat', null, h('b', null, s.days.streak || 0), h('span', null, 'dienų iš eilės')),
      h('div.stat', null, h('b', null, s.totalEarned), h('span', null, 'iš viso ⭐'))),
    h('div.badge-grid', null, cards));
  return { el };
}
