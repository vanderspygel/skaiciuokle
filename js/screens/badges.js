// Ženkliukų kolekcija: atrakinti spalvoti, užrakinti – šešėliai.

import { h, modal } from '../ui.js';
import { ACHIEVEMENTS } from '../rewards.js';
import { topBar, screen } from './common.js';

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
    topBar(ctx, { title: 'Ženkliukai' }),
    h('div.badges-summary', null,
      h('div.stat', null, h('b', null, `${got}/${ACHIEVEMENTS.length}`), h('span', null, 'ženkliukų')),
      h('div.stat', null, h('b', null, c.correct), h('span', null, 'teisingų')),
      h('div.stat', null, h('b', null, s.days.streak || 0), h('span', null, 'dienų iš eilės')),
      h('div.stat', null, h('b', null, s.totalEarned), h('span', null, 'iš viso ⭐'))),
    h('div.badge-grid', null, cards));
  return { el };
}
