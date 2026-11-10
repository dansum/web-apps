// Градски модели през епохите (за „Пловдив през вековете“ и подобни разходки във времето):
// тракийска къща, римски дом с мозайка, римски стадион, джамия с девет купола и минаре,
// къща в махалата, градска къща в европейски стил, развалини, днешни хора, фенери, пейки, табели.
// Нисък полигон, кеширани геометрии и материали; неподвижните части се сливат с mergeStatic.
import { THREE } from '../../kit.js';
import { M, column, gableRoof } from './architecture.js';
import { hipRoof } from './revival.js';
import { bakeColors } from './industrial.js';

// ---------- текстури ----------
const cache = new Map();
function tex(key, w, h, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (cache.has(k)) return cache.get(k);
  let base = cache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 4;
    cache.set(key, base);
  }
  if (rep[0] === 1 && rep[1] === 1) return base;
  const t = base.clone(); t.needsUpdate = true; t.repeat.set(...rep); cache.set(k, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const DRAW = {
  // Редове дялан камък, разделени с по три реда тухли (като в Джумая джамия).
  stoneBrick(ctx, w, h) {
    const r = rnd(7);
    ctx.fillStyle = '#d6c7a6'; ctx.fillRect(0, 0, w, h);
    const band = h / 3;
    for (let b = 0; b < 3; b++) {
      const y0 = b * band;
      for (let x = 0; x < w; x += w / 3) { const v = (r() - 0.5) * 26; ctx.fillStyle = `rgb(${210 + v},${196 + v},${166 + v})`; ctx.fillRect(x + 2, y0 + 2, w / 3 - 4, band * 0.66 - 3); }
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#a24f36' : '#b65e40'; ctx.fillRect(0, y0 + band * 0.68 + k * band * 0.1, w, band * 0.08); }
    }
  },
  // Варосана стена (мазилка) с леки петна.
  plaster(ctx, w, h) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const r = rnd(41); for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(120,110,90,${r() * 0.06})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 2 + r() * 8, 0, 7); ctx.fill(); }
  },
  // Плет, измазан с глина.
  wattle(ctx, w, h) {
    ctx.fillStyle = '#b89a6c'; ctx.fillRect(0, 0, w, h);
    const r = rnd(13);
    for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '90,65,40' : '225,205,165'},${0.1 + r() * 0.15})`; ctx.fillRect(r() * w, r() * h, 4 + r() * 8, 2 + r() * 3); }
    ctx.strokeStyle = 'rgba(80,55,30,0.35)'; ctx.lineWidth = 3;
    for (let y = 10; y < h; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x / 8) * 3); ctx.stroke(); }
  },
  // Слама за покрив.
  thatch(ctx, w, h) {
    ctx.fillStyle = '#c9a75e'; ctx.fillRect(0, 0, w, h);
    const r = rnd(19); ctx.lineWidth = 2;
    for (let i = 0; i < 500; i++) { const x = r() * w, y = r() * h; ctx.strokeStyle = `rgba(${r() > 0.5 ? '120,90,40' : '240,215,140'},${0.25 + r() * 0.3})`; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 4, y + 12 + r() * 10); ctx.stroke(); }
    ctx.fillStyle = 'rgba(90,65,30,0.35)'; for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 3);
  },
  // Мозайка: рамка с плетеница и шарка с ромбове и кръгове (по римски подове от Пловдив — обобщено).
  mosaic(ctx, w, h) {
    ctx.fillStyle = '#efe6d2'; ctx.fillRect(0, 0, w, h);
    const t = 6;
    for (let y = 0; y < h; y += t) for (let x = 0; x < w; x += t) { const v = ((x * 7 + y * 13) % 11) - 5; ctx.fillStyle = `rgb(${236 + v},${226 + v},${206 + v})`; ctx.fillRect(x, y, t - 1, t - 1); }
    ctx.strokeStyle = '#7a2f22'; ctx.lineWidth = 10; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.strokeStyle = '#2f4f6a'; ctx.lineWidth = 5;
    for (let x = 30; x < w - 20; x += 22) { ctx.beginPath(); ctx.arc(x, 30, 8, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(x, h - 30, 8, Math.PI, 0); ctx.stroke(); }
    const c = w / 2;
    for (const [rr, col] of [[70, '#2f4f6a'], [52, '#c7923a'], [34, '#7a2f22']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(c, c - rr); ctx.lineTo(c + rr, c); ctx.lineTo(c, c + rr); ctx.lineTo(c - rr, c); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.arc(c, c, 16, 0, 7); ctx.fill();
    for (const [x, y] of [[60, 60], [w - 60, 60], [60, h - 60], [w - 60, h - 60]]) { ctx.fillStyle = '#3f6f4f'; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#c7923a'; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); }
  },
  // Плочки за днешна пешеходна улица.
  paving(ctx, w, h) {
    ctx.fillStyle = '#cfc6b6'; ctx.fillRect(0, 0, w, h);
    const r = rnd(3);
    for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64) { const v = (r() - 0.5) * 24; ctx.fillStyle = `rgb(${205 + v},${197 + v},${183 + v})`; ctx.fillRect(x + ((y / 32) % 2) * 32 + 1, y + 1, 62, 30); }
  },
  // Утъпкана пръст за път.
  dirt(ctx, w, h) {
    ctx.fillStyle = '#b79c72'; ctx.fillRect(0, 0, w, h);
    const r = rnd(29); for (let i = 0; i < 600; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '90,70,45' : '230,210,170'},${0.1 + r() * 0.15})`; ctx.fillRect(r() * w, r() * h, 3, 3); }
  },
  // Слоеве в разреза: пръст с камъчета.
  soil(ctx, w, h) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    const r = rnd(37); for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '60,45,30' : '255,250,235'},${0.12 + r() * 0.2})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 2 + r() * 5, 1.5 + r() * 3, r() * 3, 0, 7); ctx.fill(); }
  },
};
const MATS = new Map();
export function CM(name, { color = 0xffffff, rep = [1, 1], rough = 0.85, side } = {}) {
  const k = `${name}|${color}|${rep}|${rough}|${side}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, side: side ?? THREE.FrontSide, map: tex(name, 256, 256, DRAW[name], rep) }));
  return MATS.get(k);
}
// Плътен цвят: еднаквите цветове делят един материал (така mergeStatic ги слива).
const COL = new Map();
export function col(color, { rough = 0.8, metal = 0, side } = {}) {
  const k = `${color}|${rough}|${metal}|${side}`;
  if (!COL.has(k)) COL.set(k, new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side: side ?? THREE.FrontSide }));
  return COL.get(k);
}
const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 10) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m, ws = 12, hs = 8, tl = Math.PI) => new THREE.Mesh(G(`s${r},${ws},${hs},${tl}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, tl)), m);
const STONE = (rep = [1, 1]) => M(0xffffff, { tex: 'stone', rep });
const WOOD = () => col(0x6b4a2c);
const DARK = () => col(0x2b2622);

// Прозорец с рамка върху стена (гледа по +z).
function win(g, x, y, z, { w = 0.16, h = 0.24, frame = 0xf3efe4, glass = 0x2f3f4a, pedi = false, arch = false } = {}) {
  const fr = box(w + 0.04, h + 0.04, 0.02, col(frame)); fr.position.set(x, y, z); g.add(fr);
  const gl = box(w, h, 0.025, col(glass, { rough: 0.3 })); gl.position.set(x, y, z + 0.004); g.add(gl);
  const bar = box(0.012, h, 0.03, col(frame)); bar.position.set(x, y, z + 0.006); g.add(bar);
  const sill = box(w + 0.08, 0.025, 0.06, col(0xe6dccb)); sill.position.set(x, y - h / 2 - 0.03, z + 0.02); g.add(sill);
  if (pedi) {
    const tri = new THREE.Mesh(G(`ped${w}`, () => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-w / 2 - 0.05, 0), new THREE.Vector2(w / 2 + 0.05, 0), new THREE.Vector2(0, 0.07)]), { depth: 0.04, bevelEnabled: false })), col(0xe6dccb));
    tri.position.set(x, y + h / 2 + 0.03, z); g.add(tri);
  }
  if (arch) { const a = new THREE.Mesh(G(`warc${w}`, () => new THREE.CircleGeometry(w / 2 + 0.02, 12, 0, Math.PI)), col(frame)); a.position.set(x, y + h / 2 + 0.02, z + 0.003); g.add(a); }
}

// ---------- тракийска къща ----------
// Стени от плет, измазан с глина, сламен покрив, огнище с дим отпред, ограда от колове.
export function thracianHouse({ w = 1.3, d = 0.95, h = 0.5 } = {}) {
  const g = new THREE.Group();
  const walls = box(w, h, d, CM('wattle', { rep: [2, 1] })); walls.position.y = h / 2; g.add(walls);
  const roof = gableRoof(w + 0.2, d + 0.3, 0.55, { color: 0xffffff });
  roof.traverse((o) => { if (o.isMesh) o.material = CM('thatch', { rep: [2, 1], side: THREE.DoubleSide }); });
  roof.position.y = h; g.add(roof);
  const gab = new THREE.Mesh(G(`tgab${d}`, () => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, 0.52)]), { depth: w - 0.02, bevelEnabled: false })), CM('wattle'));
  gab.rotation.y = Math.PI / 2; gab.position.set(-(w - 0.02) / 2, h, 0); g.add(gab);
  const door = box(0.2, 0.36, 0.02, WOOD()); door.position.set(-w * 0.2, 0.18, d / 2 + 0.01); g.add(door);
  const hole = box(0.12, 0.08, 0.02, DARK()); hole.position.set(w * 0.25, 0.32, d / 2 + 0.01); g.add(hole);
  // Ограда от колове около двора.
  const stake = col(0x7a5a3a);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; if (a > 1.1 && a < 2.0) continue; const p = cyl(0.02, 0.025, 0.32, stake, 5); p.position.set(Math.cos(a) * (w * 0.95), 0.16, Math.sin(a) * (d * 1.2) + 0.15); g.add(p); }
  // Огнище, глинен съд, дърва.
  const hearth = cyl(0.13, 0.15, 0.06, STONE([0.4, 0.2]), 10); hearth.position.set(w * 0.25, 0.03, d / 2 + 0.45); g.add(hearth);
  const pot = cyl(0.07, 0.05, 0.12, col(0x9a5a34), 10); pot.position.set(-w * 0.45, 0.06, d / 2 + 0.35); g.add(pot);
  const fire = new THREE.Mesh(G('tfire', () => new THREE.ConeGeometry(0.06, 0.16, 7)), new THREE.MeshBasicMaterial({ color: 0xff9a3a }));
  fire.position.set(w * 0.25, 0.14, d / 2 + 0.45); g.add(fire);
  g.userData.fire = fire;
  g.userData.smoke = new THREE.Vector3(w * 0.25, 0.3, d / 2 + 0.45);
  return g;
}

// ---------- римски дом ----------
// Стаи около двор с колонада (перистил); в средата басейн за дъждовна вода; подът е мозайка.
// Лицето (входът) гледа по +z. Покривът е с керемиди и се спуска към двора.
export function romanDomus({ w = 2.2, d = 1.9, h = 0.55 } = {}) {
  const g = new THREE.Group();
  const wallM = M(0xffffff, { tex: 'brick', rep: [2, 1] });
  const plasterM = CM('plaster', { color: 0xe9d9b8 });
  const t = 0.42; // дълбочина на стаите
  // Четири крила със стаи.
  const wings = [[0, -(d - t) / 2, w, t], [0, (d - t) / 2, w, t], [-(w - t) / 2, 0, t, d - 2 * t], [(w - t) / 2, 0, t, d - 2 * t]];
  for (const [x, z, ww, dd] of wings) {
    const b = box(ww, h, dd, plasterM); b.position.set(x, h / 2, z); g.add(b);
    const s = box(ww + 0.02, 0.1, dd + 0.02, wallM); s.position.set(x, 0.05, z); g.add(s); // цокъл от тухли и камък
  }
  // Покриви на крилата: наклон навътре към двора.
  const tileM = M(0xffffff, { tex: 'tiles', rep: [3, 1], side: THREE.DoubleSide });
  for (const [x, z, ww, dd, rot] of [[0, -(d - t) / 2, w + 0.1, t + 0.14, 0], [0, (d - t) / 2, w + 0.1, t + 0.14, Math.PI], [-(w - t) / 2, 0, d - 2 * t, t + 0.14, Math.PI / 2], [(w - t) / 2, 0, d - 2 * t, t + 0.14, -Math.PI / 2]]) {
    const r = new THREE.Group(); r.position.set(x, h + 0.08, z); r.rotation.y = rot;
    const p = box(ww, 0.03, dd, tileM); p.rotation.x = 0.28; r.add(p);
    g.add(r);
  }
  // Двор: мозаечен под, басейн (имплувиум), колонада.
  const iw = w - 2 * t, id = d - 2 * t;
  const floor = box(iw, 0.02, id, CM('mosaic', { rough: 0.6 })); floor.position.y = 0.012; g.add(floor);
  const pool = box(iw * 0.32, 0.03, id * 0.32, col(0x6fb2d8, { rough: 0.2 })); pool.position.y = 0.025; g.add(pool);
  const rim = box(iw * 0.36, 0.025, id * 0.36, M(0xece5d6, { tex: 'marble' })); rim.position.y = 0.014; g.add(rim);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const c = column('doric', { h: h * 0.82, r: 0.03 }); c.position.set(sx * (iw / 2 - 0.08), 0, sz * (id / 2 - 0.08)); g.add(c);
  }
  // Вход с врата, прозорчета високо.
  const door = box(0.22, 0.36, 0.02, col(0x5a3d22)); door.position.set(0, 0.18, d / 2 + 0.011); g.add(door);
  for (const x of [-w * 0.32, w * 0.32]) { const wn = box(0.1, 0.07, 0.02, DARK()); wn.position.set(x, h * 0.78, d / 2 + 0.011); g.add(wn); }
  // Червена ивица мазилка (римските стени често са рисувани).
  for (const [x, z, ww, dd] of [[0, d / 2, w + 0.01, 0.01], [0, -d / 2, w + 0.01, 0.01], [w / 2, 0, 0.01, d], [-w / 2, 0, 0.01, d]]) { const strip = box(ww, 0.05, dd, col(0x9a3a2a)); strip.position.set(x, 0.13, z); g.add(strip); }
  g.userData.mosaic = floor;
  g.userData.pool = pool;
  return g;
}

// ---------- римски стадион ----------
// Подковообразен: седалки от двете дълги страни и закръглен северен край (сфендона) към −z.
// Пистата е с пясък. Мерки: дълга права част L (от z=0 до z=L), ширина на пистата a, дълбочина на седалките D.
function seatProfile(r0, D, rows, top) {
  const pts = [[r0, 0], [r0, 0.12]];
  const s = D / rows, rh = (top - 0.12) / rows;
  for (let i = 0; i < rows; i++) { const y = 0.12 + (i + 1) * rh; pts.push([r0 + i * s, y], [r0 + (i + 1) * s, y]); }
  pts.push([r0 + D, 0]);
  return pts;
}
export function stadium({ L = 12, a = 1.8, D = 0.85, rows = 8, top = 0.62 } = {}) {
  const g = new THREE.Group();
  const seatM = M(0xeee6d3, { tex: 'marble', rep: [0.6, 0.6], side: THREE.DoubleSide });
  const prof = seatProfile(a / 2, D, rows, top);
  // Права част: профилът се изтегля по z.
  // Двете страни се строят поотделно (огледалната с обърнат ред на точките), за да са правилни нормалите.
  for (const s of [-1, 1]) {
    const geo = G(`stside${L},${a},${D},${rows},${top},${s}`, () => {
      const pts = prof.map(([x, y]) => new THREE.Vector2(s * x, y));
      if (s < 0) pts.reverse();
      return new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: L, bevelEnabled: false });
    });
    g.add(new THREE.Mesh(geo, seatM));
  }
  // Сфендона: същият профил, завъртян около оста.
  const curve = new THREE.Mesh(G(`stcurve${a},${D},${rows},${top}`, () => new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 28, Math.PI / 2, Math.PI)), seatM);
  g.add(curve);
  // Пистата.
  const arena = box(a, 0.02, L + a / 2, M(0xffffff, { tex: 'sand', rep: [1, 6] })); arena.position.set(0, 0.01, L / 2 - a / 4); g.add(arena);
  // Стълбища през седалките.
  const stairM = col(0xcfc6b2);
  for (let k = 1; k < 5; k++) for (const s of [-1, 1]) {
    const st = box(D * 1.05, 0.02, 0.06, stairM); st.position.set(s * (a / 2 + D / 2), top / 2 + 0.04, (k * L) / 5); st.rotation.z = -s * Math.atan2(top - 0.12, D); g.add(st);
  }
  // Стена-ограда (подиум) пред първия ред.
  for (const s of [-1, 1]) { const p = box(0.03, 0.14, L, M(0xffffff, { tex: 'limestone', rep: [4, 1] })); p.position.set(s * (a / 2 - 0.015), 0.07, L / 2); g.add(p); }
  g.userData = { L, a, D, top };
  return g;
}
// Профилът на седалките за разреза: и двете страни, в равнината x-y (за плочата отпред).
export function stadiumSection({ a = 1.8, D = 0.85, rows = 8, top = 0.62, depth = 0.04 } = {}) {
  const g = new THREE.Group();
  const prof = seatProfile(a / 2, D, rows, top);
  const m = M(0xeee6d3, { tex: 'marble', rep: [2, 2], side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const geo = G(`stsec${a},${D},${rows},${top},${depth},${s}`, () => { const pts = prof.map(([x, y]) => new THREE.Vector2(s * x, y)); if (s < 0) pts.reverse(); return new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth, bevelEnabled: false }); });
    g.add(new THREE.Mesh(geo, m));
  }
  const ar = box(a, 0.03, depth, M(0xffffff, { tex: 'sand' })); ar.position.set(0, 0.015, depth / 2); g.add(ar);
  return g;
}

// ---------- джамия с девет купола ----------
// Квадратна молитвена зала, покрита с 3×3 купола; стени от камък и тухли; минаре с балкон.
// Входът гледа по +z, минарето е в предния десен ъгъл.
export function mosque({ s = 2.3, h = 0.95 } = {}) {
  const g = new THREE.Group();
  const wallM = CM('stoneBrick', { rep: [2, 1] });
  const hall = box(s, h, s, wallM); hall.position.y = h / 2; g.add(hall);
  const corn = box(s + 0.06, 0.06, s + 0.06, M(0xece5d6, { tex: 'limestone' })); corn.position.y = h + 0.03; g.add(corn);
  const lead = col(0x8d969c, { rough: 0.45, metal: 0.3 });
  const drumM = CM('stoneBrick', { rep: [1, 0.3] });
  const cell = s / 3;
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) {
    const x = -s / 2 + cell * (i + 0.5), z = -s / 2 + cell * (k + 0.5);
    const drum = cyl(cell * 0.4, cell * 0.42, 0.1, drumM, 12); drum.position.set(x, h + 0.11, z); g.add(drum);
    const dome = sph(cell * 0.4, lead, 14, 8, Math.PI / 2); dome.position.set(x, h + 0.16, z); g.add(dome);
    const fin = cyl(0.008, 0.008, 0.08, col(0xd4af37, { metal: 0.6, rough: 0.3 }), 5); fin.position.set(x, h + 0.16 + cell * 0.4 + 0.03, z); g.add(fin);
  }
  // Прозорци на два реда, с арки.
  for (const side of [0, 1, 2, 3]) {
    const pg = new THREE.Group(); pg.rotation.y = side * Math.PI / 2; g.add(pg);
    for (const x of [-s / 3, 0, s / 3]) {
      if (side === 0 && x === 0) continue;
      win(pg, x, h * 0.32, s / 2 + 0.005, { w: 0.14, h: 0.2, frame: 0xd8cdb4, glass: 0x34404a });
      win(pg, x, h * 0.72, s / 2 + 0.005, { w: 0.1, h: 0.14, frame: 0xd8cdb4, glass: 0x34404a, arch: true });
    }
  }
  // Портал.
  const portal = box(0.5, 0.62, 0.08, M(0xece5d6, { tex: 'limestone' })); portal.position.set(0, 0.31, s / 2 + 0.03); g.add(portal);
  const door = box(0.28, 0.42, 0.02, col(0x5a3d22)); door.position.set(0, 0.21, s / 2 + 0.075); g.add(door);
  const ar = new THREE.Mesh(G('mqarc', () => new THREE.CircleGeometry(0.14, 14, 0, Math.PI)), col(0x5a3d22)); ar.position.set(0, 0.42, s / 2 + 0.076); g.add(ar);
  // Минаре: стъпала, многостенно тяло с шарка от тухли, балкон, тесен връх и конус.
  const mx = s / 2 + 0.22, mz = s / 2 - 0.25;
  const mb = box(0.42, 0.5, 0.42, STONE([0.5, 0.5])); mb.position.set(mx, 0.25, mz); g.add(mb);
  const body = cyl(0.15, 0.17, 2.3, CM('stoneBrick', { rep: [2, 6] }), 12); body.position.set(mx, 0.5 + 1.15, mz); g.add(body);
  const bal = cyl(0.25, 0.2, 0.08, M(0xece5d6, { tex: 'limestone' }), 14); bal.position.set(mx, 2.55, mz); g.add(bal);
  const rail = cyl(0.25, 0.25, 0.1, col(0xd8cdb4, { side: THREE.DoubleSide }), 14); rail.geometry = G('mqrail', () => new THREE.CylinderGeometry(0.25, 0.25, 0.1, 14, 1, true)); rail.position.set(mx, 2.64, mz); g.add(rail);
  const up = cyl(0.12, 0.13, 0.5, CM('stoneBrick', { rep: [1, 1.2] }), 12); up.position.set(mx, 2.85, mz); g.add(up);
  const cone = new THREE.Mesh(G('mqcone', () => new THREE.ConeGeometry(0.14, 0.55, 12)), lead); cone.position.set(mx, 3.37, mz); g.add(cone);
  const cres = new THREE.Mesh(G('mqcres', () => new THREE.TorusGeometry(0.035, 0.008, 5, 12, Math.PI * 1.4)), col(0xd4af37, { metal: 0.6, rough: 0.3 }));
  cres.position.set(mx, 3.72, mz); cres.rotation.z = Math.PI * 0.8; g.add(cres);
  g.userData.top = 3.75;
  g.userData.minaret = new THREE.Vector3(mx, 2.6, mz);
  return g;
}

// ---------- къща в махалата ----------
// Каменен приземен етаж, измазан горен етаж с дървени капаци, покрив на четири води, висок зид с порта.
export function mahalaHouse({ w = 1.4, d = 1.1, color = 0xf1ece0 } = {}) {
  const g = new THREE.Group();
  const h1 = 0.5, h2 = 0.5;
  const base = box(w, h1, d, STONE([1.5, 0.7])); base.position.y = h1 / 2; g.add(base);
  const up = box(w + 0.08, h2, d + 0.14, CM('plaster', { color })); up.position.set(0, h1 + h2 / 2, 0.05); g.add(up);
  const beam = box(w + 0.12, 0.04, d + 0.18, WOOD()); beam.position.set(0, h1 + 0.02, 0.05); g.add(beam);
  for (const x of [-w * 0.3, 0, w * 0.3]) {
    const wn = box(0.14, 0.2, 0.02, DARK()); wn.position.set(x, h1 + h2 * 0.5, d / 2 + 0.13); g.add(wn);
    for (const s of [-1, 1]) { const sh = box(0.07, 0.22, 0.015, col(0x6a4a2a)); sh.position.set(x + s * 0.11, h1 + h2 * 0.5, d / 2 + 0.135); g.add(sh); }
  }
  const lat = box(0.18, 0.12, 0.02, col(0x7a5a3a)); lat.position.set(w * 0.3, 0.32, d / 2 + 0.01); g.add(lat);
  const door = box(0.22, 0.34, 0.02, col(0x5a3d22)); door.position.set(-w * 0.25, 0.17, d / 2 + 0.01); g.add(door);
  const roof = hipRoof(w + 0.4, d + 0.5, 0.36); roof.position.set(0, h1 + h2, 0.05); g.add(roof);
  const chim = box(0.1, 0.26, 0.1, STONE([0.3, 0.5])); chim.position.set(w * 0.25, h1 + h2 + 0.28, -d * 0.1); g.add(chim);
  g.userData.chimney = new THREE.Vector3(w * 0.25, h1 + h2 + 0.45, -d * 0.1);
  return g;
}

// ---------- градска къща в европейски стил ----------
// Два или три етажа, мазилка, корниз, прозорци с фронтончета, балкон с железен парапет, магазин долу.
export function europeanHouse({ w = 1.8, d = 1.2, floors = 2, color = 0xe8c98a, trim = 0xf6f0e2, shop = true, fresh = false } = {}) {
  const g = new THREE.Group();
  const fh = 0.62;
  const H = floors * fh + 0.1;
  const body = box(w, H, d, CM('plaster', { color })); body.position.y = H / 2; g.add(body);
  const plinth = box(w + 0.02, 0.12, d + 0.02, M(0xffffff, { tex: 'limestone', rep: [2, 0.3] })); plinth.position.y = 0.06; g.add(plinth);
  const tr = col(trim);
  // Корнизи между етажите и под покрива.
  for (let f = 1; f <= floors; f++) { const c = box(w + 0.06, f === floors ? 0.08 : 0.04, d + 0.06, tr); c.position.y = f * fh + 0.1 - (f === floors ? 0 : 0.02); g.add(c); }
  // Пиластри по ъглите.
  for (const s of [-1, 1]) { const p = box(0.08, H, 0.03, tr); p.position.set(s * (w / 2 - 0.04), H / 2, d / 2 + 0.012); g.add(p); }
  const n = Math.max(2, Math.round(w / 0.45));
  const xs = Array.from({ length: n }, (_, i) => -w / 2 + 0.25 + i * (w - 0.5) / (n - 1));
  // Приземен етаж: магазин с витрини и табела или врата и прозорци.
  if (shop) {
    for (const x of xs) { if (Math.abs(x) < 0.15 && n % 2) continue; const v = box(0.3, 0.36, 0.02, col(0x3a4a52, { rough: 0.25 })); v.position.set(x, 0.32, d / 2 + 0.01); g.add(v); const vf = box(0.34, 0.03, 0.03, tr); vf.position.set(x, 0.515, d / 2 + 0.015); g.add(vf); }
    const sign = box(w * 0.6, 0.08, 0.02, col(fresh ? 0x2f6f8f : 0x5a3a22)); sign.position.set(0, 0.56, d / 2 + 0.02); g.add(sign);
  } else {
    for (const x of xs) win(g, x, 0.36, d / 2 + 0.005, { w: 0.18, h: 0.28, frame: trim });
  }
  const door = box(0.22, 0.42, 0.02, col(0x3a2a1e)); door.position.set(n % 2 ? 0 : -0.02, 0.23, d / 2 + 0.012); g.add(door);
  for (let f = 1; f < floors; f++) for (const x of xs) win(g, x, f * fh + 0.4, d / 2 + 0.005, { w: 0.18, h: 0.3, frame: trim, pedi: true });
  // Балкон на горния етаж в средата.
  const by = (floors - 1) * fh + 0.12;
  const slab = box(0.7, 0.04, 0.24, tr); slab.position.set(0, by, d / 2 + 0.12); g.add(slab);
  const iron = col(0x22272b, { metal: 0.4, rough: 0.5 });
  const top = box(0.7, 0.015, 0.015, iron); top.position.set(0, by + 0.17, d / 2 + 0.235); g.add(top);
  for (let i = 0; i < 9; i++) { const b = box(0.01, 0.17, 0.01, iron); b.position.set(-0.33 + i * 0.0825, by + 0.09, d / 2 + 0.235); g.add(b); }
  // Покрив.
  const roof = hipRoof(w + 0.16, d + 0.16, 0.38); roof.position.y = H + 0.04; g.add(roof);
  const chim = box(0.1, 0.24, 0.1, col(0xa0583a)); chim.position.set(w * 0.3, H + 0.3, -d * 0.15); g.add(chim);
  g.userData.top = H + 0.42;
  g.userData.chimney = new THREE.Vector3(w * 0.3, H + 0.45, -d * 0.15);
  return g;
}

// Фронтон с дъга над фасадата — белег на богатите пловдивски къщи (добавя се върху revivalHouse).
export function curvedPediment(w = 1.0, color = 0x3f6fae) {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0);
  sh.quadraticCurveTo(w / 2, w * 0.18, w * 0.25, w * 0.2);
  sh.quadraticCurveTo(0, w * 0.42, -w * 0.25, w * 0.2);
  sh.quadraticCurveTo(-w / 2, w * 0.18, -w / 2, 0);
  const m = new THREE.Mesh(G(`cped${w}`, () => new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false })), col(color));
  g.add(m);
  const edge = new THREE.Mesh(G(`cpede${w}`, () => new THREE.ExtrudeGeometry(sh, { depth: 0.02, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.01, bevelSegments: 1 })), col(0xf3efe4));
  edge.position.z = -0.01; edge.scale.set(1.02, 1.04, 1); g.add(edge);
  const sun = new THREE.Mesh(G('cpsun', () => new THREE.CircleGeometry(0.07, 14)), col(0xd9a441)); sun.position.set(0, w * 0.17, 0.065); g.add(sun);
  return g;
}

// ---------- развалини ----------
// Стена с неравен горен ръб и паднали камъни.
export function ruinWall(len, { h = 0.6, t = 0.3, seed = 3, low = 0.25 } = {}) {
  const g = new THREE.Group();
  const r = rnd(seed * 97 + 1);
  const n = Math.max(2, Math.round(len / 0.35));
  const step = len / n;
  for (let i = 0; i < n; i++) {
    const hh = h * (low + (1 - low) * r());
    const b = box(step + 0.01, +hh.toFixed(2), t, STONE([0.5, 0.5])); b.position.set(-len / 2 + step * (i + 0.5), hh / 2, 0); g.add(b);
  }
  for (let i = 0; i < Math.round(len * 2); i++) { const s = box(0.1, 0.07, 0.09, STONE([0.2, 0.2])); s.position.set((r() - 0.5) * len, 0.035, (r() > 0.5 ? 1 : -1) * (t / 2 + 0.08 + r() * 0.2)); s.rotation.y = r() * 3; g.add(s); }
  return g;
}

// ---------- улично обзавеждане ----------
export function streetLamp({ modern = false } = {}) {
  const g = new THREE.Group();
  const iron = col(modern ? 0x3a3f44 : 0x1f2a24, { metal: 0.4, rough: 0.5 });
  const post = cyl(0.018, 0.028, 0.95, iron, 8); post.position.y = 0.475; g.add(post);
  const glass = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffd36a, emissiveIntensity: 0.4 });
  if (modern) { const l = cyl(0.06, 0.04, 0.05, iron, 10); l.position.y = 0.98; g.add(l); const gl = cyl(0.045, 0.045, 0.01, glass, 10); gl.position.y = 0.95; g.add(gl); }
  else {
    const lamp = cyl(0.05, 0.035, 0.12, glass, 6); lamp.position.y = 1.0; g.add(lamp);
    const cap = new THREE.Mesh(G('lcap', () => new THREE.ConeGeometry(0.065, 0.06, 6)), iron); cap.position.y = 1.09; g.add(cap);
  }
  g.userData.glass = glass;
  return g;
}
export function bench() {
  const g = new THREE.Group();
  const w = col(0x8a5a32), iron = col(0x2f3438);
  const seat = box(0.5, 0.025, 0.14, w); seat.position.y = 0.16; g.add(seat);
  const back = box(0.5, 0.1, 0.02, w); back.position.set(0, 0.25, -0.065); g.add(back);
  for (const s of [-1, 1]) { const l = box(0.02, 0.16, 0.14, iron); l.position.set(s * 0.22, 0.08, 0); g.add(l); }
  return g;
}
// Табела с надпис (рисуван в canvas).
const SIGN = new Map();
export function infoBoard(text = 'Античен стадион', { w = 0.6, h = 0.34 } = {}) {
  if (!SIGN.has(text)) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 290;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#26465c'; ctx.fillRect(0, 0, 512, 290);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(14, 14, 484, 262);
    ctx.fillStyle = '#26465c'; ctx.font = 'bold 46px system-ui, Arial, sans-serif'; ctx.textAlign = 'center';
    const words = text.split(' '); let line = '', y = 80; const lines = [];
    for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > 440) { lines.push(line); line = wd; } else line = t; }
    lines.push(line);
    for (const l of lines) { ctx.fillText(l, 256, y); y += 54; }
    ctx.fillStyle = '#b8a888'; for (let i = 0; i < 3; i++) ctx.fillRect(60, y + i * 22, 392 - i * 60, 10);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    SIGN.set(text, new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 }));
  }
  const g = new THREE.Group();
  const pole = col(0x3a3f44);
  for (const s of [-1, 1]) { const p = cyl(0.015, 0.015, 0.55, pole, 6); p.position.set(s * w * 0.4, 0.275, 0); g.add(p); }
  const b = box(w, h, 0.02, SIGN.get(text)); b.position.y = 0.55 + h / 2 - 0.08; b.rotation.x = -0.1; g.add(b);
  return g;
}
// Парапет (перила) по x.
export function railing(len, { h = 0.22, color = 0x3a3f44 } = {}) {
  const g = new THREE.Group();
  const m = col(color, { metal: 0.4, rough: 0.5 });
  const top = box(len, 0.02, 0.02, m); top.position.y = h; g.add(top);
  const mid = box(len, 0.012, 0.012, m); mid.position.y = h * 0.5; g.add(mid);
  const n = Math.max(2, Math.round(len / 0.35));
  for (let i = 0; i <= n; i++) { const p = box(0.02, h, 0.02, m); p.position.set(-len / 2 + (i * len) / n, h / 2, 0); g.add(p); }
  return g;
}
export function cafeTable() {
  const g = new THREE.Group();
  const top = cyl(0.1, 0.1, 0.015, col(0xf2efe8), 12); top.position.y = 0.2; g.add(top);
  const leg = cyl(0.01, 0.01, 0.2, col(0x3a3f44), 6); leg.position.y = 0.1; g.add(leg);
  const umb = new THREE.Mesh(G('umb', () => new THREE.ConeGeometry(0.3, 0.1, 8)), col(0xc0392b)); umb.position.y = 0.62; g.add(umb);
  const up = cyl(0.008, 0.008, 0.45, col(0xdddddd), 5); up.position.y = 0.4; g.add(up);
  for (const s of [-1, 1]) { const ch = box(0.08, 0.1, 0.08, col(0x3a3f44)); ch.position.set(s * 0.17, 0.05, 0); g.add(ch); }
  return g;
}

// ---------- хора ----------
// Днешни хора и хора от Османската епоха (чалма, дълга дреха). Една мрежа с цветове по върховете.
const SKIN = 0xe0b58f;
const LOOKS = {
  // Днес: дънки, яке или тениска; дете с раница.
  man: { legs: 0x2f4a6f, top: 0x6f8f4a, hair: 0x3a2a1e },
  woman: { legs: 0x2f3440, top: 0xc0392b, hair: 0x5a3a22, long: true },
  kid: { legs: 0x2f4a6f, top: 0xf2c14e, hair: 0x3a2a1e, child: true, pack: 0x2f6f8f },
  tourist: { legs: 0xd8c8a8, top: 0x2f8f8a, hair: 0x9a8a7a, cap: 0xf2efe8 },
  archaeologist: { legs: 0x7a6a4a, top: 0xd9a441, hair: 0x3a2a1e, cap: 0xe9e1cf },
  // Османска епоха (обобщено): дълга дреха и чалма или кърпа.
  turban: { robe: 0x3f6f8f, sash: 0xd9a441, turban: 0xf3efe4 },
  robe: { robe: 0x8a3b2f, sash: 0x2a2a2e, turban: 0x2a2a2e, cap: true },
  veiled: { robe: 0x4f5f3f, sash: 0x4f5f3f, scarf: 0xece5d6 },
};
export function cityPerson(kind = 'man') {
  const L = LOOKS[kind] || LOOKS.man;
  const g = new THREE.Group();
  const sk = col(SKIN);
  if (L.robe) {
    const robe = cyl(0.08, 0.15, 0.5, col(L.robe), 12); robe.position.y = 0.25; g.add(robe);
    const sash = cyl(0.085, 0.09, 0.05, col(L.sash), 12); sash.position.y = 0.34; g.add(sash);
    for (const s of [-1, 1]) { const a = cyl(0.026, 0.024, 0.22, col(L.robe), 6); a.position.set(s * 0.1, 0.4, 0); a.rotation.z = s * 0.15; g.add(a); }
    const head = sph(0.075, sk); head.position.y = 0.6; g.add(head);
    if (L.scarf) { const sc = sph(0.085, col(L.scarf)); sc.scale.set(1, 0.95, 1); sc.position.set(0, 0.615, -0.01); g.add(sc); const ve = cyl(0.1, 0.14, 0.18, col(L.scarf), 12); ve.position.y = 0.5; g.add(ve); }
    else if (L.cap) { const c = cyl(0.07, 0.075, 0.07, col(L.turban), 10); c.position.y = 0.67; g.add(c); }
    else { const t = new THREE.Mesh(G('turb', () => new THREE.TorusGeometry(0.06, 0.035, 8, 14)), col(L.turban)); t.rotation.x = Math.PI / 2; t.position.y = 0.66; g.add(t); const tc = sph(0.06, col(L.turban), 10, 6, Math.PI / 2); tc.position.y = 0.66; g.add(tc); }
  } else {
    const k = L.child ? 0.72 : 1;
    for (const s of [-1, 1]) { const l = cyl(0.032, 0.03, 0.26, col(L.legs), 8); l.position.set(s * 0.045, 0.13, 0); g.add(l); const sh = box(0.05, 0.03, 0.09, col(0xf2efe8)); sh.position.set(s * 0.045, 0.015, 0.015); g.add(sh); }
    const body = cyl(0.075, 0.085, 0.26, col(L.top), 10); body.position.y = 0.39; g.add(body);
    for (const s of [-1, 1]) { const a = cyl(0.024, 0.022, 0.22, col(L.top), 6); a.position.set(s * 0.1, 0.4, 0); a.rotation.z = s * 0.12; g.add(a); const hd = sph(0.022, sk); hd.position.set(s * 0.115, 0.28, 0); g.add(hd); }
    const head = sph(0.075, sk); head.position.y = 0.6; g.add(head);
    const hair = sph(0.078, col(L.hair), 12, 8, Math.PI * 0.55); hair.position.set(0, 0.61, -0.008); g.add(hair);
    if (L.long) { const lh = box(0.12, 0.14, 0.04, col(L.hair)); lh.position.set(0, 0.55, -0.06); g.add(lh); }
    if (L.cap) { const c = cyl(0.08, 0.085, 0.04, col(L.cap), 12); c.position.y = 0.665; g.add(c); const p = box(0.1, 0.01, 0.07, col(L.cap)); p.position.set(0, 0.65, 0.08); g.add(p); }
    if (L.pack) { const p = box(0.13, 0.15, 0.07, col(L.pack)); p.position.set(0, 0.4, -0.1); g.add(p); }
    if (kind === 'archaeologist') { const tool = box(0.015, 0.3, 0.015, col(0x6b4a2c)); tool.position.set(0.14, 0.3, 0.05); g.add(tool); const bl = box(0.06, 0.06, 0.01, col(0x8a8f96)); bl.position.set(0.14, 0.14, 0.05); g.add(bl); }
    g.scale.setScalar(k);
  }
  bakeColors(g);
  g.userData.kind = kind;
  return g;
}

// Каменна подпорна стена (за ямата с разкопките), дължина по x.
export function retainingWall(len, h = 1.2) {
  const g = new THREE.Group();
  const w = box(len, h, 0.12, STONE([Math.max(1, Math.round(len * 1.5)), Math.max(1, Math.round(h * 1.5))])); w.position.y = -h / 2; g.add(w);
  return g;
}
