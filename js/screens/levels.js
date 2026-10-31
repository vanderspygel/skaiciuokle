import { h } from '../ui.js';
import { LEVELS, UNLOCK_CORRECT } from '../config.js';
import { levelProgress } from '../rewards.js';
import { topBar, screen } from './common.js';

export function render(ctx) {
  const s = ctx.state;
  const cards = LEVELS.map(l => {
    const locked = l.id > s.progress.unlocked;
    const p = levelProgress(s, l.id);
    const isCurrent = l.id === s.progress.unlocked && l.id < LEVELS.length;
    let footer = null;
    if (locked) footer = h('div.level-lock', null, '🔒');
    else if (isCurrent) {
      const pct = Math.min(100, Math.round(p.correct / UNLOCK_CORRECT * 100));
      footer = h('div.level-progress', null, h('div.level-progress-fill', { style: { width: pct + '%' } }));
    } else footer = h('div.level-done', null, '⭐');
    return h('button.btn.level-card' + (locked ? '.locked' : ''), {
      disabled: locked,
      onclick: () => ctx.go('quiz', { mode: 'practice', level: l.id }),
    },
      h('div.level-num', null, l.id),
      h('div.level-icon', null, l.icon),
      h('div.level-title', null, l.title),
      footer);
  });

  const el = screen('levels',
    topBar(ctx, { title: 'Skaičiuoti' }),
    h('div.level-grid', null, cards));
  return { el };
}
