// Mažos UI pagalbinės funkcijos.

// h('div.klase', {onclick}, vaikai...)
export function h(tag, props, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class') el.className += ' ' + v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function svgEl(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

// Perpaleidžia CSS animacijos klasę.
export function pulse(el, cls, ms = 900) {
  if (!el) return;
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
  clearTimeout(el['_t' + cls]);
  el['_t' + cls] = setTimeout(() => el.classList.remove(cls), ms);
}

const CONFETTI_COLORS = ['#ff7eb6', '#ffd23f', '#7ed957', '#5aa9ff', '#9b7bff', '#ff9f45'];

// Lengvas konfeti: keliolika DOM elementų su CSS animacija.
export function confetti(count = 26, origin) {
  const layer = h('div.confetti');
  const ox = origin ? origin.x : window.innerWidth / 2;
  const oy = origin ? origin.y : window.innerHeight / 3;
  for (let i = 0; i < count; i++) {
    const p = h('i');
    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 160;
    p.style.left = ox + 'px';
    p.style.top = oy + 'px';
    p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    p.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--dy', Math.sin(angle) * dist * 0.6 + 140 + 'px');
    p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    p.style.animationDelay = Math.random() * 80 + 'ms';
    if (i % 3 === 0) p.style.borderRadius = '50%';
    layer.append(p);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1600);
}

// Iššokantis langelis (pvz., pasiekimui). Neblokuoja žaidimo.
export function toast(content, ms = 3200) {
  let host = document.querySelector('.toasts');
  if (!host) {
    host = h('div.toasts');
    document.body.append(host);
  }
  const t = h('div.toast', null, content);
  host.append(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

// Modalinis langas. Grąžina uždarymo funkciją.
export function modal(content, { onClose, className } = {}) {
  const box = h('div.modal-box' + (className ? '.' + className : ''), null, content);
  const back = h('div.modal', null, box);
  const close = () => {
    back.classList.add('out');
    setTimeout(() => back.remove(), 250);
    onClose && onClose();
  };
  document.body.append(back);
  return close;
}

export function starsText(n) {
  return `${n} ⭐`;
}
