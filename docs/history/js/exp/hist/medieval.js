// Средновековни модели (Търновград и подобни градове): скални хълмове, река, каменни стени и кули,
// порта, църкви с ивици от камък и тухла, дворец, къщи, дюкяни, мост, кервани, хора от епохата,
// книжовник на маса и университетска зала. Нисък полигон, кеширани текстури.
import { mat, THREE } from '../../kit.js';
import { crenellatedWall, gableRoof, archGeo, M, TEX } from './architecture.js';
import { person } from './antiquity.js';
import { animal } from './thrace.js';

// ---------- текстури ----------
const cache = new Map();
function tex(key, size, draw, rep = [1, 1]) {
  const k = `${key}|${rep}`;
  if (cache.has(k)) return cache.get(k);
  let base = cache.get(key);
  if (!base) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
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
  // Търновски стил: редове камък, редуващи се с ивици тухли, и малки керамични розетки.
  banded(ctx, s) {
    const r = rnd(5);
    ctx.fillStyle = '#d8c9a8'; ctx.fillRect(0, 0, s, s);
    const band = s / 4;
    for (let b = 0; b < 4; b++) {
      const y0 = b * band;
      for (let x = 0; x < s; x += s / 4) { const v = (r() - 0.5) * 30; ctx.fillStyle = `rgb(${205 + v},${190 + v},${160 + v})`; ctx.fillRect(x + 2, y0 + 2, s / 4 - 4, band * 0.62 - 3); }
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#a5503a' : '#b85f42'; ctx.fillRect(0, y0 + band * 0.62 + k * band * 0.12, s, band * 0.1); }
    }
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#3f8a5a' : '#d9a83a'; ctx.beginPath(); ctx.arc(s / 8 + i * s / 4, band * 0.31, 7, 0, 7); ctx.fill(); }
  },
  // Варосана стена с тъмни дървени греди.
  timber(ctx, s) {
    ctx.fillStyle = '#efe8d8'; ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#5b3f28';
    ctx.fillRect(0, 0, s, 10); ctx.fillRect(0, s - 10, s, 10);
    for (const x of [0, s / 2 - 5, s - 10]) ctx.fillRect(x, 0, 10, s);
    ctx.strokeStyle = '#5b3f28'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(10, s - 10); ctx.lineTo(s / 2 - 5, 10); ctx.moveTo(s / 2 + 5, 10); ctx.lineTo(s - 10, s - 10); ctx.stroke();
  },
  grass(ctx, s) {
    ctx.fillStyle = '#93ad62'; ctx.fillRect(0, 0, s, s);
    const r = rnd(17); for (let i = 0; i < 700; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '60,90,30' : '200,215,140'},${0.12 + r() * 0.15})`; ctx.fillRect(r() * s, r() * s, 3, 3); }
  },
  water(ctx, s) {
    ctx.fillStyle = '#4f96c4'; ctx.fillRect(0, 0, s, s);
    const r = rnd(23); ctx.strokeStyle = 'rgba(220,240,255,0.45)'; ctx.lineWidth = 2;
    for (let i = 0; i < 26; i++) { const x = r() * s, y = r() * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (r() - 0.5) * 6, y + 14 + r() * 18); ctx.stroke(); }
  },
  field(ctx, s) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 8) { ctx.fillStyle = y % 16 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0)'; ctx.fillRect(0, y, s, 4); }
  },
  cobble(ctx, s) {
    ctx.fillStyle = '#b9ad98'; ctx.fillRect(0, 0, s, s);
    const r = rnd(29);
    for (let i = 0; i < 90; i++) { const v = (r() - 0.5) * 40; ctx.fillStyle = `rgb(${165 + v},${155 + v},${138 + v})`; ctx.beginPath(); ctx.ellipse(r() * s, r() * s, 6 + r() * 6, 5 + r() * 4, r() * 3, 0, 7); ctx.fill(); }
  },
};
const MATS = new Map();
export function MM(name, { color = 0xffffff, rep = [1, 1], side, rough = 0.85 } = {}) {
  const k = `${name}|${color}|${rep}|${side}|${rough}`;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, map: tex(name, 256, DRAW[name], rep), roughness: rough, side: side ?? THREE.FrontSide }));
  return MATS.get(k);
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const STONE = () => M(0xffffff, { tex: 'stone', rep: [1, 1] });

// ---------- природа ----------
// Скален хълм с плосък връх: контур [[x, z], …], височина h. Отгоре трева, отстрани скала.
export function cliffHill(points, h, { bevel = 0.6 } = {}) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const bt = 0.35;
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h - bt, bevelEnabled: true, bevelThickness: bt, bevelSize: bevel, bevelSegments: 3, curveSegments: 4 });
  const grass = MM('grass', { rep: [0.25, 0.25] });
  const rock = new THREE.MeshStandardMaterial({ color: 0xd8c8a6, map: (() => { const t = TEX.rock([0.35, 0.6]); return t; })(), roughness: 0.95, flatShading: true });
  const m = new THREE.Mesh(geo, [grass, rock]);
  m.rotation.x = -Math.PI / 2;
  m.position.y = -bt;
  const g = new THREE.Group(); g.add(m);
  g.userData.top = h;
  return g;
}
// Река по крива: лента с течаща вода. Връща { mesh, curve, tick(dt) }.
export function river(pts, { width = 1.6, y = 0.03 } = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y, z)));
  const N = 160, pos = [], uv = [], idx = [];
  const len = curve.getLength();
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t), d = curve.getTangentAt(t);
    const nx = -d.z, nz = d.x, l = Math.hypot(nx, nz) || 1;
    for (const s of [-1, 1]) { pos.push(p.x + (nx / l) * s * width / 2, y, p.z + (nz / l) * s * width / 2); uv.push((s + 1) / 2, (t * len) / 2); }
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const t = tex('water', 128, DRAW.water).clone(); t.needsUpdate = true;
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.25, side: THREE.DoubleSide }));
  // Брегове.
  const bank = new THREE.Mesh(geo.clone(), new THREE.MeshStandardMaterial({ color: 0xb9a77d, side: THREE.DoubleSide }));
  bank.scale.set(1, 1, 1); bank.position.y = -0.012;
  const g = new THREE.Group(); g.add(m);
  return { group: g, curve, tick(dt) { t.offset.y -= dt * 0.35; } };
}
// Нива: правоъгълник с бразди; цветът се сменя (зряло жито, лоша реколта).
export function field(w, d, color = 0xd8b85a) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, map: tex('field', 64, DRAW.field, [1, Math.max(1, Math.round(d))]) }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.02;
  return m;
}
export function tree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6), mat(0x6b4f36)); trunk.position.y = 0.2;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), mat(0x5d8a3c, { flat: true })); crown.position.y = 0.55;
  g.add(trunk, crown); g.scale.setScalar(s);
  g.userData.crown = crown;
  return g;
}

// ---------- укрепления ----------
export function stoneWall(len, { h = 0.75, t = 0.26 } = {}) { return crenellatedWall(len, { h, t, mud: false }); }
// Четириъгълна каменна кула със зъбци и тесни прозорци; по желание с керемиден покрив.
export function stoneTower({ s = 0.7, h = 1.3, roof = false } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [1, 2] });
  const body = box(s, h, s, sm); body.position.y = h / 2; g.add(body);
  const plinth = box(s + 0.08, 0.16, s + 0.08, STONE()); plinth.position.y = 0.08; g.add(plinth);
  const cornice = box(s + 0.08, 0.06, s + 0.08, M(0xb5ab98)); cornice.position.y = h; g.add(cornice);
  if (roof) {
    const r = new THREE.Mesh(new THREE.ConeGeometry(s * 0.78, s * 0.6, 4), M(0xffffff, { tex: 'tiles', rep: [3, 1] }));
    r.rotation.y = Math.PI / 4; r.position.y = h + s * 0.3 + 0.03; g.add(r);
  } else {
    const mer = M(0xffffff, { tex: 'stone', rep: [0.3, 0.3] });
    for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) {
      const a = s / 2, off = -a + 0.06 + k * (s - 0.12) / 2;
      const m = box(0.11, 0.13, 0.11, mer);
      m.position.set(i < 2 ? off : (i === 2 ? a - 0.05 : -a + 0.05), h + 0.09, i < 2 ? (i ? a - 0.05 : -a + 0.05) : off); g.add(m);
    }
  }
  const dark = M(0x2a2622);
  for (const y of [h * 0.45, h * 0.75]) for (const [x, z, w, d] of [[0, s / 2 + 0.002, 0.05, 0.005], [s / 2 + 0.002, 0, 0.005, 0.05], [0, -s / 2 - 0.002, 0.05, 0.005], [-s / 2 - 0.002, 0, 0.005, 0.05]]) {
    const win = box(w, 0.13, d, dark); win.position.set(x, y, z); g.add(win);
  }
  g.userData.height = h;
  return g;
}
// Порта: две кули, каменна арка и дървени крила на портата. Отворът гледа по +x.
export function gatehouse({ w = 1.5, h = 1.0 } = {}) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const t = stoneTower({ s: 0.6, h: h + 0.35 }); t.position.z = s * (w / 2 + 0.05); g.add(t); }
  const arch = new THREE.Mesh(archGeo(w - 0.4, h, 0.4, 0.62), M(0xffffff, { tex: 'stone', rep: [1, 1] }));
  arch.rotation.y = Math.PI / 2; g.add(arch);
  const top = box(0.44, 0.08, w - 0.35, M(0xb5ab98)); top.position.y = h + 0.04; g.add(top);
  for (let i = 0; i < 3; i++) { const m = box(0.36, 0.12, 0.12, M(0xffffff, { tex: 'stone', rep: [0.3, 0.3] })); m.position.set(0, h + 0.14, -0.28 + i * 0.28); g.add(m); }
  const wood = M(0x6b4524);
  const leaves = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(0.21, 0, s * 0.22);
    const leaf = box(0.03, h * 0.62, 0.22, wood); leaf.position.set(0, h * 0.31, -s * 0.11); hinge.add(leaf);
    for (const y of [0.15, 0.45]) { const band = box(0.035, 0.03, 0.22, M(0x2f2f33, { metal: 0.5 })); band.position.set(0, y, -s * 0.11); hinge.add(band); }
    g.add(hinge); leaves.push({ hinge, s });
  }
  g.userData.hinges = leaves.map((l) => l.hinge);
  g.userData.setOpen = (k) => { for (const { hinge, s } of leaves) hinge.rotation.y = s * k * 1.4; };
  g.userData.setOpen(1);
  return g;
}

// ---------- църкви ----------
// Кръстокуполна църква в търновски стил: ивици камък и тухла, керамични розетки, апсида на изток (+x),
// купол на барабан, притвор и по желание камбанария.
export function tarnovoChurch({ L = 1.3, W = 0.8, H = 0.75, bell = false, ruin = false } = {}) {
  const g = new THREE.Group();
  const wm = MM('banded', { rep: [2, 1] });
  if (ruin) {
    // Разкопани основи: ниски стени.
    const low = MM('banded', { rep: [2, 0.3] });
    for (const [x, z, w, d] of [[0, W / 2, L, 0.08], [0, -W / 2, L, 0.08], [-L / 2, 0, 0.08, W], [L / 2, 0, 0.08, W * 0.3]]) { const b = box(w, 0.18, d, low); b.position.set(x, 0.09, z); g.add(b); }
    const ap = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.3, W * 0.3, 0.18, 14, 1, true, 0, Math.PI), M(0xd8c9a8, { side: THREE.DoubleSide })); ap.position.set(L / 2, 0.09, 0); g.add(ap);
    return g;
  }
  const body = box(L, H, W, wm); body.position.y = H / 2; g.add(body);
  // Кръстовидни рамене с фронтони.
  const arm = box(L * 0.42, H * 1.18, W + 0.16, wm); arm.position.y = H * 0.59; g.add(arm);
  const roofA = gableRoof(L + 0.05, W + 0.08, 0.22); roofA.position.y = H; g.add(roofA);
  const roofB = gableRoof(W + 0.24, L * 0.46, 0.22); roofB.rotation.y = Math.PI / 2; roofB.position.y = H * 1.18; g.add(roofB);
  // Апсида.
  const ap = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.32, W * 0.32, H * 0.8, 16, 1, false, 0, Math.PI), wm);
  ap.position.set(L / 2, H * 0.4, 0); g.add(ap);
  const apR = new THREE.Mesh(new THREE.SphereGeometry(W * 0.33, 14, 6, 0, Math.PI, 0, Math.PI / 2), M(0xffffff, { tex: 'tiles', rep: [2, 1] }));
  apR.position.set(L / 2, H * 0.8, 0); g.add(apR);
  // Барабан и купол.
  const dy = H * 1.18 + 0.2;
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.24, W * 0.26, 0.32, 12), wm); drum.position.y = dy + 0.06; g.add(drum);
  const dark = M(0x2a2622);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const w = box(0.03, 0.14, 0.03, dark); w.position.set(Math.cos(a) * W * 0.25, dy + 0.08, Math.sin(a) * W * 0.25); g.add(w); }
  const dome = new THREE.Mesh(new THREE.SphereGeometry(W * 0.27, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xffffff, { tex: 'tiles', rep: [4, 1] }));
  dome.position.y = dy + 0.22; g.add(dome);
  const gold = M(0xd4af37, { metal: 0.7, rough: 0.3 });
  const cv = box(0.025, 0.2, 0.025, gold); cv.position.y = dy + 0.22 + W * 0.27 + 0.1; g.add(cv);
  const ch = box(0.025, 0.025, 0.11, gold); ch.position.y = dy + 0.22 + W * 0.27 + 0.14; g.add(ch);
  // Слепи арки и прозорци по дългите стени.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = -L / 2 + 0.18 + i * (L - 0.36) / 2;
      if (Math.abs(x) < L * 0.2) continue;
      const a = new THREE.Mesh(archGeo(0.22, H * 0.7, 0.02, 0.7), M(0xc9b994)); a.position.set(x, 0.05, s * (W / 2 + 0.01)); g.add(a);
      const w = box(0.06, 0.16, 0.01, dark); w.position.set(x, H * 0.45, s * (W / 2 + 0.012)); g.add(w);
    }
  }
  // Притвор и врата на запад (−x).
  const nar = box(0.28, H * 0.85, W * 0.9, wm); nar.position.set(-L / 2 - 0.14, H * 0.425, 0); g.add(nar);
  const nr = gableRoof(W * 0.9, 0.36, 0.14); nr.rotation.y = Math.PI / 2; nr.position.set(-L / 2 - 0.14, H * 0.85, 0); g.add(nr);
  const door = box(0.01, 0.3, 0.16, M(0x5a3d22)); door.position.set(-L / 2 - 0.285, 0.15, 0); g.add(door);
  if (bell) {
    const bt = box(0.34, H * 1.7, 0.34, wm); bt.position.set(-L / 2 - 0.14, H * 0.85, W / 2 + 0.05); g.add(bt);
    const open = box(0.36, 0.18, 0.2, dark); open.position.set(-L / 2 - 0.14, H * 1.45, W / 2 + 0.05); g.add(open);
    const br = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.3, 4), M(0xffffff, { tex: 'tiles', rep: [2, 1] })); br.rotation.y = Math.PI / 4; br.position.set(-L / 2 - 0.14, H * 1.7 + 0.15, W / 2 + 0.05); g.add(br);
  }
  g.userData.height = dy + 0.22 + W * 0.27 + 0.2;
  return g;
}

// ---------- дворец ----------
// Царски дворец: собствена стена с кули, тронна зала (дълга зала с колони и апсида), дворцова църква и жилищна сграда.
export function royalPalace({ w = 3.2, d = 2.4 } = {}) {
  const g = new THREE.Group();
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MM('cobble', { rep: [w, d] })); yard.rotation.x = -Math.PI / 2; yard.position.y = 0.012; g.add(yard);
  for (const [x, z, len, rot] of [[0, -d / 2, w, 0], [0, d / 2, w, 0], [-w / 2, 0, d, Math.PI / 2], [w / 2, 0, d, Math.PI / 2]]) {
    if (z > 0) { // южната стена с вход в средата
      for (const s of [-1, 1]) { const ws = stoneWall(w / 2 - 0.35, { h: 0.55, t: 0.18 }); ws.position.set(s * (w / 4 + 0.175), 0, z); g.add(ws); }
      continue;
    }
    const wl = stoneWall(len, { h: 0.55, t: 0.18 }); wl.position.set(x, 0, z); wl.rotation.y = rot; g.add(wl);
  }
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]]) { const t = stoneTower({ s: 0.45, h: 0.85, roof: true }); t.position.set(x, 0, z); g.add(t); }
  // Тронна зала.
  const hall = new THREE.Group(); hall.position.set(-0.35, 0, -0.45);
  const hm = MM('banded', { rep: [3, 1] });
  const hb = box(1.7, 0.62, 0.8, hm); hb.position.y = 0.31; hall.add(hb);
  const hr = gableRoof(1.74, 0.86, 0.24); hr.position.y = 0.62; hall.add(hr);
  const ap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 14, 1, false, 0, Math.PI), hm); ap.position.set(0.85, 0.275, 0); hall.add(ap);
  for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.42, 8), M(0xf0e8d8)); c.position.set(-0.7 + i * 0.28, 0.21, 0.44); hall.add(c); }
  const portico = box(1.74, 0.04, 0.18, M(0xffffff, { tex: 'tiles', rep: [4, 1] })); portico.position.set(0, 0.44, 0.48); portico.rotation.x = 0.25; hall.add(portico);
  const dark = M(0x2a2622);
  for (let i = 0; i < 5; i++) { const win = box(0.07, 0.16, 0.01, dark); win.position.set(-0.65 + i * 0.32, 0.4, 0.405); hall.add(win); }
  g.add(hall);
  g.userData.hall = hall;
  // Дворцова църква.
  const ch = tarnovoChurch({ L: 0.75, W: 0.5, H: 0.45 }); ch.position.set(1.05, 0, 0.55); g.add(ch);
  // Жилищна сграда на два етажа.
  const res = new THREE.Group(); res.position.set(-0.85, 0, 0.6);
  const r1 = box(0.9, 0.36, 0.5, STONE()); r1.position.y = 0.18; res.add(r1);
  const r2 = box(1.0, 0.32, 0.6, MM('timber', { rep: [3, 1] })); r2.position.y = 0.52; res.add(r2);
  const rr = gableRoof(1.06, 0.68, 0.2); rr.position.y = 0.68; res.add(rr);
  g.add(res);
  return g;
}

// ---------- къщи и дюкяни ----------
// Къща: каменен приземен етаж, издаден горен етаж с греди, керемиден покрив, комин с дим.
export function medievalHouse({ w = 0.8, d = 0.65, two = true, roofColor = 0xffffff } = {}) {
  const g = new THREE.Group();
  const h1 = 0.36, h2 = two ? 0.32 : 0;
  const base = box(w, h1, d, M(0xffffff, { tex: 'stone', rep: [1, 0.6] })); base.position.y = h1 / 2; g.add(base);
  if (two) {
    const up = box(w + 0.08, h2, d + 0.1, MM('timber', { rep: [2, 1] })); up.position.set(0, h1 + h2 / 2, 0.03); g.add(up);
    for (let i = 0; i < 3; i++) { const b = box(0.03, 0.03, 0.12, M(0x5b3f28)); b.position.set(-w / 2 + 0.1 + i * (w - 0.2) / 2, h1 - 0.01, d / 2 + 0.02); g.add(b); }
  }
  const top = h1 + h2;
  const roof = gableRoof(w + 0.16, d + 0.24, 0.24, { color: roofColor }); roof.position.y = top; g.add(roof);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(new THREE.Shape([new THREE.Vector2(-(d + 0.08) / 2, 0), new THREE.Vector2((d + 0.08) / 2, 0), new THREE.Vector2(0, 0.22)]), { depth: w + 0.06, bevelEnabled: false }), M(0xe9e1cf));
  gable.rotation.y = Math.PI / 2; gable.position.set(-(w + 0.06) / 2, top, 0.03); g.add(gable);
  const dark = M(0x2e2a26), wood = M(0x5a3d22);
  const door = box(0.16, 0.26, 0.01, wood); door.position.set(-w * 0.25, 0.13, d / 2 + 0.005); g.add(door);
  const win = box(0.12, 0.1, 0.01, dark); win.position.set(w * 0.22, 0.2, d / 2 + 0.005); g.add(win);
  if (two) for (const x of [-0.18, 0.18]) { const w2 = box(0.1, 0.12, 0.01, dark); w2.position.set(x * w * 1.6, h1 + h2 / 2, d / 2 + 0.085); g.add(w2); }
  const chim = box(0.09, 0.22, 0.09, M(0xffffff, { tex: 'stone', rep: [0.3, 0.6] })); chim.position.set(w * 0.28, top + 0.2, -d * 0.15); g.add(chim);
  g.userData.chimney = new THREE.Vector3(w * 0.28, top + 0.32, -d * 0.15);
  return g;
}
// Дюкян: работилница и магазин в едно — открит отпред, с капак-тезгях и навес. Лицето гледа по +z.
export function dukyan({ w = 1.0, d = 0.7 } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [1, 0.6] });
  const back = box(w, 0.62, 0.08, sm); back.position.set(0, 0.31, -d / 2 + 0.04); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.08, 0.62, d, sm); side.position.set(s * (w / 2 - 0.04), 0.31, 0); g.add(side); }
  const up = box(w + 0.06, 0.26, d + 0.08, MM('timber', { rep: [2, 1] })); up.position.set(0, 0.75, 0.02); g.add(up);
  const roof = gableRoof(w + 0.18, d + 0.3, 0.2); roof.position.y = 0.88; g.add(roof);
  const wood = M(0x7a5634);
  const counter = box(w - 0.12, 0.05, 0.22, wood); counter.position.set(0, 0.32, d / 2 + 0.08); g.add(counter);
  const awn = box(w - 0.1, 0.03, 0.32, wood); awn.position.set(0, 0.62, d / 2 + 0.12); awn.rotation.x = 0.35; g.add(awn);
  const floor = box(w - 0.16, 0.02, d - 0.1, M(0x8f7a5c)); floor.position.y = 0.01; g.add(floor);
  g.userData.counterY = 0.345;
  g.userData.front = d / 2 + 0.08;
  return g;
}
// Глазирани паници (сграфито) и делви за грънчарския дюкян.
export function glazedBowl(color = 0x5f8a3a) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(color, { rough: 0.3, side: THREE.DoubleSide }));
  b.scale.y = 0.6; b.position.y = 0.045; g.add(b);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.008, 6, 18), M(0xd9a83a, { rough: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.y = 0.045; g.add(rim);
  return g;
}
export function jug(color = 0xb5683a) {
  const pts = [[0, 0], [0.05, 0.01], [0.07, 0.07], [0.06, 0.13], [0.03, 0.17], [0.035, 0.2]].map(([a, b]) => new THREE.Vector2(a, b));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), M(color, { rough: 0.5, side: THREE.DoubleSide }));
  return m;
}

// Каменен мост с арки. Дължината е по x.
export function stoneBridge(len = 3, { w = 0.7, h = 0.45, n = 3 } = {}) {
  const g = new THREE.Group();
  const sm = M(0xffffff, { tex: 'stone', rep: [1, 1] });
  const span = len / n;
  for (let i = 0; i < n; i++) {
    const a = new THREE.Mesh(archGeo(+span.toFixed(3), h, w, 0.78), sm);
    a.position.set(-len / 2 + span / 2 + i * span, 0, 0); g.add(a);
  }
  const deck = box(len, 0.06, w, MM('cobble', { rep: [len, 1] })); deck.position.y = h + 0.03; g.add(deck);
  for (const s of [-1, 1]) { const p = box(len, 0.12, 0.06, sm); p.position.set(0, h + 0.12, s * (w / 2 - 0.03)); g.add(p); }
  return g;
}
// Наклонена пътека (рампа) от точка a до точка b, с калдъръм и нисък парапет.
export function ramp(a, b, { w = 0.6 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.Group();
  const deck = box(w, 0.08, len, MM('cobble', { rep: [1, Math.max(1, Math.round(len))] }));
  g.add(deck);
  for (const s of [-1, 1]) { const p = box(0.06, 0.12, len, STONE()); p.position.set(s * (w / 2 - 0.03), 0.08, 0); g.add(p); }
  g.position.copy(A).add(B).multiplyScalar(0.5);
  g.lookAt(B);
  return g;
}

// Товарен кон с денкове.
export function packHorse() {
  const h = animal('horse');
  const packM = M(0xc9a66b);
  for (const s of [-1, 1]) { const p = box(0.2, 0.16, 0.08, packM); p.position.set(0, 0.5, s * 0.13); h.add(p); }
  const top = box(0.22, 0.06, 0.24, M(0x8a5a3a)); top.position.y = 0.58; h.add(top);
  return h;
}
// Каруца с чували (носи храна от селата).
export function cart() {
  const g = new THREE.Group();
  const wood = M(0x7a5634);
  const bed = box(0.6, 0.06, 0.36, wood); bed.position.y = 0.2; g.add(bed);
  for (const s of [-1, 1]) { const side = box(0.6, 0.1, 0.03, wood); side.position.set(0, 0.27, s * 0.17); g.add(side); }
  for (const s of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 12), M(0x5a3d22)); wh.rotation.x = Math.PI / 2; wh.position.set(-0.05, 0.14, s * 0.22); g.add(wh); }
  for (let i = 0; i < 3; i++) { const sack = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.16, 8), M(0xd8c79a)); sack.position.set(-0.18 + i * 0.16, 0.31, 0); g.add(sack); }
  const pole = box(0.5, 0.03, 0.03, wood); pole.position.set(0.55, 0.2, 0); g.add(pole);
  const ox = animal('cow'); ox.position.set(0.95, 0, 0); g.add(ox);
  g.userData.ox = ox;
  return g;
}

// ---------- хора ----------
// Хора от епохата: върху общото човече сменяме дрехата и добавяме шапка, престилка или книга.
const MED = {
  smith: { body: 0x6b4a33, trim: 0x2f2f33, apron: 0x3b2d22, hat: null },
  potter: { body: 0x8c6a4f, trim: 0x5a3d22, apron: 0xb08d63 },
  goldsmith: { body: 0x2f5e7a, trim: 0xd4af37, hat: 0x2f3a4a },
  merchant: { body: 0x2f6b3a, trim: 0xd4af37, hat: 0x7a2f22, cloak: 0x7a2f22 },
  scribe: { body: 0x2a2a2e, trim: 0x2a2a2e, hat: 0x1d1d22, monk: true },
  boyar: { body: 0x8a1f2b, trim: 0xd4af37, hat: 0x5a3a22, tall: true, cloak: 0x2f4f86 },
  woman: { body: 0x9b3f5a, trim: 0xe7d38a, scarf: 0xf1ede2 },
  peasant: { body: 0xe9e1cf, trim: 0x8a1f2b },
  student: { body: 0x3a3a48, trim: 0x3a3a48, hat: 0x2a2a35 },
  professor: { body: 0x8a1f2b, trim: 0xd4af37, hat: 0x8a1f2b, cloak: 0x5a1520 },
  guard: { body: 0x5a6470, trim: 0x8a1f2b, hat: 0x8a8f96, helmet: true },
};
export function medPerson(kind = 'peasant', { scale = 1 } = {}) {
  const L = MED[kind] || MED.peasant;
  const g = person('citizen', { scale });
  const [body, belt] = g.children;
  body.material = mat(L.body);
  belt.material = mat(L.trim);
  if (L.apron) { const a = box(0.16, 0.26, 0.02, mat(L.apron)); a.position.set(0, 0.2, 0.1); a.rotation.x = -0.28; g.add(a); }
  if (L.cloak) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.44, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(L.cloak, { side: THREE.DoubleSide }));
    c.position.y = 0.3; c.rotation.y = Math.PI; g.add(c);
  }
  if (L.hat) {
    let hat;
    if (L.monk) hat = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.1, 12), mat(L.hat));
    else if (L.tall) hat = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.095, 0.16, 12), mat(L.hat));
    else if (L.helmet) hat = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.14, 12), mat(L.hat, { metalness: 0.5 }));
    else hat = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.06, 12), mat(L.hat));
    hat.position.y = 0.66 + (L.tall ? 0.04 : 0); g.add(hat);
  }
  if (L.scarf) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.6), mat(L.scarf)); s.position.y = 0.59; g.add(s); }
  if (kind === 'guard') { const sp = box(0.012, 0.9, 0.012, mat(0x6b4f36)); sp.position.set(-0.14, 0.45, 0); g.add(sp); const sh = box(0.03, 0.26, 0.18, mat(0x8a1f2b)); sh.position.set(0.15, 0.3, 0); g.add(sh); }
  g.userData.kind = kind;
  return g;
}

// ---------- книги и учене ----------
export function book(color = 0x7a2f22, open = false) {
  const g = new THREE.Group();
  if (open) {
    for (const s of [-1, 1]) { const p = box(0.1, 0.012, 0.13, M(0xf3ead2)); p.position.set(s * 0.051, 0.008, 0); p.rotation.z = -s * 0.12; g.add(p); }
    const cover = box(0.21, 0.006, 0.14, M(color)); g.add(cover);
  } else {
    const b = box(0.1, 0.035, 0.13, M(color)); b.position.y = 0.018; g.add(b);
    const pg = box(0.092, 0.028, 0.124, M(0xf3ead2)); pg.position.set(0.006, 0.018, 0); g.add(pg);
  }
  return g;
}
// Маса на книжовник: наклонен пулт с отворен ръкопис, свещ, рафт с книги, столче.
export function scribeDesk() {
  const g = new THREE.Group();
  const wood = M(0x6b4524);
  const top = box(0.5, 0.03, 0.34, wood); top.position.y = 0.36; top.rotation.x = 0.25; g.add(top);
  for (const [x, z] of [[-0.22, -0.14], [0.22, -0.14], [-0.22, 0.14], [0.22, 0.14]]) { const l = box(0.03, 0.36, 0.03, wood); l.position.set(x, 0.18, z); g.add(l); }
  const bk = book(0x7a2f22, true); bk.position.set(0, 0.39, 0); bk.rotation.x = 0.25; g.add(bk);
  const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8), M(0xf3ead2)); candle.position.set(0.2, 0.42, -0.1); g.add(candle);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 8), new THREE.MeshBasicMaterial({ color: 0xffb23a })); flame.position.set(0.2, 0.475, -0.1); g.add(flame);
  const shelf = new THREE.Group(); shelf.position.set(0, 0, -0.42);
  const sb = box(0.6, 0.5, 0.14, wood); sb.position.y = 0.25; shelf.add(sb);
  g.add(shelf);
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 10), wood); stool.position.set(0, 0.11, 0.36); g.add(stool);
  g.userData = { flame, shelf };
  return g;
}
// Рафт с книги, които се появяват (за „ето какво правят книжовниците“).
export function bookStack(n = 6) {
  const g = new THREE.Group();
  const colors = [0x7a2f22, 0x2f4f86, 0x3f6f4f, 0x8a5a2b, 0x5a1520, 0x6b4524];
  for (let i = 0; i < n; i++) {
    const b = box(0.04, 0.16, 0.12, M(colors[i % colors.length])); b.position.set(-0.22 + i * 0.05, 0.08, 0); g.add(b);
  }
  return g;
}
// Университетска зала (като в Болоня): разрязана готическа зала със заострени прозорци, катедра и пейки.
export function lectureHall({ w = 4.2, d = 3.2, h = 1.9 } = {}) {
  const g = new THREE.Group();
  const floor = box(w, 0.08, d, M(0xffffff, { tex: 'marble', rep: [4, 3] })); floor.position.y = 0.04; g.add(floor);
  const wm = M(0xe6d6b8, { tex: 'limestone', rep: [3, 2] });
  const back = box(w, h, 0.16, wm); back.position.set(0, h / 2, -d / 2); g.add(back);
  for (const s of [-1, 1]) { const side = box(0.16, h, d, wm); side.position.set(s * w / 2, h / 2, 0); g.add(side); }
  // Заострени (готически) прозорци.
  const pointed = () => {
    const sh = new THREE.Shape(); const ww = 0.26, hh = 0.6;
    sh.moveTo(-ww / 2, 0); sh.lineTo(ww / 2, 0); sh.lineTo(ww / 2, hh * 0.65); sh.quadraticCurveTo(ww / 2, hh * 0.9, 0, hh); sh.quadraticCurveTo(-ww / 2, hh * 0.9, -ww / 2, hh * 0.65); sh.closePath();
    return new THREE.ShapeGeometry(sh);
  };
  const glass = new THREE.MeshStandardMaterial({ color: 0x5f86b8, roughness: 0.2, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) { const win = new THREE.Mesh(pointed(), glass); win.position.set(-w / 3 + i * w / 3, h * 0.42, -d / 2 + 0.09); g.add(win); }
  for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const win = new THREE.Mesh(pointed(), glass); win.rotation.y = -s * Math.PI / 2; win.position.set(s * (w / 2 - 0.09), h * 0.42, -d / 4 + i * d / 2.2); g.add(win); }
  // Греди на тавана (без покрив, за да се вижда вътре).
  for (let i = 0; i < 4; i++) { const b = box(w, 0.08, 0.08, M(0x5b3f28)); b.position.set(0, h, -d / 2 + 0.2 + i * (d - 0.4) / 3); g.add(b); }
  // Катедра: издигнат амвон с балдахин.
  const cat = new THREE.Group(); cat.position.set(0, 0, -d / 2 + 0.55);
  const pod = box(0.6, 0.4, 0.5, M(0x6b4524)); pod.position.y = 0.28; cat.add(pod);
  const desk = box(0.5, 0.06, 0.2, M(0x5b3f28)); desk.position.set(0, 0.85, 0.18); desk.rotation.x = 0.3; cat.add(desk);
  const post = box(0.06, 0.4, 0.06, M(0x5b3f28)); post.position.set(0, 0.65, 0.18); cat.add(post);
  const can = box(0.8, 0.06, 0.6, M(0x8a1f2b)); can.position.set(0, 1.55, 0); cat.add(can);
  g.add(cat);
  // Пейки за студентите.
  const benches = [];
  for (let r = 0; r < 3; r++) for (const s of [-1, 1]) {
    const b = new THREE.Group(); b.position.set(s * 0.95, 0, -0.1 + r * 0.7);
    const seat = box(1.3, 0.05, 0.22, M(0x7a5634)); seat.position.y = 0.26; b.add(seat);
    const tab = box(1.3, 0.04, 0.2, M(0x7a5634)); tab.position.set(0, 0.42, -0.26); b.add(tab);
    for (const x of [-0.55, 0.55]) { const l = box(0.05, 0.42, 0.45, M(0x5b3f28)); l.position.set(x, 0.21, -0.12); b.add(l); }
    g.add(b); benches.push(b);
  }
  g.userData = { benches, cathedra: cat };
  return g;
}

// Сливане на неподвижните части: всички меши в поддървото на root с един и същ материал стават една меш.
// Много по-малко рисувания на кадър — важно за слаб компютър. skip: обекти (с поддърветата им), които се движат.
export function mergeStatic(root, skip = []) {
  const skipSet = new Set(skip);
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const byMat = new Map();
  const victims = [];
  const visit = (o) => {
    if (skipSet.has(o)) return;
    if (o.isMesh && o.visible && !Array.isArray(o.material) && !o.userData.isHitBox && !o.isSkinnedMesh) {
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

// Скалист провлак (насип) с калдъръмена пътека: от ниската точка a до високата b ([x, y, z]).
export function causeway(a, b, { w = 0.7 } = {}) {
  const dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz);
  const g = new THREE.Group();
  const prof = new THREE.Shape([new THREE.Vector2(-0.3, 0), new THREE.Vector2(L + 0.2, 0), new THREE.Vector2(L + 0.2, b[1]), new THREE.Vector2(L, b[1]), new THREE.Vector2(0, a[1])]);
  const geo = new THREE.ExtrudeGeometry(prof, { depth: w, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.05, bevelSegments: 2 });
  geo.translate(0, 0, -w / 2);
  const rock = new THREE.MeshStandardMaterial({ color: 0xd2c19c, map: TEX.rock([0.6, 0.6]), roughness: 0.95, flatShading: true });
  g.add(new THREE.Mesh(geo, rock));
  const slope = Math.atan2(b[1] - a[1], L), len = Math.hypot(L, b[1] - a[1]);
  const deck = box(len, 0.05, w * 0.8, MM('cobble', { rep: [Math.max(1, Math.round(len * 2)), 1] }));
  deck.position.set(L / 2, (a[1] + b[1]) / 2 + 0.03, 0); deck.rotation.z = slope; g.add(deck);
  for (const s of [-1, 1]) { const p = box(len, 0.1, 0.06, STONE()); p.position.set(L / 2, (a[1] + b[1]) / 2 + 0.09, s * w * 0.42); p.rotation.z = slope; g.add(p); }
  g.position.set(a[0], 0, a[2]);
  g.rotation.y = -Math.atan2(dz, dx);
  return g;
}
