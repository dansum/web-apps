// София и Кюстендил през 40-те години на XX век: хора в палта и шапки, трамвай, парен влак,
// гара на малък град, сградата на Светия синод (опростена), будка за вестници, голи зимни дървета.
// Всички модели са опростени възстановки — не са точни копия на сградите и машините.
import { THREE } from '../../kit.js';
import { M } from './architecture.js';
import { CM, col } from './city.js';
import { hipRoof, mergeStatic } from './revival.js';
import { bakeColors } from './industrial.js';

const GEO = new Map();
const G = (key, make) => { if (!GEO.has(key)) GEO.set(key, make()); return GEO.get(key); };
const box = (w, h, d, m) => new THREE.Mesh(G(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), m);
const cyl = (rt, rb, h, m, seg = 10) => new THREE.Mesh(G(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), m);
const sph = (r, m, ws = 10, hs = 8) => new THREE.Mesh(G(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)), m);
const DARK = () => col(0x2a2622);

// Надпис върху табела (кешира се по текст).
const SIGNS = new Map();
export function signMat(text, { bg = '#efe6cf', fg = '#2a2218', w = 512, h = 112, font = 'bold 64px Georgia, "Times New Roman", serif' } = {}) {
  const k = `${text}|${bg}|${fg}|${w}|${h}`;
  if (!SIGNS.has(k)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg; ctx.lineWidth = 4; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 3, w - 30);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    SIGNS.set(k, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
  }
  return SIGNS.get(k);
}

// ---------- хора ----------
// Палто, панталон или пола, шапка с периферия, барета или кърпа. Краката се движат при ходене.
const SKIN = 0xe0b58f;
const LOOKS = {
  man: { coat: 0x3a3f4a, legs: 0x2a2a2e, hat: 0x2b2b2b, brim: true },
  man2: { coat: 0x5a4a3a, legs: 0x3a3226, hat: 0x4a3e30, brim: true },
  worker: { coat: 0x4a4f3a, legs: 0x33302a, cap: 0x3a3a34 },
  woman: { coat: 0x7a2e2e, legs: 0x2a2a2e, scarf: 0xd8c8a8, skirt: true },
  woman2: { coat: 0x2f4a5a, legs: 0x2a2a2e, hat: 0x2f4a5a, skirt: true },
  kid: { coat: 0x6a7a3a, legs: 0x2f3a4a, cap: 0x8a3a2a, child: true },
  deputy: { coat: 0x22252c, legs: 0x1c1c20, hat: 0x1c1c1c, brim: true },
  peshev: { coat: 0x2c2f38, legs: 0x1c1c20, hat: 0x3a3a3a, brim: true, scarf: 0xb8b0a0, scarfNeck: true },
  priest: { robe: 0x16161a, beard: 0xd8d4cc, kalim: 0x101014 },
  partisan: { coat: 0x4a5236, legs: 0x3a3a2c, cap: 0x3a4030 },
};
export function person43(kind = 'man') {
  const L = LOOKS[kind] || LOOKS.man;
  const g = new THREE.Group();
  const k = L.child ? 0.74 : 1;
  const body = new THREE.Group(); g.add(body);
  const sk = col(SKIN);
  const legs = [];
  if (L.robe) {
    const robe = cyl(0.08, 0.15, 0.52, col(L.robe), 12); robe.position.y = 0.26; body.add(robe);
    for (const s of [-1, 1]) { const a = cyl(0.03, 0.04, 0.24, col(L.robe), 6); a.position.set(s * 0.1, 0.4, 0); a.rotation.z = s * 0.18; body.add(a); }
    const head = sph(0.072, sk); head.position.y = 0.6; body.add(head);
    const beard = sph(0.06, col(L.beard)); beard.scale.set(1, 1.3, 0.8); beard.position.set(0, 0.54, 0.035); body.add(beard);
    const hat = cyl(0.07, 0.068, 0.15, col(L.kalim), 12); hat.position.y = 0.71; body.add(hat);
    const veil = box(0.13, 0.2, 0.02, col(L.kalim)); veil.position.set(0, 0.66, -0.07); body.add(veil);
    const cross = box(0.02, 0.05, 0.01, col(0xd8b23a, { metal: 0.6, rough: 0.3 })); cross.position.set(0, 0.42, 0.11); body.add(cross);
  } else {
    for (const s of [-1, 1]) {
      const pv = new THREE.Group(); pv.position.set(s * 0.045, 0.27, 0);
      const l = cyl(0.032, 0.03, 0.26, col(L.legs), 8); l.position.y = -0.13; pv.add(l);
      const sh = box(0.05, 0.03, 0.09, col(0x1e1a16)); sh.position.set(0, -0.255, 0.015); pv.add(sh);
      g.add(pv); legs.push(pv);
    }
    const coat = cyl(0.075, L.skirt ? 0.12 : 0.1, 0.34, col(L.coat), 10); coat.position.y = 0.37; body.add(coat);
    const belt = cyl(0.079, 0.082, 0.025, col(0x1e1a16), 10); belt.position.y = 0.38; body.add(belt);
    for (const s of [-1, 1]) { const a = cyl(0.025, 0.023, 0.23, col(L.coat), 6); a.position.set(s * 0.1, 0.42, 0); a.rotation.z = s * 0.12; body.add(a); const hd = sph(0.022, sk); hd.position.set(s * 0.115, 0.29, 0); body.add(hd); }
    const head = sph(0.072, sk); head.position.y = 0.61; body.add(head);
    if (L.scarf && !L.scarfNeck) { const sc = sph(0.082, col(L.scarf)); sc.scale.set(1, 0.95, 1); sc.position.set(0, 0.625, -0.012); body.add(sc); }
    else { const hair = sph(0.074, col(0x3a2a1e), 10, 6); hair.scale.y = 0.7; hair.position.set(0, 0.63, -0.01); body.add(hair); }
    if (L.scarfNeck) { const n = cyl(0.06, 0.07, 0.04, col(L.scarf), 10); n.position.y = 0.54; body.add(n); }
    if (L.hat) {
      if (L.brim) { const b = cyl(0.11, 0.11, 0.012, col(L.hat), 14); b.position.y = 0.665; body.add(b); }
      const c = cyl(0.062, 0.07, 0.07, col(L.hat), 12); c.position.y = 0.7; body.add(c);
    }
    if (L.cap) { const c = cyl(0.075, 0.078, 0.04, col(L.cap), 12); c.position.y = 0.67; body.add(c); const p = box(0.09, 0.01, 0.06, col(L.cap)); p.position.set(0, 0.655, 0.07); body.add(p); }
    if (L.skirt) { const sk2 = cyl(0.1, 0.13, 0.12, col(L.coat), 10); sk2.position.y = 0.2; body.add(sk2); }
  }
  bakeColors(body);
  g.scale.setScalar(k);
  g.userData.legs = legs;
  g.userData.kind = kind;
  return g;
}
// Крачка: краката се люлеят; amount = 0 спира.
export function step43(p, phase, amount = 1) {
  const a = Math.sin(phase) * 0.5 * amount;
  const L = p.userData.legs; if (!L || !L.length) return;
  L[0].rotation.x = a; L[1].rotation.x = -a;
}
// Вързоп или куфар в ръката.
export function bundle({ suitcase = false } = {}) {
  const m = suitcase ? col(0x5a3a22) : col(0xb89a6a);
  const g = suitcase ? box(0.12, 0.09, 0.04, m) : sph(0.06, m);
  return g;
}

// ---------- дървета без листа (март) ----------
export function bareTree(s = 1, seed = 1) {
  const g = new THREE.Group();
  const bark = col(0x4a3a2c, { rough: 0.95 });
  const tr = cyl(0.035 * s, 0.06 * s, 0.9 * s, bark, 7); tr.position.y = 0.45 * s; g.add(tr);
  let r = seed * 9301;
  const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + rnd() * 0.4, len = (0.35 + rnd() * 0.25) * s;
    const b = cyl(0.008 * s, 0.022 * s, len, bark, 5);
    b.position.set(Math.cos(a) * len * 0.35, (0.65 + rnd() * 0.3) * s, Math.sin(a) * len * 0.35);
    b.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); g.add(b);
    for (let j = 0; j < 2; j++) {
      const t = cyl(0.004 * s, 0.009 * s, len * 0.6, bark, 4);
      t.position.set(b.position.x * 1.7 + (rnd() - 0.5) * 0.1 * s, b.position.y + 0.18 * s, b.position.z * 1.7 + (rnd() - 0.5) * 0.1 * s);
      t.rotation.set((rnd() - 0.5) * 1.2, 0, (rnd() - 0.5) * 1.2); g.add(t);
    }
  }
  return mergeStatic(g);
}

// ---------- трамвай ----------
// Жълт двуосен трамвай с тролей. Посоката на движение е +x.
export function tram() {
  const g = new THREE.Group();
  const yel = col(0xe0b030, { rough: 0.55 }), cream = col(0xf2e6c4), dark = DARK();
  const body = box(1.3, 0.42, 0.5, yel); body.position.y = 0.42; g.add(body);
  const low = box(1.32, 0.12, 0.52, col(0x8a2a22)); low.position.y = 0.24; g.add(low);
  const roof = box(1.26, 0.06, 0.54, cream); roof.position.y = 0.66; g.add(roof);
  const lant = box(0.8, 0.05, 0.3, cream); lant.position.y = 0.71; g.add(lant);
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const w = box(0.15, 0.17, 0.01, col(0x2c3d4a, { rough: 0.25 })); w.position.set(-0.5 + i * 0.2, 0.5, s * 0.255); g.add(w); }
  for (const s of [-1, 1]) { const f = box(0.01, 0.17, 0.36, col(0x2c3d4a, { rough: 0.25 })); f.position.set(s * 0.655, 0.5, 0); g.add(f); const lamp = sph(0.025, col(0xfff2c0)); lamp.position.set(s * 0.66, 0.3, 0); g.add(lamp); }
  const pole = box(0.7, 0.012, 0.012, dark); pole.position.set(-0.1, 0.95, 0); pole.rotation.z = 0.5; g.add(pole);
  for (const x of [-0.4, 0.4]) for (const z of [-0.2, 0.2]) { const w = cyl(0.08, 0.08, 0.03, dark, 12); w.rotation.x = Math.PI / 2; w.position.set(x, 0.14, z); g.add(w); }
  return mergeStatic(g);
}
export function tramRails(len) {
  const g = new THREE.Group();
  for (const z of [-0.2, 0.2]) { const r = box(len, 0.012, 0.03, col(0x6e6e70, { metal: 0.6, rough: 0.4 })); r.position.set(0, 0.035, z); g.add(r); }
  return mergeStatic(g);
}

// ---------- парен влак ----------
// Локомотив (черен котел, червени колела) и вагони. Посоката на движение е +x.
export function locomotive() {
  const g = new THREE.Group();
  const black = col(0x1d1d1f, { rough: 0.5, metal: 0.3 }), red = col(0x9a2a22), brass = col(0xc9a640, { metal: 0.6, rough: 0.35 });
  const frame = box(1.5, 0.07, 0.46, black); frame.position.y = 0.32; g.add(frame);
  const boiler = cyl(0.2, 0.2, 1.0, black, 16); boiler.rotation.z = Math.PI / 2; boiler.position.set(0.18, 0.58, 0); g.add(boiler);
  for (const x of [-0.15, 0.2, 0.55]) { const b = cyl(0.205, 0.205, 0.02, brass, 16); b.rotation.z = Math.PI / 2; b.position.set(x, 0.58, 0); g.add(b); }
  const front = cyl(0.21, 0.21, 0.04, col(0x2a2a2e), 16); front.rotation.z = Math.PI / 2; front.position.set(0.69, 0.58, 0); g.add(front);
  const lamp = sph(0.04, col(0xfff2c0)); lamp.position.set(0.72, 0.82, 0); g.add(lamp);
  const chim = cyl(0.06, 0.07, 0.24, black, 10); chim.position.set(0.55, 0.88, 0); g.add(chim);
  const dome = sph(0.08, brass); dome.scale.y = 0.8; dome.position.set(0.15, 0.8, 0); g.add(dome);
  const cab = box(0.45, 0.5, 0.5, black); cab.position.set(-0.5, 0.65, 0); g.add(cab);
  const cabRoof = box(0.52, 0.04, 0.56, col(0x2a2a2e)); cabRoof.position.set(-0.5, 0.92, 0); g.add(cabRoof);
  for (const s of [-1, 1]) { const w = box(0.18, 0.15, 0.01, col(0x2c3d4a)); w.position.set(-0.5, 0.75, s * 0.255); g.add(w); }
  const buffer = box(0.06, 0.08, 0.5, red); buffer.position.set(0.76, 0.33, 0); g.add(buffer);
  const wheels = [];
  for (const x of [-0.45, -0.05, 0.3]) for (const z of [-0.24, 0.24]) {
    const w = new THREE.Group(); w.position.set(x, 0.2, z);
    const disc = cyl(0.17, 0.17, 0.04, red, 16); disc.rotation.x = Math.PI / 2; w.add(disc);
    const spoke = box(0.3, 0.03, 0.045, black); w.add(spoke);
    g.add(w); wheels.push(w);
  }
  mergeStatic(g, wheels);
  g.userData = { roll(d) { wheels.forEach((w) => { w.rotation.z = -d / 0.17; }); }, chimney: new THREE.Vector3(0.55, 1.02, 0), length: 1.6 };
  return g;
}
export function wagon({ color = 0x2f5a3a } = {}) {
  const g = new THREE.Group();
  const body = box(1.3, 0.44, 0.5, CM('plaster', { color })); body.position.y = 0.52; g.add(body);
  const roof = box(1.34, 0.06, 0.54, col(0x3a3a3c)); roof.position.y = 0.77; g.add(roof);
  const fr = box(1.3, 0.05, 0.46, col(0x1d1d1f)); fr.position.y = 0.28; g.add(fr);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const w = box(0.14, 0.14, 0.01, col(0x2c3d4a, { rough: 0.25 })); w.position.set(-0.48 + i * 0.24, 0.6, s * 0.255); g.add(w); }
  const wheels = [];
  for (const x of [-0.45, 0.45]) for (const z of [-0.24, 0.24]) { const w = cyl(0.13, 0.13, 0.04, col(0x1d1d1f), 12); w.rotation.x = Math.PI / 2; w.position.set(x, 0.18, z); g.add(w); }
  mergeStatic(g, wheels);
  g.userData.length = 1.4;
  return g;
}
// Релсов път по x: баласт, траверси, релси.
export function railway(len) {
  const g = new THREE.Group();
  const bal = box(len, 0.06, 0.62, col(0x8a8274, { rough: 1 })); bal.position.y = 0.03; g.add(bal);
  const sl = col(0x5a4632);
  for (let x = -len / 2 + 0.15; x < len / 2; x += 0.3) { const s = box(0.1, 0.03, 0.56, sl); s.position.set(x, 0.075, 0); g.add(s); }
  for (const z of [-0.2, 0.2]) { const r = box(len, 0.04, 0.03, col(0x6e6e70, { metal: 0.6, rough: 0.4 })); r.position.set(0, 0.11, z); g.add(r); }
  return mergeStatic(g);
}

// ---------- гара на малък град ----------
// Двуетажна сграда с мазилка, керемиден покрив, часовник, табела с името; перон с навес. Лицето (към релсите) гледа по +z.
export function stationHouse(name = 'КЮСТЕНДИЛ', { w = 2.4, d = 1.0 } = {}) {
  const g = new THREE.Group();
  const wall = CM('plaster', { color: 0xe9d7a8, rep: [3, 1] }), trim = col(0xf6efe0);
  const h = 1.1;
  const base = box(w + 0.04, 0.14, d + 0.04, M(0xffffff, { tex: 'stone', rep: [4, 0.3] })); base.position.y = 0.07; g.add(base);
  const body = box(w, h, d, wall); body.position.y = h / 2; g.add(body);
  const band = box(w + 0.04, 0.04, d + 0.04, trim); band.position.y = 0.56; g.add(band);
  const roof = hipRoof(w + 0.25, d + 0.3, 0.45); roof.position.y = h; g.add(roof);
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.25 + i * (w - 0.5) / 5;
    for (const y of [0.3, 0.82]) {
      const fr = box(0.18, 0.26, 0.015, trim); fr.position.set(x, y, d / 2 + 0.006); g.add(fr);
      const gl = box(0.14, 0.22, 0.02, col(0x2f3f4a, { rough: 0.3 })); gl.position.set(x, y, d / 2 + 0.008); g.add(gl);
    }
  }
  const door = box(0.26, 0.4, 0.02, col(0x4a3420)); door.position.set(0, 0.2, d / 2 + 0.01); g.add(door);
  const sign = box(1.2, 0.18, 0.02, signMat(name)); sign.position.set(0, 1.22, d / 2 + 0.12); g.add(sign);
  const clock = cyl(0.1, 0.1, 0.02, col(0xf6f2e8), 16); clock.rotation.x = Math.PI / 2; clock.position.set(0, 0.62, d / 2 + 0.02); g.add(clock);
  const hand = box(0.012, 0.08, 0.01, DARK()); hand.position.set(0, 0.65, d / 2 + 0.035); g.add(hand);
  // Перон с навес.
  const pl = box(w + 1.2, 0.12, 0.6, M(0xd9d2c4)); pl.position.set(0, 0.06, d / 2 + 0.3); g.add(pl);
  for (let i = 0; i < 4; i++) { const p = cyl(0.025, 0.025, 0.75, col(0x2f4a3a), 8); p.position.set(-w / 2 + 0.1 + i * (w - 0.2) / 3, 0.5, d / 2 + 0.52); g.add(p); }
  const can = box(w + 0.2, 0.04, 0.6, col(0x6a5a48)); can.position.set(0, 0.88, d / 2 + 0.32); can.rotation.x = -0.12; g.add(can);
  const bench = box(0.5, 0.04, 0.12, col(0x6b4a2c)); bench.position.set(-0.7, 0.28, d / 2 + 0.12); g.add(bench);
  g.userData.top = h + 0.7;
  return mergeStatic(g);
}
// Малка къща в провинциален град (мазилка, керемиди, комин).
export function smallHouse({ w = 1.1, d = 0.9, color = 0xf1e6cc } = {}) {
  const g = new THREE.Group();
  const h = 0.62;
  const body = box(w, h, d, CM('plaster', { color })); body.position.y = h / 2; g.add(body);
  const roof = hipRoof(w + 0.22, d + 0.22, 0.34); roof.position.y = h; g.add(roof);
  for (const x of [-w * 0.25, w * 0.25]) { const wn = box(0.14, 0.18, 0.02, col(0x2f3f4a)); wn.position.set(x, 0.36, d / 2 + 0.01); g.add(wn); }
  const door = box(0.16, 0.3, 0.02, col(0x5a3d22)); door.position.set(0, 0.15, d / 2 + 0.012); g.add(door);
  const ch = box(0.08, 0.2, 0.08, col(0xa0583a)); ch.position.set(w * 0.25, h + 0.25, 0); g.add(ch);
  g.userData.chimney = new THREE.Vector3(w * 0.25, h + 0.4, 0);
  return mergeStatic(g);
}

// ---------- сградата на Светия синод (опростена) ----------
// Представителна сграда с мазилка и каменен цокъл, средна част с фронтон и малък купол с кръст.
export function synodBuilding({ w = 2.6, d = 1.2 } = {}) {
  const g = new THREE.Group();
  const wall = CM('plaster', { color: 0xe6d6b4, rep: [3, 1] }), trim = col(0xf7f0e2);
  const h = 1.15;
  const base = box(w + 0.04, 0.2, d + 0.04, M(0xffffff, { tex: 'stone', rep: [4, 0.4] })); base.position.y = 0.1; g.add(base);
  const body = box(w, h, d, wall); body.position.y = h / 2; g.add(body);
  const cor = box(w + 0.1, 0.06, d + 0.1, trim); cor.position.y = h + 0.03; g.add(cor);
  const roof = hipRoof(w + 0.1, d + 0.1, 0.32); roof.position.y = h + 0.06; g.add(roof);
  // Средна част.
  const mw = 0.9;
  const mid = box(mw, h + 0.25, 0.14, wall); mid.position.set(0, (h + 0.25) / 2, d / 2 + 0.05); g.add(mid);
  const tri = new THREE.Mesh(G('synTri', () => new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-0.5, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0, 0.24)]), { depth: 0.14, bevelEnabled: false })), trim);
  tri.position.set(0, h + 0.25, d / 2 - 0.02); g.add(tri);
  const drum = cyl(0.16, 0.16, 0.2, wall, 12); drum.position.set(0, h + 0.42, 0); g.add(drum);
  const dome = new THREE.Mesh(G('synDome', () => new THREE.SphereGeometry(0.17, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2)), col(0x5f9a84, { rough: 0.5, metal: 0.2 }));
  dome.position.set(0, h + 0.52, 0); g.add(dome);
  const gold = col(0xd8b23a, { metal: 0.75, rough: 0.28 });
  const cv = box(0.02, 0.16, 0.02, gold); cv.position.set(0, h + 0.77, 0); g.add(cv);
  const chz = box(0.09, 0.02, 0.02, gold); chz.position.set(0, h + 0.8, 0); g.add(chz);
  // Прозорци с арки.
  for (let i = 0; i < 8; i++) {
    const x = -w / 2 + 0.2 + i * (w - 0.4) / 7;
    if (Math.abs(x) < mw / 2) continue;
    for (const y of [0.4, 0.86]) {
      const fr = box(0.16, 0.26, 0.015, trim); fr.position.set(x, y, d / 2 + 0.006); g.add(fr);
      const gl = box(0.12, 0.22, 0.02, col(0x2f3f4a, { rough: 0.3 })); gl.position.set(x, y, d / 2 + 0.008); g.add(gl);
      const ar = cyl(0.08, 0.08, 0.016, trim, 10); ar.rotation.x = Math.PI / 2; ar.position.set(x, y + 0.13, d / 2 + 0.006); g.add(ar);
    }
  }
  for (const y of [0.86]) for (const x of [-0.22, 0.22]) { const gl = box(0.13, 0.26, 0.02, col(0x2f3f4a, { rough: 0.3 })); gl.position.set(x, y, d / 2 + 0.125); g.add(gl); }
  const door = box(0.3, 0.46, 0.02, col(0x4a3420)); door.position.set(0, 0.43, d / 2 + 0.125); g.add(door);
  const steps = box(mw + 0.1, 0.1, 0.3, M(0xd9d2c4)); steps.position.set(0, 0.05, d / 2 + 0.25); g.add(steps);
  g.userData.top = h + 0.9;
  return mergeStatic(g);
}

// ---------- будка за вестници ----------
export function kiosk(paperMat) {
  const g = new THREE.Group();
  const green = col(0x2f5a3a, { rough: 0.6 });
  const body = cyl(0.32, 0.32, 0.9, green, 12); body.position.y = 0.45; g.add(body);
  const roof = new THREE.Mesh(G('kioskRoof', () => new THREE.ConeGeometry(0.42, 0.3, 12)), green); roof.position.y = 1.05; g.add(roof);
  const ball = sph(0.04, col(0xd8b23a, { metal: 0.6, rough: 0.3 })); ball.position.y = 1.23; g.add(ball);
  const ring = cyl(0.335, 0.335, 0.08, col(0xe6dcc6), 12); ring.position.y = 0.85; g.add(ring);
  if (paperMat) for (let i = 0; i < 3; i++) { const a = -0.6 + i * 0.6; const p = box(0.2, 0.28, 0.01, paperMat); p.position.set(Math.sin(a) * 0.33, 0.5, Math.cos(a) * 0.33); p.rotation.y = a; g.add(p); }
  g.userData.top = 1.3;
  return mergeStatic(g);
}

// ---------- обява на стена (табло с хартия) ----------
export function noticeBoard(paperMat) {
  const g = new THREE.Group();
  const wood = col(0x5a3d22);
  for (const s of [-1, 1]) { const p = box(0.05, 1.0, 0.05, wood); p.position.set(s * 0.4, 0.5, 0); g.add(p); }
  const b = box(0.9, 0.62, 0.04, wood); b.position.y = 0.72; g.add(b);
  const paper = box(0.8, 0.54, 0.01, paperMat); paper.position.set(0, 0.72, 0.026); g.add(paper);
  const rf = box(0.98, 0.04, 0.16, wood); rf.position.set(0, 1.06, 0.03); rf.rotation.x = 0.3; g.add(rf);
  g.userData.top = 1.15;
  return mergeStatic(g);
}

// ---------- партизански лагер (спокойна сцена) ----------
// Землянка, огнище с котле, раница и дърва.
export function forestCamp() {
  const g = new THREE.Group();
  const earth = col(0x5a4632, { rough: 1 }), wood = col(0x6b4a2c);
  const dug = new THREE.Mesh(G('dugout', () => new THREE.SphereGeometry(0.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)), earth); dug.scale.set(1.3, 0.55, 0.9); g.add(dug);
  const door = box(0.22, 0.24, 0.02, col(0x2a2018)); door.position.set(0, 0.12, 0.44); g.add(door);
  for (let i = 0; i < 5; i++) { const l = cyl(0.025, 0.025, 0.4, wood, 6); const a = i * 1.25; l.position.set(0.9 + Math.cos(a) * 0.06, 0.03, 0.7 + Math.sin(a) * 0.06); l.rotation.set(Math.PI / 2, 0, a); g.add(l); }
  const stones = col(0x8a8a84);
  for (let i = 0; i < 8; i++) { const s = sph(0.04, stones); const a = i * Math.PI / 4; s.position.set(0.9 + Math.cos(a) * 0.17, 0.02, 0.7 + Math.sin(a) * 0.17); g.add(s); }
  const pot = cyl(0.07, 0.06, 0.08, col(0x2a2a2e), 10); pot.position.set(0.9, 0.18, 0.7); g.add(pot);
  for (const s of [-1, 1]) { const st = cyl(0.01, 0.01, 0.3, wood, 5); st.position.set(0.9 + s * 0.15, 0.15, 0.7); g.add(st); }
  const bar = cyl(0.008, 0.008, 0.32, wood, 5); bar.rotation.z = Math.PI / 2; bar.position.set(0.9, 0.29, 0.7); g.add(bar);
  const pack = box(0.14, 0.16, 0.08, col(0x5a5a3a)); pack.position.set(-0.4, 0.08, 0.6); g.add(pack);
  const log = cyl(0.05, 0.05, 0.6, wood, 8); log.rotation.z = Math.PI / 2; log.position.set(0.9, 0.05, 1.05); g.add(log);
  g.userData.fire = new THREE.Vector3(0.9, 0.08, 0.7);
  return mergeStatic(g);
}
