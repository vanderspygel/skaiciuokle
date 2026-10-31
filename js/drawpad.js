// Piešimo lenta pirštui. Kaupia brūkšnius ir praneša, kai vaikas sustoja.

import { h } from './ui.js';

export function drawPad({ onPause, pauseMs = 650, className = '' } = {}) {
  const canvas = h('canvas.drawpad-canvas');
  const hint = h('div.drawpad-hint', null, '✍️');
  const el = h('div.drawpad ' + className, null, canvas, hint);
  const ctx2d = canvas.getContext('2d');
  let strokes = [];
  let current = null;
  let pointerId = null;
  let timer = null;
  let enabled = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function style() {
    ctx2d.lineCap = 'round';
    ctx2d.lineJoin = 'round';
    ctx2d.lineWidth = Math.max(8, canvas.getBoundingClientRect().height / 26);
    ctx2d.strokeStyle = '#2b2340';
  }

  function drawStroke(s) {
    if (!s.length) return;
    ctx2d.beginPath();
    ctx2d.moveTo(s[0][0], s[0][1]);
    if (s.length === 1) ctx2d.lineTo(s[0][0] + 0.1, s[0][1]);
    for (let i = 1; i < s.length; i++) ctx2d.lineTo(s[i][0], s[i][1]);
    ctx2d.stroke();
  }

  function redraw() {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    style();
    strokes.forEach(drawStroke);
    hint.style.opacity = strokes.length ? 0 : 1;
  }

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  canvas.addEventListener('pointerdown', e => {
    if (!enabled || pointerId !== null) return;
    e.preventDefault();
    pointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nepalaikoma – nieko tokio */ }
    clearTimeout(timer);
    current = [pos(e)];
    strokes.push(current);
    hint.style.opacity = 0;
    style();
    drawStroke(current);
  });

  canvas.addEventListener('pointermove', e => {
    if (e.pointerId !== pointerId || !current) return;
    e.preventDefault();
    // Kai kurios naršyklės grąžina tuščią sąrašą – tada imam patį įvykį.
    const coalesced = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    const events = coalesced && coalesced.length ? coalesced : [e];
    for (const ev of events) {
      const p = pos(ev);
      const last = current[current.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 1.5) continue;
      ctx2d.beginPath();
      ctx2d.moveTo(last[0], last[1]);
      ctx2d.lineTo(p[0], p[1]);
      ctx2d.stroke();
      current.push(p);
    }
  });

  const end = e => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    current = null;
    clearTimeout(timer);
    timer = setTimeout(() => onPause && onPause(strokes.map(s => s.slice())), pauseMs);
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  return {
    el,
    strokes: () => strokes.map(s => s.slice()),
    isEmpty: () => strokes.length === 0,
    clear() {
      clearTimeout(timer);
      strokes = [];
      current = null;
      pointerId = null;
      redraw();
    },
    setEnabled(v) { enabled = v; el.classList.toggle('disabled', !v); },
    destroy() { clearTimeout(timer); ro.disconnect(); },
  };
}
