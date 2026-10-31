import { h } from '../ui.js';

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
