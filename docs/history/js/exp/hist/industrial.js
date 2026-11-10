// Индустриален град от Първата индустриална революция (края на XVIII – началото на XIX век):
// тухлена фабрика с много прозорци, машинна зала с балансирна парна машина, котел, комин,
// предачна машина, механичен стан, трансмисионен вал с ремъци, работнически къщи в редици,
// шахта на мина, локомотив „Ракета“, вагони, баржа, водна мелница, църква, гара, дим.
// Нисък полигон, кеширани текстури и геометрии. Неподвижните части се сливат с mergeStatic.
import { mat, THREE } from '../../kit.js';
import { person } from './antiquity.js';
import { mergeStatic } from './medieval.js';

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
  // Червени тухли на редове, светъл хоросан, малко сажди.
  brick(ctx, w, h) {
    ctx.fillStyle = '#d2c3a8'; ctx.fillRect(0, 0, w, h);
    const r = rnd(41), rows = 16, cols = 4, bh = h / rows, bw = w / cols;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * bw / 2;
      for (let x = -1; x <= cols; x++) {
        const v = (r() - 0.5) * 34;
        ctx.fillStyle = `rgb(${158 + v},${72 + v * 0.5},${52 + v * 0.4})`;
        ctx.fillRect(x * bw + off + 1.5, y * bh + 1.5, bw - 3, bh - 3);
      }
    }
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(30,20,15,${r() * 0.12})`; ctx.fillRect(r() * w, r() * h, 10 + r() * 30, 4 + r() * 8); }
  },
  // Плочи от шисти (сив покрив).
  slate(ctx, w, h) {
    ctx.fillStyle = '#4f5862'; ctx.fillRect(0, 0, w, h);
    const r = rnd(43), rows = 8, cols = 6, bh = h / rows, bw = w / cols;
    for (let y = 0; y < rows; y++) {
      const off = (y % 2) * bw / 2;
      for (let x = -1; x <= cols; x++) {
        const v = (r() - 0.5) * 26;
        ctx.fillStyle = `rgb(${86 + v},${96 + v},${108 + v})`;
        ctx.fillRect(x * bw + off + 1, y * bh + 1, bw - 2, bh - 3);
      }
    }
  },
  // Прозорец с много малки стъкла (дървени рамки).
  window(ctx, w, h) {
    ctx.fillStyle = '#e8e2d2'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5f7c90'); g.addColorStop(1, '#2c3d4a');
    ctx.fillStyle = g; ctx.fillRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(8, 8, (w - 16) / 3, h - 16);
    ctx.fillStyle = '#e8e2d2';
    for (let i = 1; i < 3; i++) ctx.fillRect(5 + (w - 10) * i / 3 - 1.5, 5, 3, h - 10);
    for (let i = 1; i < 4; i++) ctx.fillRect(5, 5 + (h - 10) * i / 4 - 1.5, w - 10, 3);
  },
  // Дъски за под, врати, вагони.
  planks(ctx, w, h) {
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 0, w, h);
    const r = rnd(47);
    for (let y = 0; y < h; y += 16) { const v = (r() - 0.5) * 30; ctx.fillStyle = `rgb(${138 + v},${100 + v},${64 + v})`; ctx.fillRect(0, y + 1, w, 14); }
  },
  // Калдъръм.
  cobble(ctx, w, h) {
    ctx.fillStyle = '#7d766c'; ctx.fillRect(0, 0, w, h);
    const r = rnd(53);
    for (let i = 0; i < 110; i++) { const v = (r() - 0.5) * 40; ctx.fillStyle = `rgb(${135 + v},${128 + v},${116 + v})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 5 + r() * 5, 4 + r() * 3, r() * 3, 0, 7); ctx.fill(); }
  },
  // Въглища.
  coal(ctx, w, h) {
    ctx.fillStyle = '#1d1d20'; ctx.fillRect(0, 0, w, h);
    const r = rnd(59);
    for (let i = 0; i < 120; i++) { ctx.fillStyle = `rgba(${r() > 0.6 ? '140,140,150' : '0,0,0'},${0.2 + r() * 0.4})`; ctx.fillRect(r() * w, r() * h, 3 + r() * 6, 3 + r() * 5); }
  },
  // Вода в канала.
  water(ctx, w, h) {
    ctx.fillStyle = '#4f6f73'; ctx.fillRect(0, 0, w, h);
    const r = rnd(61); ctx.strokeStyle = 'rgba(220,235,235,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const x = r() * w, y = r() * h; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 22, y); ctx.stroke(); }
  },
  // Основа: прежда (успоредни конци).
  threads(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) { ctx.fillStyle = 'rgba(250,246,232,0.95)'; ctx.fillRect(x, 0, 1.5, h); }
  },
  // Ремък с напречни ивици (вижда се, че се движи).
  belt(ctx, w, h) {
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { ctx.fillStyle = '#3a2416'; ctx.fillRect(0, y, w, 4); }
  },
};
const MATS = new Map();
// Колко пъти се повтаря текстурата на единица дължина при „световните“ материали (world: true).
const DENS = { brick: 2, slate: 1.2, cobble: 0.8, planks: 2, coal: 2 };
export function IM(name, { color = 0xffffff, rep = [1, 1], rough = 0.85, side, transparent = false, world = false } = {}) {
  const k = `${name}|${color}|${rep}|${rough}|${side}|${transparent}|${world}`;
  if (!MATS.has(k)) {
    const map = name ? tex(name, name === 'window' ? 64 : 128, name === 'window' ? 96 : 128, DRAW[name], world ? [1, 1] : rep) : null;
    const m = new THREE.MeshStandardMaterial({ color, map, roughness: rough, side: side ?? THREE.FrontSide, transparent, alphaTest: transparent ? 0.3 : 0 });
    if (world) m.userData.density = DENS[name] || 1;
    MATS.set(k, m);
  }
  return MATS.get(k);
}
// Световен материал: текстурата е с еднакъв мащаб върху кутии с различен размер (за да се сливат в едно).
const WM = (name, opts = {}) => IM(name, { ...opts, world: true });
// Кеширан материал: еднаквите цветове делят един материал (така mergeStatic ги слива).
const CM = new Map();
export function cm(color, extra = {}) {
  const k = `${color}|${JSON.stringify(extra)}`;
  if (!CM.has(k)) CM.set(k, mat(color, extra));
  return CM.get(k);
}
const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => {
  const k = m.userData && m.userData.density;
  if (!k) return new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
  return new THREE.Mesh(G(`bw${w},${h},${d},${k}`, () => {
    const g = new THREE.BoxGeometry(w, h, d);
    const uv = g.attributes.uv, S = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let i = 0; i < uv.count; i++) { const [a, b] = S[Math.floor(i / 4)]; uv.setXY(i, uv.getX(i) * a * k, uv.getY(i) * b * k); }
    return g;
  }), m);
};
const cyl = (rt, rb, h, m, seg = 12) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const IRON = () => cm(0x2f3438, { metalness: 0.5, roughness: 0.5 });
const BRASS = () => cm(0xc9a640, { metalness: 0.6, roughness: 0.35 });
const brickM = (w, h, color = 0xffffff) => WM('brick', { color });
const stoneTrim = () => cm(0xd8d0bf);

// Тухлена стена с отвори за прозорци няма — прозорците са плочи върху стената със стъкло, перваз и горен камък.
function windowOn(g, x, y, z, { w = 0.36, h = 0.55, face = 1, axis = 'z', arched = false } = {}) {
  const pane = new THREE.Mesh(G(`pane${w},${h}`, () => new THREE.PlaneGeometry(w, h)), IM('window'));
  const sill = box(w + 0.1, 0.04, 0.07, stoneTrim());
  const lint = box(w + 0.08, 0.06, 0.05, stoneTrim());
  const parts = [[pane, 0, 0.012], [sill, -h / 2 - 0.02, 0.03], [lint, h / 2 + 0.03, 0.02]];
  if (arched) {
    const top = new THREE.Mesh(G(`arc${w}`, () => new THREE.CircleGeometry(w / 2, 12, 0, Math.PI)), IM('window', { color: 0xc8d0d6 }));
    parts.pop(); parts.push([top, h / 2, 0.012]);
  }
  for (const [m, dy, out] of parts) {
    if (axis === 'z') { m.position.set(x, y + dy, z + face * out); if (face < 0) m.rotation.y = Math.PI; }
    else { m.position.set(x + face * out, y + dy, z); m.rotation.y = face * Math.PI / 2; }
    g.add(m);
  }
}

// Двускатен покрив: дължина по x, наклон към ±z, с триъгълни калкани от тухла.
export function gable(len, span, rise, { roof = WM('slate'), wall = null, over = 0.12 } = {}) {
  const g = new THREE.Group();
  const half = span / 2 + over;
  const sl = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  for (const s of [-1, 1]) {
    const p = box(len + over * 2, 0.05, sl, roof);
    p.rotation.x = s * ang;
    p.position.set(0, rise / 2, s * half / 2);
    g.add(p);
  }
  const ridge = box(len + over * 2, 0.06, 0.08, cm(0x3d434a)); ridge.position.y = rise + 0.02; g.add(ridge);
  if (wall) {
    const sh = new THREE.Shape([new THREE.Vector2(-span / 2, 0), new THREE.Vector2(span / 2, 0), new THREE.Vector2(0, rise)]);
    const k = wall.userData.density || 1;
    const tg = G(`tri${span},${rise},${k}`, () => { const e = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: false }); const uv = e.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k); return e; });
    for (const s of [-1, 1]) { const t = new THREE.Mesh(tg, wall); t.rotation.y = Math.PI / 2; t.position.set(s * (len / 2) - 0.08, 0, 0); g.add(t); }
  }
  return g;
}

// Колело със спици в равнината x-y (оста е по z).
export function spokedWheel(r, { tube = 0.03, spokes = 6, color = 0x2f3438, hub = 0.06, depth = 0.04 } = {}) {
  const g = new THREE.Group();
  const m = cm(color, { metalness: 0.4, roughness: 0.55 });
  g.add(new THREE.Mesh(G(`tor${r},${tube}`, () => new THREE.TorusGeometry(r, tube, 6, 28)), m));
  for (let i = 0; i < spokes; i++) {
    const s = box(r * 2 - tube, 0.025, depth * 0.6, m); s.rotation.z = (i / spokes) * Math.PI; g.add(s);
  }
  const h = cyl(hub, hub, depth * 1.6, m); h.rotation.x = Math.PI / 2; g.add(h);
  return mergeStatic(g);
}

// ---------- сгради ----------
// Текстилна фабрика: тухлена, на няколко етажа, много прозорци, чугунени колони вътре,
// покрив от шисти и камбанка. Предната стена на приземния етаж е „изрязана“, за да се вижда цехът.
export function mill({ w = 8, d = 3.2, floors = 4, fh = 1.1, bays = 10, cutaway = true } = {}) {
  const g = new THREE.Group();
  const H = floors * fh, t = 0.18;
  const bm = brickM(w, H);
  const back = box(w, H, t, bm); back.position.set(0, H / 2, -d / 2 + t / 2); g.add(back);
  for (const s of [-1, 1]) { const e = box(t, H, d, brickM(d, H)); e.position.set(s * (w / 2 - t / 2), H / 2, 0); g.add(e); }
  const y0 = cutaway ? fh : 0;
  const front = box(w, H - y0, t, brickM(w, H - y0)); front.position.set(0, y0 + (H - y0) / 2, d / 2 - t / 2); g.add(front);
  if (cutaway) {
    // Чугунена греда над изрязания отвор и тухлени стълбове в краищата.
    const girder = box(w, 0.12, 0.2, IRON()); girder.position.set(0, fh - 0.06, d / 2 - 0.1); g.add(girder);
    for (const s of [-1, 1]) { const p = box(0.3, fh, t + 0.04, bm); p.position.set(s * (w / 2 - 0.15), fh / 2, d / 2 - t / 2); g.add(p); }
    const fl = box(w - 0.3, 0.04, d - 0.3, WM('planks')); fl.position.y = 0.02; g.add(fl);
    const ceil = box(w - 0.3, 0.08, d - 0.3, WM('planks', { color: 0xb8a58c })); ceil.position.y = fh - 0.04; g.add(ceil);
    for (let x = -w / 2 + 1.2; x < w / 2 - 0.5; x += 1.6) {
      const c = cyl(0.035, 0.045, fh - 0.08, IRON(), 8); c.position.set(x, fh / 2 - 0.04, -0.45); g.add(c);
    }
  }
  // Каменни корнизи между етажите.
  for (let f = 1; f <= floors; f++) {
    for (const z of [d / 2 + 0.02, -d / 2 - 0.02]) {
      if (f === 1 && cutaway && z > 0) continue;
      const c = box(w + 0.04, 0.05, 0.06, stoneTrim()); c.position.set(0, f * fh, z); g.add(c);
    }
  }
  // Прозорци.
  const dx = (w - 0.6) / bays;
  for (let f = 0; f < floors; f++) {
    const y = f * fh + fh * 0.52;
    for (let i = 0; i < bays; i++) {
      const x = -w / 2 + 0.3 + dx * (i + 0.5);
      if (!(cutaway && f === 0)) windowOn(g, x, y, d / 2, { face: 1 });
      windowOn(g, x, y, -d / 2, { face: -1 });
    }
    for (const zz of [-d / 4, d / 4]) for (const s of [-1, 1]) windowOn(g, s * w / 2, y, zz, { face: s, axis: 'x' });
  }
  // Покрив, камбанка.
  const rf = gable(w, d, 0.9, { roof: WM('slate'), wall: brickM(d, 1) }); rf.position.y = H; g.add(rf);
  const cup = new THREE.Group(); cup.position.set(0, H + 0.75, 0);
  const base = box(0.4, 0.3, 0.4, cm(0xf0ead8)); base.position.y = 0.15; cup.add(base);
  for (const [x, z] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) { const p = box(0.04, 0.32, 0.04, cm(0xf0ead8)); p.position.set(x, 0.46, z); cup.add(p); }
  const bell = new THREE.Mesh(G('bell', () => new THREE.CylinderGeometry(0.05, 0.1, 0.13, 10, 1, true)), BRASS()); bell.position.y = 0.48; cup.add(bell);
  const dome = new THREE.Mesh(G('dome', () => new THREE.ConeGeometry(0.3, 0.3, 4)), cm(0x5a6670)); dome.position.y = 0.77; dome.rotation.y = Math.PI / 4; cup.add(dome);
  g.add(cup);
  g.userData = { H, fh, w, d, bell };
  return g;
}

// Машинна зала (висока, с арковидни прозорци) или котелно (ниско). Южната стена е махната (разрез).
export function engineHouse({ w = 2.4, d = 3.2, h = 3.4, open = true, arched = true, roofRise = 0.7 } = {}) {
  const g = new THREE.Group();
  const t = 0.18, bm = brickM(Math.max(w, d), h);
  const back = box(w, h, t, bm); back.position.set(0, h / 2, -d / 2 + t / 2); g.add(back);
  for (const s of [-1, 1]) { const e = box(t, h, d, bm); e.position.set(s * (w / 2 - t / 2), h / 2, 0); g.add(e); }
  if (open) {
    const lin = box(w, 0.35, t, bm); lin.position.set(0, h - 0.175, d / 2 - t / 2); g.add(lin);
    for (const s of [-1, 1]) { const p = box(0.22, h, t + 0.04, bm); p.position.set(s * (w / 2 - 0.11), h / 2, d / 2 - t / 2); g.add(p); }
  } else {
    const f = box(w, h, t, bm); f.position.set(0, h / 2, d / 2 - t / 2); g.add(f);
  }
  const fl = box(w - 0.2, 0.04, d - 0.2, WM('cobble')); fl.position.y = 0.02; g.add(fl);
  for (const s of [-1, 1]) for (const zz of [-d / 4, d / 4]) windowOn(g, s * w / 2, h * 0.55, zz, { face: s, axis: 'x', w: 0.34, h: h * 0.4, arched });
  const rf = gable(d, w, roofRise, { roof: WM('slate'), wall: brickM(w, 1) }); rf.rotation.y = Math.PI / 2; rf.position.y = h; g.add(rf);
  return g;
}

// Комин: четириъгълен, стеснява се нагоре, с цокъл и корниз. userData.top е горният отвор (локално).
export function chimney(h = 8, { r0 = 0.55, r1 = 0.32 } = {}) {
  const g = new THREE.Group();
  const plinth = box(r0 * 1.8, 0.8, r0 * 1.8, WM('brick', { color: 0xc9b7a0 })); plinth.position.y = 0.4; g.add(plinth);
  const shaft = new THREE.Mesh(G(`chim${h},${r0},${r1}`, () => new THREE.CylinderGeometry(r1, r0, h, 4, 1)), IM('brick', { rep: [2, Math.round(h * 2)] }));
  shaft.rotation.y = Math.PI / 4; shaft.position.y = h / 2; g.add(shaft);
  const band = box(r1 * 1.7, 0.08, r1 * 1.7, stoneTrim()); band.position.y = h * 0.75; g.add(band);
  const cap = box(r1 * 1.75, 0.18, r1 * 1.75, WM('brick', { color: 0x6a5a50 })); cap.position.y = h + 0.05; g.add(cap);
  const soot = box(r1 * 1.3, 0.05, r1 * 1.3, cm(0x111111)); soot.position.y = h + 0.15; g.add(soot);
  g.userData.top = new THREE.Vector3(0, h + 0.2, 0);
  return g;
}

// ---------- машини ----------
// Балансирна парна машина (тип Уат): цилиндър, люлееща се греда, мотовилка, маховик,
// конусни зъбни колела към трансмисионния вал и центробежен регулатор.
// Равнината на машината е x-y; маховикът е на +x. set(theta) поставя частите за ъгъл на коляното.
export function beamEngine() {
  const g = new THREE.Group();
  const iron = IRON(), green = cm(0x2f4a3a, { roughness: 0.5 });
  const PIV = [0, 2.35], HALF = 0.78, CR = 0.3, FLY = [0.78, 1.0];
  // Основа на цилиндъра и цилиндърът.
  const plinth = box(0.6, 0.18, 0.6, cm(0xb9ad98)); plinth.position.set(-HALF, 0.09, 0); g.add(plinth);
  const cylinder = cyl(0.22, 0.22, 1.0, green, 16); cylinder.position.set(-HALF, 0.7, 0); g.add(cylinder);
  for (const y of [0.22, 1.18]) { const fl = cyl(0.26, 0.26, 0.05, iron, 16); fl.position.set(-HALF, y, 0); g.add(fl); }
  const steamPipe = cyl(0.045, 0.045, 0.75, BRASS(), 8); steamPipe.rotation.z = Math.PI / 2; steamPipe.position.set(-HALF - 0.4, 1.1, 0); g.add(steamPipe);
  // Стойка на гредата (две чугунени колони с напречник).
  for (const z of [-0.22, 0.22]) { const c = cyl(0.05, 0.07, PIV[1], iron, 10); c.position.set(0, PIV[1] / 2, z); g.add(c); }
  const cross = box(0.2, 0.1, 0.56, iron); cross.position.set(0, PIV[1] - 0.06, 0); g.add(cross);
  // Гредата: издута по средата („рибен корем“).
  const sh = new THREE.Shape();
  sh.moveTo(-HALF - 0.05, -0.04); sh.quadraticCurveTo(0, -0.22, HALF + 0.05, -0.04); sh.lineTo(HALF + 0.05, 0.04); sh.quadraticCurveTo(0, 0.2, -HALF - 0.05, 0.04); sh.closePath();
  const beam = new THREE.Mesh(G('beam', () => { const e = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false }); e.translate(0, 0, -0.035); return e; }), green);
  const beamPivot = new THREE.Group(); beamPivot.position.set(PIV[0], PIV[1], 0); beamPivot.add(beam); g.add(beamPivot);
  // Буталният прът и мотовилката (поставят се в set).
  const rod = cyl(0.025, 0.025, 1, BRASS(), 8); g.add(rod);
  const conRod = cyl(0.035, 0.035, 1, iron, 8); g.add(conRod);
  // Маховик (вертикално, оста по z), коляно.
  const fly = spokedWheel(0.62, { tube: 0.055, spokes: 6, color: 0x2a2f33, hub: 0.09, depth: 0.08 });
  fly.position.set(FLY[0], FLY[1], -0.25); g.add(fly);
  const crankArm = box(CR + 0.08, 0.07, 0.04, iron); crankArm.position.x = CR / 2; const crank = new THREE.Group(); crank.position.set(FLY[0], FLY[1], -0.1); crank.add(crankArm); g.add(crank);
  for (const z of [-0.5, 0.05]) { const st = box(0.12, FLY[1], 0.12, cm(0xb9ad98)); st.position.set(FLY[0], FLY[1] / 2, z); g.add(st); }
  const axle = cyl(0.05, 0.05, 1.1, iron, 8); axle.rotation.x = Math.PI / 2; axle.position.set(FLY[0], FLY[1], -0.75); g.add(axle);
  // Конусни зъбни колела: оста на маховика (по z) → трансмисионният вал (по x).
  const gearA = gear(0.24); gearA.position.set(FLY[0], FLY[1], -1.22); g.add(gearA);
  const gearB = gear(0.24); gearB.rotation.y = Math.PI / 2; gearB.position.set(FLY[0] + 0.24, FLY[1], -1.46); g.add(gearB);
  // Центробежен регулатор над маховика.
  const gov = new THREE.Group(); gov.position.set(FLY[0] - 0.42, 1.55, -0.6);
  const spindle = cyl(0.015, 0.015, 0.5, iron, 6); spindle.position.y = 0.25; gov.add(spindle);
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.y = 0.48;
    const a = box(0.015, 0.26, 0.015, iron); a.position.y = -0.13; arm.add(a);
    const ball = new THREE.Mesh(G('gball', () => new THREE.SphereGeometry(0.05, 10, 8)), BRASS()); ball.position.y = -0.26; arm.add(ball);
    arm.userData.s = s; gov.add(arm); arms.push(arm);
  }
  const govPost = box(0.06, 1.55, 0.06, iron); govPost.position.set(FLY[0] - 0.42, 0.78, -0.6); g.add(govPost, gov);
  // Ограда около маховика.
  for (const x of [FLY[0] - 0.9, FLY[0] + 0.9]) { const p = box(0.03, 0.5, 0.03, iron); p.position.set(x, 0.25, 0.35); g.add(p); }
  const rail = box(1.8, 0.03, 0.03, iron); rail.position.set(FLY[0], 0.5, 0.35); g.add(rail);

  const pin = new THREE.Vector3(), endE = new THREE.Vector3(), endW = new THREE.Vector3();
  function placeRod(m, a, b) {
    const d = b.clone().sub(a); const len = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(1, len, 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  }
  function set(theta, speed = 0) {
    pin.set(FLY[0] + CR * Math.cos(theta), FLY[1] + CR * Math.sin(theta), -0.1);
    // Ъгълът на гредата следва височината на коляното (приближено).
    const phi = Math.asin(Math.max(-1, Math.min(1, (CR * Math.sin(theta)) / (PIV[1] - FLY[1])))) * 0.45;
    beamPivot.rotation.z = phi;
    endE.set(PIV[0] + HALF * Math.cos(phi), PIV[1] + HALF * Math.sin(phi), -0.05);
    endW.set(PIV[0] - HALF * Math.cos(phi), PIV[1] - HALF * Math.sin(phi), 0);
    placeRod(conRod, endE, pin);
    placeRod(rod, new THREE.Vector3(-HALF, 1.2, 0), endW);
    fly.rotation.z = theta; crank.rotation.z = theta;
    gearA.rotation.z = theta; gearB.rotation.x = -theta;
    gov.rotation.y = theta * 2;
    const spread = 0.15 + Math.min(1, speed) * 0.7;
    for (const a of arms) a.rotation.z = a.userData.s * spread;
  }
  set(0);
  g.userData = { set, fly, beamPivot, moving: [beamPivot, rod, conRod, fly, crank, gearA, gearB, gov], shaftStart: new THREE.Vector3(FLY[0] + 0.24, FLY[1], -1.46) };
  return g;
}
function gear(r) {
  const g = new THREE.Group();
  const m = cm(0x3a3f44, { metalness: 0.5, roughness: 0.5 });
  const d = cyl(r * 0.75, r, 0.08, m, 16); d.rotation.x = Math.PI / 2; g.add(d);
  for (let i = 0; i < 14; i++) { const t = box(0.04, 0.05, 0.06, m); const a = (i / 14) * Math.PI * 2; t.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.02); t.rotation.z = a; g.add(t); }
  return mergeStatic(g);
}

// Трансмисионен вал по x с ремъчни шайби в точките xs. Върти се около x.
export function lineShaft(len, xs = []) {
  const g = new THREE.Group();
  const iron = IRON();
  const s = cyl(0.03, 0.03, len, iron, 8); s.rotation.z = Math.PI / 2; s.position.x = len / 2; g.add(s);
  for (const x of xs) { const p = spokedWheel(0.13, { tube: 0.025, spokes: 4, color: 0x6b5a48, hub: 0.035, depth: 0.08 }); p.rotation.y = Math.PI / 2; p.position.x = x; g.add(p); }
  return g;
}
// Ремък между две точки (локални за родителя): плоска лента, чиято текстура се движи.
const beltMat = () => IM('belt', { rep: [1, 3] });
export function beltBetween(a, b, width = 0.07) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A); const len = d.length();
  const m = new THREE.Mesh(G(`belt${width}`, () => new THREE.BoxGeometry(width, 1, 0.012)), beltMat());
  m.scale.y = len;
  m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return m;
}
export const beltTexture = () => beltMat().map;

// Котел в тухлена зидария: огнище с врата, железен барабан, предпазен клапан с тежест,
// манометър със стрелка (добавен за детето). Огнището гледа към +z.
export function boiler() {
  const g = new THREE.Group();
  const setting = box(1.0, 0.75, 1.7, WM('brick', { color: 0xc9a68a })); setting.position.y = 0.375; g.add(setting);
  const drum = new THREE.Mesh(G('drum', () => new THREE.CylinderGeometry(0.42, 0.42, 1.6, 18, 1, false, 0, Math.PI)), cm(0x4a4f55, { metalness: 0.45, roughness: 0.5 }));
  drum.rotation.x = Math.PI / 2; drum.rotation.y = Math.PI / 2; drum.position.y = 0.75; g.add(drum);
  for (const z of [-0.6, -0.2, 0.2, 0.6]) { const r = new THREE.Mesh(G('rivet', () => new THREE.TorusGeometry(0.425, 0.012, 4, 18, Math.PI)), IRON()); r.position.set(0, 0.75, z); g.add(r); }
  const door = box(0.36, 0.28, 0.04, IRON()); door.position.set(0, 0.3, 0.86); g.add(door);
  const glow = new THREE.Mesh(G('glow', () => new THREE.PlaneGeometry(0.28, 0.12)), new THREE.MeshBasicMaterial({ color: 0xff7a1a })); glow.position.set(0, 0.24, 0.885); g.add(glow);
  // Предпазен клапан: тръбичка, лост и тежест.
  const vp = cyl(0.04, 0.04, 0.2, BRASS(), 8); vp.position.set(0.15, 1.25, -0.3); g.add(vp);
  // Отвод за парата през покрива.
  const vent = cyl(0.035, 0.035, 1.4, IRON(), 8); vent.position.set(-0.15, 2.0, -0.55); g.add(vent);
  const ventCap = cyl(0.06, 0.04, 0.08, IRON(), 8); ventCap.position.set(-0.15, 2.72, -0.55); g.add(ventCap);
  const lever = new THREE.Group(); lever.position.set(0.15, 1.36, -0.3);
  const arm = box(0.04, 0.03, 0.5, IRON()); arm.position.z = 0.22; lever.add(arm);
  const wt = new THREE.Mesh(G('wt', () => new THREE.SphereGeometry(0.06, 10, 8)), IRON()); wt.position.set(0, -0.04, 0.42); lever.add(wt);
  g.add(lever);
  // Паропровод към машината (+x).
  const pipe = cyl(0.045, 0.045, 0.45, BRASS(), 8); pipe.position.set(-0.1, 1.35, 0.2); g.add(pipe);
  const pipe2 = cyl(0.045, 0.045, 1.6, BRASS(), 8); pipe2.rotation.z = Math.PI / 2; pipe2.position.set(0.7, 1.55, 0.2); g.add(pipe2);
  // Манометър.
  const gauge = new THREE.Group(); gauge.position.set(-0.28, 1.12, 0.62);
  const face = new THREE.Mesh(G('gface', () => new THREE.CircleGeometry(0.15, 24)), cm(0xfaf6ea)); gauge.add(face);
  const ring = new THREE.Mesh(G('gring', () => new THREE.TorusGeometry(0.15, 0.018, 6, 24)), BRASS()); gauge.add(ring);
  const red = new THREE.Mesh(G('gred', () => new THREE.RingGeometry(0.1, 0.14, 16, 1, -Math.PI * 0.25, Math.PI * 0.32)), new THREE.MeshBasicMaterial({ color: 0xd8382f, side: THREE.DoubleSide })); red.position.z = 0.003; gauge.add(red);
  const green = new THREE.Mesh(G('ggreen', () => new THREE.RingGeometry(0.1, 0.14, 16, 1, Math.PI * 0.07, Math.PI * 0.5)), new THREE.MeshBasicMaterial({ color: 0x2fb36b, side: THREE.DoubleSide })); green.position.z = 0.003; gauge.add(green);
  const needle = new THREE.Group(); const nd = box(0.012, 0.13, 0.01, cm(0x111111)); nd.position.y = 0.06; needle.add(nd); needle.position.z = 0.01; gauge.add(needle);
  const stem = cyl(0.02, 0.02, 0.3, BRASS(), 6); stem.position.set(0, -0.2, -0.05); gauge.add(stem);
  g.add(gauge);
  // Купчина въглища и лопата.
  const heap = new THREE.Mesh(G('heap', () => new THREE.ConeGeometry(0.35, 0.25, 9)), IM('coal', { rough: 0.6 })); heap.position.set(0.45, 0.12, 1.25); g.add(heap);
  const shovel = box(0.03, 0.6, 0.03, WM('planks')); shovel.position.set(0.15, 0.3, 1.2); shovel.rotation.z = 0.5; g.add(shovel);
  g.userData = { glow, lever, needle, gauge, valveTop: new THREE.Vector3(-0.15, 2.8, -0.55), heap };
  return g;
}

// Механичен стан: чугунени рамки, основа, бърдо, което се люлее, совалка, която тича, плат на вала.
export function powerLoom({ cloth = 0x6f8fb8 } = {}) {
  const g = new THREE.Group();
  const iron = cm(0x3c4247, { metalness: 0.4, roughness: 0.55 });
  for (const x of [-0.36, 0.36]) {
    for (const z of [-0.26, 0.26]) { const l = box(0.05, 0.6, 0.05, iron); l.position.set(x, 0.3, z); g.add(l); }
    const top = box(0.05, 0.05, 0.6, iron); top.position.set(x, 0.58, 0); g.add(top);
    const low = box(0.05, 0.04, 0.6, iron); low.position.set(x, 0.12, 0); g.add(low);
  }
  const warpBeam = cyl(0.06, 0.06, 0.66, cm(0xf3ecd8), 10); warpBeam.rotation.z = Math.PI / 2; warpBeam.position.set(0, 0.42, -0.26); g.add(warpBeam);
  const warp = new THREE.Mesh(G('warp', () => new THREE.PlaneGeometry(0.62, 0.45)), IM('threads', { rep: [4, 1], side: THREE.DoubleSide, transparent: true }));
  warp.rotation.x = -Math.PI / 2 + 0.08; warp.position.set(0, 0.46, -0.03); g.add(warp);
  const clothM = cm(cloth);
  const cloth1 = new THREE.Mesh(G('clothP', () => new THREE.PlaneGeometry(0.62, 0.18)), cm(cloth, { side: THREE.DoubleSide }));
  cloth1.rotation.x = -Math.PI / 2; cloth1.position.set(0, 0.47, 0.18); g.add(cloth1);
  const roll = cyl(0.07, 0.07, 0.64, clothM, 12); roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.32, 0.28); g.add(roll);
  // Бърдото (батан) се люлее около долна ос.
  const batten = new THREE.Group(); batten.position.set(0, 0.14, 0.1);
  for (const x of [-0.31, 0.31]) { const s = box(0.03, 0.34, 0.03, WM('planks')); s.position.set(x, 0.17, 0); batten.add(s); }
  const reed = box(0.64, 0.06, 0.04, WM('planks', { color: 0xc8a070 })); reed.position.y = 0.34; batten.add(reed);
  const race = box(0.66, 0.02, 0.07, WM('planks')); race.position.set(0, 0.31, 0.02); batten.add(race);
  const shuttle = box(0.1, 0.03, 0.035, cm(0x7a4a2a)); shuttle.position.set(0, 0.335, 0.03); batten.add(shuttle);
  g.add(batten);
  // Шайба отстрани (тук стига ремъкът).
  const pul = spokedWheel(0.12, { tube: 0.02, spokes: 4, color: 0x6b5a48, hub: 0.03, depth: 0.06 }); pul.rotation.y = Math.PI / 2; pul.position.set(0.44, 0.45, -0.1); g.add(pul);
  g.userData = { batten, shuttle, pulley: pul, roll, ph: Math.random() * 6 };
  return g;
}
// Движение на стан: speed 0..1.
export function animateLoom(l, t, speed) {
  const u = l.userData; u.k = (u.k || 0) + speed * 0.12;
  const a = u.k * 9 + u.ph;
  u.batten.rotation.x = -0.18 + Math.sin(a) * 0.16 * Math.min(1, speed * 3);
  u.shuttle.position.x = Math.sin(a * 0.5) * 0.25;
  u.pulley.rotation.x = -u.k * 12;
}

// Предачна машина (тип „мюл“): стойка с макари, валове, подвижна количка с вретена.
// Количката излиза напред (изтегля и усуква конеца) и се връща.
export function spinningMule(len = 2.4) {
  const g = new THREE.Group();
  const wood = WM('planks'), iron = cm(0x3c4247, { metalness: 0.4 });
  // Стойка с макари (ровинг) отзад.
  const creel = box(len, 0.05, 0.25, wood); creel.position.set(0, 0.62, -0.32); g.add(creel);
  for (const x of [-len / 2 + 0.05, len / 2 - 0.05]) { const p = box(0.05, 0.62, 0.05, wood); p.position.set(x, 0.31, -0.32); g.add(p); }
  const n = Math.round(len / 0.12);
  for (let i = 0; i < n; i++) { const b = cyl(0.03, 0.03, 0.09, cm(0xf2ead3), 8); b.position.set(-len / 2 + 0.06 + i * (len - 0.12) / (n - 1), 0.7, -0.32); g.add(b); }
  const rollers = cyl(0.025, 0.025, len, iron, 8); rollers.rotation.z = Math.PI / 2; rollers.position.set(0, 0.5, -0.15); g.add(rollers);
  const rbase = box(len, 0.05, 0.2, wood); rbase.position.set(0, 0.45, -0.15); g.add(rbase);
  for (const x of [-len / 2 + 0.05, len / 2 - 0.05]) { const p = box(0.05, 0.45, 0.05, wood); p.position.set(x, 0.22, -0.15); g.add(p); }
  // Глава с колела и шайба.
  const head = box(0.25, 0.55, 0.45, wood); head.position.set(len / 2 + 0.16, 0.28, -0.1); g.add(head);
  const hw = spokedWheel(0.2, { tube: 0.025, spokes: 6, color: 0x6b5a48, hub: 0.04, depth: 0.05 }); hw.rotation.y = Math.PI / 2; hw.position.set(len / 2 + 0.3, 0.38, -0.1); g.add(hw);
  // Релси за количката.
  for (const x of [-len / 2 + 0.2, 0, len / 2 - 0.2]) { const r = box(0.04, 0.03, 1.0, iron); r.position.set(x, 0.015, 0.25); g.add(r); }
  // Количка с вретена.
  const carriage = new THREE.Group();
  const cb = box(len, 0.08, 0.16, wood); cb.position.y = 0.32; carriage.add(cb);
  for (const x of [-len / 2 + 0.1, len / 2 - 0.1]) for (const z of [-0.05, 0.05]) { const w = cyl(0.04, 0.04, 0.03, iron, 8); w.rotation.z = Math.PI / 2; w.position.set(x, 0.04, z); carriage.add(w); const l = box(0.04, 0.3, 0.04, wood); l.position.set(x, 0.18, 0); carriage.add(l); }
  const spindles = [];
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group(); s.position.set(-len / 2 + 0.06 + i * (len - 0.12) / (n - 1), 0.36, 0);
    const rodS = cyl(0.006, 0.006, 0.18, iron, 5); rodS.position.y = 0.09; rodS.rotation.x = -0.25; s.add(rodS);
    const cop = new THREE.Mesh(G('cop', () => new THREE.ConeGeometry(0.025, 0.08, 8)), cm(0xfbf7ec)); cop.position.set(0, 0.06, -0.01); s.add(cop);
    const mark = box(0.004, 0.06, 0.03, cm(0xc0392b)); mark.position.set(0.02, 0.06, -0.01); s.add(mark);
    carriage.add(s); spindles.push(s);
  }
  mergeStatic(carriage);
  g.add(carriage);
  // Конци между валовете и вретената.
  const yarn = new THREE.Mesh(G(`yarn${len}`, () => new THREE.PlaneGeometry(len - 0.1, 1)), IM('threads', { rep: [Math.round(len * 3), 1], side: THREE.DoubleSide, transparent: true }));
  g.add(yarn);
  g.userData = { carriage, spindles, yarn, wheel: hw, k: 0 };
  setMule(g, 0);
  return g;
}
export function setMule(m, phase) {
  const u = m.userData;
  // 0..0.7: количката излиза бавно; 0.7..1: връща се бързо.
  const p = phase % 1;
  const out = p < 0.7 ? p / 0.7 : 1 - (p - 0.7) / 0.3;
  const z = 0.0 + out * 0.6;
  u.carriage.position.z = z;
  const a = new THREE.Vector3(0, 0.5, -0.12), b = new THREE.Vector3(0, 0.45, z - 0.02);
  const d = b.clone().sub(a);
  u.yarn.position.copy(a).addScaledVector(d, 0.5);
  u.yarn.scale.y = d.length();
  u.yarn.rotation.x = -Math.PI / 2 + Math.atan2(d.y, d.z) * -1;
}

// ---------- хора ----------
const LOOK = {
  man: { body: 0x4b4036, trim: 0x2a2a2a, cap: 0x3a3a3a },
  woman: { body: 0x5f5470, trim: 0xe9e2d0, shawl: 0xb88a5a, apron: 0xefe8d8 },
  girl: { body: 0x7a5a4a, trim: 0xefe8d8, apron: 0xefe8d8, shawl: 0xd8c8a8, child: true },
  boy: { body: 0x55606a, trim: 0x2a2a2a, cap: 0x4a4038, child: true },
  master: { body: 0x1f2630, trim: 0xf1ede2, top: 0x15181c },
  miner: { body: 0x2c2a28, trim: 0x111111, cap: 0x2c2a28 },
  lady: { body: 0x3a5a7a, trim: 0xf1ede2, shawl: 0x8a2f3a },
};
export function worker(kind = 'man') {
  const L = LOOK[kind] || LOOK.man;
  const g = person('citizen', { scale: L.child ? 0.72 : 1 });
  const [body, belt] = g.children;
  body.material = cm(L.body); belt.material = cm(L.trim);
  if (L.apron) { const a = box(0.17, 0.3, 0.02, cm(L.apron)); a.position.set(0, 0.2, 0.1); a.rotation.x = -0.28; g.add(a); }
  if (L.shawl) { const s = new THREE.Mesh(G('shawl', () => new THREE.SphereGeometry(0.098, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62)), cm(L.shawl)); s.position.y = 0.585; g.add(s); }
  if (L.cap) { const c = cyl(0.085, 0.09, 0.04, cm(L.cap), 12); c.position.y = 0.66; g.add(c); const p = box(0.12, 0.012, 0.07, cm(L.cap)); p.position.set(0, 0.645, 0.08); g.add(p); }
  if (L.top) { const b = cyl(0.12, 0.12, 0.012, cm(L.top), 14); b.position.y = 0.655; const h = cyl(0.075, 0.07, 0.17, cm(L.top), 12); h.position.y = 0.74; g.add(b, h); }
  bakeColors(g);
  g.userData.kind = kind;
  return g;
}
// Слива всички части на фигура в една мрежа с цветове по върховете (едно рисуване вместо пет).
let VC = null;
export function bakeColors(root) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const victims = [];
  root.traverse((o) => { if (o.isMesh && !Array.isArray(o.material) && o.material.color) victims.push(o); });
  const pos = [], nor = [], col = [];
  for (const o of victims) {
    const rel = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(rel);
    const p = g.attributes.position, n = g.attributes.normal, c = o.material.color;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }
    g.dispose();
  }
  for (const o of victims) o.parent.remove(o);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  if (!VC) VC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
  root.add(new THREE.Mesh(geo, VC));
  return root;
}

// ---------- жилища и град ----------
// Редица еднакви тухлени къщи („терасни“): врата и прозорец долу, прозорец горе, комини на покрива.
// Редицата е по x, лицето гледа към +z. userData.chimneys са точките за дима (локално).
export function terraceRow(n = 6, { w = 0.9, d = 1.0, h = 1.45, color = 0xffffff } = {}) {
  const g = new THREE.Group();
  const L = n * w;
  const body = box(L, h, d, brickM(L, h, color)); body.position.set(0, h / 2, 0); g.add(body);
  const rf = gable(L, d, 0.45, { roof: WM('slate'), wall: brickM(d, 1, color), over: 0.06 }); rf.position.y = h; g.add(rf);
  const chimneys = [];
  const doors = [0x2f4f3a, 0x5a2a22, 0x2a3a5a, 0x3a3a3a];
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + w * (i + 0.5);
    const door = box(0.22, 0.42, 0.03, cm(doors[i % doors.length])); door.position.set(x - 0.18, 0.23, d / 2 + 0.015); g.add(door);
    const step = box(0.28, 0.05, 0.12, stoneTrim()); step.position.set(x - 0.18, 0.025, d / 2 + 0.06); g.add(step);
    windowOn(g, x + 0.15, 0.4, d / 2, { w: 0.26, h: 0.32 });
    windowOn(g, x, 1.08, d / 2, { w: 0.26, h: 0.32 });
    windowOn(g, x, 0.75, -d / 2, { w: 0.22, h: 0.28, face: -1 });
    if (i % 2 === 0) {
      const cx = -L / 2 + w * i + (i === 0 ? 0.15 : 0);
      const st = box(0.22, 0.4, 0.3, brickM(0.3, 0.4, color)); st.position.set(cx, h + 0.5, 0); g.add(st);
      for (const dz of [-0.07, 0.07]) { const p = cyl(0.035, 0.04, 0.12, cm(0xa0583a), 8); p.position.set(cx, h + 0.76, dz); g.add(p); }
      chimneys.push(new THREE.Vector3(cx, h + 0.85, 0));
    }
  }
  // Малки задни дворчета с ниски стени.
  for (let i = 0; i <= n; i++) { const wl = box(0.04, 0.32, 0.5, brickM(0.5, 0.3, color)); wl.position.set(-L / 2 + i * w, 0.16, -d / 2 - 0.25); g.add(wl); }
  const backWall = box(L, 0.32, 0.04, brickM(L, 0.3, color)); backWall.position.set(0, 0.16, -d / 2 - 0.5); g.add(backWall);
  g.userData = { chimneys, L };
  return g;
}

// Обща водна помпа (чешма) на улицата.
export function pump() {
  const g = new THREE.Group();
  const p = cyl(0.06, 0.07, 0.5, cm(0x2f4a3a), 10); p.position.y = 0.25; g.add(p);
  const sp = cyl(0.02, 0.02, 0.14, cm(0x2f4a3a), 6); sp.rotation.x = Math.PI / 2; sp.position.set(0, 0.36, 0.08); g.add(sp);
  const handle = box(0.02, 0.02, 0.26, IRON()); handle.position.set(0, 0.5, -0.1); handle.rotation.x = 0.4; g.add(handle);
  const trough = box(0.3, 0.1, 0.2, cm(0x9a948a)); trough.position.set(0, 0.05, 0.18); g.add(trough);
  g.userData.handle = handle;
  return g;
}
// Простор с пране между две точки.
export function washingLine(a, b, colors = [0xf2f0ea, 0x8aa0c0, 0xd8c8a8, 0xc07a6a, 0xf2f0ea]) {
  const g = new THREE.Group();
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const d = B.clone().sub(A), len = d.length();
  const line = cyl(0.004, 0.004, len, cm(0x777777), 4); line.position.copy(A).addScaledVector(d, 0.5); line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); g.add(line);
  const items = [];
  colors.forEach((c, i) => {
    const t = (i + 1) / (colors.length + 1);
    const cl = new THREE.Mesh(G('cloth', () => { const p = new THREE.PlaneGeometry(0.14, 0.18); p.translate(0, -0.09, 0); return p; }), cm(c, { side: THREE.DoubleSide }));
    cl.position.copy(A).addScaledVector(d, t); cl.rotation.y = Math.atan2(-d.z, d.x); g.add(cl); items.push(cl);
  });
  g.userData.items = items;
  return g;
}

// Църква с кула и шпил.
export function church() {
  const g = new THREE.Group();
  const stone = WM('cobble', { color: 0xd8d0c0 });
  const nave = box(2.4, 1.5, 1.3, stone); nave.position.set(0, 0.75, 0); g.add(nave);
  const rf = gable(2.4, 1.3, 0.7, { roof: WM('slate'), wall: stone }); rf.position.y = 1.5; g.add(rf);
  for (const x of [-0.7, 0, 0.7]) for (const s of [-1, 1]) windowOn(g, x, 0.8, s * 0.65, { face: s, w: 0.22, h: 0.6, arched: true });
  const tower = box(0.8, 2.6, 0.8, stone); tower.position.set(-1.6, 1.3, 0); g.add(tower);
  const spire = new THREE.Mesh(G('spire', () => new THREE.ConeGeometry(0.5, 2.0, 4)), IM('slate', { rep: [1, 3] })); spire.rotation.y = Math.PI / 4; spire.position.set(-1.6, 3.6, 0); g.add(spire);
  const clock = new THREE.Mesh(G('clk', () => new THREE.CircleGeometry(0.18, 20)), cm(0xf5efe0)); clock.position.set(-1.6, 2.2, 0.41); g.add(clock);
  for (const [r, l] of [[0, 0.13], [1.9, 0.1]]) { const hnd = box(0.02, l, 0.01, cm(0x111111)); hnd.position.set(-1.6 + Math.sin(r) * l / 2, 2.2 + Math.cos(r) * l / 2, 0.42); hnd.rotation.z = -r; g.add(hnd); }
  return g;
}
// Малко училище с камбанка.
export function school() {
  const g = engineHouse({ w: 1.8, d: 1.2, h: 1.2, open: false, arched: true, roofRise: 0.45 });
  windowOn(g, -0.45, 0.6, 0.6, { w: 0.3, h: 0.45 }); windowOn(g, 0.45, 0.6, 0.6, { w: 0.3, h: 0.45 });
  const door = box(0.26, 0.5, 0.03, cm(0x2f4f3a)); door.position.set(0, 0.25, 0.615); g.add(door);
  const bc = box(0.18, 0.3, 0.18, stoneTrim()); bc.position.set(0.9, 1.75, 0); g.add(bc);
  return g;
}
// Гара: перон с навес на чугунени стълбове.
export function station(len = 3.2) {
  const g = new THREE.Group();
  const pl = box(len, 0.16, 0.7, WM('cobble')); pl.position.y = 0.08; g.add(pl);
  for (let x = -len / 2 + 0.3; x <= len / 2 - 0.3; x += (len - 0.6) / 3) { const p = cyl(0.03, 0.03, 0.9, cm(0x2f4a3a), 8); p.position.set(x, 0.6, -0.1); g.add(p); }
  const roof = box(len + 0.2, 0.05, 0.85, WM('planks', { color: 0x8a9aa0 })); roof.position.set(0, 1.07, -0.05); roof.rotation.x = 0.12; g.add(roof);
  const hut = box(0.9, 0.9, 0.5, brickM(0.9, 0.9)); hut.position.set(len / 2 - 0.6, 0.6, -0.15); g.add(hut);
  windowOn(g, len / 2 - 0.6, 0.65, 0.1, { w: 0.24, h: 0.3 });
  const bench = box(0.6, 0.05, 0.16, WM('planks')); bench.position.set(-0.6, 0.38, -0.1); g.add(bench);
  return g;
}

// ---------- транспорт ----------
// Релсов път по x: две релси върху траверси.
export function track(len) {
  const g = new THREE.Group();
  const bal = box(len, 0.06, 0.62, WM('cobble', { color: 0x9a9080 })); bal.position.y = 0.03; g.add(bal);
  const sl = WM('planks', { color: 0x7a6040 });
  for (let x = -len / 2 + 0.15; x < len / 2; x += 0.3) { const s = box(0.1, 0.03, 0.56, sl); s.position.set(x, 0.075, 0); g.add(s); }
  for (const z of [-0.18, 0.18]) { const r = box(len, 0.04, 0.03, cm(0x6e6e70, { metalness: 0.6, roughness: 0.4 })); r.position.set(0, 0.11, z); g.add(r); }
  return g;
}
// Локомотивът „Ракета“ (1829): жълт котел, висок бял комин, наклонени цилиндри,
// големи предни колела, малки задни. Посоката на движение е +x.
export function rocket() {
  const g = new THREE.Group();
  const yellow = cm(0xe3b51e, { roughness: 0.45 }), black = cm(0x1d1d1f), white = cm(0xf2efe6), copper = cm(0xb8733a, { metalness: 0.5, roughness: 0.4 });
  const frame = box(1.25, 0.06, 0.42, black); frame.position.set(0, 0.32, 0); g.add(frame);
  const barrel = cyl(0.2, 0.2, 0.85, yellow, 16); barrel.rotation.z = Math.PI / 2; barrel.position.set(0.12, 0.58, 0); g.add(barrel);
  for (const x of [-0.25, 0.12, 0.5]) { const b = new THREE.Mesh(G('band', () => new THREE.TorusGeometry(0.203, 0.01, 4, 18)), black); b.rotation.y = Math.PI / 2; b.position.set(x, 0.58, 0); g.add(b); }
  const smokebox = cyl(0.21, 0.21, 0.12, black, 16); smokebox.rotation.z = Math.PI / 2; smokebox.position.set(0.6, 0.58, 0); g.add(smokebox);
  const chim = cyl(0.07, 0.08, 1.15, white, 12); chim.position.set(0.6, 1.3, 0); g.add(chim);
  const crown = cyl(0.11, 0.075, 0.1, black, 12); crown.position.set(0.6, 1.9, 0); g.add(crown);
  const firebox = box(0.32, 0.5, 0.42, copper); firebox.position.set(-0.45, 0.6, 0); g.add(firebox);
  const plate = box(0.3, 0.04, 0.45, WM('planks')); plate.position.set(-0.68, 0.36, 0); g.add(plate);
  // Колела.
  const wheels = [];
  for (const [x, r] of [[0.38, 0.29], [-0.45, 0.15]]) for (const z of [-0.25, 0.25]) {
    const w = spokedWheel(r, { tube: 0.025, spokes: r > 0.2 ? 10 : 6, color: 0xe3b51e, hub: 0.05, depth: 0.04 });
    w.position.set(x, r + 0.02 + 0.09, z); g.add(w); wheels.push({ w, r });
  }
  // Наклонени цилиндри и биели.
  const rods = [];
  for (const z of [-0.3, 0.3]) {
    const c = cyl(0.06, 0.06, 0.42, yellow, 10); c.position.set(-0.32, 0.72, z); c.rotation.z = 0.62; g.add(c);
    const rd = cyl(0.015, 0.015, 1, black, 6); g.add(rd); rods.push({ rd, z });
  }
  const driver = worker('man'); driver.position.set(-0.7, 0.36, 0); driver.rotation.y = Math.PI / 2; g.add(driver);
  // Тендер: варел с вода и въглища.
  const tender = new THREE.Group(); tender.position.x = -1.25;
  const tf = box(0.75, 0.06, 0.45, black); tf.position.y = 0.3; tender.add(tf);
  const tb = box(0.75, 0.2, 0.45, WM('planks', { color: 0xc89a3a })); tb.position.y = 0.43; tender.add(tb);
  const water = cyl(0.16, 0.16, 0.6, IM('planks', { color: 0xc89a3a }), 12); water.rotation.z = Math.PI / 2; water.position.y = 0.66; tender.add(water);
  const coal = box(0.3, 0.08, 0.38, WM('coal')); coal.position.set(0.2, 0.55, 0); tender.add(coal);
  for (const x of [-0.25, 0.25]) for (const z of [-0.25, 0.25]) { const w = spokedWheel(0.14, { tube: 0.02, spokes: 6, color: 0x1d1d1f, hub: 0.04, depth: 0.03 }); w.position.set(x, 0.24, z); tender.add(w); wheels.push({ w, r: 0.14 }); }
  g.add(tender);
  mergeStatic(tender, wheels.map((x) => x.w));
  mergeStatic(g, [tender, driver, ...wheels.map((x) => x.w), ...rods.map((x) => x.rd)]);
  const pinP = new THREE.Vector3();
  function roll(dist) {
    for (const { w, r } of wheels) w.rotation.z = -dist / r;
    const a = -dist / 0.29;
    for (const { rd, z } of rods) {
      pinP.set(0.38 + Math.cos(a) * 0.14, 0.4 + Math.sin(a) * 0.14, z);
      const A = new THREE.Vector3(-0.15, 0.82, z);
      const d = pinP.clone().sub(A); rd.position.copy(A).addScaledVector(d, 0.5); rd.scale.y = d.length(); rd.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
  }
  roll(0);
  g.userData = { roll, chimneyTop: new THREE.Vector3(0.6, 2.0, 0), length: 2.0 };
  return g;
}
// Пътнически вагон (като три сглобени дилижанса) или открит вагон.
export function coach({ open = false, color = 0x6a2a2a } = {}) {
  const g = new THREE.Group();
  const black = cm(0x1d1d1f);
  const fr = box(1.0, 0.05, 0.46, black); fr.position.y = 0.3; g.add(fr);
  if (open) {
    const b = box(1.0, 0.22, 0.46, WM('planks', { color: 0xb08a5a })); b.position.y = 0.44; g.add(b);
    const inner = box(0.92, 0.04, 0.38, WM('coal')); inner.position.y = 0.53; g.add(inner);
  } else {
    const body = box(1.0, 0.42, 0.48, cm(color)); body.position.y = 0.55; g.add(body);
    for (const x of [-0.33, 0, 0.33]) for (const s of [-1, 1]) { const wdw = box(0.18, 0.14, 0.01, cm(0x2c3d4a)); wdw.position.set(x, 0.64, s * 0.245); g.add(wdw); const pan = box(0.24, 0.12, 0.01, cm(0xd8b85a)); pan.position.set(x, 0.43, s * 0.246); g.add(pan); }
    const roof = box(1.04, 0.04, 0.52, black); roof.position.y = 0.78; g.add(roof);
    const lug = box(0.6, 0.08, 0.36, cm(0x7a6040)); lug.position.y = 0.84; g.add(lug);
  }
  const wheels = [];
  for (const x of [-0.32, 0.32]) for (const z of [-0.24, 0.24]) { const w = spokedWheel(0.15, { tube: 0.02, spokes: 6, color: 0x1d1d1f, hub: 0.04, depth: 0.03 }); w.position.set(x, 0.25, z); g.add(w); wheels.push(w); }
  mergeStatic(g, wheels);
  g.userData = { roll(dist) { for (const w of wheels) w.rotation.z = -dist / 0.15; }, length: 1.1 };
  return g;
}
// Баржа за канала, натоварена с въглища. Дължината е по x.
export function barge({ load = 'coal' } = {}) {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  sh.moveTo(-1.1, -0.17); sh.lineTo(0.9, -0.17); sh.quadraticCurveTo(1.15, 0, 0.9, 0.17); sh.lineTo(-1.1, 0.17); sh.closePath();
  const hull = new THREE.Mesh(G('hull', () => { const e = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: false }); e.rotateX(Math.PI / 2); e.translate(0, 0.22, 0); return e; }), IM('planks', { color: 0x6a4a2a, rep: [3, 1] }));
  hull.position.y = -0.1; g.add(hull);
  const stripe = box(2.0, 0.03, 0.36, cm(0xb03a2e)); stripe.position.set(-0.1, 0.1, 0); g.add(stripe);
  const cargo = box(1.4, 0.12, 0.28, IM(load === 'coal' ? 'coal' : 'planks', { color: load === 'coal' ? 0xffffff : 0xf0e6cc })); cargo.position.set(0.1, 0.16, 0); g.add(cargo);
  const cabin = box(0.4, 0.22, 0.3, cm(0x2f5a3a)); cabin.position.set(-0.85, 0.22, 0); g.add(cabin);
  const croof = box(0.44, 0.03, 0.34, cm(0xb03a2e)); croof.position.set(-0.85, 0.34, 0); g.add(croof);
  const tiller = box(0.3, 0.02, 0.02, WM('planks')); tiller.position.set(-1.2, 0.2, 0); g.add(tiller);
  const mast = cyl(0.015, 0.015, 0.45, IM('planks'), 6); mast.position.set(0.7, 0.3, 0); g.add(mast);
  g.userData = { mastTop: new THREE.Vector3(0.7, 0.5, 0) };
  return g;
}
// Шахта на мина: дървена кула с две колела (шайби), клетка, която се движи нагоре-надолу.
export function headframe() {
  const g = new THREE.Group();
  const wood = WM('planks', { color: 0x9a7a5a });
  const H = 2.6;
  for (const [x, z] of [[-0.45, -0.4], [0.45, -0.4], [-0.45, 0.4], [0.45, 0.4]]) {
    const l = box(0.08, H, 0.08, wood); l.position.set(x * 0.75, H / 2, z * 0.75); l.rotation.set(z * 0.08, 0, -x * 0.08); g.add(l);
  }
  for (let y = 0.6; y < H; y += 0.65) { for (const z of [-0.3, 0.3]) { const b = box(0.7, 0.05, 0.05, wood); b.position.set(0, y, z * (1 - y / H * 0.3)); g.add(b); } for (const x of [-0.3, 0.3]) { const b = box(0.05, 0.05, 0.7, wood); b.position.set(x * (1 - y / H * 0.3), y, 0); g.add(b); } }
  const top = box(0.6, 0.08, 0.6, wood); top.position.y = H; g.add(top);
  // Подпора към машинната зала (по -x).
  const strut = box(0.08, 2.2, 0.08, wood); strut.position.set(-0.8, 1.05, 0); strut.rotation.z = -0.45; g.add(strut);
  const sheaves = [];
  for (const z of [-0.14, 0.14]) { const s = spokedWheel(0.32, { tube: 0.03, spokes: 6, color: 0x2f3438, hub: 0.05, depth: 0.04 }); s.position.set(0, H + 0.28, z); g.add(s); sheaves.push(s); }
  const collar = box(0.9, 0.12, 0.9, cm(0x8a8070)); collar.position.y = 0.06; g.add(collar);
  const hole = box(0.6, 0.02, 0.6, cm(0x0a0a0a)); hole.position.y = 0.125; g.add(hole);
  const cage = new THREE.Group();
  const cg = box(0.36, 0.42, 0.36, cm(0x4a4f55, { metalness: 0.4 })); cg.position.y = 0.21; cage.add(cg);
  const tub = box(0.26, 0.14, 0.2, WM('coal')); tub.position.y = 0.12; cage.add(tub);
  g.add(cage);
  const ropes = [];
  for (const z of [-0.14, 0.14]) { const r = cyl(0.008, 0.008, 1, cm(0x222222), 4); g.add(r); ropes.push({ r, z }); }
  const diag = [];
  for (const z of [-0.14, 0.14]) { const r = cyl(0.008, 0.008, 1, cm(0x222222), 4); g.add(r); diag.push({ r, z }); }
  function set(t) {
    const y = 0.15 + (Math.sin(t) * 0.5 + 0.5) * 1.6;
    cage.position.y = y;
    for (const { r, z } of ropes) { r.position.set(0.3, (y + 0.42 + H + 0.28) / 2, z); r.scale.y = H + 0.28 - y - 0.42; }
    for (const s of sheaves) s.rotation.z = t * 3;
  }
  // Наклонените въжета към барабана в машинната зала (-x).
  for (const { r, z } of diag) {
    const A = new THREE.Vector3(-0.3, H + 0.28, z), B = new THREE.Vector3(-2.1, 1.2, z);
    const d = B.clone().sub(A); r.position.copy(A).addScaledVector(d, 0.5); r.scale.y = d.length(); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  }
  set(0);
  g.userData = { set, cage, sheaves, moving: [cage, ...sheaves, ...ropes.map((r) => r.r)] };
  return g;
}
// Вагонетка за въглища (с наклонени стени).
export function coalWagon() {
  const g = new THREE.Group();
  const b = new THREE.Mesh(G('cw', () => new THREE.CylinderGeometry(0.3, 0.2, 0.3, 4, 1)), IM('planks', { color: 0x8a6a4a }));
  b.rotation.y = Math.PI / 4; b.position.y = 0.33; b.scale.set(1.2, 1, 0.8); g.add(b);
  const c = box(0.4, 0.06, 0.28, WM('coal')); c.position.y = 0.49; g.add(c);
  for (const x of [-0.15, 0.15]) for (const z of [-0.14, 0.14]) { const w = cyl(0.08, 0.08, 0.03, IRON(), 10); w.rotation.x = Math.PI / 2; w.position.set(x, 0.1, z); g.add(w); }
  return g;
}
// Стара водна мелница: каменна сграда и водно колело с лопатки (оста по x).
export function waterMill() {
  const g = new THREE.Group();
  const stone = WM('cobble', { color: 0xd8d0c0 });
  const b = box(1.4, 1.2, 1.4, stone); b.position.y = 0.6; g.add(b);
  const rf = gable(1.4, 1.4, 0.55, { roof: WM('slate'), wall: stone }); rf.position.y = 1.2; g.add(rf);
  windowOn(g, 0, 0.75, 0.7, { w: 0.26, h: 0.36 });
  const door = box(0.28, 0.5, 0.03, WM('planks')); door.position.set(0.4, 0.25, 0.715); g.add(door);
  const wheel = new THREE.Group(); wheel.position.set(-0.95, 0.55, 0);
  const w = spokedWheel(0.6, { tube: 0.03, spokes: 8, color: 0x6b5a48, hub: 0.07, depth: 0.12 }); w.rotation.y = Math.PI / 2; wheel.add(w);
  for (let i = 0; i < 12; i++) { const p = box(0.18, 0.04, 0.14, WM('planks')); const a = (i / 12) * Math.PI * 2; p.position.set(0, Math.sin(a) * 0.6, Math.cos(a) * 0.6); p.rotation.x = -a; wheel.add(p); }
  mergeStatic(wheel);
  g.add(wheel);
  g.userData = { wheel };
  return g;
}

// ---------- дим и пара ----------
// Стълб дим от точка на обект (следва го, ако се движи). Връща { group, dispose, set({ rate, color }) }.
export function plume(stage, obj, local, { n = 7, size = 0.16, rise = 2.2, drift = 0.6, color = 0x5a5a5e, opacity = 0.5, speed = 0.16 } = {}) {
  const g = new THREE.Group();
  const geo = G('puff', () => new THREE.IcosahedronGeometry(1, 1));
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 1, depthWrite: false, flatShading: true }));
    m.userData = { ph: i / n, origin: new THREE.Vector3() };
    g.add(m); puffs.push(m);
  }
  stage.scene.add(g);
  const P = new THREE.Vector3();
  let on = 1, op = opacity;
  const off = stage.tick((dt, t) => {
    obj.updateWorldMatrix(true, false);
    P.copy(local).applyMatrix4(obj.matrixWorld);
    for (const s of puffs) {
      const prev = s.userData.k ?? 0;
      const k = (t * speed + s.userData.ph) % 1;
      if (k < prev) s.userData.origin.copy(P);
      s.userData.k = k;
      if (!s.userData.init) { s.userData.origin.copy(P); s.userData.init = true; }
      const o = s.userData.origin;
      s.position.set(o.x + k * drift + Math.sin(t * 0.7 + s.userData.ph * 9) * 0.08, o.y + k * rise, o.z - k * drift * 0.4);
      s.scale.setScalar(size * (0.6 + k * 2.6));
      s.material.opacity = op * on * (1 - k) * Math.min(1, k * 8);
      s.visible = on > 0.01;
    }
  });
  return {
    group: g,
    set({ rate, color: c, opacity: o } = {}) { if (rate !== undefined) on = rate; if (c !== undefined) for (const s of puffs) s.material.color.setHex(c); if (o !== undefined) op = o; },
    dispose() { off(); stage.scene.remove(g); },
  };
}
