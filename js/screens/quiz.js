// Užduočių ekranas. Režimai:
//  practice – įprastas skaičiavimas pagal lygį (be laiko, su vaizdine pagalba 1–3 lygiuose);
//  mental   – mintinai su vizualiu laikmačiu;
//  test     – kontrolinis (be grįžtamojo ryšio, laikas kiekvienam veiksmui);
//  review   – kontrolinio klaidų pakartojimas;
//  write    – atsakymas rašomas pirštu (be laiko).

import { h, svgEl, pulse, confetti, toast } from '../ui.js';
import { SPEEDS, gameFor } from '../config.js';
import { Scheduler, makeChoices, checkAnswer, recordResult, statKey } from '../math.js';
import {
  problemPoints, masteryFactor, modeMult, roundStars, repeatMult, roundGems, ratingMult,
  today, practiceKey, recordBest,
} from '../economy.js';
import { buildTemplates, recognizeNumber, addSample } from '../handwriting.js';
import { drawPad } from '../drawpad.js';
import { updateStreak, recordLevelAnswer, unlockedLevels, friendStage, gameProgress, dateKey } from '../rewards.js';
import { monsterSVG } from '../monster.js';
import { monsterView } from '../monsterView.js';
import { topBar, screen } from './common.js';

const ROUND = 10;
const PRAISE = ['Puiku!', 'Teisingai!', 'Šaunu!', 'Super!', 'Valio!', 'Taip!', 'Nuostabu!'];
const ENCOURAGE = ['Nieko tokio!', 'Tu gali!', 'Bandom dar!'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export function render(ctx, params) {
  const s = ctx.state;
  const mode = params.mode;
  const isTest = mode === 'test';
  // Žaidimas „Iki 10“ arba „Iki 20“ – pasirenkamas pradžios ekrane.
  const game = gameFor(s);
  const level = mode === 'practice' ? game.levels[params.level - 1] : null;
  const speed = (mode === 'mental' || isTest) ? SPEEDS.find(x => x.id === params.speed) || SPEEDS[0] : null;
  const limits = (level && level.limits) || game.limits;
  // Mygtukai ir rašysena – visi žaidimo skaičiai (ne lygio), kad nebūtų galima atspėti.
  // Klaidų taisyme – pagal pačias užduotis (kontrolinis galėjo būti kito žaidimo).
  const reviewMax = mode === 'review' ? Math.max(0, ...params.problems.map(p => (typeof p.answer === 'number' ? p.answer : 0))) : 0;
  const maxAnswer = reviewMax > game.limits.maxResult ? 20 : Math.max(game.limits.maxResult, game.limits.maxNumber);
  const total = isTest ? params.count : mode === 'review' ? params.problems.length : ROUND;

  // Įvedimo būdas: visada visi skaičiai 0–10, kad nebūtų galima tiesiog atspėti.
  // Palyginimas – du mygtukai su reiškiniais.
  // Rašyti ranka: rašymo režime visada, mintinai ir kontroliniame – jei pasirinkta.
  const isWrite = mode === 'write';
  const useDraw = isWrite || params.input === 'draw';
  const inputFor = p => (p.kind === 'compare' ? 'choice' : useDraw ? 'draw' : 'pad');

  // Rašymui: numatytieji pavyzdžiai + vaiko rašysena.
  let templates = useDraw ? buildTemplates(s.handwriting.samples) : null;
  let pad = null;
  let lastRead = null;

  // Užduočių šaltinis. Rašyme palyginimų nėra – ten nėra ką rašyti.
  let scheduler = null;
  let reviewQueue = null;
  if (mode === 'review') reviewQueue = params.problems.slice();
  else {
    let sources = level ? [level] : unlockedLevels(s, game);
    if (isWrite) sources = sources.map(l => ({ ...l, kinds: l.kinds.filter(k => k !== 'compare') }));
    scheduler = new Scheduler({ sources, stats: s.stats });
  }

  // ---------- DOM ----------
  const dots = h('div.progress-dots', null, Array.from({ length: total }, () => h('i')));
  const problemEl = h('div.problem');
  const labelEl = h('div.problem-label');
  const visualEl = h('div.visual');
  const feedbackEl = h('div.feedback');
  const answersEl = h('section.answers');
  const overlayEl = h('div.quiz-overlay');
  const mv = monsterView(ctx, { className: 'quiz-monster' });

  let track = null, walker = null;
  if (speed) {
    const st = friendStage(s.monster, s);
    walker = h('div.track-walker', null, svgEl(monsterSVG(s.monster, { stage: st.id })));
    track = h('div.track', { 'aria-hidden': 'true' },
      h('div.track-path'),
      h('div.track-deco.d1', null, '🌼'), h('div.track-deco.d2', null, '🌷'), h('div.track-deco.d3', null, '🍄'),
      h('div.track-home', null, '🏡'),
      walker);
  }

  // „· iki 20“ – jei lygio pavadinime to dar nėra.
  const gameTag = game.id === 10 || (level && /iki 20/i.test(level.title)) ? '' : ` · iki ${game.id}`;
  const title = (level ? `${level.id}. ${level.title}` : isTest ? 'Kontrolinis' : mode === 'review' ? 'Taisom klaidas' : isWrite ? '✍️ Rašyti' : `${speed.emoji} ${speed.name}${useDraw ? ' ✍️' : ''}`) + gameTag;
  const el = screen('quiz' + (isTest ? '.is-test' : ''),
    topBar(ctx, { back: mode === 'practice' ? 'levels' : 'home', title, extra: dots }),
    track,
    h('section.quiz-main', null, labelEl, problemEl, visualEl, feedbackEl),
    answersEl,
    mv.el,
    overlayEl);

  // ---------- Būsena ----------
  let index = 0;
  let problem = null;
  let attempts = 0;
  let timeouts = 0;
  let recorded = false;
  let locked = false;
  let shownAt = 0;
  let timerStart = 0;
  let timerHandle = null;
  let selected = null;
  // Žvaigždutės skaičiuojamos raundo pabaigoje: taškų suma × daugikliai.
  let points = 0; // Σ(užduoties taškai × įvaldymas)
  let firstOk = 0; // teisingi iš pirmo karto (įvertinimui)
  let curPoints = 0; // dabartinės užduoties vertė
  let finished = false;
  const mult = mode === 'review' ? 1 : modeMult(mode, speed && speed.id);
  const pKey = level ? practiceKey(game.id, level.id) : null;
  const repeat = pKey ? repeatMult(today(s, dateKey()).rounds[pKey] || 0) : 1;
  // Naujausias lygis raundo pradžioje: jei šis raundas atrakins kitą, užduotis vis tiek įskaitoma.
  const topAtStart = level ? gameProgress(s, game).unlocked : null;
  let reviewAllRight = true;
  const log = [];
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

  // ---------- Laikmatis ----------
  function startTimer() {
    if (!speed) return;
    stopTimer();
    walker.style.transition = 'none';
    walker.style.left = '0px';
    void walker.offsetWidth;
    walker.style.transition = `left ${speed.seconds}s linear`;
    walker.style.left = 'calc(100% - var(--walker))';
    timerStart = performance.now();
    timerHandle = later(onTimeout, speed.seconds * 1000);
  }

  function stopTimer() {
    if (!speed) return;
    if (timerHandle) { clearTimeout(timerHandle); timers.delete(timerHandle); timerHandle = null; }
    const left = getComputedStyle(walker).left;
    walker.style.transition = 'none';
    walker.style.left = left;
  }

  // ---------- Užduotis ----------
  function nextProblem() {
    if (index >= total) return finish();
    problem = reviewQueue ? reviewQueue[index] : scheduler.next();
    curPoints = problemPoints(problem) * masteryFactor(s.stats[statKey(problem)]);
    attempts = 0;
    timeouts = 0;
    recorded = false;
    locked = false;
    selected = null;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    overlayEl.textContent = '';
    overlayEl.className = 'quiz-overlay';
    drawProblem();
    drawVisual(false);
    drawAnswers();
    shownAt = performance.now();
    startTimer();
  }

  function drawProblem() {
    problemEl.textContent = '';
    problemEl.classList.remove('correct', 'shake');
    labelEl.textContent = '';
    if (problem.kind === 'compare') {
      labelEl.textContent = 'Kuris didesnis?';
      problemEl.append(h('span.problem-compare', null, '⚖️'));
      return;
    }
    if (problem.kind === 'friend') labelEl.textContent = `Kiek trūksta iki ${problem.target}?`;
    for (const t of problem.parts) {
      if (t === '?') problemEl.append(h('span.slot', null, selected === null ? '?' : selected));
      else if (typeof t === 'number') problemEl.append(h('span.num', null, t));
      else problemEl.append(h('span.op', null, t));
    }
  }

  function updateSlot() {
    const slot = problemEl.querySelector('.slot');
    if (slot) {
      slot.textContent = selected === null ? '?' : selected;
      slot.classList.toggle('filled', selected !== null);
    }
  }

  // ---------- Vaizdinė pagalba: dešimties rėmelis ----------
  function frameCells(n) {
    const frames = Math.max(1, Math.ceil(n / 10));
    const wrap = h('div.frames');
    const cells = [];
    for (let f = 0; f < frames; f++) {
      const fr = h('div.frame');
      for (let i = 0; i < 10; i++) {
        const c = h('div.cell');
        fr.append(c);
        cells.push(c);
      }
      wrap.append(fr);
    }
    return { wrap, cells };
  }

  function drawVisual(reveal) {
    visualEl.textContent = '';
    visualEl.className = 'visual';
    const showAid = reveal || (level && level.visual && !isTest);
    if (!showAid) return;
    const p = problem;

    if (p.kind === 'compare') {
      if (!reveal) return;
      const lv = p.left.value, rv = p.right.value;
      visualEl.append(h('div.reveal-compare', null,
        h('div' + (p.answer === 'left' ? '.win' : ''), null, `${p.left.text} = ${lv}`),
        h('div.vs', null, lv > rv ? '>' : '<'),
        h('div' + (p.answer === 'right' ? '.win' : ''), null, `${p.right.text} = ${rv}`)));
      return;
    }

    let counter = 0;
    const numberDot = dot => {
      if (dot.dataset.n) return;
      dot.dataset.n = ++counter;
      dot.textContent = counter;
      dot.classList.add('counted');
    };

    if (p.op === '+' ) {
      // a + b = c (taip pat a + ? = c ir draugiški skaičiai)
      const a = p.a, b = p.kind === 'friend' ? p.answer : p.b;
      const c = a + b;
      const { wrap, cells } = frameCells(p.kind === 'friend' ? p.target : c);
      cells.forEach((cell, i) => {
        if (i < a) cell.append(h('span.dot.dot-a'));
        else if (i < c) {
          if (reveal || p.kind === 'add') cell.append(h('span.dot.dot-b' + (reveal && p.kind !== 'add' ? '.answer' : '')));
          else if (p.kind === 'friend' || p.kind === 'missAdd') cell.append(h('span.dot.dot-empty'));
        }
      });
      if (!reveal) {
        wrap.addEventListener('click', e => {
          const dot = e.target.closest('.dot:not(.dot-empty)');
          if (dot) numberDot(dot);
        });
        visualEl.append(h('div.visual-hint', null, '👆 Bakstelėk ir skaičiuok'));
      } else if (p.kind === 'add') {
        wrap.querySelectorAll('.dot').forEach(numberDot);
      } else {
        wrap.querySelectorAll('.dot.answer').forEach(numberDot);
      }
      visualEl.append(wrap);
      return;
    }

    // Atimtis: a − b = c (taip pat ? − b = c)
    const a = p.a, b = p.b;
    const { wrap, cells } = frameCells(a);
    cells.forEach((cell, i) => { if (i < a) cell.append(h('span.dot.dot-a')); });
    const dotsArr = [...wrap.querySelectorAll('.dot')];
    if (!reveal) {
      wrap.addEventListener('click', e => {
        const dot = e.target.closest('.dot');
        if (dot) dot.classList.toggle('gone');
      });
      visualEl.append(h('div.visual-hint', null, `👆 Paimk ${b}: bakstelėk ${b} taškelius`));
    } else {
      dotsArr.forEach((d, i) => {
        if (i >= a - b) d.classList.add('gone');
        else if (p.kind === 'sub') numberDot(d);
      });
      if (p.kind === 'missSub') dotsArr.forEach(d => d.classList.add('answer-all'));
    }
    visualEl.append(wrap);
  }

  // ---------- Atsakymai ----------
  function removePad() {
    if (pad) { pad.destroy(); pad = null; }
  }

  // Perskaitom, ką vaikas parašė, ir parodom tai „?“ langelyje.
  function readDrawing(strokes) {
    if (locked || !strokes.length) return;
    const r = recognizeNumber(strokes, templates, maxAnswer);
    if (r.value === null) {
      lastRead = null;
      selected = null;
      feedbackEl.className = 'feedback soft';
      feedbackEl.textContent = 'Nesupratau 🤔 Parašyk dar kartą';
    } else {
      lastRead = { strokes, groups: r.groups, digits: r.digits };
      selected = r.value;
      feedbackEl.className = 'feedback';
      feedbackEl.textContent = '';
    }
    updateSlot();
    markKeys();
  }

  function clearDrawing() {
    if (pad) pad.clear();
    lastRead = null;
    selected = null;
    updateSlot();
    markKeys();
  }

  function drawAnswers() {
    removePad();
    answersEl.textContent = '';
    const type = inputFor(problem);
    answersEl.className = 'answers answers-' + type;
    el.classList.toggle('monster-up', type === 'draw' || (type === 'pad' && maxAnswer > 10));
    if (type === 'draw') {
      pad = drawPad({ onPause: readDrawing });
      const clearBtn = h('button.btn.btn-secondary.draw-clear', { onclick: () => { clearDrawing(); feedbackEl.textContent = ''; } }, 'Trinti 🧽');
      const check = h('button.btn.btn-primary.key-check', { disabled: true, onclick: () => { if (selected !== null) answer(selected, null); } }, 'Tikrinti ✔');
      answersEl.append(h('div.draw-area', null, pad.el, h('div.draw-buttons', null, clearBtn, check)));
      return;
    }
    if (type === 'choice') {
      const opts = makeChoices(problem, 2, Math.random, limits);
      for (const v of opts) {
        const label = problem.kind === 'compare' ? (v === 'left' ? problem.left.text : problem.right.text) : v;
        const btn = h('button.btn.choice', { onclick: () => answer(v, btn) }, label);
        answersEl.append(btn);
      }
    } else {
      // Mygtukai pagal žaidimo ribas (ne lygio), kad ir 1 lygyje būtų visi 0–10 (0–20).
      // Iki 20 – eilėmis po dešimt: 1–10, 11–20, 0.
      const max = maxAnswer;
      const pad = h('div.numpad' + (max > 10 ? '.numpad-wide' : ''));
      const keys = [];
      for (let v = 1; v <= max; v++) keys.push(v);
      keys.push(0);
      for (const v of keys) {
        const b = h('button.btn.key', { onclick: () => { if (locked) return; selected = v; updateSlot(); markKeys(); } }, v);
        b.dataset.v = v;
        pad.append(b);
      }
      const check = h('button.btn.btn-primary.key-check', { disabled: true, onclick: () => { if (selected !== null) answer(selected, null); } }, 'Tikrinti ✔');
      pad.append(check);
      answersEl.append(pad);
    }
  }

  function markKeys() {
    answersEl.querySelectorAll('.key').forEach(k => k.classList.toggle('selected', Number(k.dataset.v) === selected));
    const check = answersEl.querySelector('.key-check');
    if (check) check.disabled = selected === null;
  }

  // Teisingai perskaitytas teisingas atsakymas – geras rašysenos pavyzdys, mokomės iš jo.
  function learnFromDrawing() {
    if (!useDraw || !lastRead) return;
    s.counters.written += 1;
    ctx.quest({ type: 'written' });
    if (lastRead.digits.length === lastRead.groups.length) {
      lastRead.groups.forEach((g, k) => addSample(s.handwriting.samples, lastRead.digits[k], g));
      templates = buildTemplates(s.handwriting.samples);
    }
    pad?.setEnabled(false);
  }

  // ---------- Atsakymo tikrinimas ----------
  function answer(value, btn) {
    if (locked) return;
    const ms = performance.now() - shownAt;
    const correct = checkAnswer(problem, value);

    if (isTest) {
      locked = true;
      stopTimer();
      recordResult(s.stats, problem, correct, ms);
      log.push({ problem, value, correct });
      if (correct) { s.counters.correct += 1; ctx.played(); learnFromDrawing(); points += curPoints; firstOk += 1; }
      else pad?.setEnabled(false);
      if (btn) btn.classList.add('picked');
      ctx.save();
      advance(350);
      return;
    }

    const firstTry = attempts === 0 && timeouts === 0;
    if (!recorded) {
      recorded = true;
      recordResult(s.stats, problem, correct, ms);
      if (scheduler) scheduler.report(problem, correct);
      if (level) {
        const unlocked = recordLevelAnswer(s, level.id, correct, game);
        if (unlocked) {
          toast(h('div.badge-toast', null, h('span.badge-toast-icon', null, '🔓'),
            h('div', null, h('b', null, 'Naujas lygis!'), h('div', null, `${unlocked.id}. ${unlocked.title}`))));
        }
      }
    }

    if (correct) {
      locked = true;
      const fast = speed && firstTry && (performance.now() - timerStart) <= speed.seconds * 500;
      stopTimer();
      // Teisingas atsakymas po klaidos moka tiek pat – tai irgi mokymasis.
      points += curPoints;
      if (firstTry) firstOk += 1;
      const stars = Math.max(1, Math.round(curPoints * mult * repeat));
      learnFromDrawing();
      if (fast) s.counters.fast += 1;
      const streakBonus = updateStreak(s, firstTry);
      s.counters.correct += 1;
      ctx.played();
      if (streakBonus) ctx.reward(streakBonus);
      if (s.streak >= 10) ctx.quest({ type: 'streak', streak: s.streak });

      problemEl.classList.add('correct');
      selected = value;
      updateSlot();
      if (btn) btn.classList.add('right');
      else answersEl.querySelector(`.key[data-v="${value}"]`)?.classList.add('right');
      feedbackEl.className = 'feedback good';
      feedbackEl.textContent = pick(PRAISE) + (fast ? ' ⚡ Greitai!' : '');
      if (streakBonus) feedbackEl.textContent += ` 🔥 ${s.streak} iš eilės!`;
      floatStars(stars + streakBonus, btn || problemEl);
      const r = (btn || problemEl).getBoundingClientRect();
      confetti(22, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
      mv.react('jump');
      advance(1300);
      return;
    }

    // Klaida.
    attempts += 1;
    if (attempts === 1) updateStreak(s, false);
    ctx.save();
    pulse(problemEl, 'shake', 500);
    if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
    if (pad) pad.clear();
    lastRead = null;
    selected = null;
    updateSlot();
    markKeys();

    if (attempts >= 2) {
      if (mode === 'review') reviewAllRight = false;
      reveal();
      return;
    }
    feedbackEl.className = 'feedback soft';
    feedbackEl.textContent = 'Beveik! Pabandyk dar kartą';
    mv.react('nod');
    mv.say(pick(ENCOURAGE));
  }

  // Laikas baigėsi.
  function onTimeout() {
    timerHandle = null;
    if (locked) return;
    if (isTest) {
      locked = true;
      recordResult(s.stats, problem, false, speed.seconds * 1000);
      log.push({ problem, value: null, correct: false });
      ctx.save();
      advance(200);
      return;
    }
    timeouts += 1;
    if (!recorded) {
      recorded = true;
      recordResult(s.stats, problem, false, speed.seconds * 1000);
      if (scheduler) scheduler.report(problem, false);
    }
    updateStreak(s, false);
    ctx.save();
    if (timeouts >= 2) { reveal(); return; }
    locked = true;
    mv.say('Nieko tokio!');
    overlayEl.className = 'quiz-overlay show';
    overlayEl.append(h('div.overlay-card', null,
      h('div.overlay-emoji', null, '🏡'),
      h('div.overlay-text', null, 'Laikas baigėsi – pabandom dar kartą?'),
      h('button.btn.btn-primary.btn-big', {
        onclick: () => {
          overlayEl.className = 'quiz-overlay';
          overlayEl.textContent = '';
          locked = false;
          startTimer();
        },
      }, 'Pabandom! 💪')));
  }

  // Parodom teisingą atsakymą su vaizdine pagalba.
  function reveal() {
    locked = true;
    stopTimer();
    if (problem.kind !== 'compare') {
      selected = problem.answer;
      updateSlot();
      problemEl.querySelector('.slot')?.classList.add('revealed');
    }
    drawVisual(true);
    feedbackEl.className = 'feedback soft';
    feedbackEl.textContent = problem.kind === 'compare'
      ? `Didesnis: ${problem.answer === 'left' ? problem.left.text : problem.right.text}`
      : `Atsakymas: ${problem.answer}`;
    mv.react('nod');
    mv.say('Nieko tokio! Kitą kartą pavyks!', 2500);
    removePad();
    answersEl.textContent = '';
    answersEl.className = 'answers answers-next';
    answersEl.append(h('button.btn.btn-primary.btn-big', { onclick: () => advance(0) }, 'Toliau ➜'));
  }

  function advance(ms) {
    locked = true;
    dots.children[index]?.classList.add('done');
    index += 1;
    later(nextProblem, ms);
  }

  function floatStars(n, anchor) {
    const r = anchor.getBoundingClientRect();
    const f = h('div.float-stars', { style: { left: r.left + r.width / 2 + 'px', top: r.top + 'px' } }, `+${n} ⭐`);
    document.body.append(f);
    later(() => f.remove(), 1200);
  }

  // ---------- Pabaiga ----------
  function finish() {
    stopTimer();
    finished = true;
    if (isTest) {
      ctx.go('results', { log, speed: speed.id, count: total, input: params.input, points });
      return;
    }
    const earned = roundStars({ points, mult, ok: firstOk, total, repeat });
    const gems = mode === 'mental' ? roundGems({ mode, speed: speed.id, game: game.id, ok: firstOk, total }) : 0;
    if (mode === 'mental') recordBest(s, 'm', game.id, speed.id, firstOk, total);
    if (pKey) {
      const t = today(s, dateKey());
      t.rounds[pKey] = (t.rounds[pKey] || 0) + 1;
    }
    ctx.reward(earned);
    if (gems) ctx.addGems(gems);
    ctx.quest({
      type: 'round', mode, speed: speed && speed.id, game: game.id, ok: firstOk, total,
      level: level && level.id, topLevel: topAtStart,
    });
    const why = [];
    if (speed) why.push(`${speed.emoji} ×${String(mult).replace('.', ',')}`);
    if (isWrite) why.push(`✍️ ×${String(mult).replace('.', ',')}`);
    why.push(`${firstOk}/${total}${ratingMult(firstOk, total) !== 1 ? ' ×' + String(ratingMult(firstOk, total)).replace('.', ',') : ''}`);
    if (repeat < 1) why.push(`🔁 ×${String(repeat).replace('.', ',')}`);
    if (mode === 'review' && reviewAllRight) {
      s.counters.mistakesCleared += 1;
      ctx.checkBadges();
    }
    ctx.save();
    removePad();
    answersEl.textContent = '';
    visualEl.textContent = '';
    labelEl.textContent = '';
    problemEl.textContent = '';
    feedbackEl.textContent = '';
    mv.react('cheer');
    confetti(40);
    overlayEl.className = 'quiz-overlay show';
    overlayEl.append(h('div.overlay-card', null,
      h('div.overlay-emoji', null, '🎉'),
      h('div.overlay-text', null, mode === 'review' && reviewAllRight ? 'Visos klaidos pataisytos!' : 'Šaunu! Raundas baigtas!'),
      h('div.overlay-stars', null, `+${earned} ⭐`, gems ? ` +${gems} 💎` : ''),
      h('div.overlay-why', null, why.join(' · ')),
      repeat < 1 ? h('div.overlay-hint', null, 'Šį lygį šiandien jau daug kartų žaidei – pabandyk ir kitą! 🙂') : null,
      h('div.overlay-buttons', null,
        mode === 'review' ? null : h('button.btn.btn-primary.btn-big', { onclick: () => ctx.go('quiz', params) }, 'Dar kartą! 🔁'),
        h('button.btn.btn-secondary.btn-big', { onclick: () => ctx.go(mode === 'practice' ? 'levels' : 'home') }, mode === 'practice' ? 'Lygiai' : 'Namo 🏠'))));
    later(() => ctx.showCelebrations(() => mv.refresh()), 900);
  }

  later(nextProblem, 0);

  return {
    el,
    destroy() {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      removePad();
      document.querySelectorAll('.float-stars').forEach(f => f.remove());
      // Išėjus raundo viduryje uždirbti taškai neprapuola (tik be įvertinimo daugiklio).
      if (!finished && !isTest && points > 0) ctx.reward(Math.round(points * mult * repeat));
    },
  };
}
