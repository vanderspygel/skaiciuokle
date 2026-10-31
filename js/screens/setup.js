// Mintinai ir kontrolinio nustatymai: laiko lygis, užduočių skaičius, istorija.

import { h } from '../ui.js';
import { SPEEDS } from '../config.js';
import { topBar, screen } from './common.js';

export function render(ctx, { mode }) {
  if (mode === 'write') return renderWrite(ctx);
  const s = ctx.state;
  const isTest = mode === 'test';
  let speed = s.prefs.lastSpeed || 'turtle';
  let count = s.prefs.lastTestCount || 10;

  const speedRow = h('div.speed-row');
  const countRow = h('div.count-row');

  function drawSpeeds() {
    speedRow.textContent = '';
    for (const sp of SPEEDS) {
      speedRow.append(h('button.btn.speed-btn' + (sp.id === speed ? '.selected' : ''), {
        onclick: () => {
          speed = sp.id;
          if (!isTest) start();
          else drawSpeeds();
        },
      }, h('span.speed-emoji', null, sp.emoji), h('span', null, sp.name),
        h('span.speed-stars', null, '⭐'.repeat(sp.stars))));
    }
  }

  function drawCounts() {
    countRow.textContent = '';
    for (const n of [10, 20]) {
      countRow.append(h('button.btn.count-btn' + (n === count ? '.selected' : ''), {
        onclick: () => { count = n; drawCounts(); },
      }, `${n} užduočių`));
    }
  }

  function start() {
    s.prefs.lastSpeed = speed;
    s.prefs.lastTestCount = count;
    ctx.save();
    ctx.go('quiz', { mode, speed, count });
  }

  drawSpeeds();
  drawCounts();

  let history = null;
  if (isTest && s.tests.length) {
    const recent = s.tests.slice(-12);
    history = h('section.history', null,
      h('h2', null, 'Mano kontroliniai'),
      h('div.history-strip', null, recent.map(t => {
        const sp = SPEEDS.find(x => x.id === t.speed);
        return h('div.history-item', null,
          h('div.history-stars', null, '⭐'.repeat(t.rating) || '💪'),
          h('div.history-score', null, `${t.ok}/${t.n}`),
          h('div.history-meta', null, `${sp ? sp.emoji : ''} ${t.date.slice(5).replace('-', '.')}`));
      })));
  }

  const el = screen('setup',
    topBar(ctx, { title: isTest ? 'Kontrolinis' : 'Mintinai' }),
    h('div.setup-body', null,
      h('p.setup-hint', null, isTest ? 'Kiek užduočių?' : 'Kokiu greičiu?'),
      isTest ? countRow : null,
      isTest ? h('p.setup-hint', null, 'Kokiu greičiu?') : null,
      speedRow,
      isTest ? h('button.btn.btn-primary.btn-big.start-btn', { onclick: start }, 'Pradedam! 🚀') : null,
      history));
  return { el };
}

// Rašymo režimas: pradėti arba išmokyti padarėlį savo rašysenos.
function renderWrite(ctx) {
  const samples = ctx.state.handwriting.samples;
  const known = Object.keys(samples).filter(d => samples[d].length).length;
  const start = () => ctx.go(known ? 'quiz' : 'teach', known ? { mode: 'write' } : { next: 'write' });

  const el = screen('setup',
    topBar(ctx, { title: 'Rašyti' }),
    h('div.setup-body', null,
      h('div.write-hero', null, '✍️'),
      h('p.setup-hint', null, 'Parašyk atsakymą pirštu!'),
      h('p.hint', null, known
        ? `Padarėlis jau moka ${known} iš 10 tavo skaitmenų.`
        : 'Pirmiausia parodyk padarėliui, kaip tu rašai skaičius.'),
      h('button.btn.btn-primary.btn-big.start-btn', { onclick: start }, known ? 'Pradedam! ✍️' : 'Mokyti padarėlį 🎓'),
      known ? h('button.btn.btn-secondary.btn-big', { onclick: () => ctx.go('teach', {}) }, 'Mokyti dar kartą 🎓') : null));
  return { el };
}
