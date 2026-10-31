// Parduotuvės prekės. Kainų kreivė: pirmi daiktai pigūs, įspūdingiausi – brangūs.

import { PARTS, PART_ORDER, partItemId } from './monster.js';

export const CATEGORIES = [
  { id: 'clothes', title: 'Rūbai', icon: '🎩' },
  { id: 'parts', title: 'Kūnas', icon: '🎨' },
  { id: 'furniture', title: 'Baldai', icon: '🛋️' },
  { id: 'decor', title: 'Sienos', icon: '🖼️' },
  { id: 'treats', title: 'Skanėstai', icon: '🍪' },
];

const CLOTHES = [
  ['hat-bow', 'Kaspinas', 8],
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
].map(([id, name, price]) => ({ id, cat: 'clothes', name, price }));

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
].map(([id, name, price, emoji, kind, size]) => ({ id, cat: 'furniture', name, price, emoji, kind: kind || 'emoji', size: size || 1 }));

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
].map(([id, name, price, slot]) => ({ id, cat: 'decor', name, price, slot }));

// Skanėstai – tik smagi animacija, neperkami „visam laikui“.
const TREATS = [
  ['t-apple', 'Obuolys', 3, '🍎'],
  ['t-cookie', 'Sausainis', 5, '🍪'],
  ['t-icecream', 'Ledai', 8, '🍦'],
  ['t-cupcake', 'Keksiukas', 10, '🧁'],
  ['t-cake', 'Tortas', 15, '🍰'],
].map(([id, name, price, emoji]) => ({ id, cat: 'treats', name, price, emoji, consumable: true }));

// Kūno dalys ir spalvos iš monster.js kainų.
const PART_ITEMS = [];
for (const cat of PART_ORDER) {
  const p = PARTS[cat];
  for (const [opt, price] of Object.entries(p.prices)) {
    PART_ITEMS.push({ id: partItemId(cat, opt), cat: 'parts', name: `${p.options[opt].name}`, group: p.title, part: cat, opt, price });
  }
}
PART_ITEMS.sort((a, b) => a.price - b.price);

export const ITEMS = [...CLOTHES, ...PART_ITEMS, ...FURNITURE, ...DECOR, ...TREATS];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

export function itemsIn(cat) {
  return ITEMS.filter(i => i.cat === cat && !(i.cat === 'decor' && i.price === 0));
}

export function isOwned(state, item) {
  return item.price === 0 || state.owned.includes(item.id);
}
