// Draugai: visi užauginti ir auginami draugai. Bakstelėjus – žaidžiama su juo.

import { h, svgEl } from '../ui.js';
import { friendSVG } from '../monsterView.js';
import { allFriends, friendStage, switchFriend } from '../rewards.js';
import { friendKind } from '../catalog.js';
import { STAGES } from '../config.js';
import { growthBar } from './home.js';
import { topBar, screen } from './common.js';

export function render(ctx) {
  const s = ctx.state;
  const grid = h('div.friends-grid');

  for (const f of allFriends(s)) {
    const active = f === s.monster;
    const st = friendStage(f, s);
    grid.append(h('button.btn.friend-card' + (active ? '.active' : ''), {
      'aria-label': f.name,
      onclick: () => {
        if (!active) { switchFriend(s, f.uid); ctx.save(); }
        ctx.go('home');
      },
    },
      h('div.friend-pic', null, svgEl(friendSVG(ctx, f))),
      h('div.friend-name', null, f.name),
      h('div.friend-stage', null, `${friendKind(f.kind).emoji} ${st.name}`),
      growthBar(f, s),
      h('div.stage-steps', null, STAGES.map((x, i) => h('span' + (i <= STAGES.indexOf(st) ? '.done' : ''), null, x.emoji))),
      h('div.friend-tag', null, active ? '⭐ Žaidžia su tavim' : 'Bakstelk ir žaisk')));
  }

  grid.append(h('button.btn.friend-card.add', { onclick: () => ctx.go('shop', { tab: 'friends' }) },
    h('span.plus', null, '🥚'),
    h('span', null, 'Naujas draugas')));

  const el = screen('friends',
    topBar(ctx, { title: 'Mano draugai' }),
    h('p.friends-hint', null, 'Žvaigždutės augina tą draugą, su kuriuo dabar žaidi.'),
    grid);
  return { el };
}
