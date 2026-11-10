// Подробна архитектура за известните сгради: текстури, колони (дорийски, йонийски, коринтски),
// храмове с фронтони и фризове, арки, театри, амфитеатри, терми, базилики.
// Геометриите и материалите се кешират, за да вървят и на слаб компютър.
import { THREE } from '../../kit.js';

// ---------- текстури, нарисувани в canvas ----------
const texCache = new Map();
function canvasTex(key, w, h, draw, repeat = [1, 1]) {
  const k = `${key}|${repeat}`;
  if (texCache.has(k)) return texCache.get(k);
  let base = texCache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 4;
    texCache.set(key, base);
  }
  if (repeat[0] === 1 && repeat[1] === 1) return base;
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(...repeat);
  texCache.set(k, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function blocks(ctx, w, h, { base, line, rows = 6, cols = 4, jitter = 14, seed = 7 }) {
  const r = rnd(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  const rh = h / rows;
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * (w / cols / 2);
    for (let x = -1; x <= cols; x++) {
      const bx = x * (w / cols) + off;
      const v = Math.floor((r() - 0.5) * jitter);
      ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 100})`;
      ctx.fillRect(bx + 1, y * rh + 1, w / cols - 2, rh - 2);
    }
    ctx.strokeStyle = line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y * rh); ctx.lineTo(w, y * rh); ctx.stroke();
    for (let x = -1; x <= cols; x++) { const bx = x * (w / cols) + off; ctx.beginPath(); ctx.moveTo(bx, y * rh); ctx.lineTo(bx, (y + 1) * rh); ctx.stroke(); }
  }
}
export const TEX = {
  marble: (rep) => canvasTex('marble', 256, 256, (ctx, w, h) => {
    blocks(ctx, w, h, { base: '#f2ede1', line: 'rgba(160,150,130,0.35)', rows: 4, cols: 2, jitter: 8, seed: 3 });
    const r = rnd(11); ctx.strokeStyle = 'rgba(150,140,125,0.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) { ctx.beginPath(); let x = r() * w, y = 0; ctx.moveTo(x, y); while (y < h) { x += (r() - 0.5) * 30; y += 20; ctx.lineTo(x, y); } ctx.stroke(); }
  }, rep),
  stone: (rep) => canvasTex('stone', 256, 256, (ctx, w, h) => blocks(ctx, w, h, { base: '#a39a8a', line: 'rgba(60,55,45,0.55)', rows: 6, cols: 3, jitter: 30, seed: 5 }), rep),
  limestone: (rep) => canvasTex('limestone', 256, 256, (ctx, w, h) => blocks(ctx, w, h, { base: '#d9cdb2', line: 'rgba(110,95,70,0.45)', rows: 7, cols: 3, jitter: 18, seed: 9 }), rep),
  mudbrick: (rep) => canvasTex('mudbrick', 256, 256, (ctx, w, h) => blocks(ctx, w, h, { base: '#cfae7f', line: 'rgba(120,85,50,0.45)', rows: 10, cols: 5, jitter: 16, seed: 13 }), rep),
  brick: (rep) => canvasTex('brick', 256, 256, (ctx, w, h) => {
    // Римски opus mixtum: редове тухли и камък.
    ctx.fillStyle = '#b9a586'; ctx.fillRect(0, 0, w, h);
    blocks(ctx, w, h / 2, { base: '#b9a586', line: 'rgba(80,70,55,0.5)', rows: 3, cols: 3, jitter: 22, seed: 17 });
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#a5523a' : '#b25e44'; ctx.fillRect(0, h / 2 + i * (h / 8), w, h / 8 - 2); }
  }, rep),
  tiles: (rep) => canvasTex('tiles', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#9c4a2b'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      const g = ctx.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, '#7f3a21'); g.addColorStop(0.5, '#c0623c'); g.addColorStop(1, '#7f3a21');
      ctx.fillStyle = g; ctx.fillRect(x, 0, 16, h);
    }
    ctx.strokeStyle = 'rgba(60,25,10,0.5)'; ctx.lineWidth = 2;
    for (let y = 0; y < h; y += 21) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  }, rep),
  sand: (rep) => canvasTex('sand', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e4cf98'; ctx.fillRect(0, 0, w, h);
    const r = rnd(21); for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(120,95,50,${r() * 0.18})`; ctx.fillRect(r() * w, r() * h, 2, 2); }
  }, rep),
  rock: (rep) => canvasTex('rock', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b3a07a'; ctx.fillRect(0, 0, w, h);
    const r = rnd(31); for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '255,250,235' : '70,60,45'},${0.08 + r() * 0.12})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 6 + r() * 26, 3 + r() * 10, r() * 3, 0, Math.PI * 2); ctx.fill(); }
  }, rep),
};

const matCache = new Map();
export function M(color, { tex = null, rep = [1, 1], rough = 0.8, metal = 0, side, flat = false } = {}) {
  const key = `${color}|${tex}|${rep}|${rough}|${metal}|${side}|${flat}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, map: tex ? TEX[tex](rep) : null, roughness: rough, metalness: metal, side: side ?? THREE.FrontSide, flatShading: flat }));
  }
  return matCache.get(key);
}
const geoCache = new Map();
const G = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);

// ---------- колони ----------
// Ствол с канелюри (вдлъбнати жлебове) и ентазис (леко издуване по средата).
function shaftGeo(r, h, flutes) {
  return G(`shaft${r},${h},${flutes}`, () => {
    const g = new THREE.CylinderGeometry(r * 0.82, r, h, flutes * 2, 6, false);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
      const rr = Math.hypot(x, z); if (rr < 1e-6) continue;
      const a = Math.atan2(z, x);
      const k = Math.round((a / (Math.PI * 2)) * flutes * 2);
      const groove = k % 2 ? 0.9 : 1;
      const entasis = 1 + 0.035 * Math.sin(Math.PI * (y / h + 0.5));
      p.setX(i, x * groove * entasis); p.setZ(i, z * groove * entasis);
    }
    g.computeVertexNormals();
    return g;
  });
}
export function column(order = 'doric', { h = 1, r = 0.07, color = 0xf2ede1 } = {}) {
  const g = new THREE.Group();
  const m = M(color, { rough: 0.6 });
  const capH = r * (order === 'corinthian' ? 1.6 : 0.9);
  const shaftH = h - capH - (order === 'doric' ? 0 : r * 0.5);
  let y0 = 0;
  if (order !== 'doric') {
    const base = new THREE.Mesh(G(`cb${r}`, () => new THREE.CylinderGeometry(r * 1.25, r * 1.35, r * 0.5, 16)), m);
    base.position.y = r * 0.25; g.add(base); y0 = r * 0.5;
  }
  const shaft = new THREE.Mesh(shaftGeo(r, shaftH, order === 'doric' ? 10 : 12), m);
  shaft.position.y = y0 + shaftH / 2; g.add(shaft);
  const top = y0 + shaftH;
  if (order === 'doric') {
    const ech = new THREE.Mesh(G(`ech${r}`, () => new THREE.LatheGeometry([[r * 0.82, 0], [r * 1.25, r * 0.35], [r * 1.3, r * 0.45]].map(([a, b]) => new THREE.Vector2(a, b)), 16)), m);
    ech.position.y = top; g.add(ech);
    const ab = box(r * 2.7, r * 0.42, r * 2.7, m); ab.position.y = top + r * 0.45 + r * 0.21; g.add(ab);
  } else if (order === 'ionic') {
    const ab = box(r * 2.6, r * 0.3, r * 2.1, m); ab.position.y = top + capH - r * 0.15; g.add(ab);
    for (const s of [-1, 1]) {
      const vol = new THREE.Mesh(G(`vol${r}`, () => new THREE.TorusGeometry(r * 0.38, r * 0.14, 8, 20)), m);
      vol.position.set(s * r * 1.05, top + capH * 0.45, 0); g.add(vol);
    }
    const ech = new THREE.Mesh(G(`ie${r}`, () => new THREE.CylinderGeometry(r * 1.05, r * 0.85, r * 0.4, 16)), m);
    ech.position.y = top + r * 0.2; g.add(ech);
  } else {
    // Коринтски: камбана с два реда акантови листа.
    const bell = new THREE.Mesh(G(`bell${r}`, () => new THREE.CylinderGeometry(r * 1.25, r * 0.85, capH, 16)), m);
    bell.position.y = top + capH / 2; g.add(bell);
    const leafG = G(`leaf${r}`, () => new THREE.ConeGeometry(r * 0.22, r * 0.75, 5));
    for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + row * 0.39, rr = r * (0.95 + row * 0.15);
      const lf = new THREE.Mesh(leafG, m); lf.position.set(Math.cos(a) * rr, top + r * (0.35 + row * 0.55), Math.sin(a) * rr);
      lf.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); g.add(lf);
    }
    const ab = box(r * 2.7, r * 0.25, r * 2.7, m); ab.position.y = top + capH + r * 0.12; g.add(ab);
  }
  return g;
}

// Стъпала (стилобат).
export function steps(w, d, { n = 3, h = 0.06, inset = 0.07, color = 0xece5d6 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const s = box(w + (n - 1 - i) * inset * 2, h, d + (n - 1 - i) * inset * 2, M(color, { tex: 'marble', rep: [3, 1] }));
    s.position.y = h / 2 + i * h; g.add(s);
  }
  g.userData.top = n * h;
  return g;
}

// Покрив на две води с керемиди; дългата страна е по x.
export function gableRoof(len, span, rise, { color = 0xffffff } = {}) {
  const g = new THREE.Group();
  const slope = Math.hypot(span / 2, rise);
  const m = M(color, { tex: 'tiles', rep: [Math.max(1, Math.round(len * 3)), Math.max(1, Math.round(slope * 3))] });
  for (const s of [-1, 1]) {
    const p = box(len, 0.03, slope, m);
    p.position.set(0, rise / 2, s * span / 4);
    p.rotation.x = s * Math.atan2(rise, span / 2);
    g.add(p);
  }
  const ridge = box(len + 0.02, 0.035, 0.05, M(0x8a3c22)); ridge.position.y = rise + 0.01; g.add(ridge);
  return g;
}

// Фронтон: триъгълник с корниз и рисуван тимпан, с акротерии.
function pediment(span, rise, depth, color) {
  const g = new THREE.Group();
  const tri = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
  const tymp = new THREE.Mesh(G(`ped${span},${rise}`, () => new THREE.ExtrudeGeometry(tri, { depth, bevelEnabled: false })), M(0x5a7fa8));
  g.add(tymp);
  // Корниз по наклонените страни.
  const sl = Math.hypot(span / 2, rise);
  for (const s of [-1, 1]) {
    const c = box(sl + 0.04, 0.035, depth + 0.04, M(color));
    c.position.set(s * span / 4, rise / 2, depth / 2); c.rotation.z = -s * Math.atan2(rise, span / 2); g.add(c);
  }
  // Фигури във фронтона (силуети на статуи).
  const figM = M(0xf4efe4);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * span / (n + 1.5);
    const hh = rise * 0.75 * (1 - Math.abs(x) / (span / 2));
    if (hh < 0.03) continue;
    const f = new THREE.Mesh(G(`fig${hh.toFixed(3)}`, () => new THREE.CapsuleGeometry(0.018, hh * 0.6, 4, 6)), figM);
    f.position.set(x, hh * 0.45 + 0.01, depth + 0.012); g.add(f);
  }
  const acro = new THREE.Mesh(G('acro', () => new THREE.ConeGeometry(0.03, 0.08, 6)), M(0xd4af37, { metal: 0.6, rough: 0.3 }));
  acro.position.set(0, rise + 0.04, depth / 2); g.add(acro);
  return g;
}

// Гръцки храм с периптер (колони от всички страни), цела (вътрешна зала) и фриз с триглифи.
// Дългата страна е по x. w — дължина, d — ширина.
export function greekTemple({ w = 2.3, d = 1.0, h = 0.42, front = 8, side = 17, order = 'doric', color = 0xf2ede1, painted = true } = {}) {
  const g = new THREE.Group();
  const st = steps(w, d, { color }); g.add(st);
  const y0 = st.userData.top;
  const r = Math.min(d / front, w / side) * 0.32;
  const put = (x, z) => { const c = column(order, { h, r, color }); c.position.set(x, y0, z); g.add(c); };
  const iw = w - r * 2.2, id = d - r * 2.2;
  for (let i = 0; i < side; i++) { const x = -iw / 2 + (iw * i) / (side - 1); put(x, -id / 2); put(x, id / 2); }
  for (let i = 1; i < front - 1; i++) { const z = -id / 2 + (id * i) / (front - 1); put(-iw / 2, z); put(iw / 2, z); }
  // Цела с врата.
  const cella = box(iw * 0.72, h * 0.95, id * 0.6, M(color, { tex: 'marble', rep: [4, 2] }));
  cella.position.y = y0 + h * 0.475; g.add(cella);
  const door = box(0.01, h * 0.55, id * 0.16, M(0x5a3d22)); door.position.set(iw * 0.36 + 0.006, y0 + h * 0.275, 0); g.add(door);
  // Антаблемент: архитрав, фриз (триглифи и рисувани метопи), корниз.
  const ey = y0 + h;
  const arch = box(w, r * 1.2, d, M(color)); arch.position.y = ey + r * 0.6; g.add(arch);
  const fz = box(w - 0.01, r * 1.1, d - 0.01, M(painted ? 0xc95a3c : color)); fz.position.y = ey + r * 1.75; g.add(fz);
  const triM = M(painted ? 0x2f4f86 : 0xd9d2c0);
  const nTri = side * 2 - 1;
  for (let i = 0; i < nTri; i++) {
    const x = -iw / 2 + (iw * i) / (nTri - 1);
    for (const s of [-1, 1]) { const t = box(r * 0.55, r * 1.1, 0.012, triM); t.position.set(x, ey + r * 1.75, s * (d / 2 + 0.004)); g.add(t); }
  }
  for (let i = 0; i < front * 2 - 1; i++) {
    const z = -id / 2 + (id * i) / (front * 2 - 2);
    for (const s of [-1, 1]) { const t = box(0.012, r * 1.1, r * 0.55, triM); t.position.set(s * (w / 2 + 0.004), ey + r * 1.75, z); g.add(t); }
  }
  const corn = box(w + 0.06, r * 0.45, d + 0.06, M(color)); corn.position.y = ey + r * 2.5; g.add(corn);
  // Фронтони отпред и отзад, покрив.
  const rise = d * 0.22;
  const roofY = ey + r * 2.72;
  for (const s of [-1, 1]) {
    const p = pediment(d + 0.04, rise, 0.05, color);
    p.rotation.y = s * Math.PI / 2;
    p.position.set(s * (w / 2 - 0.02), roofY, 0);
    g.add(p);
  }
  const roof = gableRoof(w + 0.04, d + 0.12, rise); roof.position.y = roofY;
  roof.rotation.y = 0; g.add(roof);
  g.userData.height = roofY + rise;
  return g;
}

// Колонада-стоа: покрита галерия с дорийски колони отвън и йонийски отвътре.
export function stoaDetailed({ w = 2.4, d = 0.8, h = 0.55, cols = 11 } = {}) {
  const g = new THREE.Group();
  const st = steps(w, d, { n: 2 }); g.add(st);
  const y0 = st.userData.top;
  const back = box(w, h + 0.1, 0.08, M(0xe8dfcb, { tex: 'limestone', rep: [6, 1] })); back.position.set(0, y0 + (h + 0.1) / 2, -d / 2 + 0.04); g.add(back);
  for (let i = 0; i < cols; i++) {
    const x = -w / 2 + 0.06 + ((w - 0.12) * i) / (cols - 1);
    const c = column('doric', { h, r: 0.045 }); c.position.set(x, y0, d / 2 - 0.06); g.add(c);
    if (i % 2 === 0 && i > 0 && i < cols - 1) { const c2 = column('ionic', { h: h + 0.06, r: 0.035 }); c2.position.set(x, y0, 0); g.add(c2); }
  }
  // Ниши/дюкяни в задната стена.
  for (let i = 0; i < 6; i++) { const dr = box(0.16, 0.26, 0.01, M(0x6b4f36)); dr.position.set(-w / 2 + 0.25 + i * (w - 0.5) / 5, y0 + 0.13, -d / 2 + 0.085); g.add(dr); }
  const ent = box(w + 0.04, 0.09, d + 0.04, M(0xf2ede1)); ent.position.y = y0 + h + 0.12; g.add(ent);
  const roof = gableRoof(w + 0.1, d + 0.14, 0.18); roof.position.y = y0 + h + 0.16; g.add(roof);
  return g;
}

// Кръгла сграда (толос) с конусовиден керемиден покрив.
export function tholos({ r = 0.45, h = 0.42 } = {}) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(G(`thb${r}`, () => new THREE.CylinderGeometry(r + 0.06, r + 0.08, 0.08, 28)), M(0xece5d6));
  base.position.y = 0.04; g.add(base);
  const wall = new THREE.Mesh(G(`thw${r},${h}`, () => new THREE.CylinderGeometry(r * 0.78, r * 0.78, h, 28)), M(0xe8dfcb, { tex: 'limestone', rep: [4, 1] }));
  wall.position.y = 0.08 + h / 2; g.add(wall);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const c = column('doric', { h, r: 0.035 }); c.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r); g.add(c); }
  const roof = new THREE.Mesh(G(`thr${r}`, () => new THREE.ConeGeometry(r + 0.1, 0.28, 28)), M(0xffffff, { tex: 'tiles', rep: [6, 1] }));
  roof.position.y = 0.08 + h + 0.14; g.add(roof);
  return g;
}

// Каменна арка: правоъгълник с полукръгъл отвор, извлечен в дълбочина.
export function archGeo(span, height, depth, open = 0.8) {
  return G(`arch${span},${height},${depth},${open}`, () => {
    const s = new THREE.Shape();
    s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(span / 2, height); s.lineTo(-span / 2, height); s.closePath();
    const r = (span * open) / 2;
    const hole = new THREE.Path();
    hole.moveTo(-r, 0); hole.lineTo(-r, height - r - height * 0.18); hole.absarc(0, height - r - height * 0.18, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.closePath();
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 12 });
    g.translate(0, 0, -depth / 2);
    return g;
  });
}

// Римски театър (като Античния театър в Пловдив): кавея на два пояса с диазома и стълбища,
// орхестра и двуетажна сцена (scaenae frons) с коринтски колони. Седалките са назад (−z), сцената отпред (+z).
export function romanTheatre({ R = 1.75 } = {}) {
  const g = new THREE.Group();
  const seatM = M(0xeee6d3, { tex: 'marble', rep: [8, 1], side: THREE.DoubleSide });
  const prof = [[0.42, 0]];
  const rows = 12, rStep = (R - 0.45) / rows;
  for (let i = 0; i < rows; i++) {
    const r = 0.45 + i * rStep, hh = 0.035 + i * 0.045 + (i >= 6 ? 0.05 : 0);
    if (i === 6) prof.push([r, hh - 0.05], [r + rStep * 0.6, hh - 0.05]); // диазома (пътека)
    prof.push([r, hh], [r + rStep, hh]);
  }
  prof.push([R + 0.08, 0.72], [R + 0.08, 0], [0.42, 0]);
  const cavea = new THREE.Mesh(G(`cav${R}`, () => new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 40, Math.PI / 2, Math.PI)), seatM);
  g.add(cavea);
  // Радиални стълбища.
  const stairM = M(0xcfc6b2);
  for (let i = 1; i < 7; i++) {
    const a = Math.PI / 2 + (i / 7) * Math.PI;
    const st = box(0.05, 0.02, R - 0.45, stairM);
    st.position.set(Math.sin(a) * (R + 0.45) / 2, 0.3, Math.cos(a) * (R + 0.45) / 2);
    st.rotation.y = a; st.rotation.x = -Math.atan2(0.6, R - 0.45); g.add(st);
  }
  // Орхестра.
  const orch = new THREE.Mesh(G('orch', () => new THREE.CircleGeometry(0.42, 32, 0, Math.PI)), M(0xd8cdb4, { tex: 'marble', rep: [2, 2] }));
  orch.rotation.x = -Math.PI / 2; orch.rotation.z = Math.PI; orch.position.y = 0.005; g.add(orch);
  // Сцена: подиум и двуетажна фасада.
  const podium = box(2.0, 0.12, 0.28, M(0xe2d6bc, { tex: 'limestone', rep: [5, 1] })); podium.position.set(0, 0.06, 0.5); g.add(podium);
  const wall = box(2.0, 0.85, 0.08, M(0xe2d6bc, { tex: 'limestone', rep: [5, 2] })); wall.position.set(0, 0.55, 0.66); g.add(wall);
  for (const [x, hh] of [[0, 0.32], [-0.6, 0.24], [0.6, 0.24]]) { const dr = box(0.16, hh, 0.01, M(0x5a3d22)); dr.position.set(x, 0.12 + hh / 2, 0.615); g.add(dr); }
  for (let lvl = 0; lvl < 2; lvl++) {
    for (let i = 0; i < 9; i++) {
      const c = column('corinthian', { h: 0.36, r: 0.022, color: lvl ? 0xe9e1cf : 0xb0a08a });
      c.position.set(-0.88 + i * 0.22, 0.12 + lvl * 0.4, 0.56); g.add(c);
    }
    const ent = box(2.0, 0.04, 0.14, M(0xf2ede1)); ent.position.set(0, 0.5 + lvl * 0.4, 0.58); g.add(ent);
  }
  return g;
}

// Амфитеатър: елипса с два пояса аркади отвън, стъпаловидна кавея отвътре и арена с пясък.
export function amphitheatre({ a = 1.15, b = 0.82, h = 0.62 } = {}) {
  const g = new THREE.Group();
  const n = 26;
  const facM = M(0xd8c7a3, { tex: 'limestone', rep: [1, 1] });
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, t2 = ((i + 1) / n) * Math.PI * 2;
    const x1 = Math.cos(t) * a, z1 = Math.sin(t) * b, x2 = Math.cos(t2) * a, z2 = Math.sin(t2) * b;
    const span = Math.hypot(x2 - x1, z2 - z1);
    for (let lvl = 0; lvl < 2; lvl++) {
      const arc = new THREE.Mesh(archGeo(+span.toFixed(3), h / 2, 0.08, 0.62), facM);
      arc.position.set((x1 + x2) / 2, lvl * h / 2, (z1 + z2) / 2);
      arc.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
      g.add(arc);
    }
  }
  const top = new THREE.Mesh(G(`amt${a},${b}`, () => new THREE.TorusGeometry(1, 0.03, 6, 48)), M(0xcdbb95));
  top.scale.set(a, b, 1); top.rotation.x = Math.PI / 2; top.position.y = h; g.add(top);
  const cav = new THREE.Mesh(G(`amc`, () => new THREE.CylinderGeometry(0.98, 0.62, h * 0.9, 48, 1, true)), M(0xe8dcc0, { side: THREE.DoubleSide, tex: 'marble', rep: [10, 2] }));
  cav.scale.set(a, 1, b); cav.position.y = h * 0.47; g.add(cav);
  const arena = new THREE.Mesh(G('arena', () => new THREE.CircleGeometry(0.62, 40)), M(0xffffff, { tex: 'sand', rep: [2, 2] }));
  arena.scale.set(a, b, 1); arena.rotation.x = -Math.PI / 2; arena.position.y = 0.02; g.add(arena);
  return g;
}

// Терми: зала с купол и отвор (окулус), апсиди, вход с колони, басейн със стъпала и пещ с дим.
export function baths() {
  const g = new THREE.Group();
  const wallM = M(0xffffff, { tex: 'brick', rep: [3, 1] });
  const hall = box(1.3, 0.55, 0.9, wallM); hall.position.y = 0.275; g.add(hall);
  const drum = new THREE.Mesh(G('bdrum', () => new THREE.CylinderGeometry(0.36, 0.38, 0.12, 24)), wallM); drum.position.y = 0.61; g.add(drum);
  const dome = new THREE.Mesh(G('bdome', () => new THREE.SphereGeometry(0.36, 24, 12, 0, Math.PI * 2, 0.18, Math.PI / 2 - 0.18)), M(0xb9714c)); dome.position.y = 0.67; g.add(dome);
  for (const s of [-1, 1]) {
    const ap = new THREE.Mesh(G('bap', () => new THREE.CylinderGeometry(0.28, 0.28, 0.42, 20, 1, false, 0, Math.PI)), wallM);
    ap.position.set(s * 0.65, 0.21, 0); ap.rotation.y = s > 0 ? 0 : Math.PI; g.add(ap);
  }
  for (let i = 0; i < 4; i++) { const c = column('corinthian', { h: 0.42, r: 0.028 }); c.position.set(-0.3 + i * 0.2, 0, 0.52); g.add(c); }
  const pr = box(0.75, 0.05, 0.16, M(0xf2ede1)); pr.position.set(0, 0.45, 0.52); g.add(pr);
  const tri = new THREE.Shape([new THREE.Vector2(-0.4, 0), new THREE.Vector2(0.4, 0), new THREE.Vector2(0, 0.13)]);
  const pedi = new THREE.Mesh(G('bped', () => new THREE.ExtrudeGeometry(tri, { depth: 0.16, bevelEnabled: false })), M(0xf2ede1));
  pedi.position.set(0, 0.475, 0.44); g.add(pedi);
  // Басейн (фригидарий) отпред, със стъпала.
  const rim = box(0.9, 0.06, 0.42, M(0xece5d6, { tex: 'marble', rep: [2, 1] })); rim.position.set(0, 0.03, 0.95); g.add(rim);
  const water = box(0.8, 0.02, 0.32, M(0x5fb0de, { rough: 0.15 })); water.position.set(0, 0.055, 0.95); g.add(water);
  for (let i = 0; i < 3; i++) { const st = box(0.8, 0.012, 0.04, M(0xdcd3c0)); st.position.set(0, 0.04 - i * 0.012, 0.78 + i * 0.04); g.add(st); }
  // Пещ (префурниум) отстрани и дим.
  const furn = box(0.22, 0.3, 0.22, M(0xffffff, { tex: 'brick' })); furn.position.set(0.75, 0.15, -0.45); g.add(furn);
  const smoke = [];
  for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(G('smoke', () => new THREE.SphereGeometry(0.06, 8, 6)), new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: 0.45 })); s.position.set(0.75, 0.35 + i * 0.12, -0.45); g.add(s); smoke.push(s); }
  g.userData = { pool: water, smoke };
  return g;
}

// Базилика (като Голямата базилика в Плиска): три кораба, апсида, нартекс, керемидени покриви, кръст.
export function basilica({ L = 1.0, W = 0.55 } = {}) {
  const g = new THREE.Group();
  const wallM = M(0xffffff, { tex: 'limestone', rep: [3, 1] });
  const nave = box(L, 0.36, W * 0.45, wallM); nave.position.y = 0.18; g.add(nave);
  for (const s of [-1, 1]) { const aisle = box(L, 0.24, W * 0.27, wallM); aisle.position.set(0, 0.12, s * W * 0.36); g.add(aisle); }
  const apse = new THREE.Mesh(G('bsap', () => new THREE.CylinderGeometry(W * 0.22, W * 0.22, 0.32, 18, 1, false, 0, Math.PI)), wallM);
  apse.position.set(L / 2, 0.16, 0); apse.rotation.y = Math.PI / 2; g.add(apse);
  const nar = box(0.14, 0.26, W, wallM); nar.position.set(-L / 2 - 0.07, 0.13, 0); g.add(nar);
  const roof = gableRoof(L, W * 0.5, 0.12); roof.position.y = 0.36; g.add(roof);
  for (const s of [-1, 1]) { const r2 = box(L, 0.02, W * 0.3, M(0xffffff, { tex: 'tiles', rep: [3, 1] })); r2.position.set(0, 0.26, s * W * 0.37); r2.rotation.x = s * 0.25; g.add(r2); }
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const win = box(0.05, 0.07, 0.005, M(0x2e2a26)); win.position.set(-L / 2 + 0.15 + i * (L - 0.3) / 4, 0.28, s * (W * 0.225 + 0.003)); g.add(win); }
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  const cv = box(0.02, 0.14, 0.02, gold); cv.position.set(-L / 2 + 0.05, 0.56, 0); g.add(cv);
  const ch = box(0.02, 0.02, 0.08, gold); ch.position.set(-L / 2 + 0.05, 0.6, 0); g.add(ch);
  return g;
}

// Скален хълм с подпорни стени (за Акропола и Пникс).
export function rockHill({ rx = 1.6, rz = 1.1, h = 0.8, wall = true } = {}) {
  const g = new THREE.Group();
  const geo = G(`rh${rx},${rz},${h}`, () => {
    const c = new THREE.CylinderGeometry(0.78, 1, h, 18, 3);
    const p = c.attributes.position; const r = rnd(41);
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < h / 2 - 0.01 && y > -h / 2 + 0.01) { const k = 1 + (r() - 0.5) * 0.12; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } }
    c.computeVertexNormals(); return c;
  });
  const m = new THREE.Mesh(geo, M(0xffffff, { tex: 'rock', rep: [3, 1], flat: true }));
  m.scale.set(rx, 1, rz); m.position.y = h / 2; g.add(m);
  if (wall) {
    const ring = new THREE.Mesh(G(`rw`, () => new THREE.CylinderGeometry(0.8, 0.8, 0.14, 24, 1, true)), M(0xffffff, { tex: 'limestone', rep: [10, 1], side: THREE.DoubleSide }));
    ring.scale.set(rx, 1, rz); ring.position.y = h + 0.03; g.add(ring);
  }
  const top = new THREE.Mesh(G('rtop', () => new THREE.CircleGeometry(0.79, 24)), M(0xd9cdb2));
  top.scale.set(rx, rz, 1); top.rotation.x = -Math.PI / 2; top.position.y = h + 0.002; g.add(top);
  g.userData.top = h;
  return g;
}

// Бронзова статуя на пиедестал (напр. Атина Промахос).
export function statue({ h = 0.5, color = 0x8a6a3a } = {}) {
  const g = new THREE.Group();
  const ped = box(0.14, 0.12, 0.14, M(0xe2dccd)); ped.position.y = 0.06; g.add(ped);
  const bm = M(color, { metal: 0.6, rough: 0.35 });
  const body = new THREE.Mesh(G(`stb${h}`, () => new THREE.CylinderGeometry(h * 0.08, h * 0.13, h * 0.7, 10)), bm); body.position.y = 0.12 + h * 0.35; g.add(body);
  const head = new THREE.Mesh(G(`sth${h}`, () => new THREE.SphereGeometry(h * 0.07, 10, 8)), bm); head.position.y = 0.12 + h * 0.78; g.add(head);
  const spear = box(0.008, h * 1.1, 0.008, bm); spear.position.set(h * 0.12, 0.12 + h * 0.55, 0); g.add(spear);
  const shield = new THREE.Mesh(G(`sts${h}`, () => new THREE.CylinderGeometry(h * 0.11, h * 0.11, 0.01, 14)), bm); shield.rotation.z = Math.PI / 2; shield.position.set(-h * 0.12, 0.12 + h * 0.35, 0); g.add(shield);
  return g;
}

// Каменна крепостна стена с бойници (зъбци) отгоре.
export function crenellatedWall(len, { h = 1.1, t = 0.35, mud = true } = {}) {
  const g = new THREE.Group();
  const base = box(len, h * 0.4, t, M(0xffffff, { tex: 'stone', rep: [Math.max(1, Math.round(len)), 1] })); base.position.y = h * 0.2; g.add(base);
  const top = box(len, h * 0.6, t * 0.9, M(0xffffff, { tex: mud ? 'mudbrick' : 'stone', rep: [Math.max(1, Math.round(len)), 1] })); top.position.y = h * 0.7; g.add(top);
  const n = Math.max(2, Math.floor(len / 0.32));
  const mer = M(0xffffff, { tex: mud ? 'mudbrick' : 'stone', rep: [0.3, 0.3] });
  for (let i = 0; i < n; i++) { const m = box(0.16, 0.14, t * 0.9, mer); m.position.set(-len / 2 + 0.16 + i * (len - 0.32) / Math.max(1, n - 1), h + 0.07, 0); g.add(m); }
  return g;
}
export function towerDetailed({ s = 0.85, h = 1.7 } = {}) {
  const g = new THREE.Group();
  const b = box(s, h * 0.35, s, M(0xffffff, { tex: 'stone' })); b.position.y = h * 0.175; g.add(b);
  const t = box(s * 0.95, h * 0.65, s * 0.95, M(0xffffff, { tex: 'mudbrick' })); t.position.y = h * 0.675; g.add(t);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
    const m = box(0.14, 0.14, 0.14, M(0xffffff, { tex: 'mudbrick', rep: [0.3, 0.3] }));
    const a = (s * 0.95) / 2 - 0.07, off = -a + k * a;
    m.position.set(i < 2 ? off : (i === 2 ? a : -a), h + 0.07, i < 2 ? (i ? a : -a) : off); g.add(m);
  }
  for (const [x, z] of [[0, s / 2 + 0.001], [s / 2 + 0.001, 0]]) { const w = box(z ? 0.06 : 0.005, 0.12, z ? 0.005 : 0.06, M(0x2e2a26)); w.position.set(x, h * 0.75, z); g.add(w); }
  return g;
}
