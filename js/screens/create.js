import { h, svgEl } from '../ui.js';
import { monsterSVG, PARTS, PART_ORDER, COLORS, WEAR, availableOptions, randomParts } from '../monster.js';
import { ITEM_BY_ID, isOwned } from '../catalog.js';
import { topBar, screen } from './common.js';

const NAMES = ['Bumbulis', 'Pūkis', 'Žirnelis', 'Burbulas', 'Mimi', 'Tošis', 'Kakaris', 'Saulutė', 'Bubu', 'Ūsius', 'Dzinga', 'Pupa', 'Gugis', 'Lola', 'Žybsnis'];

const TAB_ICONS = { body: '🫧', color: '🎨', pattern: '🔵', eyes: '👀', mouth: '👄', top: '🦄', tail: '〰️', feet: '🦶', wear: '🎩' };
const SLOTS = [['body', 'Drabužiai'], ['back', 'Ant nugaros'], ['head', 'Kepurė'], ['face', 'Akiniai'], ['neck', 'Kaklui']];

export function render(ctx, { first = false } = {}) {
  const s = ctx.state;
  const draft = s.monster
    ? JSON.parse(JSON.stringify(s.monster))
    : { name: '', parts: randomParts(s.owned), wear: {} };
  draft.wear = draft.wear || {};

  // Nemokami rūbai (kaina 0) rodomi visada, kiti – kai nupirkti.
  const ownedWear = Object.keys(WEAR).filter(id => ITEM_BY_ID[id] && isOwned(s, ITEM_BY_ID[id]));
  const tabs = [...PART_ORDER, 'wear'];
  let tab = tabs[0];

  const preview = h('div.create-preview');
  const nameInput = h('input.name-input', {
    type: 'text', maxlength: 14, placeholder: 'Vardas', value: draft.name,
    autocomplete: 'off', autocorrect: 'off', spellcheck: 'false',
    oninput: e => { draft.name = e.target.value; updateDone(); },
  });
  const tabBar = h('div.tabs');
  const grid = h('div.option-grid');
  const doneBtn = h('button.btn.btn-primary.btn-big', { onclick: finish }, first ? 'Sukurti! ✨' : 'Baigta ✔');

  function drawPreview() {
    preview.textContent = '';
    preview.append(svgEl(monsterSVG(draft, { className: 'm-idle' })));
  }

  function updateDone() {
    doneBtn.disabled = !draft.name.trim();
  }

  function drawTabs() {
    tabBar.textContent = '';
    for (const t of tabs) {
      tabBar.append(h('button.tab' + (t === tab ? '.active' : ''), {
        onclick: () => { tab = t; drawTabs(); drawGrid(); },
        'aria-label': t === 'wear' ? 'Rūbai' : PARTS[t].title,
      }, h('span.tab-icon', null, TAB_ICONS[t]), h('span.tab-label', null, t === 'wear' ? 'Rūbai' : PARTS[t].title)));
    }
  }

  function optionButton(selected, content, onclick, label) {
    return h('button.option' + (selected ? '.selected' : ''), { onclick, 'aria-label': label }, content);
  }

  function drawGrid() {
    grid.textContent = '';
    if (tab === 'wear') {
      for (const [slot, title] of SLOTS) {
        const items = ownedWear.filter(id => WEAR[id].slot === slot);
        if (!items.length) continue;
        grid.append(h('div.option-group-title', null, title));
        grid.append(optionButton(!draft.wear[slot], h('span.option-none', null, '🚫'), () => { draft.wear[slot] = null; drawPreview(); drawGrid(); }, 'Nieko'));
        for (const id of items) {
          const m = { ...draft, wear: { ...draft.wear, [slot]: id } };
          grid.append(optionButton(draft.wear[slot] === id, svgEl(monsterSVG(m)), () => { draft.wear[slot] = id; drawPreview(); drawGrid(); }, ITEM_BY_ID[id]?.name));
        }
      }
      return;
    }
    for (const opt of availableOptions(tab, s.owned)) {
      let content;
      if (tab === 'color') {
        const c = COLORS[opt];
        content = h('span.swatch', { style: { background: c.grad ? `linear-gradient(135deg, ${c.grad.join(',')})` : c.main, borderColor: c.dark } });
      } else {
        content = svgEl(monsterSVG({ ...draft, parts: { ...draft.parts, [tab]: opt }, wear: {} }));
      }
      grid.append(optionButton(draft.parts[tab] === opt, content, () => {
        draft.parts[tab] = opt;
        drawPreview();
        drawGrid();
      }, PARTS[tab].options[opt].name));
    }
  }

  function randomize() {
    draft.parts = randomParts(s.owned);
    if (!draft.name.trim()) {
      draft.name = NAMES[Math.floor(Math.random() * NAMES.length)];
      nameInput.value = draft.name;
    }
    updateDone();
    drawPreview();
    drawGrid();
    preview.firstElementChild?.classList.add('m-spin');
  }

  function finish() {
    draft.name = draft.name.trim();
    if (!draft.name) { nameInput.focus(); return; }
    s.monster = draft;
    ctx.save();
    ctx.go('home');
  }

  drawPreview();
  drawTabs();
  drawGrid();
  updateDone();

  const el = screen('create',
    first
      ? h('header.topbar', null, h('span.btn-icon-space'), h('div.topbar-title', null, 'Susikurk savo padarėlį!'), h('span.btn-icon-space'))
      : topBar(ctx, { title: 'Padarėlis' }),
    h('div.create-layout', null,
      h('section.create-left', null,
        preview,
        h('label.name-label', null, 'Kuo jis vardu?', nameInput),
        first ? h('p.hint', null, 'Iš kiaušinio išsiris būtent toks!') : null),
      h('section.create-right', null, tabBar, grid)),
    h('footer.create-footer', null,
      h('button.btn.btn-secondary.btn-big', { onclick: randomize }, '🎲 Atsitiktinis'),
      doneBtn));

  return { el };
}
