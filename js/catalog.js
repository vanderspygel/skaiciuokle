// Parduotuvės prekės. Kainų kreivė: pirmi daiktai pigūs, įspūdingiausi – brangūs.

import { PARTS, PART_ORDER, partItemId } from './monster.js';
import { ROOMS, roomItemId } from './rooms.js';

export const CATEGORIES = [
  { id: 'friends', title: 'Draugai', icon: '🥚' },
  { id: 'clothes', title: 'Rūbai', icon: '🎩' },
  { id: 'parts', title: 'Kūnas', icon: '🎨' },
  { id: 'rooms', title: 'Kambariai', icon: '🏡' },
  { id: 'furniture', title: 'Baldai', icon: '🛋️' },
  { id: 'decor', title: 'Sienos', icon: '🖼️' },
  { id: 'treats', title: 'Skanėstai', icon: '🍪' },
];

// Kaina 0 – nemokami rūbai, kuriuos galima rinktis jau kuriant padarėlį.
const CLOTHES = [
  ['outfit-tee', 'Marškinėliai', 0],
  ['outfit-dress', 'Suknelė', 0],
  ['outfit-overalls', 'Kombinezonas', 0],
  ['hat-bow', 'Kaspinas', 8],
  ['outfit-sweater', 'Dryžuotas megztinis', 15],
  ['outfit-pajamas', 'Pižama', 20],
  ['outfit-jersey', 'Sporto marškinėliai', 25],
  ['outfit-tutu', 'Baleto sijonėlis', 35],
  ['back-cape', 'Superherojaus apsiaustas', 40],
  ['outfit-tux', 'Smokingas', 45],
  ['back-bat', 'Šikšnosparnio sparnai', 50],
  ['outfit-hero', 'Superherojaus kostiumas', 50],
  ['back-wings', 'Fėjos sparneliai', 70],
  ['outfit-princess', 'Princesės suknelė', 90],
  ['hat-flower', 'Gėlytė', 10],
  ['glasses-round', 'Akiniai', 12],
  ['bowtie', 'Peteliškė', 12],
  ['hat-party', 'Šventinė kepurė', 15],
  ['necklace', 'Karoliai', 18],
  ['hat-cap', 'Kepuraitė', 20],
  ['scarf', 'Šalikas', 22],
  ['hat-beanie', 'Megzta kepurė', 25],
  ['glasses-sun', 'Saulės akiniai', 30],
  ['medal', 'Medalis', 40],
  ['glasses-star', 'Žvaigždiniai akiniai', 45],
  ['hat-top', 'Cilindras', 60],
  ['hat-crown', 'Karūna', 120],
  ['neck-bell', 'Varpelis', 14],
  ['hat-flowercrown', 'Gėlių vainikas', 28],
  ['outfit-raincoat', 'Lietpaltis', 30],
  ['outfit-sailor', 'Jūreivio marškinėliai', 32],
  ['back-backpack', 'Kuprinė', 34],
  ['glasses-heart', 'Širdelių akiniai', 36],
  ['outfit-chef', 'Virėjo švarkelis', 38],
  ['hat-chef', 'Virėjo kepurė', 38],
  ['hat-headphones', 'Ausinės', 42],
  ['back-balloon', 'Balionas', 44],
  ['mask-hero', 'Superherojaus kaukė', 48],
  ['hat-pirate', 'Pirato skrybėlė', 55],
  ['outfit-dino', 'Dinozauro kostiumas', 65],
  ['hat-wizard', 'Burtininko kepurė', 75],
  ['outfit-astronaut', 'Astronauto kostiumas', 85],
  ['back-rocket', 'Reaktyvinė kuprinė', 100],
].map(([id, name, price]) => ({ id, cat: 'clothes', name, price }))
  .sort((a, b) => a.price - b.price);

// Baldai ir žaislai kambariui. kind: 'emoji' arba 'rug' (piešiamas CSS).
const FURNITURE = [
  ['f-balloons', 'Balionai', 5, '🎈'],
  ['f-ball', 'Kamuolys', 6, '⚽'],
  ['f-plant', 'Augalas', 8, '🪴'],
  ['f-cactus', 'Kaktusas', 8, '🌵'],
  ['f-teddy', 'Meškiukas', 10, '🧸'],
  ['f-books', 'Knygos', 12, '📚'],
  ['f-rug', 'Kilimas', 12, null, 'rug'],
  ['f-lamp', 'Lempa', 15, '💡'],
  ['f-chair', 'Kėdė', 18, '🪑'],
  ['f-puzzle', 'Dėlionė', 15, '🧩'],
  ['f-rug2', 'Vaivorykštės kilimas', 30, null, 'rug-rainbow'],
  ['f-bed', 'Lova', 35, '🛏️', null, 1.6],
  ['f-sofa', 'Sofa', 40, '🛋️', null, 1.6],
  ['f-fish', 'Akvariumas', 50, '🐠', null, 1.1],
  ['f-guitar', 'Gitara', 55, '🎸', null, 1.2],
  ['f-piano', 'Pianinas', 65, '🎹', null, 1.4],
  ['f-disco', 'Disko rutulys', 80, '🪩'],
  ['f-rainbow', 'Vaivorykštė', 100, '🌈', null, 1.6],
  ['f-carousel', 'Karuselė', 130, '🎠', null, 1.6],
  ['f-castle', 'Pilis', 150, '🏰', null, 1.8],
  ['f-rocket', 'Raketa', 160, '🚀', null, 1.5],
  ['f-flower', 'Saulėgrąža', 7, '🌻'],
  ['f-kite', 'Aitvaras', 9, '🪁'],
  ['f-yoyo', 'Jojo', 9, '🪀'],
  ['f-basketball', 'Krepšinio kamuolys', 10, '🏀'],
  ['f-gift', 'Dovana', 12, '🎁'],
  ['f-dino', 'Dinozauriukas', 14, '🦖'],
  ['f-paint', 'Dažai', 16, '🎨'],
  ['f-clock', 'Laikrodis', 18, '🕰️'],
  ['f-skate', 'Riedlentė', 20, '🛹'],
  ['f-snowman', 'Senis besmegenis', 22, '⛄', null, 1.2],
  ['f-tree', 'Eglutė', 28, '🎄', null, 1.4],
  ['f-tv', 'Televizorius', 32, '📺', null, 1.2],
  ['f-drum', 'Būgnas', 38, '🥁'],
  ['f-tent', 'Palapinė', 60, '⛺', null, 1.5],
  ['f-slide', 'Čiuožykla', 75, '🛝', null, 1.5],
  ['f-fountain', 'Fontanas', 90, '⛲', null, 1.5],
  ['f-ferris', 'Apžvalgos ratas', 140, '🎡', null, 1.8],
  ['f-circus', 'Cirkas', 180, '🎪', null, 1.8],
  // Tinka konkretiems kambariams (bet galima statyti bet kur).
  ['f-pillow', 'Pagalvė', 8, '🛌'],
  ['f-candle', 'Žvakė', 8, '🕯️'],
  ['f-teapot', 'Arbatinukas', 10, '🫖'],
  ['f-plates', 'Lėkštės', 12, '🍽️'],
  ['f-pot', 'Puodas', 14, '🍲'],
  ['f-soap', 'Muilas', 6, '🧼'],
  ['f-duck', 'Guminė antytė', 9, '🐤'],
  ['f-shower', 'Dušas', 30, '🚿', null, 1.3],
  ['f-bathtub', 'Vonia', 45, '🛁', null, 1.6],
  ['f-tree2', 'Medis', 30, '🌳', null, 1.8],
  ['f-swing', 'Sūpynės', 25, '🪢', null, 1.3],
  ['f-doghouse', 'Šuns būda', 35, '🏠', null, 1.4],
  ['f-shield', 'Riterio skydas', 30, '🛡️'],
  ['f-throne', 'Karališka karūna', 90, '👑', null, 1.2],
  ['f-dragonegg', 'Drakono kiaušinis', 70, '🥚'],
  ['f-shell', 'Kriauklė', 10, '🐚'],
  ['f-octopus', 'Aštuonkojis', 40, '🐙', null, 1.2],
  ['f-coral', 'Koralai', 25, '🪸', null, 1.2],
  ['f-planet', 'Planeta', 60, '🪐', null, 1.4],
  ['f-ufo', 'NSO', 120, '🛸', null, 1.5],
  ['f-telescope', 'Teleskopas', 50, '🔭', null, 1.2],
].map(([id, name, price, emoji, kind, size]) => ({ id, cat: 'furniture', name, price, emoji, kind: kind || 'emoji', size: size || 1 }))
  .sort((a, b) => a.price - b.price);

// Tapetai ir grindys – CSS fonai (stiliai css/style.css: .wall-*, .floor-*).
const DECOR = [
  ['wall-cream', 'Šviesi siena', 0, 'wall'],
  ['floor-wood', 'Medinės grindys', 0, 'floor'],
  ['wall-mint', 'Mėtinės juostos', 10, 'wall'],
  ['floor-grass', 'Žolytė', 12, 'floor'],
  ['wall-dots', 'Rožiniai taškeliai', 15, 'wall'],
  ['floor-tiles', 'Languotos plytelės', 18, 'floor'],
  ['wall-sky', 'Dangus su debesimis', 30, 'wall'],
  ['floor-carpet', 'Minkštas kilimas', 30, 'floor'],
  ['wall-night', 'Žvaigždėta naktis', 60, 'wall'],
  ['floor-clouds', 'Debesų grindys', 70, 'floor'],
  ['wall-candy', 'Saldainių siena', 90, 'wall'],
  ['wall-stripes', 'Vaivorykštės juostos', 40, 'wall'],
  ['wall-forest', 'Miško siena', 50, 'wall'],
  ['floor-checker', 'Šachmatų grindys', 25, 'floor'],
  ['floor-sand', 'Smėlis', 35, 'floor'],
  ['floor-gold', 'Auksinės grindys', 120, 'floor'],
  ['wall-kitchen', 'Virtuvės plytelės', 30, 'wall'],
  ['wall-bath', 'Vonios plytelės', 30, 'wall'],
  ['floor-bath', 'Vonios grindys', 25, 'floor'],
  ['wall-planks', 'Medinės lentos', 45, 'wall'],
  ['wall-castle', 'Pilies akmenys', 80, 'wall'],
  ['floor-stone', 'Akmeninės grindys', 60, 'floor'],
  ['wall-sea', 'Po vandeniu', 90, 'wall'],
  ['wall-space', 'Kosmosas', 100, 'wall'],
  ['floor-metal', 'Kosminės grindys', 80, 'floor'],
].map(([id, name, price, slot]) => ({ id, cat: 'decor', name, price, slot }))
  .sort((a, b) => a.price - b.price);

// Skanėstai – tik smagi animacija, neperkami „visam laikui“.
const TREATS = [
  ['t-apple', 'Obuolys', 3, '🍎'],
  ['t-cookie', 'Sausainis', 5, '🍪'],
  ['t-icecream', 'Ledai', 8, '🍦'],
  ['t-cupcake', 'Keksiukas', 10, '🧁'],
  ['t-cake', 'Tortas', 15, '🍰'],
  ['t-banana', 'Bananas', 3, '🍌'],
  ['t-strawberry', 'Braškės', 4, '🍓'],
  ['t-watermelon', 'Arbūzas', 5, '🍉'],
  ['t-chocolate', 'Šokoladas', 6, '🍫'],
  ['t-donut', 'Spurgytė', 7, '🍩'],
  ['t-pizza', 'Pica', 9, '🍕'],
  ['t-pancakes', 'Blynai', 10, '🥞'],
].map(([id, name, price, emoji]) => ({ id, cat: 'treats', name, price, emoji, consumable: true }))
  .sort((a, b) => a.price - b.price);

// Kūno dalys ir spalvos iš monster.js kainų.
const PART_ITEMS = [];
for (const cat of PART_ORDER) {
  const p = PARTS[cat];
  for (const [opt, price] of Object.entries(p.prices)) {
    PART_ITEMS.push({ id: partItemId(cat, opt), cat: 'parts', name: `${p.options[opt].name}`, group: p.title, part: cat, opt, price });
  }
}
PART_ITEMS.sort((a, b) => a.price - b.price);

// Draugai: nupirkus atsiranda naujas kiaušinis, kuris auga atskirai.
// parts – iš ko išsiris; grants – kokias kūno dalis kartu gauna (kad galėtų keisti).
// repeat: galima pirkti daug kartų (bet kokio padarėlio kūrimas).
// SPĖJIMAS: kainos ir tai, kad draugai perkami už ⭐, – Lukas gali pakeisti.
const P = (body, color, pattern, eyes, mouth, top, tail, feet) => ({ body, color, pattern, eyes, mouth, top, tail, feet });
export const FRIEND_KINDS = [
  { kind: 'monster', name: 'Padarėlis', price: 60, repeat: true, emoji: '👾', names: ['Bumbulis', 'Burbulas', 'Gugis', 'Dzinga'], parts: null },
  { kind: 'cat', name: 'Kačiukas', price: 50, emoji: '🐱', names: ['Murkis', 'Pūkė', 'Rainius'], parts: P('round', 'orange', 'stripes', 'two', 'cat', 'catEars', 'curl', 'round') },
  { kind: 'dog', name: 'Šuniukas', price: 50, emoji: '🐶', names: ['Margis', 'Reksas', 'Bimba'], parts: P('bean', 'yellow', 'spots', 'two', 'tooth', 'dogEars', 'curl', 'round'), wear: { neck: 'neck-bell' } },
  { kind: 'bunny', name: 'Kiškutis', price: 70, emoji: '🐰', names: ['Ilgaausis', 'Morkytė', 'Šuoliukas'], parts: P('egg', 'pink', 'belly', 'two', 'smile', 'bunny', 'puff', 'round') },
  { kind: 'bear', name: 'Meškiukas', price: 70, emoji: '🐻', names: ['Rudnosis', 'Medutis', 'Mika'], parts: P('round', 'skinBrown', 'belly', 'two', 'tooth', 'roundEars', 'none', 'round') },
  { kind: 'girl', name: 'Mergaitė', price: 90, emoji: '👧', names: ['Ema', 'Lukrecija', 'Gabija', 'Austėja'], parts: P('egg', 'skinLight', 'none', 'two', 'smile', 'hairPigtails', 'none', 'sneakers'), wear: { body: 'outfit-dress' } },
  { kind: 'boy', name: 'Berniukas', price: 90, emoji: '👦', names: ['Jonas', 'Matas', 'Kajus', 'Dominykas'], parts: P('round', 'skinTan', 'none', 'two', 'grin', 'hairShort', 'none', 'sneakers'), wear: { body: 'outfit-tee' } },
  { kind: 'kid', name: 'Garbanė', price: 90, emoji: '🧒', names: ['Liepa', 'Saulė', 'Rūta'], parts: P('bean', 'skinBrown', 'none', 'happy', 'smile', 'hairCurly', 'none', 'sneakers'), wear: { body: 'outfit-overalls' } },
  { kind: 'alien', name: 'Ateivis', price: 110, emoji: '👽', names: ['Zorbas', 'Bzz', 'Kosmis'], parts: P('bean', 'green', 'spots', 'three', 'oh', 'antennae', 'none', 'float') },
  { kind: 'dragon', name: 'Drakoniukas', price: 140, emoji: '🐲', names: ['Ugnelis', 'Spygliukas', 'Drakis'], parts: P('pear', 'teal', 'belly', 'googly', 'fangs', 'crest', 'spike', 'claws') },
  { kind: 'ghost', name: 'Vaiduokliukas', price: 140, emoji: '👻', names: ['Ūū', 'Šmėkla', 'Bū'], parts: P('ghost', 'lilac', 'none', 'happy', 'oh', 'none', 'none', 'float') },
  { kind: 'mermaid', name: 'Žuvytė', price: 160, emoji: '🐟', names: ['Bangelė', 'Perlė', 'Burbulė'], parts: P('egg', 'mint', 'hearts', 'two', 'smile', 'none', 'fin', 'float') },
  { kind: 'unicorn', name: 'Vienaragis', price: 220, emoji: '🦄', names: ['Žvaigždė', 'Stebuklas', 'Vaivorė'], parts: P('round', 'pink', 'hearts', 'hearts', 'smile', 'unicorn', 'puff', 'legs') },
].map(f => ({ ...f, id: 'friend:' + f.kind, cat: 'friends', consumable: !!f.repeat }));

// Kokias mokamas dalis gauna su draugu.
export function friendGrants(fk) {
  if (!fk.parts) return [];
  const parts = PART_ORDER.filter(cat => PARTS[cat].prices[fk.parts[cat]] !== undefined).map(cat => partItemId(cat, fk.parts[cat]));
  return [...parts, ...Object.values(fk.wear || {})];
}

export function friendKind(kind) {
  return FRIEND_KINDS.find(f => f.kind === kind) || FRIEND_KINDS[0];
}

// Kambariai: nupirkus gaunamos ir jų sienos bei grindys.
const ROOM_ITEMS = ROOMS.filter(r => r.price > 0)
  .map(r => ({ id: roomItemId(r.id), cat: 'rooms', name: r.name, price: r.price, emoji: r.icon, room: r.id, grants: [r.wallpaper, r.floor, ...(r.starter || [])] }));

export const ITEMS = [...FRIEND_KINDS, ...ROOM_ITEMS, ...CLOTHES, ...PART_ITEMS, ...FURNITURE, ...DECOR, ...TREATS];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export function itemsIn(cat) {
  return ITEMS.filter(i => i.cat === cat && !(i.cat === 'decor' && i.price === 0));
}

export function isOwned(state, item) {
  return item.price === 0 || state.owned.includes(item.id);
}
