// Namo kambariai. 'home' – pirmasis kambarys (state.room), kiti – state.rooms[id].
// Nupirkus kambarį gaunamos jo sienos, grindys (decor) ir du pradiniai daiktai (starter).
// SPĖJIMAS: kainos ir tai, kad kambariai perkami už ⭐, – Lukas gali pakeisti.

export const ROOMS = [
  { id: 'home', name: 'Kambarys', icon: '🏠', price: 0, wallpaper: 'wall-cream', floor: 'floor-wood' },
  { id: 'bedroom', name: 'Miegamasis', icon: '🛏️', price: 40, wallpaper: 'wall-night', floor: 'floor-carpet', starter: ['f-bed', 'f-lamp'] },
  { id: 'kitchen', name: 'Virtuvė', icon: '🍳', price: 60, wallpaper: 'wall-kitchen', floor: 'floor-tiles', starter: ['f-teapot', 'f-plates'] },
  { id: 'bathroom', name: 'Vonia', icon: '🛁', price: 80, wallpaper: 'wall-bath', floor: 'floor-bath', starter: ['f-bathtub', 'f-duck'] },
  { id: 'playroom', name: 'Žaidimų kambarys', icon: '🧸', price: 120, wallpaper: 'wall-stripes', floor: 'floor-checker', starter: ['f-ball', 'f-puzzle'] },
  { id: 'yard', name: 'Kiemas', icon: '🌳', price: 150, wallpaper: 'wall-sky', floor: 'floor-grass', starter: ['f-tree2', 'f-swing'] },
  { id: 'treehouse', name: 'Namelis medyje', icon: '🌲', price: 250, wallpaper: 'wall-planks', floor: 'floor-wood', starter: ['f-books', 'f-telescope'] },
  { id: 'castle', name: 'Pilies menė', icon: '🏰', price: 350, wallpaper: 'wall-castle', floor: 'floor-stone', starter: ['f-throne', 'f-shield'] },
  { id: 'sea', name: 'Povandeninis kambarys', icon: '🐠', price: 400, wallpaper: 'wall-sea', floor: 'floor-sand', starter: ['f-coral', 'f-shell'] },
  { id: 'space', name: 'Kosminė stotis', icon: '🚀', price: 500, wallpaper: 'wall-space', floor: 'floor-metal', starter: ['f-planet', 'f-ufo'] },
];

export const ROOM_BY_ID = Object.fromEntries(ROOMS.map(r => [r.id, r]));

export const roomItemId = id => 'room:' + id;

export function hasRoom(state, id) {
  return id === 'home' || (state.owned || []).includes(roomItemId(id));
}

export function ownedRooms(state) {
  return ROOMS.filter(r => hasRoom(state, r.id));
}

// Kambario duomenys: { wallpaper, floor, items }. Sukuriami pirmą kartą prireikus.
export function roomState(state, id) {
  if (id === 'home' || !ROOM_BY_ID[id]) return state.room;
  state.rooms = state.rooms || {};
  if (!state.rooms[id]) {
    const r = ROOM_BY_ID[id];
    state.rooms[id] = {
      wallpaper: r.wallpaper, floor: r.floor,
      items: (r.starter || []).map((it, i) => ({ uid: id + i, id: it, x: 25 + i * 50, y: 85 })),
    };
  }
  return state.rooms[id];
}

// Kuriame kambaryje dabar esama (paskutinis aplankytas).
export function currentRoomId(state) {
  const id = state.prefs && state.prefs.room;
  return id && hasRoom(state, id) ? id : 'home';
}

export function friendRoom(state, f) {
  const id = f.room || 'home';
  return hasRoom(state, id) ? id : 'home';
}
