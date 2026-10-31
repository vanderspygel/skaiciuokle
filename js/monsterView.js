// Padarėlio komponentas su reakcijomis (šokinėja, apsisuka, padrąsina).

import { monsterSVG } from './monster.js';
import { stageFor } from './rewards.js';
import { h, svgEl, pulse } from './ui.js';

const GIGGLES = ['Hi hi hi!', 'Kutena!', 'Cha cha!', 'Labas!', 'Oho!'];

export function monsterView(ctx, { className = '', interactive = true, monster, stage } = {}) {
  const m = monster || ctx.state.monster;
  const st = stage || stageFor(ctx.state.totalEarned);
  const bubble = h('div.bubble');
  const wrap = h('div.monster ' + className);
  let svg = svgEl(monsterSVG(m, { stage: st.id, scale: st.scale }));
  wrap.append(svg, bubble);

  let bubbleTimer;
  const view = {
    el: wrap,
    say(text, ms = 1800) {
      bubble.textContent = text;
      bubble.classList.add('show');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
    },
    react(kind) {
      const cls = { jump: 'm-jump', spin: 'm-spin', wiggle: 'm-wiggle', cheer: 'm-cheer', nod: 'm-nod', eat: 'm-eat' }[kind];
      if (cls) pulse(wrap, cls, 1000);
    },
    refresh(newMonster, newStage) {
      const s = newStage || stageFor(ctx.state.totalEarned);
      const fresh = svgEl(monsterSVG(newMonster || ctx.state.monster, { stage: s.id, scale: s.scale }));
      svg.replaceWith(fresh);
      svg = fresh;
    },
  };

  if (interactive) {
    wrap.addEventListener('click', () => {
      view.react(Math.random() < 0.5 ? 'spin' : 'wiggle');
      view.say(GIGGLES[Math.floor(Math.random() * GIGGLES.length)], 1200);
    });
  }
  return view;
}
