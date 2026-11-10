// Модели от Българското възраждане (средата на XIX век): възрожденска къща с еркер и широки стрехи,
// каменно гърбаво мостче, калдъръм, дюкяни на чаршията, църква с камбанария, килийно училище,
// ново (светско) училище, читалище, чешма, дървета и хора във възрожденски и в европейски дрехи.
// Лицето на всяка сграда гледа по +z. Сградите с „разрез“ са отворени отпред, за да се вижда вътре.
import { THREE } from '../../kit.js';
import { M, gableRoof, archGeo } from './architecture.js';

// ---------- текстури ----------
const texCache = new Map();
function tex(key, size, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (texCache.has(k)) return texCache.get(k);
  let base = texCache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 4;
    texCache.set(key, base);
  }
  if (rep[0] === 1 && rep[1] === 1) return base;
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(...rep); texCache.set(k, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const DRAW = {
  // Калдъръм: обли речни камъни.
  cobble(ctx, s) {
    ctx.fillStyle = '#8f877a'; ctx.fillRect(0, 0, s, s);
    const r = rnd(29);
    for (let i = 0; i < 150; i++) {
      const v = (r() - 0.5) * 46;
      ctx.fillStyle = `rgb(${170 + v},${162 + v},${146 + v})`;
      ctx.beginPath(); ctx.ellipse(r() * s, r() * s, 7 + r() * 6, 5 + r() * 4, r() * 3, 0, 7); ctx.fill();
    }
  },
  // Дъски (под, порти, кепенци).
  plank(ctx, s) {
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 0, s, s);
    const r = rnd(41);
    for (let x = 0; x < s; x += s / 6) {
      const v = (r() - 0.5) * 30;
      ctx.fillStyle = `rgb(${138 + v},${100 + v},${64 + v})`; ctx.fillRect(x + 1, 0, s / 6 - 2, s);
      ctx.strokeStyle = 'rgba(60,35,15,0.35)'; ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); const xx = x + 4 + r() * (s / 6 - 8); ctx.moveTo(xx, 0); ctx.lineTo(xx + (r() - 0.5) * 6, s); ctx.stroke(); }
    }
  },
  grass(ctx, s) {
    ctx.fillStyle = '#86a85a'; ctx.fillRect(0, 0, s, s);
    const r = rnd(17);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '50,85,30' : '200,220,140'},${0.12 + r() * 0.16})`; ctx.fillRect(r() * s, r() * s, 3, 3); }
  },
  water(ctx, s) {
    ctx.fillStyle = '#4a8fbf'; ctx.fillRect(0, 0, s, s);
    const r = rnd(23); ctx.strokeStyle = 'rgba(225,242,255,0.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) { const x = r() * s, y = r() * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 3, x + 22 + r() * 16, y); ctx.stroke(); }
  },
  // Табло с букви за взаимното училище.
  letters(ctx, s) {
    ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, s - 10, s - 10);
    ctx.fillStyle = '#2a2018'; ctx.font = `bold ${s / 6}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const L = ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И'];
    L.forEach((c, i) => ctx.fillText(c, s * (0.22 + (i % 3) * 0.28), s * (0.25 + Math.floor(i / 3) * 0.26)));
  },
  // Букви, изписани с пръчица в пясъка.
  sand(ctx, s) {
    ctx.fillStyle = '#e2cf9c'; ctx.fillRect(0, 0, s, s);
    const r = rnd(7); for (let i = 0; i < 500; i++) { ctx.fillStyle = `rgba(120,95,50,${r() * 0.2})`; ctx.fillRect(r() * s, r() * s, 2, 2); }
    ctx.strokeStyle = 'rgba(110,80,40,0.8)'; ctx.lineWidth = 5; ctx.font = `${s / 3}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeText('А Б', s / 2, s / 2);
  },
  // Черна дъска с урок по смятане.
  board(ctx, s) {
    ctx.fillStyle = '#26332c'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, s - 12, s - 12);
    ctx.fillStyle = '#eef2ea'; ctx.font = `${s / 8}px serif`; ctx.textAlign = 'center';
    ctx.fillText('12 + 7 = 19', s / 2, s * 0.38); ctx.fillText('5 × 4 = 20', s / 2, s * 0.62);
  },
  // Стенна карта (опростена).
  map(ctx, s) {
    ctx.fillStyle = '#d7e7f2'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#c9d79a';
    ctx.beginPath(); ctx.moveTo(s * 0.1, s * 0.3); ctx.bezierCurveTo(s * 0.35, s * 0.1, s * 0.7, s * 0.2, s * 0.85, s * 0.35);
    ctx.bezierCurveTo(s * 0.8, s * 0.6, s * 0.6, s * 0.85, s * 0.35, s * 0.8); ctx.bezierCurveTo(s * 0.2, s * 0.75, s * 0.05, s * 0.55, s * 0.1, s * 0.3); ctx.fill();
    ctx.strokeStyle = '#4b7aa8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(s * 0.15, s * 0.32); ctx.lineTo(s * 0.8, s * 0.36); ctx.stroke();
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, s - 10, s - 10);
  },
  // Рафт с книги.
  books(ctx, s) {
    ctx.fillStyle = '#5a3d24'; ctx.fillRect(0, 0, s, s);
    const r = rnd(13); const C = ['#8a2f2a', '#2f5a8a', '#3f7a3f', '#c49a3a', '#6a3a6a', '#2a2a2a'];
    for (let row = 0; row < 4; row++) {
      let x = 6; const y0 = row * s / 4 + 6, hh = s / 4 - 12;
      while (x < s - 10) { const bw = 6 + r() * 8; ctx.fillStyle = C[Math.floor(r() * C.length)]; ctx.fillRect(x, y0 + (r() * 6), bw, hh - r() * 6); x += bw + 1; }
      ctx.fillStyle = '#3e2a18'; ctx.fillRect(0, (row + 1) * s / 4 - 6, s, 6);
    }
  },
  // Шарена черга.
  rug(ctx, s) {
    ctx.fillStyle = '#a3302a'; ctx.fillRect(0, 0, s, s);
    const C = ['#e0b040', '#2f4f7a', '#f2ead8', '#2f6a3a'];
    for (let y = 0; y < s; y += s / 8) { ctx.fillStyle = C[(y / (s / 8)) % 4]; ctx.fillRect(0, y + s / 32, s, s / 32); }
    ctx.fillStyle = '#f2ead8';
    for (let x = s / 8; x < s; x += s / 4) for (let y = s / 8; y < s; y += s / 4) { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 10, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 10, y); ctx.fill(); }
  },
  icon(ctx, s) {
    ctx.fillStyle = '#c99a2e'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#7a2a22'; ctx.fillRect(s * 0.12, s * 0.1, s * 0.76, s * 0.8);
    ctx.fillStyle = '#e8c070'; ctx.beginPath(); ctx.arc(s / 2, s * 0.35, s * 0.16, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9a982'; ctx.beginPath(); ctx.arc(s / 2, s * 0.36, s * 0.09, 0, 7); ctx.fill();
    ctx.fillStyle = '#2f4f7a'; ctx.fillRect(s * 0.33, s * 0.48, s * 0.34, s * 0.36);
  },
  // Надпис на сграда.
  sign(ctx, s, text) {
    ctx.fillStyle = '#f6efdc'; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, s - 8, s - 8);
    ctx.fillStyle = '#3a2614'; ctx.font = `bold ${s / 4.2}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, s / 2, s / 2 + 4);
  },
};
const MATS = new Map();
// Материал с рисувана текстура от DRAW.
export function RM(name, { color = 0xffffff, rep = [1, 1], rough = 0.85, side } = {}) {
  const k = `${name}|${color}|${rep}|${side}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, side: side ?? THREE.FrontSide, map: tex(name, 256, DRAW[name], rep) }));
  return MATS.get(k);
}
function signMat(text) {
  const k = `sign|${text}`;
  if (!MATS.has(k)) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f6efdc'; ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, 504, 120);
    ctx.fillStyle = '#3a2614'; ctx.font = 'bold 64px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    MATS.set(k, new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 }));
  }
  return MATS.get(k);
}

const geoCache = new Map();
const G = (key, make) => { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 10) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m) => new THREE.Mesh(G(`s${r}`, () => new THREE.SphereGeometry(r, 12, 9)), m);
const STONE = () => M(0xffffff, { tex: 'stone', rep: [2, 1] });
const DARK = () => M(0x2b2622);
const WOOD = () => M(0x6b4a2c);
const WHITE = () => M(0xf3efe4);

// Покрив на четири води (с керемиди), с широки стрехи. Основата е по x и z.
export function hipRoof(w, d, rise) {
  const g = new THREE.Group();
  const geo = G('hip', () => { const c = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1); c.rotateY(Math.PI / 4); c.translate(0, 0.5, 0); return c; });
  const m = new THREE.Mesh(geo, M(0xffffff, { tex: 'tiles', rep: [4, 2], flat: true }));
  m.scale.set(w, rise, d); g.add(m);
  // Долната страна на стрехата: тъмно дърво.
  const under = box(w, 0.02, d, M(0x5b3f28)); under.position.y = 0.01; g.add(under);
  return g;
}

// Прозорец с бяла рамка и капаци; гледа по +z.
function windowZ(w = 0.18, h = 0.24, { shutters = false } = {}) {
  const g = new THREE.Group();
  const fr = box(w + 0.04, h + 0.04, 0.02, WHITE()); g.add(fr);
  const gl = box(w, h, 0.025, M(0x2f3f4a, { rough: 0.3 })); g.add(gl);
  const bar = box(0.012, h, 0.03, WHITE()); g.add(bar);
  const bar2 = box(w, 0.012, 0.03, WHITE()); g.add(bar2);
  if (shutters) for (const s of [-1, 1]) { const sh = box(w / 2, h + 0.02, 0.015, RM('plank', { color: 0x7a9a6a, rep: [0.5, 1] })); sh.position.set(s * (w * 0.75 + 0.03), 0, 0.01); g.add(sh); }
  return g;
}

// ---------- възрожденска къща ----------
// Каменен приземен етаж, дървен (измазан и боядисан) горен етаж, издаден напред, еркер и стрехи.
export function revivalHouse({ w = 1.7, d = 1.3, color = 0x3f6fae, erker = true, h1 = 0.62, h2 = 0.66 } = {}) {
  const g = new THREE.Group();
  const base = box(w, h1, d, M(0xffffff, { tex: 'stone', rep: [Math.max(1, Math.round(w * 1.5)), 1] })); base.position.y = h1 / 2; g.add(base);
  // Порта (дървена, двукрила) и малки прозорчета с решетки долу.
  const doorX = erker ? -w * 0.28 : 0;
  const door = box(0.3, 0.44, 0.03, RM('plank', { rep: [1, 1] })); door.position.set(doorX, 0.22, d / 2 + 0.01); g.add(door);
  const lint = box(0.36, 0.05, 0.05, WOOD()); lint.position.set(doorX, 0.46, d / 2 + 0.02); g.add(lint);
  for (const x of erker ? [w * 0.1, w * 0.33] : [-w * 0.3, w * 0.3]) { const wn = box(0.1, 0.1, 0.02, DARK()); wn.position.set(x, 0.42, d / 2 + 0.005); g.add(wn); for (const k of [-1, 0, 1]) { const b = box(0.008, 0.1, 0.03, M(0x333333)); b.position.set(x + k * 0.03, 0.42, d / 2 + 0.01); g.add(b); } }
  // Горен етаж: издаден напред с подпори.
  const over = 0.18;
  const upD = d + over;
  const up = box(w + 0.06, h2, upD, M(color, { rough: 0.9 })); up.position.set(0, h1 + h2 / 2, over / 2); g.add(up);
  const beam = box(w + 0.1, 0.05, upD + 0.04, WOOD()); beam.position.set(0, h1 + 0.025, over / 2); g.add(beam);
  for (const s of [-1, 1]) for (const zz of [-1, 1]) { const post = box(0.04, h2, 0.04, WOOD()); post.position.set(s * (w / 2 + 0.035), h1 + h2 / 2, over / 2 + zz * (upD / 2 + 0.005)); g.add(post); }
  const nb = Math.max(2, Math.round(w / 0.32));
  for (let i = 0; i < nb; i++) { const br = box(0.035, 0.035, 0.26, WOOD()); br.position.set(-w / 2 + 0.12 + i * (w - 0.24) / (nb - 1), h1 - 0.08, d / 2 + 0.06); br.rotation.x = -0.6; g.add(br); }
  // Прозорци горе.
  const fz = d / 2 + over + 0.012;
  const xs = erker ? [-w * 0.38, w * 0.38] : [-w * 0.3, 0, w * 0.3];
  for (const x of xs) { const wn = windowZ(0.16, 0.24, { shutters: false }); wn.position.set(x, h1 + h2 * 0.52, fz); g.add(wn); }
  for (const s of [-1, 1]) for (const z of [-d * 0.2, d * 0.25]) { const wn = windowZ(0.15, 0.22); wn.rotation.y = s * Math.PI / 2; wn.position.set(s * (w / 2 + 0.04), h1 + h2 * 0.52, z); g.add(wn); }
  // Еркер: издадена напред стая с три прозореца.
  let top = h1 + h2;
  if (erker) {
    const ew = Math.min(0.8, w * 0.45), ed = 0.26;
    const e = box(ew, h2 * 0.92, ed, M(color, { rough: 0.9 })); e.position.set(0, h1 + h2 * 0.5, d / 2 + over + ed / 2); g.add(e);
    const eb = box(ew + 0.04, 0.04, ed + 0.02, WOOD()); eb.position.set(0, h1 + h2 * 0.04, d / 2 + over + ed / 2); g.add(eb);
    for (const s of [-1, 1]) { const br = box(0.035, 0.035, 0.34, WOOD()); br.position.set(s * ew * 0.38, h1 - 0.06, d / 2 + over + 0.08); br.rotation.x = -0.75; g.add(br); }
    for (const x of [-ew * 0.32, 0, ew * 0.32]) { const wn = windowZ(0.14, 0.22); wn.position.set(x, h1 + h2 * 0.52, d / 2 + over + ed + 0.012); g.add(wn); }
  }
  // Широка стреха и покрив на четири води.
  const ov = 0.3;
  const roof = hipRoof(w + 2 * ov, upD + 2 * ov + (erker ? 0.2 : 0), 0.42); roof.position.set(0, top, over / 2 + (erker ? 0.1 : 0)); g.add(roof);
  const chim = box(0.12, 0.34, 0.12, STONE()); chim.position.set(w * 0.26, top + 0.32, -d * 0.12); g.add(chim);
  const cap = box(0.18, 0.04, 0.18, M(0xffffff, { tex: 'tiles' })); cap.position.set(w * 0.26, top + 0.5, -d * 0.12); g.add(cap);
  g.userData.chimney = new THREE.Vector3(w * 0.26, top + 0.55, -d * 0.12);
  g.userData.top = top + 0.42;
  return g;
}

// Висок каменен зид (дувар) с керемиди отгоре и дървена порта; дължината е по x.
export function yardWall(len, { h = 0.5, gate = false } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [Math.max(1, Math.round(len * 1.2)), 0.6] });
  const parts = gate ? [[-len / 2, -0.25], [0.25, len / 2]] : [[-len / 2, len / 2]];
  for (const [a, b] of parts) { const w = box(b - a, h, 0.16, sm); w.position.set((a + b) / 2, h / 2, 0); g.add(w); const c = box(b - a + 0.04, 0.05, 0.24, M(0xffffff, { tex: 'tiles', rep: [2, 1] })); c.position.set((a + b) / 2, h + 0.025, 0); g.add(c); }
  if (gate) {
    const door = box(0.5, h - 0.04, 0.05, RM('plank', { color: 0xc8a070, rep: [2, 1] })); door.position.set(0, (h - 0.04) / 2, 0); g.add(door);
    const roof = gableRoof(0.7, 0.4, 0.14); roof.position.y = h + 0.04; g.add(roof);
  }
  return g;
}

// Гърбаво каменно мостче над реката. Минава по z (реката тече по x).
export function humpBridge({ span = 1.7, w = 0.55, rise = 0.36 } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [1.5, 1] });
  const H = rise + 0.12;
  const arch = new THREE.Mesh(archGeo(span, H, w, 0.78), sm);
  arch.rotation.y = Math.PI / 2; g.add(arch);
  const L = span / 2 + 0.45;
  const slope = Math.hypot(L, H), ang = Math.atan2(H, L);
  for (const s of [-1, 1]) {
    const deck = box(w, 0.07, slope, RM('cobble', { rep: [1, 2] }));
    deck.position.set(0, H / 2 + 0.02, s * L / 2); deck.rotation.x = s * ang; g.add(deck);
    for (const k of [-1, 1]) { const p = box(0.06, 0.13, slope, sm); p.position.set(k * (w / 2 - 0.03), H / 2 + 0.1, s * L / 2); p.rotation.x = s * ang; g.add(p); }
    const fill = box(w * 0.98, H * 0.55, L * 0.5, sm); fill.position.set(0, H * 0.27, s * (span / 2 + 0.12)); g.add(fill);
  }
  return g;
}

// Чешма: каменна стена, корито и струя вода.
export function fountain() {
  const g = new THREE.Group();
  const wall = box(0.6, 0.6, 0.18, M(0xffffff, { tex: 'limestone', rep: [1, 1] })); wall.position.y = 0.3; g.add(wall);
  const arch = new THREE.Mesh(archGeo(0.6, 0.18, 0.2, 0.7), M(0xffffff, { tex: 'limestone' })); arch.position.y = 0.6; g.add(arch);
  const trough = box(0.5, 0.12, 0.26, M(0xffffff, { tex: 'limestone' })); trough.position.set(0, 0.06, 0.2); g.add(trough);
  const water = box(0.44, 0.02, 0.2, M(0x5aa0d0, { rough: 0.2 })); water.position.set(0, 0.115, 0.2); g.add(water);
  const pipe = cyl(0.015, 0.015, 0.1, M(0x8a7a5a), 6); pipe.rotation.x = Math.PI / 2; pipe.position.set(0, 0.36, 0.13); g.add(pipe);
  const stream = cyl(0.008, 0.008, 0.24, new THREE.MeshStandardMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.8 }), 6); stream.position.set(0, 0.24, 0.18); g.add(stream);
  g.userData.stream = stream;
  return g;
}

// ---------- дюкян на чаршията ----------
// Горният кепенк е вдигнат като навес, долният е свален като тезгях. kind: 'aba' | 'kozhuh' | 'bakal'.
export function shop({ w = 1.1, d = 0.9, kind = 'aba' } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [1, 0.6] });
  const h = 0.72;
  const back = box(w, h, 0.08, sm); back.position.set(0, h / 2, -d / 2 + 0.04); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.08, h, d, sm); side.position.set(s * (w / 2 - 0.04), h / 2, 0); g.add(side); }
  const fl = box(w - 0.1, 0.1, d - 0.05, RM('plank', { rep: [2, 1] })); fl.position.y = 0.05; g.add(fl);
  const counter = box(w - 0.14, 0.05, 0.26, RM('plank', { color: 0xd9b88a, rep: [2, 0.5] })); counter.position.set(0, 0.3, d / 2 + 0.1); g.add(counter);
  for (const s of [-1, 1]) { const leg = box(0.04, 0.3, 0.04, WOOD()); leg.position.set(s * (w / 2 - 0.12), 0.15, d / 2 + 0.2); g.add(leg); }
  const awn = box(w - 0.1, 0.03, 0.34, RM('plank', { rep: [2, 0.5] })); awn.position.set(0, h - 0.04, d / 2 + 0.14); awn.rotation.x = 0.4; g.add(awn);
  const roof = hipRoof(w + 0.3, d + 0.5, 0.3); roof.position.set(0, h, 0.08); g.add(roof);
  // Стоки.
  if (kind === 'aba') {
    // Сгънат шаяк (вълнен плат) и готови аби.
    [0x2a3550, 0x5a3a28, 0x1e1e24, 0x6a2a2a].forEach((c, i) => { const f = box(0.22, 0.04, 0.16, M(c)); f.position.set(-w * 0.3 + (i % 2) * 0.24, 0.345 + Math.floor(i / 2) * 0.045, d / 2 + 0.1); g.add(f); });
    for (const x of [-0.2, 0.1, 0.35]) { const a = box(0.18, 0.28, 0.03, M(x > 0.2 ? 0x2a3550 : 0x3a2a1e)); a.position.set(x * w, 0.42, -d / 2 + 0.12); g.add(a); }
    const spool = cyl(0.04, 0.04, 0.08, M(0xe8e0c8), 10); spool.position.set(w * 0.3, 0.37, d / 2 + 0.12); g.add(spool);
  } else if (kind === 'kozhuh') {
    // Кожуси и агнешки кожи.
    for (const [x, c] of [[-0.28, 0xf0e8d6], [0, 0x7a5a3a], [0.28, 0xe6dccb]]) { const k = box(0.22, 0.32, 0.04, M(c, { rough: 1 })); k.position.set(x * w, 0.42, -d / 2 + 0.12); g.add(k); const tr = box(0.24, 0.03, 0.05, M(0xf5efe0)); tr.position.set(x * w, 0.27, -d / 2 + 0.12); g.add(tr); }
    for (let i = 0; i < 3; i++) { const sk = box(0.2, 0.025, 0.16, M(i === 1 ? 0x8a6a4a : 0xf2ead8, { rough: 1 })); sk.position.set(-w * 0.2 + i * 0.2, 0.34 + i * 0.01, d / 2 + 0.1); g.add(sk); }
  } else {
    // Бакалин: чували с жито и ориз, кантар.
    for (const [x, c] of [[-0.3, 0xd8c79a], [-0.08, 0xc9b27a], [0.15, 0xe8e0c8]]) { const s = cyl(0.07, 0.08, 0.16, M(c), 10); s.position.set(x * w, 0.405, d / 2 + 0.1); g.add(s); }
    const sc = box(0.02, 0.2, 0.02, M(0x555555, { metal: 0.6 })); sc.position.set(w * 0.33, 0.43, d / 2 + 0.1); g.add(sc);
  }
  g.userData.front = d / 2 + 0.3;
  return g;
}

// ---------- църква и камбанария ----------
// Ниска каменна църква с покрив на две води, апсида на изток (+x) и дървена галерия отпред.
export function revivalChurch({ L = 2.6, W = 1.3, H = 0.8 } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [3, 1] });
  const nave = box(L, H, W, sm); nave.position.y = H / 2; g.add(nave);
  const roof = gableRoof(L + 0.2, W + 0.36, 0.42); roof.position.y = H; g.add(roof);
  for (const s of [-1, 1]) { const gab = new THREE.Mesh(G(`gab${W}`, () => { const sh = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(0, 0.4)]); return new THREE.ShapeGeometry(sh); }), M(0xffffff, { tex: 'stone', side: THREE.DoubleSide })); gab.rotation.y = Math.PI / 2; gab.position.set(s * L / 2, H, 0); g.add(gab); }
  const apse = new THREE.Mesh(G('apse', () => new THREE.CylinderGeometry(W * 0.32, W * 0.32, H * 0.85, 16, 1, false, 0, Math.PI)), sm);
  apse.position.set(L / 2, H * 0.425, 0); g.add(apse);
  const ar = new THREE.Mesh(G('apr', () => new THREE.ConeGeometry(W * 0.36, 0.25, 16, 1, false, 0, Math.PI)), M(0xffffff, { tex: 'tiles' })); ar.position.set(L / 2, H * 0.85 + 0.12, 0); g.add(ar);
  // Галерия с дървени колони отпред.
  const gz = W / 2 + 0.3;
  for (let i = 0; i < 7; i++) { const c = cyl(0.03, 0.035, H * 0.82, WOOD(), 8); c.position.set(-L / 2 + 0.15 + i * (L - 0.3) / 6, H * 0.41, gz); g.add(c); }
  const lean = box(L + 0.1, 0.03, 0.5, M(0xffffff, { tex: 'tiles', rep: [6, 1] })); lean.position.set(0, H * 0.9, gz - 0.04); lean.rotation.x = 0.3; g.add(lean);
  const gfl = box(L, 0.05, 0.6, M(0xffffff, { tex: 'limestone', rep: [4, 1] })); gfl.position.set(0, 0.025, gz - 0.05); g.add(gfl);
  const door = box(0.26, 0.44, 0.02, RM('plank', { color: 0xb08050 })); door.position.set(0, 0.22, W / 2 + 0.01); g.add(door);
  for (const x of [-L * 0.32, L * 0.3]) { const wn = box(0.1, 0.18, 0.02, DARK()); wn.position.set(x, H * 0.62, W / 2 + 0.01); g.add(wn); const t = new THREE.Mesh(G('wa', () => new THREE.CircleGeometry(0.05, 10, 0, Math.PI)), DARK()); t.position.set(x, H * 0.62 + 0.09, W / 2 + 0.021); g.add(t); }
  return g;
}
export function bellTower({ h = 1.6 } = {}) {
  const g = new THREE.Group();
  const s = 0.55;
  const base = box(s, h * 0.62, s, M(0xffffff, { tex: 'stone', rep: [1, 2] })); base.position.y = h * 0.31; g.add(base);
  const deck = box(s + 0.06, 0.05, s + 0.06, WOOD()); deck.position.y = h * 0.62 + 0.025; g.add(deck);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.05, h * 0.3, 0.05, WOOD()); p.position.set(x * s * 0.42, h * 0.62 + h * 0.15, z * s * 0.42); g.add(p); }
  const pivot = new THREE.Group(); pivot.position.y = h * 0.9; g.add(pivot);
  const bell = new THREE.Mesh(G('bell', () => new THREE.LatheGeometry([[0, -0.01], [0.09, 0], [0.08, 0.04], [0.06, 0.12], [0.04, 0.15], [0, 0.155]].map(([a, b]) => new THREE.Vector2(a, b)), 14)), M(0xb8862b, { metal: 0.6, rough: 0.35, side: THREE.DoubleSide }));
  bell.position.y = -0.16; pivot.add(bell);
  const roof = hipRoof(s + 0.3, s + 0.3, 0.38); roof.position.y = h * 0.92; g.add(roof);
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  const cv = box(0.02, 0.18, 0.02, gold); cv.position.y = h * 0.92 + 0.46; g.add(cv);
  const ch = box(0.1, 0.02, 0.02, gold); ch.position.y = h * 0.92 + 0.5; g.add(ch);
  g.userData.bell = pivot;
  return g;
}

// ---------- училища и читалище ----------
// Килийно училище: малка стая при църквата, отворена отпред. Децата седят на пода, учат по църковни книги
// и пишат букви с пръчица в пясъчник.
export function cellSchool({ w = 1.9, d = 1.4, h = 0.8 } = {}) {
  const g = new THREE.Group();
  const wm = M(0xeee6d6, { rough: 0.95 });
  const floor = box(w, 0.06, d, RM('plank', { rep: [3, 2] })); floor.position.y = 0.03; g.add(floor);
  const back = box(w, h, 0.1, wm); back.position.set(0, h / 2, -d / 2 + 0.05); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.1, h, d, wm); side.position.set(s * (w / 2 - 0.05), h / 2, 0); g.add(side); const plinth = box(0.12, 0.18, d, STONE()); plinth.position.set(s * (w / 2 - 0.05), 0.09, 0); g.add(plinth); }
  const bpl = box(w, 0.18, 0.12, STONE()); bpl.position.set(0, 0.09, -d / 2 + 0.05); g.add(bpl);
  for (const s of [-1, 1]) { const p = box(0.07, h, 0.07, WOOD()); p.position.set(s * (w / 2 - 0.05), h / 2, d / 2 - 0.04); g.add(p); }
  const beam = box(w, 0.06, 0.08, WOOD()); beam.position.set(0, h - 0.03, d / 2 - 0.04); g.add(beam);
  const roof = gableRoof(w + 0.3, d + 0.4, 0.4); roof.rotation.y = 0; roof.position.y = h; g.add(roof);
  for (const s of [-1, 1]) { const gab = new THREE.Mesh(G(`cgab${d}`, () => { const sh = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, 0.4)]); return new THREE.ShapeGeometry(sh); }), M(0xeee6d6, { side: THREE.DoubleSide })); gab.rotation.y = Math.PI / 2; gab.position.set(s * (w / 2 - 0.05), h, 0); g.add(gab); }
  // Миндер (нисък одър) с черга покрай задната стена.
  const minder = box(w - 0.3, 0.1, 0.32, RM('rug', { rep: [2, 1] })); minder.position.set(0, 0.11, -d / 2 + 0.28); g.add(minder);
  const rug = box(w * 0.6, 0.012, d * 0.42, RM('rug')); rug.position.set(-w * 0.08, 0.066, d * 0.1); g.add(rug);
  // Икона и кандило.
  const icon = box(0.2, 0.26, 0.02, RM('icon')); icon.position.set(w * 0.28, h * 0.62, -d / 2 + 0.11); g.add(icon);
  const lamp = sph(0.03, new THREE.MeshStandardMaterial({ color: 0xffb040, emissive: 0xff8a20, emissiveIntensity: 1 })); lamp.position.set(w * 0.28, h * 0.4, -d / 2 + 0.16); g.add(lamp);
  // Пясъчник: дървена тавичка с пясък, в който се пише с пръчица.
  const sb = new THREE.Group();
  const frame = box(0.42, 0.05, 0.28, WOOD()); frame.position.y = 0.025; sb.add(frame);
  const sand = box(0.38, 0.012, 0.24, RM('sand')); sand.position.y = 0.052; sb.add(sand);
  const stick = box(0.008, 0.008, 0.16, WOOD()); stick.position.set(0.12, 0.07, 0.04); stick.rotation.y = 0.6; sb.add(stick);
  sb.position.set(-w * 0.15, 0.06, d * 0.12); g.add(sb);
  // Аналой (наклонена масичка) с отворен псалтир.
  const ps = new THREE.Group();
  const leg = cyl(0.02, 0.025, 0.36, WOOD(), 8); leg.position.y = 0.18; ps.add(leg);
  const desk = box(0.24, 0.02, 0.18, WOOD()); desk.position.y = 0.37; desk.rotation.x = 0.4; ps.add(desk);
  for (const s of [-1, 1]) { const pg = box(0.1, 0.012, 0.14, M(0xf2e8cf)); pg.position.set(s * 0.055, 0.39, 0.005); pg.rotation.x = 0.4; pg.rotation.z = -s * 0.08; ps.add(pg); }
  const cover = box(0.22, 0.008, 0.15, M(0x6a2a1e)); cover.position.y = 0.38; cover.rotation.x = 0.4; ps.add(cover);
  ps.position.set(w * 0.22, 0.06, d * 0.05); g.add(ps);
  g.userData = { sandbox: sb, psalter: ps, lamp, floorY: 0.06, w, d };
  return g;
}

// Ново светско училище: двуетажна сграда. Приземният етаж е класна стая, отворена отпред („разрез“):
// стенни табла с букви (за групите на взаимоучителната метода), черна дъска, чинове, карта, глобус и катедра.
// userData.groups: места пред таблата — { c: точка до таблото, n: посока към стаята } (в мерките на сградата).
export function newSchool({ w = 4.0, d = 2.4, h1 = 1.0, h2 = 0.8 } = {}) {
  const g = new THREE.Group();
  const wm = M(0xf4efe2, { rough: 0.95 });
  const floor = box(w, 0.06, d, RM('plank', { rep: [5, 3] })); floor.position.y = 0.03; g.add(floor);
  const back = box(w, h1, 0.12, wm); back.position.set(0, h1 / 2, -d / 2 + 0.06); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.12, h1, d, wm); side.position.set(s * (w / 2 - 0.06), h1 / 2, 0); g.add(side); }
  const plinth = box(w + 0.04, 0.16, 0.14, STONE()); plinth.position.set(0, 0.08, -d / 2 + 0.06); g.add(plinth);
  for (const s of [-1, 1]) { const pl = box(0.14, 0.16, d + 0.04, STONE()); pl.position.set(s * (w / 2 - 0.06), 0.08, 0); g.add(pl); }
  // Предни стълбове (разрез).
  for (let i = 0; i < 5; i++) { const p = box(0.1, h1, 0.1, wm); p.position.set(-w / 2 + 0.05 + i * (w - 0.1) / 4, h1 / 2, d / 2 - 0.05); g.add(p); }
  const beam = box(w + 0.04, 0.08, d + 0.04, M(0xd8cfb8)); beam.position.y = h1 + 0.04; g.add(beam);
  // Горен етаж: затворен, с много прозорци.
  const up = box(w, h2, d, wm); up.position.y = h1 + 0.08 + h2 / 2; g.add(up);
  const n = 7;
  for (let i = 0; i < n; i++) { if (i === 3) continue; const wn = windowZ(0.2, 0.32, { shutters: true }); wn.position.set(-w / 2 + 0.35 + i * (w - 0.7) / (n - 1), h1 + 0.08 + h2 * 0.5, d / 2 + 0.012); g.add(wn); }
  for (const s of [-1, 1]) for (const z of [-d * 0.25, d * 0.25]) { const wn = windowZ(0.2, 0.32); wn.rotation.y = s * Math.PI / 2; wn.position.set(s * (w / 2 + 0.012), h1 + 0.08 + h2 * 0.5, z); g.add(wn); }
  const cor = box(w + 0.1, 0.05, d + 0.1, M(0xd8cfb8)); cor.position.y = h1 + 0.08 + h2; g.add(cor);
  const top = h1 + 0.1 + h2;
  const roof = hipRoof(w + 0.6, d + 0.6, 0.6); roof.position.y = top; g.add(roof);
  const sign = box(0.9, 0.22, 0.02, signMat('УЧИЛИЩЕ')); sign.position.set(0, h1 + 0.08 + h2 * 0.5, d / 2 + 0.03); g.add(sign);
  const bellPv = new THREE.Group(); bellPv.position.set(0, top + 0.75, 0); g.add(bellPv);
  const frame = box(0.03, 0.3, 0.03, WOOD()); frame.position.set(0, top + 0.6, 0); g.add(frame);
  const sbell = new THREE.Mesh(G('sbell', () => new THREE.ConeGeometry(0.06, 0.08, 10, 1, true)), M(0xb8862b, { metal: 0.6, rough: 0.35, side: THREE.DoubleSide })); sbell.position.y = -0.06; bellPv.add(sbell);
  // Стенни табла с букви: четири на задната стена и по едно на страничните.
  const groups = [];
  for (const x of [-1.5, -0.5, 0.5, 1.5]) {
    const t = box(0.36, 0.36, 0.02, RM('letters')); t.position.set(x, h1 * 0.56, -d / 2 + 0.13); g.add(t);
    groups.push({ c: new THREE.Vector3(x, 0.06, -d / 2 + 0.2), n: new THREE.Vector3(0, 0, 1) });
  }
  for (const s of [-1, 1]) {
    const t = box(0.02, 0.36, 0.36, RM('letters')); t.position.set(s * (w / 2 - 0.13), h1 * 0.56, 0.3); g.add(t);
    groups.push({ c: new THREE.Vector3(s * (w / 2 - 0.2), 0.06, 0.3), n: new THREE.Vector3(-s, 0, 0) });
  }
  const board = box(0.02, 0.5, 0.8, RM('board')); board.position.set(w / 2 - 0.13, h1 * 0.56, -0.55); g.add(board);
  const map = box(0.02, 0.44, 0.6, RM('map')); map.position.set(-(w / 2 - 0.13), h1 * 0.6, -0.55); g.add(map);
  // Катедра с глобус и учебници (в предния десен ъгъл).
  const cat = new THREE.Group();
  const top2 = box(0.44, 0.04, 0.26, WOOD()); top2.position.y = 0.36; cat.add(top2);
  const front = box(0.44, 0.34, 0.03, RM('plank')); front.position.set(0, 0.17, -0.12); cat.add(front);
  const globe = new THREE.Group();
  const ball = sph(0.08, M(0x5d9fd0, { rough: 0.5 })); ball.position.y = 0.12; globe.add(ball);
  const land = sph(0.081, M(0x9cc27a, { rough: 0.6 })); land.scale.set(1, 1, 0.45); land.position.y = 0.12; globe.add(land);
  const st = cyl(0.01, 0.03, 0.06, M(0x6b4a2c), 8); st.position.y = 0.03; globe.add(st);
  globe.position.set(-0.12, 0.38, 0); cat.add(globe);
  const books = new THREE.Group();
  [0x2f5a8a, 0x8a2f2a, 0x3f7a3f].forEach((c, i) => { const b = box(0.13, 0.025, 0.09, M(c)); b.position.y = 0.0125 + i * 0.026; b.rotation.y = i * 0.2; books.add(b); });
  books.position.set(0.12, 0.38, 0); cat.add(books);
  cat.position.set(1.45, 0.06, 0.95); g.add(cat);
  // Чинове с пейки: три колони, два реда.
  const desks = [];
  for (let r = 0; r < 2; r++) for (const x of [-0.7, 0, 0.7]) {
    const dk = new THREE.Group();
    const tp = box(0.66, 0.03, 0.18, RM('plank', { rep: [2, 0.5] })); tp.position.y = 0.24; tp.rotation.x = 0.15; dk.add(tp);
    const fr = box(0.66, 0.22, 0.02, RM('plank', { rep: [2, 0.5] })); fr.position.set(0, 0.12, -0.08); dk.add(fr);
    const bench = box(0.66, 0.03, 0.12, WOOD()); bench.position.set(0, 0.14, 0.2); dk.add(bench);
    for (const s of [-1, 1]) { const lg = box(0.03, 0.14, 0.1, WOOD()); lg.position.set(s * 0.3, 0.07, 0.2); dk.add(lg); }
    dk.position.set(x, 0.06, 0.05 + r * 0.5);
    g.add(dk); desks.push(dk);
  }
  g.userData = { board, groups, globe, books, map, desks, sign, cat, bell: bellPv, floorY: 0.06, w, d, h1 };
  return g;
}

// Читалище: двуетажна сграда с надпис; приземният етаж е отворен отпред: библиотека, маса с вестници,
// малка сцена със завеса и пейки за слушателите.
export function chitalishte({ w = 3.0, d = 2.0, h1 = 0.95, h2 = 0.75, color = 0xe6c27a } = {}) {
  const g = new THREE.Group();
  const wm = M(color, { rough: 0.95 });
  const floor = box(w, 0.06, d, RM('plank', { rep: [4, 3] })); floor.position.y = 0.03; g.add(floor);
  const back = box(w, h1, 0.12, wm); back.position.set(0, h1 / 2, -d / 2 + 0.06); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.12, h1, d, wm); side.position.set(s * (w / 2 - 0.06), h1 / 2, 0); g.add(side); }
  for (const s of [-1, 1]) { const pl = box(0.14, 0.16, d + 0.04, STONE()); pl.position.set(s * (w / 2 - 0.06), 0.08, 0); g.add(pl); }
  for (let i = 0; i < 4; i++) { const p = cyl(0.05, 0.055, h1, WHITE(), 10); p.position.set(-w / 2 + 0.06 + i * (w - 0.12) / 3, h1 / 2, d / 2 - 0.05); g.add(p); }
  const beam = box(w + 0.04, 0.08, d + 0.04, M(0xf3efe4)); beam.position.y = h1 + 0.04; g.add(beam);
  const up = box(w, h2, d, wm); up.position.y = h1 + 0.08 + h2 / 2; g.add(up);
  for (const x of [-w * 0.36, -w * 0.2, w * 0.2, w * 0.36]) { const wn = windowZ(0.18, 0.3, { shutters: true }); wn.position.set(x, h1 + 0.08 + h2 * 0.5, d / 2 + 0.012); g.add(wn); }
  const sign = box(0.95, 0.24, 0.02, signMat('ЧИТАЛИЩЕ')); sign.position.set(0, h1 + 0.08 + h2 * 0.5, d / 2 + 0.03); g.add(sign);
  const top = h1 + 0.08 + h2;
  const cor = box(w + 0.1, 0.05, d + 0.1, M(0xf3efe4)); cor.position.y = top; g.add(cor);
  // Фронтон над входа.
  const ped = new THREE.Mesh(G(`ped${w}`, () => { const sh = new THREE.Shape([new THREE.Vector2(-w * 0.3, 0), new THREE.Vector2(w * 0.3, 0), new THREE.Vector2(0, 0.32)]); return new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }); }), M(0xf3efe4));
  ped.position.set(0, top + 0.02, d / 2 - 0.02); g.add(ped);
  const roof = hipRoof(w + 0.5, d + 0.5, 0.5); roof.position.y = top + 0.02; g.add(roof);
  // Вътре: библиотека.
  const shelf = box(0.9, 0.7, 0.16, RM('books')); shelf.position.set(-w * 0.3, 0.06 + 0.35, -d / 2 + 0.2); g.add(shelf);
  const shelf2 = box(0.16, 0.7, 0.7, RM('books')); shelf2.position.set(-(w / 2 - 0.2), 0.06 + 0.35, -d * 0.05); g.add(shelf2);
  // Маса с вестници.
  const table = new THREE.Group();
  const tt = box(0.6, 0.03, 0.34, WOOD()); tt.position.y = 0.3; table.add(tt);
  for (const [x, z] of [[-0.26, -0.13], [0.26, -0.13], [-0.26, 0.13], [0.26, 0.13]]) { const l = box(0.03, 0.3, 0.03, WOOD()); l.position.set(x, 0.15, z); table.add(l); }
  const papers = [];
  for (const [x, r] of [[-0.15, 0.2], [0.12, -0.15]]) { const p = box(0.18, 0.006, 0.24, M(0xf1ece0)); p.position.set(x, 0.32, 0); p.rotation.y = r; table.add(p); papers.push(p); const ln = box(0.14, 0.007, 0.02, M(0x333333)); ln.position.set(x, 0.322, -0.08); ln.rotation.y = r; table.add(ln); }
  table.position.set(-w * 0.22, 0.06, d * 0.15); g.add(table);
  // Сцена със завеса.
  const stg = new THREE.Group();
  const plat = box(1.0, 0.14, 0.62, RM('plank', { rep: [2, 1] })); plat.position.y = 0.07; stg.add(plat);
  const curtains = [];
  for (const s of [-1, 1]) { const c = box(0.5, 0.7, 0.03, M(0x8a1f2a)); c.position.set(s * 0.25, 0.14 + 0.35, 0.28); stg.add(c); curtains.push(c); }
  const val = box(1.06, 0.1, 0.05, M(0x6a1720)); val.position.set(0, 0.88, 0.28); stg.add(val);
  stg.position.set(w * 0.24, 0.06, -d / 2 + 0.45); g.add(stg);
  const benches = [];
  for (let i = 0; i < 2; i++) { const b = box(0.9, 0.04, 0.12, WOOD()); b.position.set(w * 0.24, 0.2, d * 0.08 + i * 0.36); g.add(b); for (const s of [-1, 1]) { const l = box(0.04, 0.14, 0.1, WOOD()); l.position.set(w * 0.24 + s * 0.4, 0.13, d * 0.08 + i * 0.36); g.add(l); } benches.push(b); }
  // Светлина на лампа (пали се вечер).
  const lamp = sph(0.04, new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb040, emissiveIntensity: 0.15 }));
  lamp.position.set(-w * 0.22, h1 * 0.8, d * 0.15); g.add(lamp);
  g.userData = { stage: stg, curtains, table, papers, shelf, benches, lamp, floorY: 0.06, w, d };
  return g;
}

// ---------- природа ----------
export function pine(s = 1) {
  const g = new THREE.Group();
  const t = cyl(0.04 * s, 0.06 * s, 0.3 * s, M(0x5b3f28), 6); t.position.y = 0.15 * s; g.add(t);
  [[0.34, 0.5, 0.42], [0.27, 0.42, 0.68], [0.18, 0.34, 0.9]].forEach(([r, h, y]) => { const c = new THREE.Mesh(G(`pc${r}`, () => new THREE.ConeGeometry(r, h, 8)), M(0x2f5e36, { flat: true })); c.scale.setScalar(s); c.position.y = y * s; g.add(c); });
  return g;
}
export function leafTree(s = 1, color = 0x5e8f3a) {
  const g = new THREE.Group();
  const t = cyl(0.04 * s, 0.06 * s, 0.45 * s, M(0x6b4a2c), 6); t.position.y = 0.22 * s; g.add(t);
  for (const [x, y, z, r] of [[0, 0.62, 0, 0.3], [0.15, 0.55, 0.08, 0.2], [-0.14, 0.58, -0.06, 0.22]]) { const c = new THREE.Mesh(G(`lt${r}`, () => new THREE.IcosahedronGeometry(r, 1)), M(color, { flat: true })); c.scale.setScalar(s); c.position.set(x * s, y * s, z * s); g.add(c); }
  return g;
}
// Зелен хълм с гора (Средна гора около града).
export function forestHill({ rx = 4, rz = 2.5, h = 1.6, trees = 14, seed = 3 } = {}) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(G('hill', () => new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), RM('grass', { rep: [6, 3] }));
  m.scale.set(rx, h, rz); g.add(m);
  const r = rnd(seed * 97 + 1);
  for (let i = 0; i < trees; i++) {
    const a = r() * Math.PI * 2, k = 0.25 + r() * 0.6;
    const x = Math.cos(a) * rx * k, z = Math.sin(a) * rz * k;
    const y = h * Math.sqrt(Math.max(0, 1 - k * k));
    const t = r() > 0.4 ? pine(0.9 + r() * 0.6) : leafTree(0.9 + r() * 0.5, r() > 0.5 ? 0x5e8f3a : 0x6f9a44);
    t.position.set(x, y - 0.05, z); g.add(t);
  }
  return g;
}

// ---------- хора ----------
// kind: 'man' (потури, аба, червен пояс, калпак), 'woman' (сукман, бяла риза, престилка, кърпа),
// 'gent' (европейски сюртук и фес), 'lady' (европейска рокля), 'priest' (расо и калимавка),
// 'shepherd' (кожух и гега), 'boy', 'girl' (деца), 'helper' (по-голям ученик с показалка).
const SKIN = 0xe0b58f;
export function folkPerson(kind = 'man', { scale = 1, color } = {}) {
  const g = new THREE.Group();
  const child = kind === 'boy' || kind === 'girl' || kind === 'helper';
  const female = kind === 'woman' || kind === 'lady' || kind === 'girl';
  const P = {
    man: { top: 0x2a3550, legs: 0x3a2a1e, sash: 0xb0302a, hat: 0x1e1a18 },
    shepherd: { top: 0xf0e8d6, legs: 0xe8e0cc, sash: 0xb0302a, hat: 0x1e1a18 },
    boy: { top: color ?? 0xf2ede0, legs: 0x5a4030, sash: 0xb0302a, hat: 0x3a2a1e },
    helper: { top: color ?? 0x2f5a8a, legs: 0x3a2a1e, sash: 0xc49a3a, hat: null },
    gent: { top: 0x1e1e24, legs: 0x5a5a62, sash: null, hat: 0xb0222a },
    priest: { top: 0x15151a, legs: 0x15151a, sash: null, hat: 0x15151a },
    woman: { top: 0xf3efe4, skirt: color ?? 0x1e2440, apron: 0xb0302a, scarf: 0x7a2a2a },
    girl: { top: 0xf3efe4, skirt: color ?? 0x8a2f4a, apron: 0xe0b040, scarf: null },
    lady: { top: color ?? 0x6a5a8a, skirt: color ?? 0x6a5a8a, apron: null, scarf: null },
  }[kind] || {};
  const sk = M(SKIN);
  const arms = [];
  if (female) {
    const skirtR = kind === 'lady' ? 0.2 : 0.15;
    const skirt = cyl(0.08, skirtR, 0.36, M(P.skirt), 12); skirt.position.y = 0.18; g.add(skirt);
    const bod = cyl(0.075, 0.085, 0.16, M(kind === 'lady' ? P.top : P.skirt), 10); bod.position.y = 0.43; g.add(bod);
    if (kind !== 'lady') { const sh = cyl(0.07, 0.075, 0.06, M(P.top), 10); sh.position.y = 0.49; g.add(sh); }
    if (P.apron) { const ap = box(0.13, 0.26, 0.01, M(P.apron)); ap.position.set(0, 0.2, 0.14); ap.rotation.x = -0.12; g.add(ap); const st = box(0.13, 0.02, 0.012, M(0xe0b040)); st.position.set(0, 0.1, 0.152); st.rotation.x = -0.12; g.add(st); }
  } else {
    const long = kind === 'priest';
    if (long) { const robe = cyl(0.09, 0.14, 0.52, M(P.top), 12); robe.position.y = 0.26; g.add(robe); }
    else {
      for (const s of [-1, 1]) { const l = cyl(0.035, kind === 'gent' ? 0.035 : 0.03, 0.24, M(P.legs), 8); l.position.set(s * 0.045, 0.12, 0); g.add(l); }
      // Потурите са широки на бедрата.
      if (kind !== 'gent') { const hips = cyl(0.09, 0.07, 0.1, M(P.legs), 10); hips.position.y = 0.27; g.add(hips); }
      const coatLen = kind === 'gent' ? 0.3 : 0.22;
      const coat = cyl(0.075, kind === 'gent' ? 0.1 : 0.09, coatLen, M(P.top), 10); coat.position.y = 0.52 - coatLen / 2; g.add(coat);
      if (kind === 'gent') { const sh = box(0.05, 0.08, 0.01, M(0xf5f2ea)); sh.position.set(0, 0.47, 0.075); g.add(sh); }
      if (kind === 'man' || kind === 'boy') { const shirt = box(0.05, 0.14, 0.01, M(0xf2ede0)); shirt.position.set(0, 0.42, 0.08); g.add(shirt); }
    }
    if (P.sash) { const s = cyl(0.085, 0.085, 0.045, M(P.sash), 10); s.position.y = 0.33; g.add(s); }
  }
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * 0.1, 0.5, 0);
    const a = cyl(0.025, 0.022, 0.2, M(female ? P.top : P.top), 6); a.position.y = -0.1; pv.add(a);
    const h = sph(0.022, sk); h.position.y = -0.21; pv.add(h);
    pv.rotation.z = s * 0.12; g.add(pv); arms.push(pv);
  }
  const head = sph(0.075, sk); head.position.y = 0.6; g.add(head);
  if (kind === 'man' || kind === 'shepherd') { const hat = cyl(0.07, 0.075, 0.1, M(P.hat), 10); hat.position.y = 0.68; g.add(hat); const mus = box(0.06, 0.012, 0.01, M(0x2a1e14)); mus.position.set(0, 0.58, 0.072); g.add(mus); }
  if (kind === 'boy') { const hat = cyl(0.06, 0.07, 0.06, M(P.hat), 10); hat.position.y = 0.66; g.add(hat); }
  if (kind === 'gent') { const fez = cyl(0.05, 0.065, 0.08, M(P.hat), 10); fez.position.y = 0.68; g.add(fez); const ts = box(0.01, 0.06, 0.01, M(0x111111)); ts.position.set(0.05, 0.69, 0); g.add(ts); const mus = box(0.06, 0.012, 0.01, M(0x2a1e14)); mus.position.set(0, 0.58, 0.072); g.add(mus); }
  if (kind === 'priest') { const kal = cyl(0.085, 0.07, 0.1, M(P.hat), 10); kal.position.y = 0.69; g.add(kal); const beard = new THREE.Mesh(G('beard', () => new THREE.ConeGeometry(0.05, 0.12, 8)), M(0x6a6a6a)); beard.rotation.x = Math.PI; beard.position.set(0, 0.52, 0.04); g.add(beard); }
  if (kind === 'woman') { const sc = sph(0.08, M(P.scarf)); sc.scale.set(1, 0.85, 1); sc.position.set(0, 0.63, -0.012); g.add(sc); }
  if (kind === 'girl' || kind === 'lady') { const hair = sph(0.078, M(0x3a2414)); hair.scale.set(1, 0.9, 1); hair.position.set(0, 0.62, -0.015); g.add(hair); const bun = sph(0.035, M(0x3a2414)); bun.position.set(0, 0.64, -0.08); g.add(bun); }
  if (kind === 'helper') { const hair = sph(0.077, M(0x3a2414)); hair.scale.set(1, 0.6, 1); hair.position.set(0, 0.64, -0.01); g.add(hair); const ptr = cyl(0.006, 0.006, 0.34, WOOD(), 5); ptr.position.set(0, -0.05, 0.1); ptr.rotation.x = 1.0; arms[1].add(ptr); }
  if (kind === 'shepherd') { const crook = cyl(0.008, 0.008, 0.7, WOOD(), 5); crook.position.set(0.14, 0.35, 0.04); g.add(crook); }
  g.scale.setScalar(scale * (child ? (kind === 'helper' ? 0.78 : 0.66) : 0.85));
  g.userData.kind = kind;
  g.userData.arms = arms;
  return g;
}

// Слива неподвижните части на модел в по-малко на брой мрежи (по една за материал), за да върви
// и на слаб компютър. Обектите в skip (и всичко под тях) остават отделни — те се движат или се кликат.
export function mergeStatic(root, skip = []) {
  const skipSet = new Set(skip);
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMat = new Map();
  const victims = [];
  const visit = (o) => {
    if (skipSet.has(o)) return;
    if (o.isMesh && o.visible && !Array.isArray(o.material) && !o.userData.isHitBox) {
      const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      if (!byMat.has(o.material)) byMat.set(o.material, []);
      byMat.get(o.material).push({ geo: o.geometry, rel });
      victims.push(o);
    }
    for (const c of o.children) visit(c);
  };
  for (const c of root.children) visit(c);
  for (const o of victims) o.parent.remove(o);
  for (const [material, list] of byMat) {
    const pos = [], nor = [], uv = [];
    for (const { geo, rel } of list) {
      const g = (geo.index ? geo.toNonIndexed() : geo.clone()).applyMatrix4(rel);
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        pos.push(p.getX(i), p.getY(i), p.getZ(i));
        if (n) nor.push(n.getX(i), n.getY(i), n.getZ(i)); else nor.push(0, 1, 0);
        if (u) uv.push(u.getX(i), u.getY(i)); else uv.push(0, 0);
      }
      g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    root.add(new THREE.Mesh(geo, material));
  }
  return root;
}
