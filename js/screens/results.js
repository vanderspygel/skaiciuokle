// Kontrolinio rezultatai: žvaigždutės, reakcija, klaidų sąrašas.

import { h, confetti } from '../ui.js';
import { testRating, testBonus } from '../config.js';
import { problemText, answerText } from '../math.js';
import { dateKey } from '../rewards.js';
import { monsterView } from '../monsterView.js';
import { topBar, screen } from './common.js';

export function render(ctx, { log, speed, count, input }) {
  const s = ctx.state;
  const ok = log.filter(x => x.correct).length;
  const rating = testRating(ok / count);
  const bonus = testBonus(rating.stars, count);
  const mistakes = log.filter(x => !x.correct);

  s.tests.push({ date: dateKey(), n: count, speed, ok, rating: rating.stars });
  if (s.tests.length > 200) s.tests.splice(0, s.tests.length - 200);
  s.counters.tests += 1;
  if (ok === count) {
    s.counters.perfectTests += 1;
    if (speed === 'cheetah') s.counters.perfectCheetah += 1;
  }
  ctx.reward(bonus);

  const mv = monsterView(ctx, { className: 'results-monster' });
  const starRow = h('div.result-stars', null,
    [0, 1, 2].map(i => h('span.result-star' + (i < rating.stars ? '.on' : ''), { style: { animationDelay: 300 + i * 350 + 'ms' } }, '⭐')));

  const list = mistakes.length
    ? h('section.mistakes', null,
      h('h2', null, 'Pasimokykim iš klaidų'),
      h('div.mistake-list', null, mistakes.map(m => h('div.mistake', null,
        h('span.mistake-task', null, problemText(m.problem)),
        h('span.mistake-yours', null, m.value === null ? '⏰' : answerText(m.problem, m.value)),
        h('span.mistake-arrow', null, '→'),
        h('span.mistake-right', null, answerText(m.problem, m.problem.answer))))),
      h('button.btn.btn-primary.btn-big', { onclick: () => ctx.go('quiz', { mode: 'review', input, problems: mistakes.map(m => m.problem) }) }, 'Pakartoti klaidas 🔍'))
    : null;

  const el = screen('results',
    topBar(ctx, { title: 'Rezultatas' }),
    h('div.results-body', null,
      h('div.results-top', null,
        mv.el,
        h('div.results-summary', null,
          h('div.result-emoji', null, rating.emoji),
          starRow,
          h('div.result-score', null, `${ok} iš ${count}`),
          h('div.result-text', null, rating.text),
          bonus ? h('div.result-bonus', null, `+${bonus} ⭐`) : null)),
      list,
      h('div.results-buttons', null,
        h('button.btn.btn-secondary.btn-big', { onclick: () => ctx.go('setup', { mode: 'test' }) }, 'Dar kartą 🔁'),
        h('button.btn.btn-secondary.btn-big', { onclick: () => ctx.go('home') }, 'Namo 🏠'))));

  const t = setTimeout(() => {
    if (rating.stars >= 2) { confetti(50); mv.react('cheer'); }
    else mv.react('jump');
    mv.say(rating.stars === 3 ? 'Tu žvaigždė!' : rating.stars ? 'Šaunuolė!' : 'Kartu treniruosimės!', 2600);
    ctx.showCelebrations(() => mv.refresh());
  }, 500);
  return { el, destroy() { clearTimeout(t); } };
}
