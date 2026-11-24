// Tėvams: ataskaita, kas sekasi ir ką verta pakartoti.
// Atidaroma iš Ženkliukų ekrano per tėvų apsaugą (žr. badges.js).

import { h, toast } from '../ui.js';
import { GAMES, speedEmoji } from '../config.js';
import { gameProgress, levelProgress, accuracy } from '../rewards.js';
import {
  summarize, byGroup, weakFacts, slowFacts, factGrid, factGrid20, cellLevel, recentTests,
  secondsText, percentText, starDays, shopProgress,
} from '../parent.js';
import { ITEMS } from '../catalog.js';
import { SKILLS, questFor, QUEST_BY_ID } from '../economy.js';
import { dateKey } from '../rewards.js';
import { topBar, screen } from './common.js';

const section = (title, hint, ...body) =>
  h('section.parent-card', null, h('h2', null, title), hint ? h('p.parent-hint', null, hint) : null, ...body);

function factRows(list, empty) {
  if (!list.length) return h('p.parent-empty', null, empty);
  return h('table.parent-table', null,
    h('thead', null, h('tr', null,
      h('th', null, 'Užduotis'), h('th', null, 'Bandyta'), h('th', null, 'Klaidų'), h('th', null, 'Vid. laikas'))),
    h('tbody', null, list.map(f => h('tr', null,
      h('td.parent-fact', null, f.text),
      h('td', null, f.n),
      h('td', null, f.err ? `${f.err} (${percentText(f.errRate)})` : '0'),
      h('td', null, secondsText(f.avgMs))))));
}

// Sudėties arba atimties lentelė (iki 10 arba iki 20): spalva rodo, kaip sekasi.
function grid(stats, op, upTo = 10) {
  const g = upTo === 20 ? factGrid20(stats, op) : (() => {
    const rows = factGrid(stats, op, 10);
    return { rows, rowLabels: rows.map((_, a) => a), colLabels: rows[0].map((_, b) => b) };
  })();
  const sign = op === '+' ? '+' : '−';
  const head = h('tr', null, h('th.grid-corner', null, sign), g.colLabels.map(b => h('th', null, b)));
  const body = g.rows.map((row, i) => {
    const a = g.rowLabels[i];
    return h('tr', null,
      h('th', null, a),
      row.map((cell, j) => {
        const b = g.colLabels[j];
        if (!cell) return h('td.grid-cell.grid-na');
        const lvl = cellLevel(cell);
        const fact = upTo === 20 && op === '+' && a !== b ? `${a} + ${b} ir ${b} + ${a}` : `${a} ${sign} ${b}`;
        const tip = cell.n
          ? `${fact}: bandyta ${cell.n}, klaidų ${cell.err}, ${secondsText(cell.avgMs)}`
          : `${fact}: dar nebandyta`;
        return h('td.grid-cell.grid-' + lvl, { title: tip, onclick: () => toast(tip, 2400) }, op === '+' ? a + b : a - b);
      }));
  });
  return h('div.parent-grid-wrap', null,
    h('table.parent-grid', { 'aria-label': `${op === '+' ? 'Sudėties' : 'Atimties'} lentelė iki ${upTo}` },
      h('thead', null, head), h('tbody', null, body)));
}

const legend = () => h('div.grid-legend', null,
  [['good', 'Moka'], ['ok', 'Beveik / lėtai'], ['weak', 'Kartais klysta'], ['bad', 'Dažnai klysta'], ['none', 'Nebandyta']]
    .map(([lvl, label]) => h('span.grid-legend-item', null, h('span.grid-swatch.grid-' + lvl), label)));

function levelsTable(s) {
  return Object.values(GAMES).map(game => {
    const gp = gameProgress(s, game);
    return h('div.parent-game', null,
      h('h3', null, game.title),
      h('table.parent-table', null,
        h('thead', null, h('tr', null,
          h('th', null, 'Lygis'), h('th', null, 'Būsena'), h('th', null, 'Teisingų'), h('th', null, 'Pastarųjų tikslumas'))),
        h('tbody', null, game.levels.map(l => {
          const locked = l.id > gp.unlocked;
          const p = levelProgress(s, l.id, game);
          const status = locked ? '🔒 Užrakintas' : l.id < gp.unlocked ? '✅ Įveiktas' : '▶️ Dabar';
          return h('tr', locked ? { class: 'parent-locked' } : null,
            h('td', null, `${l.icon} ${l.title}`),
            h('td', null, status),
            h('td', null, locked ? '—' : p.correct),
            h('td', null, locked || !p.recent.length ? '—' : `${percentText(accuracy(p))} (iš ${p.recent.length})`));
        }))));
  });
}

function testsList(s) {
  const list = recentTests(s.tests, 10);
  if (!list.length) return h('p.parent-empty', null, 'Kontrolinių dar nebuvo.');
  return h('div.parent-tests', null, list.map(t => {
    return h('div.parent-test', null,
      h('div.parent-test-bar', null, h('div.parent-test-fill', { style: { height: Math.round(t.ratio * 100) + '%' } })),
      h('div.parent-test-score', null, `${t.ok}/${t.n}`),
      h('div.parent-test-meta', null, `${speedEmoji(t.speed)} ${t.date.slice(5).replace('-', '.')}`),
      t.game ? h('div.parent-test-game', null, `iki ${t.game}`) : null);
  }));
}

// Žvaigždutės: kiek uždirbama per dieną ir kiek parduotuvės jau nupirkta.
function starsSection(s) {
  const days = starDays(s.starLog, dateKey(), 14);
  const max = Math.max(1, ...days.map(d => d.stars));
  const played = days.filter(d => d.stars > 0);
  const avg = played.length ? Math.round(played.reduce((a, d) => a + d.stars, 0) / played.length) : 0;
  const shop = shopProgress(s.owned || [], ITEMS);
  const left = Math.max(0, shop.total - shop.spent);
  const q = questFor(s, dateKey());
  return [
    h('p.parent-line', null, `Vidutiniškai ${avg} ⭐ per žaistą dieną · dabar turi ${s.stars} ⭐ ir ${s.gems || 0} 💎`),
    h('p.parent-line', null, `Parduotuvė: nupirkta ${shop.count} iš ${shop.of} (${shop.spent} iš ${shop.total} ⭐)` +
      (avg ? ` · likusiam reikėtų ~${Math.ceil(left / avg)} dienų` : '')),
    h('div.parent-tests', null, days.map(d => h('div.parent-test', null,
      h('div.parent-test-bar', null, h('div.parent-test-fill', { style: { height: Math.round(d.stars / max * 100) + '%' } })),
      h('div.parent-test-score', null, d.stars || '·'),
      h('div.parent-test-meta', null, d.date.slice(5).replace('-', '.'))))),
    h('p.parent-line', null, `Dienos užduotis: ${QUEST_BY_ID[q.id].text} – ${q.done ? 'atlikta ✅' : 'dar ne'}`),
    h('p.parent-line', null, 'Įgūdžiai (atrakina svajonių prekes ir aukščiausius augimo etapus):'),
    h('ul.parent-skills', null, Object.values(SKILLS).map(k => h('li', null, `${k.check(s) ? '✅' : '⬜'} ${k.text}`))),
  ];
}

export function render(ctx) {
  const s = ctx.state;
  const sum = summarize(s.stats);
  const groups = byGroup(s.stats);
  const learnedDigits = Object.values(s.handwriting.samples || {}).filter(a => a && a.length).length;

  const el = screen('parent',
    topBar(ctx, { back: 'badges', title: 'Tėvams' }),
    h('div.parent-body', null,
      h('div.badges-summary', null,
        h('div.stat', null, h('b', null, s.days.total || 0), h('span', null, 'dienų žaista')),
        h('div.stat', null, h('b', null, `${s.days.streak || 0} / ${s.days.best || 0}`), h('span', null, 'serija dabar / geriausia')),
        h('div.stat', null, h('b', null, sum.n), h('span', null, 'atsakyta užduočių')),
        h('div.stat', null, h('b', null, sum.n ? percentText(sum.accuracy) : '—'), h('span', null, 'iš pirmo karto'))),

      section('Žvaigždutės', 'Tikslas – visą parduotuvę nupirkti per maždaug mėnesį žaidžiant 10–15 min per dieną.', ...starsSection(s)),

      section('Pagal užduočių tipą', 'Skaičiuojamas tik pirmas atsakymas į kiekvieną užduotį.',
        groups.length
          ? h('table.parent-table', null,
            h('thead', null, h('tr', null, h('th', null, 'Tipas'), h('th', null, 'Bandyta'), h('th', null, 'Tikslumas'), h('th', null, 'Vid. laikas'))),
            h('tbody', null, groups.map(g => h('tr', null,
              h('td', null, g.title), h('td', null, g.n), h('td', null, percentText(g.accuracy)), h('td', null, secondsText(g.avgMs))))))
          : h('p.parent-empty', null, 'Dar nėra duomenų – pažaiskit!')),

      section('Sunkiausios užduotys', 'Kuriose dažniausiai klystama (bent 2 bandymai). Programa jas jau rodo dažniau.',
        factRows(weakFacts(s.stats), 'Klaidų beveik nėra – šaunu! 🎉')),

      section('Lėčiausios užduotys', 'Atsakoma be klaidų, bet ilgai (vidutiniškai 6 s ir daugiau) – dar skaičiuojama, ne prisimenama.',
        factRows(slowFacts(s.stats), 'Lėtų užduočių nėra.')),

      section('Sudėtis iki 10', 'Eilutė – pirmas skaičius, stulpelis – antras. Užvedus ar bakstelėjus matyti skaičiai.',
        grid(s.stats, '+'), legend()),

      section('Atimtis iki 10', 'Eilutė – iš kiek atimama, stulpelis – kiek atimama.',
        grid(s.stats, '-'), legend()),

      section('Sudėtis iki 20', 'Tik per dešimtį. Eilutė – didesnis skaičius, stulpelis – mažesnis; 8 + 5 ir 5 + 8 – viename langelyje.',
        grid(s.stats, '+', 20), legend()),

      section('Atimtis iki 20', 'Eilutė – iš kiek atimama (11–20), stulpelis – kiek atimama.',
        grid(s.stats, '-', 20), legend()),

      section('Lygiai', null, ...levelsTable(s)),

      section('Kontroliniai', 'Paskutiniai 10: stulpelio aukštis – teisingų dalis.', testsList(s)),

      section('Rašymas ranka', null,
        h('p.parent-line', null, `Išmokyta skaitmenų: ${learnedDigits} iš 10 · teisingai parašytų atsakymų: ${s.counters.written || 0}`))));

  return { el };
}
