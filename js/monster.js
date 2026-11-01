// Padarėlis iš atskirų SVG dalių. Visi piešiniai originalūs.
// viewBox 0 0 200 230: kūnas ~ y 56–192, kojos iki ~215, viršuje vietos kepurėms.

const INK = '#2b2340';
const MOUTH = '#5a2a3a';
const PINK = '#ff8fab';

// Dešinė pusė = veidrodinis kairės atspindys.
const mirror = s => `${s}<g transform="translate(200 0) scale(-1 1)">${s}</g>`;

// ---------- Spalvos ----------

export const COLORS = {
  purple: { name: 'Violetinė', main: '#9b7bff', dark: '#6d4fd6', light: '#d9ccff' },
  teal: { name: 'Žydra', main: '#3cc7b4', dark: '#1f9584', light: '#b8f0e7' },
  orange: { name: 'Oranžinė', main: '#ff9f45', dark: '#e0741c', light: '#ffd9b0' },
  pink: { name: 'Rožinė', main: '#ff7eb6', dark: '#e0508f', light: '#ffd0e5' },
  green: { name: 'Žalia', main: '#7ed957', dark: '#4fa82f', light: '#d4f5c4' },
  blue: { name: 'Mėlyna', main: '#5aa9ff', dark: '#2f7bd6', light: '#c9e3ff' },
  yellow: { name: 'Geltona', main: '#ffd23f', dark: '#e0a800', light: '#fff1b8' },
  coral: { name: 'Koralinė', main: '#ff6b6b', dark: '#d94545', light: '#ffd0d0' },
  night: { name: 'Naktinė', main: '#3d3a7a', dark: '#26235a', light: '#8c87d9' },
  gold: { name: 'Auksinė', main: '#ffcc33', dark: '#d99a00', light: '#fff0b0', grad: ['#fff2a8', '#ffcc33', '#e8a300'] },
  rainbow: { name: 'Vaivorykštė', main: '#ff9f45', dark: '#9b7bff', light: '#fff1b8', grad: ['#ff7eb6', '#ffd23f', '#7ed957', '#5aa9ff', '#9b7bff'] },
};

// ---------- Kūnai ----------

const BODIES = {
  round: { name: 'Apvalus', top: 64, d: 'M36,128 a64,64 0 1,0 128,0 a64,64 0 1,0 -128,0Z' },
  egg: { name: 'Kiaušinukas', top: 56, d: 'M44,124 a56,68 0 1,0 112,0 a56,68 0 1,0 -112,0Z' },
  blob: { name: 'Kubiukas', top: 66, d: 'M82,66 H118 A44,44 0 0 1 162,110 V148 A44,44 0 0 1 118,192 H82 A44,44 0 0 1 38,148 V110 A44,44 0 0 1 82,66Z' },
  bean: { name: 'Pupelė', top: 56, d: 'M100,56 A50,50 0 0 1 150,106 V142 A50,50 0 0 1 100,192 A50,50 0 0 1 50,142 V106 A50,50 0 0 1 100,56Z' },
  pear: { name: 'Kriaušė', top: 64, d: 'M100,64 C138,64 148,100 154,128 C162,168 148,192 100,192 C52,192 38,168 46,128 C52,100 62,64 100,64Z' },
  ghost: { name: 'Vaiduokliukas', top: 62, d: 'M38,126 C38,88 66,62 100,62 C134,62 162,88 162,126 L162,184 q-10.33,14 -20.67,0 t-20.67,0 t-20.67,0 t-20.67,0 t-20.67,0 t-20.67,0Z' },
};

// ---------- Raštai (apkerpami pagal kūną) ----------

const heart = (x, y, s, fill) =>
  `<path d="M${x},${y + s * 0.9} C${x - s * 1.4},${y} ${x - s * 0.7},${y - s} ${x},${y - s * 0.3} C${x + s * 0.7},${y - s} ${x + s * 1.4},${y} ${x},${y + s * 0.9}Z" fill="${fill}"/>`;
const star = (x, y, r, fill) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const rr = i % 2 ? r * 0.45 : r;
    d += `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`;
  }
  return `<path d="${d}Z" fill="${fill}"/>`;
};

const PATTERNS = {
  none: { name: 'Be rašto', svg: () => '' },
  spots: { name: 'Taškuotas', svg: c => [[66, 88, 11], [134, 80, 8], [142, 152, 13], [60, 162, 9], [110, 180, 8], [152, 116, 6], [88, 70, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.dark}" opacity=".35"/>`).join('') },
  stripes: { name: 'Dryžuotas', svg: c => [72, 100, 156, 184].map(y => `<rect x="0" y="${y}" width="200" height="11" fill="${c.dark}" opacity=".28"/>`).join('') },
  belly: { name: 'Pilvukas', svg: c => `<ellipse cx="100" cy="164" rx="42" ry="34" fill="${c.light}"/>` },
  hearts: { name: 'Širdelės', svg: c => [[64, 90, 7], [138, 84, 6], [146, 156, 8], [58, 160, 6], [104, 180, 7]].map(([x, y, s]) => heart(x, y, s, c.light)).join('') },
  stars: { name: 'Žvaigždutės', svg: () => [[64, 88, 9], [140, 82, 7], [146, 158, 10], [58, 160, 7], [104, 182, 8]].map(([x, y, r]) => star(x, y, r, '#fff6b0')).join('') },
};

// ---------- Akys ----------

const eye = (x, y, r) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="2.5"/>` +
  `<circle class="mon-pupil" cx="${x + r * 0.12}" cy="${y + r * 0.15}" r="${r * 0.52}" fill="${INK}"/>` +
  `<circle cx="${x + r * 0.32}" cy="${y - r * 0.2}" r="${r * 0.2}" fill="#fff"/>`;

const EYES = {
  two: { name: 'Dvi akys', svg: () => eye(76, 108, 15) + eye(124, 108, 15) },
  one: { name: 'Viena akis', svg: () => eye(100, 104, 24) },
  three: { name: 'Trys akys', svg: () => eye(70, 112, 11) + eye(100, 98, 12) + eye(130, 112, 11) },
  happy: { name: 'Linksmos', svg: () => mirror(`<path d="M64,112 Q76,96 88,112" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`) },
  googly: { name: 'Išpūstos', svg: () => eye(74, 106, 18) + eye(128, 110, 12) },
  hearts: { name: 'Širdelės', svg: () => heart(76, 108, 13, '#ff4f81') + heart(124, 108, 13, '#ff4f81') },
  stars: { name: 'Žvaigždės', svg: () => star(76, 108, 16, '#ffc400') + star(124, 108, 16, '#ffc400') },
};

// ---------- Burnos ----------

const MOUTHS = {
  smile: { name: 'Šypsena', svg: () => `<path d="M84,138 Q100,154 116,138" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` },
  grin: { name: 'Plati', svg: () => `<path d="M80,134 Q100,170 120,134Z" fill="${MOUTH}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="100" cy="150" rx="9" ry="5" fill="${PINK}"/>` },
  tooth: { name: 'Dantukas', svg: () => `<path d="M84,138 Q100,154 116,138" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="95" y="144" width="10" height="9" rx="2" fill="#fff" stroke="${INK}" stroke-width="2"/>` },
  fangs: { name: 'Iltukai', svg: () => `<path d="M78,136 Q100,156 122,136" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M86,142 l4,9 l4,-7Z M114,142 l-4,9 l-4,-7Z" fill="#fff" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` },
  oh: { name: 'O!', svg: () => `<ellipse cx="100" cy="144" rx="8" ry="10" fill="${MOUTH}" stroke="${INK}" stroke-width="3"/>` },
  cat: { name: 'Katytė', svg: () => `<path d="M86,138 Q93,149 100,139 Q107,149 114,138" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>` },
};

// ---------- Ausys, ragai, antenos (už kūno) ----------

const TOPS = {
  none: { name: 'Nieko', svg: () => '' },
  catEars: { name: 'Katino ausys', svg: (c, t) => mirror(`<path d="M56,${t + 34} L62,${t - 22} L94,${t + 8}Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/><path d="M64,${t + 20} L67,${t - 6} L84,${t + 8}Z" fill="${PINK}"/>`) },
  roundEars: { name: 'Meškiuko ausys', svg: (c, t) => mirror(`<circle cx="62" cy="${t + 12}" r="20" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><circle cx="62" cy="${t + 12}" r="10" fill="${c.light}"/>`) },
  horns: { name: 'Ragiukai', svg: (c, t) => mirror(`<path d="M72,${t + 14} Q60,${t - 12} 78,${t - 28} Q78,${t - 6} 90,${t + 8}Z" fill="#fff4d6" stroke="#d9b977" stroke-width="3" stroke-linejoin="round"/>`) },
  antennae: { name: 'Antenos', svg: (c, t) => mirror(`<path d="M86,${t + 8} Q80,${t - 14} 70,${t - 30}" fill="none" stroke="${c.dark}" stroke-width="5" stroke-linecap="round"/><circle cx="70" cy="${t - 32}" r="9" fill="#ffd23f" stroke="#e0a800" stroke-width="2"/>`) },
  bunny: { name: 'Kiškio ausys', svg: (c, t) => mirror(`<ellipse cx="78" cy="${t - 22}" rx="13" ry="38" transform="rotate(-14 78 ${t - 22})" fill="${c.main}" stroke="${c.dark}" stroke-width="3"/><ellipse cx="78" cy="${t - 20}" rx="6" ry="26" transform="rotate(-14 78 ${t - 20})" fill="${PINK}"/>`) },
  unicorn: { name: 'Stebuklingas ragas', svg: (c, t) => `<path d="M90,${t + 10} L100,${t - 42} L110,${t + 10}Z" fill="#ffe680" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/><path d="M93,${t - 2} L107,${t - 8} M95,${t - 16} L105,${t - 21}" stroke="#e0a800" stroke-width="2.5"/>` },
  sprout: { name: 'Daigelis', svg: (c, t) => `<path d="M100,${t + 8} Q98,${t - 14} 100,${t - 24}" fill="none" stroke="#4fa82f" stroke-width="4" stroke-linecap="round"/><path d="M100,${t - 22} Q84,${t - 40} 72,${t - 26} Q86,${t - 16} 100,${t - 22}Z M100,${t - 22} Q116,${t - 42} 130,${t - 30} Q116,${t - 16} 100,${t - 22}Z" fill="#7ed957" stroke="#4fa82f" stroke-width="2.5"/>` },
  crest: { name: 'Skiauterė', svg: (c, t) => `<path d="M76,${t + 14} L80,${t - 16} L92,${t + 4} L100,${t - 26} L108,${t + 4} L120,${t - 16} L124,${t + 14}Z" fill="${c.dark}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>` },
};

// ---------- Uodegos (už kūno) ----------

const TAILS = {
  none: { name: 'Be uodegos', svg: () => '' },
  curl: { name: 'Riestukė', svg: c => `<path d="M146,168 C184,176 194,140 174,134 C160,130 156,150 168,152" fill="none" stroke="${c.main}" stroke-width="12" stroke-linecap="round"/><path d="M146,168 C184,176 194,140 174,134 C160,130 156,150 168,152" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round" opacity=".5"/>` },
  spike: { name: 'Drakoniukė', svg: c => `<path d="M146,158 Q178,160 196,140 Q186,170 150,184Z" fill="${c.main}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/><path d="M164,160 l6,-12 l4,11 M178,154 l8,-10 l1,11" fill="${c.dark}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>` },
  puff: { name: 'Pūkas', svg: c => `<circle cx="164" cy="176" r="18" fill="#fff" stroke="${c.light}" stroke-width="5"/>` },
  zap: { name: 'Žaibukas', svg: () => `<path d="M146,168 L172,160 L164,148 L194,140 L176,158 L186,162 L150,180Z" fill="#ffd23f" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/>` },
  fin: { name: 'Pelekas', svg: c => `<path d="M148,170 Q170,160 172,150 Q186,150 194,140 Q192,166 182,172 Q192,184 194,196 Q178,188 164,182Z" fill="${c.light}" stroke="${c.dark}" stroke-width="3" stroke-linejoin="round"/>` },
};

// ---------- Kojos (už kūno) ----------

const FEET = {
  round: { name: 'Pėdutės', svg: c => mirror(`<ellipse cx="76" cy="200" rx="21" ry="13" fill="${c.dark}"/>`) },
  claws: { name: 'Nagučiai', svg: c => mirror(`<ellipse cx="76" cy="200" rx="22" ry="13" fill="${c.dark}"/><circle cx="64" cy="208" r="4" fill="#fff"/><circle cx="76" cy="211" r="4" fill="#fff"/><circle cx="88" cy="208" r="4" fill="#fff"/>`) },
  legs: { name: 'Ilgos kojos', svg: c => mirror(`<rect x="72" y="176" width="14" height="32" rx="7" fill="${c.dark}"/><ellipse cx="76" cy="210" rx="18" ry="9" fill="${c.dark}"/>`) },
  float: { name: 'Plaukia ore', svg: () => '' },
  sneakers: { name: 'Sportbačiai', svg: () => mirror(`<path d="M56,206 Q56,190 76,190 Q92,190 96,204 L96,210 L56,210Z" fill="#ff5a5a" stroke="#c23b3b" stroke-width="2.5"/><rect x="54" y="207" width="44" height="6" rx="3" fill="#fff" stroke="#ccc" stroke-width="1.5"/><path d="M68,196 L84,196" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`) },
};

// ---------- Drabužiai ir aksesuarai ----------

// Rūbų viršus su apvalia apykakle; apkerpama pagal kūną, todėl tinka bet kokiai formai.
const SHIRT = 'M0,150 H70 Q100,172 130,150 H200 V230 H0Z';
const COLLAR = 'M70,150 Q100,172 130,150';
const shirt = (fill, edge) => `<path d="${SHIRT}" fill="${fill}"/><path d="${COLLAR}" fill="none" stroke="${edge}" stroke-width="5" stroke-linecap="round"/>`;

export const WEAR = {
  // Drabužiai ant kūno (slot: body) – apkerpami pagal kūno formą.
  'outfit-tee': { slot: 'body', svg: () => shirt('#ff6b6b', '#d94545') + heart(100, 184, 7, '#fff') },
  'outfit-dress': { slot: 'body', svg: () => shirt('#ff9ecb', '#e0508f') + `<rect x="0" y="176" width="200" height="6" fill="#e0508f"/><path d="M0,182 H200 V230 H0Z" fill="#ff7eb6"/>${[[60, 192], [84, 200], [108, 194], [132, 200], [150, 190], [72, 210], [120, 212]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#fff" opacity=".8"/>`).join('')}<path d="M100,179 L90,173 L90,185Z M100,179 L110,173 L110,185Z" fill="#c9305e"/>` },
  'outfit-overalls': { slot: 'body', svg: () => `<path d="M0,172 H200 V230 H0Z M80,152 H120 V172 H80Z" fill="#5aa9ff"/><path d="M84,154 L64,138 M116,154 L136,138" stroke="#2f7bd6" stroke-width="7" stroke-linecap="round"/><circle cx="86" cy="157" r="3.5" fill="#ffd23f"/><circle cx="114" cy="157" r="3.5" fill="#ffd23f"/><rect x="90" y="176" width="20" height="12" rx="3" fill="none" stroke="#2f7bd6" stroke-width="2.5"/>` },
  'outfit-sweater': { slot: 'body', svg: () => shirt('#ffd23f', '#e0a800') + `<rect x="0" y="172" width="200" height="8" fill="#7ed957"/><rect x="0" y="188" width="200" height="8" fill="#7ed957"/><rect x="0" y="204" width="200" height="8" fill="#7ed957"/>` },
  'outfit-pajamas': { slot: 'body', svg: () => shirt('#c9e3ff', '#5aa9ff') + [[66, 180, 6], [134, 176, 5], [104, 196, 6], [150, 196, 5], [52, 198, 4]].map(([x, y, r]) => star(x, y, r, '#ffd23f')).join('') + `<path d="M120,190 a8,8 0 1,0 6,12 a6,6 0 1,1 -6,-12Z" fill="#fff3b0"/>` },
  'outfit-jersey': { slot: 'body', svg: () => shirt('#4fa82f', '#fff') + `<text x="100" y="185" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="#fff">10</text>` },
  'outfit-tutu': { slot: 'body', svg: () => shirt('#ffc2dd', '#ff7eb6'), extra: () => `<ellipse cx="100" cy="180" rx="66" ry="13" fill="#ffd6e8" stroke="#ff7eb6" stroke-width="3"/><ellipse cx="100" cy="176" rx="54" ry="8" fill="#ffc2dd"/>${[52, 70, 88, 106, 124, 142].map(x => `<circle cx="${x + 3}" cy="${183 + (x % 3)}" r="2.5" fill="#fff"/>`).join('')}` },
  'outfit-tux': { slot: 'body', svg: () => `<path d="${SHIRT}" fill="#2b2340"/><path d="M76,152 L100,200 L124,152 Q100,170 76,152Z" fill="#fff"/>${[176, 186, 196].map(y => `<circle cx="100" cy="${y}" r="2.5" fill="#2b2340"/>`).join('')}` },
  'outfit-hero': { slot: 'body', svg: () => shirt('#2f7bd6', '#ffd23f') + `<circle cx="100" cy="184" r="13" fill="#ffd23f"/>${star(100, 184, 10, '#ff4f4f')}<rect x="0" y="200" width="200" height="7" fill="#ff4f4f"/>` },
  'outfit-princess': { slot: 'body', svg: () => shirt('#b28dff', '#ffcc33') + `<rect x="0" y="178" width="200" height="5" fill="#ffcc33"/><path d="M0,183 H200 V230 H0Z" fill="#9b7bff"/><path d="M0,198 Q12,190 24,198 T48,198 T72,198 T96,198 T120,198 T144,198 T168,198 T192,198 T216,198" fill="none" stroke="#ffcc33" stroke-width="3"/><path d="M100,166 l6,7 l-6,7 l-6,-7Z" fill="#5ad0ff" stroke="#fff" stroke-width="1.5"/>` },
  // Ant nugaros (slot: back) – piešiama už kūno.
  'back-cape': { slot: 'back', svg: () => `<path d="M66,138 Q30,182 26,214 Q100,202 174,214 Q170,182 134,138Z" fill="#ff4f4f" stroke="#c23b3b" stroke-width="3" stroke-linejoin="round"/>` },
  'back-wings': { slot: 'back', svg: () => mirror(`<ellipse cx="40" cy="100" rx="32" ry="20" transform="rotate(-30 40 100)" fill="#c9f0ff" fill-opacity=".9" stroke="#7fc8e8" stroke-width="3"/><ellipse cx="44" cy="142" rx="22" ry="13" transform="rotate(25 44 142)" fill="#ffd0e5" fill-opacity=".9" stroke="#ff9ecb" stroke-width="3"/>`) },
  'back-bat': { slot: 'back', svg: () => mirror(`<path d="M64,118 L14,88 L22,110 L6,120 L24,132 L12,150 L60,148Z" fill="#3d3a7a" stroke="#26235a" stroke-width="3" stroke-linejoin="round"/>`) },

  // Kepurės (slot: head) – pritvirtinamos prie kūno viršaus t.
  'hat-party': { slot: 'head', svg: t => `<path d="M80,${t + 10} L100,${t - 46} L120,${t + 10}Z" fill="#5aa9ff" stroke="#2f7bd6" stroke-width="3" stroke-linejoin="round"/><path d="M87,${t - 8} L113,${t - 8} M93,${t - 26} L107,${t - 26}" stroke="#ffd23f" stroke-width="5"/><circle cx="100" cy="${t - 48}" r="8" fill="#ff7eb6"/>` },
  'hat-cap': { slot: 'head', svg: t => `<path d="M64,${t + 14} Q64,${t - 26} 100,${t - 26} Q136,${t - 26} 136,${t + 14}Z" fill="#ff6b6b" stroke="#d94545" stroke-width="3"/><path d="M118,${t + 10} Q150,${t + 2} 160,${t + 16} L118,${t + 18}Z" fill="#d94545"/><circle cx="100" cy="${t - 26}" r="5" fill="#d94545"/>` },
  'hat-beanie': { slot: 'head', svg: t => `<path d="M66,${t + 12} Q66,${t - 30} 100,${t - 30} Q134,${t - 30} 134,${t + 12}Z" fill="#7ed957" stroke="#4fa82f" stroke-width="3"/><rect x="62" y="${t + 2}" width="76" height="16" rx="8" fill="#4fa82f"/><circle cx="100" cy="${t - 34}" r="11" fill="#fff" stroke="#ddd" stroke-width="2"/>` },
  'hat-flower': { slot: 'head', svg: t => `<g transform="translate(128 ${t + 4})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-11" rx="7" ry="11" fill="#ff9ecb" transform="rotate(${a})"/>`).join('')}<circle r="7" fill="#ffd23f"/></g>` },
  'hat-bow': { slot: 'head', svg: t => `<path d="M100,${t} L76,${t - 16} L76,${t + 16}Z M100,${t} L124,${t - 16} L124,${t + 16}Z" fill="#ff4f81" stroke="#c9305e" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="${t}" r="7" fill="#c9305e"/>` },
  'hat-top': { slot: 'head', svg: t => `<rect x="62" y="${t + 2}" width="76" height="10" rx="5" fill="#2b2340"/><rect x="74" y="${t - 46}" width="52" height="52" rx="4" fill="#2b2340"/><rect x="74" y="${t - 8}" width="52" height="9" fill="#9b7bff"/>` },
  'hat-crown': { slot: 'head', svg: t => `<path d="M68,${t + 10} L68,${t - 22} L84,${t - 6} L100,${t - 32} L116,${t - 6} L132,${t - 22} L132,${t + 10}Z" fill="#ffcc33" stroke="#d99a00" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="${t - 2}" r="5" fill="#ff4f81"/><circle cx="82" cy="${t + 2}" r="4" fill="#5aa9ff"/><circle cx="118" cy="${t + 2}" r="4" fill="#7ed957"/>` },
  // Akiniai (slot: face).
  'glasses-round': { slot: 'face', svg: () => `<circle cx="76" cy="108" r="19" fill="#bfe3ff" fill-opacity=".25" stroke="#2b2340" stroke-width="4"/><circle cx="124" cy="108" r="19" fill="#bfe3ff" fill-opacity=".25" stroke="#2b2340" stroke-width="4"/><path d="M95,106 Q100,100 105,106" fill="none" stroke="#2b2340" stroke-width="4"/>` },
  'glasses-sun': { slot: 'face', svg: () => `<path d="M54,98 L96,98 Q96,124 76,124 Q54,124 54,98Z M104,98 L146,98 Q146,124 124,124 Q104,124 104,98Z" fill="#2b2340" stroke="#111" stroke-width="3" stroke-linejoin="round"/><path d="M96,102 L104,102" stroke="#111" stroke-width="4"/><path d="M62,104 L72,104" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>` },
  'glasses-star': { slot: 'face', svg: () => star(76, 108, 24, '#ff7eb6') + star(124, 108, 24, '#ff7eb6') + `<circle cx="76" cy="109" r="10" fill="#fff" fill-opacity=".35"/><circle cx="124" cy="109" r="10" fill="#fff" fill-opacity=".35"/><path d="M96,106 L104,106" stroke="#e0508f" stroke-width="4"/>` },
  // Ant kaklo / krūtinės (slot: neck).
  'scarf': { slot: 'neck', clip: true, svg: () => `<rect x="0" y="152" width="200" height="20" fill="#ff6b6b"/><path d="M0,156 H200 M0,166 H200" stroke="#fff" stroke-width="3" stroke-dasharray="8 8" opacity=".7"/>`, extra: () => `<path d="M118,160 L132,160 L138,196 L122,198Z" fill="#ff6b6b" stroke="#d94545" stroke-width="2.5" stroke-linejoin="round"/>` },
  'bowtie': { slot: 'neck', svg: () => `<path d="M100,166 L80,154 L80,178Z M100,166 L120,154 L120,178Z" fill="#5aa9ff" stroke="#2f7bd6" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="166" r="6" fill="#2f7bd6"/>` },
  'necklace': { slot: 'neck', svg: () => `<path d="M66,150 Q100,182 134,150" fill="none" stroke="#ffcc33" stroke-width="3"/>${[[74, 160], [86, 168], [100, 172], [114, 168], [126, 160]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="5" fill="${['#ff7eb6', '#5aa9ff', '#ffd23f', '#7ed957', '#9b7bff'][i]}"/>`).join('')}` },
  'medal': { slot: 'neck', svg: () => `<path d="M84,146 L100,172 L116,146" fill="none" stroke="#5aa9ff" stroke-width="7"/><circle cx="100" cy="176" r="12" fill="#ffcc33" stroke="#d99a00" stroke-width="3"/>${star(100, 176, 7, '#fff3b0')}` },
};

// ---------- Visų dalių aprašas ----------

// free: kiek pirmųjų variantų prieinama iš karto; kiti – parduotuvėje.
export const PARTS = {
  body: { title: 'Kūnas', options: BODIES, free: ['round', 'egg', 'blob', 'bean'], prices: { pear: 25, ghost: 45 } },
  color: { title: 'Spalva', options: COLORS, free: ['purple', 'teal', 'orange', 'pink', 'green', 'blue'], prices: { yellow: 10, coral: 10, night: 30, gold: 90, rainbow: 140 } },
  pattern: { title: 'Raštas', options: PATTERNS, free: ['none', 'spots', 'stripes', 'belly'], prices: { hearts: 20, stars: 30 } },
  eyes: { title: 'Akys', options: EYES, free: ['two', 'one', 'three', 'happy', 'googly'], prices: { hearts: 35, stars: 50 } },
  mouth: { title: 'Burna', options: MOUTHS, free: ['smile', 'grin', 'tooth', 'fangs', 'oh', 'cat'], prices: {} },
  top: { title: 'Ausys ir ragai', options: TOPS, free: ['none', 'catEars', 'roundEars', 'horns', 'antennae', 'bunny'], prices: { sprout: 30, crest: 40, unicorn: 110 } },
  tail: { title: 'Uodega', options: TAILS, free: ['none', 'curl', 'spike', 'puff', 'zap'], prices: { fin: 35 } },
  feet: { title: 'Kojos', options: FEET, free: ['round', 'claws', 'legs', 'float'], prices: { sneakers: 40 } },
};

export const PART_ORDER = ['body', 'color', 'pattern', 'eyes', 'mouth', 'top', 'tail', 'feet'];

export function partItemId(cat, opt) {
  return `part:${cat}:${opt}`;
}

export function isPartAvailable(cat, opt, owned) {
  return PARTS[cat].free.includes(opt) || owned.includes(partItemId(cat, opt));
}

export function availableOptions(cat, owned = []) {
  return Object.keys(PARTS[cat].options).filter(o => isPartAvailable(cat, o, owned));
}

export function randomParts(owned = [], rng = Math.random) {
  const parts = {};
  for (const cat of PART_ORDER) {
    const opts = availableOptions(cat, owned);
    parts[cat] = opts[Math.floor(rng() * opts.length)];
  }
  return parts;
}

// ---------- Piešimas ----------

let uid = 0;

function gradDef(id, c) {
  const stops = c.grad.map((s, i) => `<stop offset="${Math.round(i / (c.grad.length - 1) * 100)}%" stop-color="${s}"/>`).join('');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`;
}

// Grąžina padarėlio SVG eilutę.
// opts.stage: 'egg' | 'baby' | 'teen' | 'big'; opts.scale: mastelis (augimui).
export function monsterSVG(monster, opts = {}) {
  const id = `m${++uid}`;
  const parts = monster.parts;
  const c0 = COLORS[parts.color] || COLORS.purple;
  const body = BODIES[parts.body] || BODIES.round;
  const t = body.top;
  const cls = `mon ${opts.className || ''}`.trim();

  if (opts.stage === 'egg') return eggSVG(id, c0, cls, opts);

  const defs = [];
  let c = c0;
  if (c0.grad) {
    defs.push(gradDef(`${id}g`, c0));
    c = { ...c0, main: `url(#${id}g)` };
  }
  defs.push(`<clipPath id="${id}c"><path d="${body.d}"/></clipPath>`);

  const wear = monster.wear || {};
  const w = slot => (wear[slot] && WEAR[wear[slot]]) || null;
  const neck = w('neck');
  const outfit = w('body');
  const scale = opts.scale ?? 1;
  const floatFeet = parts.feet === 'float';

  return `<svg class="${cls}" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>${defs.join('')}</defs>
<ellipse class="mon-shadow" cx="100" cy="216" rx="${floatFeet ? 40 : 56}" ry="8" fill="#000" opacity=".1"/>
<g transform="translate(100 216) scale(${scale}) translate(-100 -216)">
<g class="mon-move${floatFeet ? ' mon-float' : ''}">
<g class="mon-breathe">
${w('back') ? w('back').svg() : ''}
${TAILS[parts.tail]?.svg(c) || ''}
${FEET[parts.feet]?.svg(c) || ''}
${TOPS[parts.top]?.svg(c, t) || ''}
<path d="${body.d}" fill="${c.main}" stroke="${c0.dark}" stroke-width="4"/>
<g clip-path="url(#${id}c)">
${PATTERNS[parts.pattern]?.svg(c0) || ''}
<ellipse cx="70" cy="86" rx="22" ry="14" fill="#fff" opacity=".25" transform="rotate(-25 70 86)"/>
${outfit ? outfit.svg() : ''}
${neck && neck.clip ? neck.svg() : ''}
</g>
${outfit ? `<path d="${body.d}" fill="none" stroke="${c0.dark}" stroke-width="4"/>${outfit.extra ? outfit.extra() : ''}` : ''}
${neck ? (neck.clip ? neck.extra() : neck.svg()) : ''}
<circle cx="58" cy="132" r="9" fill="${PINK}" opacity=".55"/><circle cx="142" cy="132" r="9" fill="${PINK}" opacity=".55"/>
<g class="mon-eyes">${EYES[parts.eyes]?.svg() || ''}</g>
<g class="mon-mouth">${MOUTHS[parts.mouth]?.svg() || ''}</g>
${w('face') ? w('face').svg() : ''}
${w('head') ? w('head').svg(t) : ''}
</g>
</g>
</g>
</svg>`;
}

function eggSVG(id, c, cls, opts) {
  const fill = c.grad ? `url(#${id}g)` : c.light;
  return `<svg class="${cls} mon-egg" viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>${c.grad ? gradDef(`${id}g`, c) : ''}<clipPath id="${id}c"><path d="M100,62 C140,62 156,120 156,150 C156,186 132,206 100,206 C68,206 44,186 44,150 C44,120 60,62 100,62Z"/></clipPath></defs>
<ellipse cx="100" cy="214" rx="48" ry="8" fill="#000" opacity=".1"/>
<g class="mon-move"><g class="mon-breathe">
<path d="M100,62 C140,62 156,120 156,150 C156,186 132,206 100,206 C68,206 44,186 44,150 C44,120 60,62 100,62Z" fill="#fffaf0" stroke="${c.dark}" stroke-width="4"/>
<g clip-path="url(#${id}c)">
<circle cx="76" cy="110" r="14" fill="${fill}"/><circle cx="128" cy="96" r="10" fill="${fill}"/><circle cx="130" cy="160" r="16" fill="${fill}"/><circle cx="70" cy="170" r="11" fill="${fill}"/><circle cx="100" cy="136" r="8" fill="${fill}"/>
<ellipse cx="78" cy="92" rx="14" ry="9" fill="#fff" opacity=".6" transform="rotate(-30 78 92)"/>
</g>
<path d="M62,128 l12,-8 l10,10 l12,-10 l10,8" fill="none" stroke="${c.dark}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="${opts.cracked ? 1 : 0}"/>
</g></g>
</svg>`;
}
