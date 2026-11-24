import { h } from '../ui.js';
import { makeGateProblem } from '../math.js';

// Viršutinė juosta: atgal mygtukas, pavadinimas, žvaigždučių skaičius.
export function topBar(ctx, { back = 'home', backParams, title = '', onBack, extra } = {}) {
  const backBtn = back || onBack
    ? h('button.btn.btn-icon', { 'aria-label': 'Atgal', onclick: onBack || (() => ctx.go(back, backParams)) }, back === 'home' && !onBack ? '🏠' : '⬅️')
    : h('span.btn-icon-space');
  return h('header.topbar', null,
    backBtn,
    h('div.topbar-title', null, title),
    extra || null,
    h('div.star-pill', null, h('span', { 'data-stars': '' }, ctx.state.stars), ' ⭐'));
}

export function screen(cls, ...children) {
  return h('main.screen.' + cls, null, ...children);
}

// Tėvų apsauga: dviženklių sudėtis arba atimtis iki 100 (vaikui per sunku).
// Suklydus duodama kita užduotis. Piešiama į box (pvz., modalo turinį).
export function gateStep(box, { text, onPass, onCancel }, wrong = false) {
  const task = makeGateProblem();
  const input = h('input.gate-input', {
    type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 3,
    autocomplete: 'off', 'aria-label': 'Atsakymas',
  });
  const submit = () => {
    if (input.value.trim() !== '' && Number(input.value.trim()) === task.answer) onPass();
    else gateStep(box, { text, onPass, onCancel }, true);
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  box.textContent = '';
  box.append(
    h('div.gate-title', null, '🔒 Tik tėvams'),
    h('p.gate-text', null, text),
    h('div.gate-task', null, `${task.text} =`),
    input,
    wrong ? h('p.gate-wrong', null, 'Neteisingai – štai kita užduotis.') : null,
    h('div.gate-buttons', null,
      h('button.btn.btn-secondary.btn-big', { onclick: onCancel }, 'Atšaukti'),
      h('button.btn.btn-primary.btn-big', { onclick: submit }, 'Toliau')));
  setTimeout(() => input.focus(), 50);
}
