// „Išmokyk padarėlį“: vaikas po kartą parašo kiekvieną skaitmenį,
// kad atpažinimas prisitaikytų prie jos rašysenos.

import { h, confetti } from '../ui.js';
import { drawPad } from '../drawpad.js';
import { addSample, splitDigits, gestureSize, MIN_SIZE } from '../handwriting.js';
import { monsterView } from '../monsterView.js';
import { topBar, screen } from './common.js';

const ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
const THANKS = ['Aha!', 'Supratau!', 'Gražu!', 'Įsiminiau!', 'Ačiū!'];

// after: užduoties parametrai, nuo kurių pradėti po mokymo (pvz., mintinai su rašymu).
export function render(ctx, { after } = {}) {
  const goal = after || { mode: 'write' };
  const s = ctx.state;
  let i = 0;

  const mv = monsterView(ctx, { className: 'teach-monster' });
  const example = h('div.teach-example');
  const prompt = h('div.teach-prompt');
  const dots = h('div.progress-dots', null, ORDER.map(() => h('i')));
  const msg = h('div.feedback');
  const okBtn = h('button.btn.btn-primary.btn-big', { disabled: true, onclick: save }, 'Gerai ✔');
  const pad = drawPad({ onPause: () => { okBtn.disabled = pad.isEmpty(); } });
  const clearBtn = h('button.btn.btn-secondary.btn-big', { onclick: () => { pad.clear(); okBtn.disabled = true; msg.textContent = ''; } }, 'Trinti 🧽');
  const body = h('div.teach-body');

  function show() {
    const d = ORDER[i];
    example.textContent = d;
    prompt.textContent = `Parašyk skaičių ${d}`;
    pad.clear();
    okBtn.disabled = true;
    [...dots.children].forEach((dot, k) => dot.classList.toggle('done', k < i));
  }

  function save() {
    const strokes = pad.strokes();
    if (!strokes.length) return;
    const tooSmall = gestureSize(strokes) < MIN_SIZE;
    if (tooSmall || splitDigits(strokes).length > 1) {
      msg.className = 'feedback soft';
      msg.textContent = tooSmall ? 'Parašyk didesnį 🙂' : 'Parašyk tik vieną skaitmenį 🙂';
      pad.clear();
      okBtn.disabled = true;
      return;
    }
    msg.textContent = '';
    addSample(s.handwriting.samples, ORDER[i], strokes);
    ctx.save();
    mv.react('nod');
    mv.say(THANKS[Math.floor(Math.random() * THANKS.length)], 1000);
    i += 1;
    if (i < ORDER.length) show();
    else finish();
  }

  function finish() {
    dots.lastElementChild?.classList.add('done');
    ctx.checkBadges();
    ctx.save();
    body.textContent = '';
    body.append(h('div.overlay-card', null,
      h('div.overlay-emoji', null, '🎓'),
      h('div.overlay-text', null, 'Ačiū! Dabar suprantu tavo rašyseną!'),
      h('div.overlay-buttons', null,
        h('button.btn.btn-primary.btn-big', { onclick: () => ctx.go('quiz', goal) }, 'Pradedam! ✍️'),
        h('button.btn.btn-secondary.btn-big', { onclick: () => ctx.go('home') }, 'Namo 🏠'))));
    mv.react('cheer');
    confetti(40);
  }

  body.append(
    h('section.teach-left', null, mv.el, prompt, example),
    h('section.teach-right', null, pad.el, msg, h('div.draw-buttons.row', null, clearBtn, okBtn)));

  show();

  const el = screen('teach',
    topBar(ctx, { back: 'setup', backParams: { mode: goal.mode }, title: 'Išmokyk padarėlį', extra: dots }),
    h('p.teach-intro', null, 'Padarėlis nori išmokti, kaip tu rašai skaičius.'),
    body);
  return { el, destroy() { pad.destroy(); } };
}
