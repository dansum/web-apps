// Кораби и предмети от епохата на Великите географски открития (XV–XVI в.).
// caravel() — каравела с три мачти и триъгълни (латински) платна: обшивка от дъски, кърмова надстройка,
// кормило, въжета, моряци, бъчви и флаг. Гледа към +x, водната линия е при y ≈ 0.18.
// Другото: компас в кутия, астролабия, чували с подправки, картофи, царевица, домати, какао, чайка.
// Моделите са възстановка по запазени рисунки и описания, не по точни чертежи.
import { THREE, mat } from '../../kit.js';
import { person } from './antiquity.js';

const texCache = new Map();
function canvasTex(key, w, h, draw) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

// Обшивка: дъски по дължината, тъмен пояс (вейл) и катранено дъно.
const planks = () => canvasTex('planks', 256, 256, (ctx, w, h) => {
  const r = rnd(5);
  const rows = 16;
  for (let i = 0; i < rows; i++) {
    const v = i / rows;
    const base = v < 0.1 ? [150, 102, 58] : v < 0.16 ? [70, 46, 28] : v > 0.55 ? [92, 66, 44] : [132, 90, 52];
    for (let x = 0; x < w; x += 64) {
      const k = (r() - 0.5) * 22;
      ctx.fillStyle = `rgb(${base[0] + k},${base[1] + k * 0.8},${base[2] + k * 0.6})`;
      ctx.fillRect(x + (i % 2) * 32, i * (h / rows), 64, h / rows);
    }
    ctx.fillStyle = 'rgba(40,25,12,0.6)'; ctx.fillRect(0, i * (h / rows), w, 1.5);
    for (let x = (i % 2) * 32; x < w; x += 64) ctx.fillRect(x, i * (h / rows), 1.5, h / rows);
  }
  ctx.fillStyle = 'rgba(30,20,10,0.5)';
  for (let i = 0; i < 120; i++) ctx.fillRect(r() * w, r() * h, 2, 2); // гвоздеи
});
const deckTex = () => canvasTex('deck', 128, 128, (ctx, w, h) => {
  const r = rnd(9);
  for (let i = 0; i < 8; i++) { const k = (r() - 0.5) * 20; ctx.fillStyle = `rgb(${176 + k},${138 + k},${92 + k})`; ctx.fillRect(0, i * 16, w, 16); ctx.fillStyle = 'rgba(60,40,20,0.5)'; ctx.fillRect(0, i * 16, w, 1); }
});
// Платно с шевове и кръста на Ордена на Христос (както на португалските каравели).
const sailTex = (cross) => canvasTex('sail' + cross, 256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f1e7cf'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 2;
  for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, h); ctx.stroke(); }
  if (!cross) return;
  const cx = w * 0.7, cy = h * 0.66, s = 34;
  ctx.fillStyle = '#b3201c';
  // Кръст с разширени краища.
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.beginPath();
    ctx.moveTo(cx + dy * 5, cy + dx * 5);
    ctx.lineTo(cx + dx * s + dy * 14, cy + dy * s + dx * 14);
    ctx.lineTo(cx + dx * s - dy * 14, cy + dy * s - dx * 14);
    ctx.lineTo(cx - dy * 5, cy - dx * 5);
    ctx.fill();
  }
  ctx.fillStyle = '#f1e7cf'; ctx.fillRect(cx - 3, cy - s + 6, 6, s * 2 - 12); ctx.fillRect(cx - s + 6, cy - 3, s * 2 - 12, 6);
});

// ---------- корпус ----------
function hullGeometry(L, W, D) {
  const N = 30, M = 13;
  const pos = [], uv = [], idx = [];
  const half = (u) => (u < 0.42 ? 0.6 + 0.4 * Math.sin((u / 0.42) * Math.PI / 2) : Math.pow(Math.max(0, Math.cos(((u - 0.42) / 0.58) * Math.PI / 2)), 0.75)) * W / 2 + 0.004;
  const sheer = (u) => D + 0.42 * Math.pow(Math.max(0, (0.3 - u) / 0.3), 1.4) * D + 0.25 * Math.pow(u, 3) * D;
  const keel = (u) => 0.5 * D * Math.pow(Math.max(0, (u - 0.72) / 0.28), 2) + 0.12 * D * Math.pow(Math.max(0, (0.12 - u) / 0.12), 2);
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1), x = -L / 2 + u * L, w = half(u), s = sheer(u), k = keel(u);
    for (let j = 0; j < M; j++) {
      const th = (Math.PI * j) / (M - 1);
      const f = Math.pow(Math.sin(th), 0.5);
      const y = s - (s - k) * f;
      pos.push(x, y, w * Math.cos(th));
      uv.push(x / L * 3, 1 - f);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < M - 1; j++) {
    const a = i * M + j, b = a + M;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { g, half, sheer, keel };
}

// Триъгълно платно, разделено на малки триъгълници, за да се издува.
function sailGeometry(A, B, C, n = 7) {
  const pos = [], uv = [], idx = [], base = [];
  const row = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    row.push(k);
    for (let j = 0; j <= n - i; j++) {
      const a = j / n, b = i / n; // a: по рейката (A→B), b: към долния ъгъл (C)
      const p = new THREE.Vector3().copy(A).addScaledVector(new THREE.Vector3().subVectors(B, A), a).addScaledVector(new THREE.Vector3().subVectors(C, A), b);
      pos.push(p.x, p.y, p.z); base.push(p.x, p.y, p.z);
      uv.push(a + b, a);
      // Издуване: най-силно в средата, нула по ръбовете.
      k++;
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
    const a = row[i] + j, b = row[i + 1] + j;
    idx.push(a, a + 1, b);
    if (j < n - i - 1) idx.push(a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // Тегло на издуването за всяка точка.
  const wgt = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) { const a = j / n, b = i / n, c = 1 - a - b; wgt.push(Math.max(0, a * b * c) * 27); }
  g.userData = { base: new Float32Array(base), wgt };
  g.computeVertexNormals();
  return g;
}

const cyl = (r1, r2, h, m, seg = 10) => new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
const bx = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

// Каравела. opts.lite: без моряци и дребни неща (за малките кораби по картата).
export function caravel({ lite = false, cross = true } = {}) {
  const L = 2.4, W = 0.74, D = 0.5;
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ map: planks(), roughness: 0.85, side: THREE.DoubleSide });
  const dark = mat(0x4a3220), spar = mat(0x6d4a2c), rope = new THREE.LineBasicMaterial({ color: 0x3b2a1a });
  const { g: hg, half, sheer } = hullGeometry(L, W, D);
  const hull = new THREE.Mesh(hg, wood);
  g.add(hull);
  const X = (u) => -L / 2 + u * L;
  // Палуба (малко под ръба, за да има перила).
  const deckY = D * 0.86;
  const outline = [];
  for (let i = 0; i <= 24; i++) { const u = 0.02 + (i / 24) * 0.96; outline.push(new THREE.Vector2(X(u), half(u) * 0.97)); }
  for (let i = 24; i >= 0; i--) { const u = 0.02 + (i / 24) * 0.96; outline.push(new THREE.Vector2(X(u), -half(u) * 0.97)); }
  const deck = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(outline)), new THREE.MeshStandardMaterial({ map: deckTex(), roughness: 0.9 }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = deckY;
  g.add(deck);
  // Кърма: плоска задна стена (транец).
  const tr = [];
  for (let j = 0; j <= 12; j++) { const th = (Math.PI * j) / 12; const s = sheer(0), f = Math.pow(Math.sin(th), 0.5); tr.push(new THREE.Vector2(half(0) * Math.cos(th), s - (s - 0.12 * D) * f)); }
  const transom = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(tr)), wood);
  transom.rotation.y = -Math.PI / 2; transom.position.x = -L / 2 + 0.002;
  g.add(transom);
  // Кърмова надстройка (ют) с перила.
  const pY = sheer(0.12) - 0.05;
  const poop = bx(L * 0.24, 0.04, half(0.12) * 1.9, new THREE.MeshStandardMaterial({ map: deckTex(), roughness: 0.9 }));
  poop.position.set(X(0.13), pY, 0); g.add(poop);
  const front = bx(0.04, pY - deckY, half(0.25) * 1.9, wood); front.position.set(X(0.25), (pY + deckY) / 2, 0); g.add(front);
  // Врата и прозорче в надстройката.
  const door = bx(0.045, 0.16, 0.1, dark); door.position.set(X(0.25) + 0.005, deckY + 0.08, 0); g.add(door);
  for (const s of [-1, 1]) {
    const rail = bx(L * 0.25, 0.025, 0.025, spar); rail.position.set(X(0.13), pY + 0.12, s * half(0.13) * 0.92); g.add(rail);
    for (let i = 0; i < 6; i++) { const p = bx(0.02, 0.12, 0.02, spar); const u = 0.02 + i * 0.04; p.position.set(X(u), pY + 0.06, s * half(u) * 0.92); g.add(p); }
  }
  // Пояс над водата и линия на перилата.
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 20; i++) { const u = 0.01 + i * 0.049; pts.push(new THREE.Vector3(X(u), sheer(u) + 0.008, s * half(u))); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const cap = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.018, 5), spar);
    g.add(cap);
  }
  // Кормило и румпел.
  const rudder = bx(0.05, D * 0.95, 0.03, dark);
  rudder.position.set(-L / 2 - 0.04, D * 0.42, 0); g.add(rudder);
  // Котва на носа.
  const anchor = new THREE.Group();
  const shank = cyl(0.012, 0.012, 0.22, mat(0x3d3f45, { metalness: 0.6, roughness: 0.4 }), 6); anchor.add(shank);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 5, 10, Math.PI), shank.material); arm.rotation.z = Math.PI; arm.position.y = -0.07; anchor.add(arm);
  anchor.position.set(X(0.9), D * 0.75, half(0.9) + 0.02); anchor.rotation.x = 0.2; g.add(anchor);

  // Мачти: бизан (задна), голяма и предна. Каравелата „латина“ има триъгълни платна.
  const masts = [
    { u: 0.24, h: 1.45, yard: 1.55 },
    { u: 0.55, h: 2.15, yard: 2.3 },
    { u: 0.78, h: 1.7, yard: 1.75 },
  ];
  const sails = [];
  const lines = [];
  for (const [mi, m] of masts.entries()) {
    const x = X(m.u), y0 = mi === 0 ? pY : deckY;
    const mast = cyl(0.022, 0.034, m.h, spar, 8);
    mast.position.set(x, y0 + m.h / 2, 0); g.add(mast);
    const top = cyl(0.05, 0.04, 0.06, spar, 8); top.position.set(x, y0 + m.h * 0.9, 0); g.add(top); // марс (площадка)
    // Наклонена рейка: предният край ниско, задният — високо.
    const ang = 0.55;
    const c = new THREE.Vector3(x + 0.05, y0 + m.h * 0.82, 0.04);
    const dir = new THREE.Vector3(-Math.cos(ang), Math.sin(ang), 0);
    const A = c.clone().addScaledVector(dir, -m.yard * 0.48); // долен преден край
    const B = c.clone().addScaledVector(dir, m.yard * 0.52);  // горен заден край
    const yardMesh = cyl(0.014, 0.02, m.yard, spar, 6);
    yardMesh.position.copy(c).addScaledVector(dir, m.yard * 0.02);
    yardMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(yardMesh);
    const C = new THREE.Vector3(x - m.yard * 0.36, y0 + 0.16, 0.05); // долен заден ъгъл
    const sg = sailGeometry(A, B, C);
    const sail = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: sailTex(cross && mi === 1), roughness: 0.95, side: THREE.DoubleSide }));
    sail.userData.part = mi === 1 ? 'mainsail' : 'sail';
    g.add(sail); sails.push(sail);
    // Въжета: ванти към бордовете, шкот към долния ъгъл.
    const mh = new THREE.Vector3(x, y0 + m.h * 0.95, 0);
    for (const s of [-1, 1]) for (const dx of [-0.08, 0.06]) lines.push(mh, new THREE.Vector3(x + dx, sheer(m.u) + 0.01, s * half(m.u + dx / L)));
    lines.push(C, new THREE.Vector3(C.x - 0.05, deckY + 0.02, 0.15));
    lines.push(A, new THREE.Vector3(A.x + 0.02, sheer(Math.min(0.98, m.u + 0.25)), 0));
    lines.push(mh, c);
  }
  // Щаг от предната мачта към носа.
  lines.push(new THREE.Vector3(X(0.78), deckY + 1.6, 0), new THREE.Vector3(X(0.99), sheer(0.99) + 0.02, 0));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines), rope));
  // Флаг на голямата мачта.
  const flagGeo = new THREE.PlaneGeometry(0.34, 0.12, 6, 1);
  flagGeo.translate(0.17, 0, 0);
  const flag = new THREE.Mesh(flagGeo, new THREE.MeshStandardMaterial({ color: 0xc0302a, side: THREE.DoubleSide, roughness: 0.9 }));
  flag.position.set(X(0.55) + 0.02, deckY + 2.2, 0);
  flag.rotation.y = Math.PI; // вятърът духа назад
  g.add(flag);
  flag.userData.base = Float32Array.from(flagGeo.attributes.position.array);

  if (!lite) {
    // Бъчви, навито въже, компас в кутия при кормилото и моряци.
    for (const [u, z] of [[0.4, 0.17], [0.43, 0.08], [0.68, -0.18]]) {
      const b = barrel(); b.scale.setScalar(0.55); b.position.set(X(u), deckY, z); g.add(b);
    }
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 6, 14), mat(0xb59866)); coil.rotation.x = Math.PI / 2; coil.position.set(X(0.66), deckY + 0.02, 0.15); g.add(coil);
    const bin = bx(0.09, 0.09, 0.09, spar); bin.position.set(X(0.08), pY + 0.065, 0); g.add(bin);
    const bowl = cyl(0.035, 0.03, 0.02, mat(0xc9a14a, { metalness: 0.7, roughness: 0.3 }), 14); bowl.position.set(X(0.08), pY + 0.12, 0); g.add(bowl);
    const crew = [['sailor', X(0.15), 0.12, pY], ['captain', X(0.1), -0.1, pY], ['sailor', X(0.62), -0.08, deckY], ['sailor', X(0.35), 0.18, deckY]];
    for (const [kind, x, z, y] of crew) {
      const p = person(kind === 'captain' ? 'citizen' : 'citizen', { scale: 0.42 });
      p.children[0].material = mat(kind === 'captain' ? 0x2f3e66 : [0x8a5a3a, 0x6b7f8f, 0x9a8a5a][Math.floor(Math.abs(z) * 30) % 3]);
      if (kind === 'captain') { const hat = cyl(0.06, 0.07, 0.04, mat(0x1d1d24), 10); hat.position.y = 0.66; p.add(hat); }
      p.position.set(x, y, z); g.add(p);
    }
  }
  g.userData = { sails, flag };
  return g;
}

// Анимация: платната се издуват, флагът се вее. wind: 0…1.
export function animateShip(ship, t, wind = 1) {
  for (const [i, s] of ship.userData.sails.entries()) {
    const p = s.geometry.attributes.position, { base, wgt } = s.geometry.userData;
    const k = (0.16 + 0.03 * Math.sin(t * 1.7 + i)) * wind;
    for (let v = 0; v < p.count; v++) p.setZ(v, base[v * 3 + 2] + wgt[v] * k);
    p.needsUpdate = true;
  }
  const f = ship.userData.flag, fp = f.geometry.attributes.position, fb = f.userData.base;
  for (let v = 0; v < fp.count; v++) { const x = fb[v * 3]; fp.setZ(v, Math.sin(x * 14 - t * 6) * 0.03 * x * 3 * (0.3 + wind)); }
  fp.needsUpdate = true;
}

// ---------- предмети ----------
export function barrel() {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 8; i++) { const y = i / 8; pts.push(new THREE.Vector2(0.11 + 0.025 * Math.sin(y * Math.PI), y * 0.3)); }
  const b = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), mat(0x8a5a32));
  g.add(b);
  for (const y of [0.04, 0.26]) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.008, 4, 16), mat(0x3d3f45, { metalness: 0.5 })); h.rotation.x = Math.PI / 2; h.position.y = y; g.add(h); }
  const lid = cyl(0.11, 0.11, 0.01, mat(0x6d4a2c), 14); lid.position.y = 0.3; g.add(lid);
  return g;
}

// Компас в дървена кутия: роза на ветровете и стрелка, която леко трепти.
const roseTex = () => canvasTex('rose', 256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#f4ead2'; ctx.fillRect(0, 0, w, h);
  const c = w / 2;
  ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c, c, c - 8, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2; ctx.lineWidth = i % 4 ? 1 : 2; ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * 30, c + Math.sin(a) * 30); ctx.lineTo(c + Math.cos(a) * (c - 10), c + Math.sin(a) * (c - 10)); ctx.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, len = i % 2 ? c * 0.5 : c * 0.85;
    ctx.fillStyle = i % 2 ? '#2f5fa8' : '#b3201c';
    ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
    ctx.lineTo(c + Math.cos(a + 0.25) * 22, c + Math.sin(a + 0.25) * 22); ctx.lineTo(c, c); ctx.lineTo(c + Math.cos(a - 0.25) * 22, c + Math.sin(a - 0.25) * 22); ctx.fill();
  }
  ctx.fillStyle = '#2a1f14'; ctx.font = 'bold 34px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', c, 26); // северът на старите компаси често е бележен с лилия; тук — с буква
});
export function compass() {
  const g = new THREE.Group();
  const wood = mat(0x7a4f2c);
  const boxM = bx(0.62, 0.16, 0.62, wood); boxM.position.y = 0.08; g.add(boxM);
  const lid = bx(0.62, 0.03, 0.62, wood); lid.position.set(0, 0.42, -0.36); lid.rotation.x = -1.2; g.add(lid);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 8, 32), mat(0xc9a14a, { metalness: 0.75, roughness: 0.3 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.17; g.add(ring);
  const card = new THREE.Mesh(new THREE.CircleGeometry(0.24, 32), new THREE.MeshStandardMaterial({ map: roseTex(), roughness: 0.8 }));
  card.rotation.x = -Math.PI / 2; card.position.y = 0.165; g.add(card);
  const needle = new THREE.Group();
  const n1 = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.2, 4), mat(0xb3201c, { metalness: 0.4 })); n1.rotation.x = -Math.PI / 2; n1.position.z = -0.1;
  const n2 = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.2, 4), mat(0x2f3e66, { metalness: 0.4 })); n2.rotation.x = Math.PI / 2; n2.position.z = 0.1;
  const pin = cyl(0.012, 0.012, 0.03, mat(0xc9a14a, { metalness: 0.7 }), 8);
  needle.add(n1, n2, pin); needle.position.y = 0.19; g.add(needle);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.25, 32), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, roughness: 0.05 }));
  glass.rotation.x = -Math.PI / 2; glass.position.y = 0.215; g.add(glass);
  g.userData.needle = needle;
  return g;
}

// Астролабия: месингов диск с деления, алидада (визир) и халка за окачване.
const astroTex = () => canvasTex('astro', 256, 256, (ctx, w, h) => {
  const c = w / 2;
  ctx.fillStyle = '#c99a3c'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#6b4a14'; ctx.lineWidth = 2;
  for (const r of [c - 4, c - 30]) { ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke(); }
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; ctx.lineWidth = i % 6 ? 1 : 2.5; ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * (c - 4), c + Math.sin(a) * (c - 4)); ctx.lineTo(c + Math.cos(a) * (c - (i % 6 ? 16 : 28)), c + Math.sin(a) * (c - (i % 6 ? 16 : 28))); ctx.stroke(); }
});
export function astrolabe() {
  const g = new THREE.Group();
  const brass = mat(0xc99a3c, { metalness: 0.8, roughness: 0.3 });
  const disc = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.42, 48, 1), new THREE.MeshStandardMaterial({ map: astroTex(), metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
  // UV на пръстена — по радиус; задаваме ги като за кръг, за да легнат деленията.
  const p = disc.geometry.attributes.position, uv = disc.geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 0.84 + 0.5, p.getY(i) / 0.84 + 0.5);
  g.add(disc);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 8, 48), brass); g.add(rim);
  // Кръстът в средата (при морската астролабия дискът е отворен, за да не го люлее вятърът).
  for (const r of [0, Math.PI / 2]) { const bar = bx(0.82, 0.04, 0.02, brass); bar.rotation.z = r; g.add(bar); }
  const alidade = new THREE.Group();
  const al = bx(0.8, 0.035, 0.03, mat(0xa77a2a, { metalness: 0.8, roughness: 0.35 })); alidade.add(al);
  for (const s of [-1, 1]) { const v = bx(0.02, 0.09, 0.05, al.material); v.position.set(s * 0.3, 0.04, 0); alidade.add(v); }
  alidade.position.z = 0.03; g.add(alidade);
  const hub = cyl(0.04, 0.04, 0.08, brass, 12); hub.rotation.x = Math.PI / 2; g.add(hub);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 6, 16), brass); ring.position.y = 0.5; g.add(ring);
  const lug = bx(0.06, 0.06, 0.03, brass); lug.position.y = 0.44; g.add(lug);
  g.userData.alidade = alidade;
  return g;
}

// Чувал с подправка (пипер, канела, карамфил). Зърната са InstancedMesh.
export function spiceSack(color = 0x2a2018, { grain = 0.02, n = 60 } = {}) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 10; i++) { const y = i / 10; pts.push(new THREE.Vector2(0.2 + 0.07 * Math.sin(y * Math.PI) - (y > 0.85 ? (y - 0.85) * 0.4 : 0), y * 0.42)); }
  const sack = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), mat(0xc8b48a, { side: THREE.DoubleSide }));
  g.add(sack);
  const roll = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.03, 6, 18), sack.material); roll.rotation.x = Math.PI / 2; roll.position.y = 0.42; g.add(roll);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color)); top.scale.y = 0.35; top.position.y = 0.38; g.add(top);
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(grain, 6, 4), mat(color, { roughness: 0.6 }), n);
  const r = rnd(color % 1000 + 3), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.17; m4.makeTranslation(Math.cos(a) * d, 0.4 + 0.06 * (1 - d / 0.17) + r() * 0.01, Math.sin(a) * d); im.setMatrixAt(i, m4); }
  g.add(im);
  return g;
}
export function cinnamon() {
  const g = new THREE.Group();
  const m = mat(0x8b4a22, { roughness: 0.9 });
  for (let i = 0; i < 7; i++) { const s = cyl(0.025, 0.025, 0.42, m, 8); s.rotation.z = Math.PI / 2; s.position.set(0, 0.03 + (i % 3) * 0.045, -0.06 + (i % 4) * 0.04); g.add(s); }
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 4, 12), mat(0xc8b48a)); tie.rotation.y = Math.PI / 2; tie.position.y = 0.07; g.add(tie);
  return g;
}

// Растения от Америка.
export function potato() {
  const geo = new THREE.SphereGeometry(0.11, 12, 8);
  const p = geo.attributes.position, r = rnd(17);
  for (let i = 0; i < p.count; i++) { const k = 1 + (r() - 0.5) * 0.12; p.setXYZ(i, p.getX(i) * 1.35 * k, p.getY(i) * 0.85 * k, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(0xb08850, { flat: true }));
  const g = new THREE.Group(); m.position.y = 0.09; g.add(m); return g;
}
export function corn() {
  const g = new THREE.Group();
  const cob = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 10), mat(0xf2c230, { roughness: 0.6 }));
  cob.rotation.z = Math.PI / 2; cob.position.y = 0.07; g.add(cob);
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 5, 4), mat(0xffd54a, { roughness: 0.5 }), 72);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 72; i++) { const a = (i % 8) / 8 * Math.PI * 2 + (Math.floor(i / 8) % 2) * 0.4, x = -0.14 + Math.floor(i / 8) * 0.035; m4.makeTranslation(x, 0.07 + Math.sin(a) * 0.058, Math.cos(a) * 0.058); im.setMatrixAt(i, m4); }
  g.add(im);
  for (const s of [-1, 1]) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 6, 1, true), mat(0x9bbf5a, { side: THREE.DoubleSide })); leaf.rotation.z = -Math.PI / 2 + s * 0.15; leaf.position.set(0.2, 0.07, s * 0.04); g.add(leaf); }
  return g;
}
export function tomato() {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(0xd8321e, { roughness: 0.35 })); t.scale.y = 0.8; t.position.y = 0.08; g.add(t);
  for (let i = 0; i < 5; i++) { const l = bx(0.07, 0.005, 0.018, mat(0x3f7a2a)); l.rotation.y = (i / 5) * Math.PI * 2; l.position.set(Math.cos(-(i / 5) * Math.PI * 2) * 0.03, 0.16, Math.sin(-(i / 5) * Math.PI * 2) * 0.03); g.add(l); }
  return g;
}
export function cocoa() {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(0.075 * Math.pow(Math.sin(y * Math.PI), 0.8) + 0.002, y * 0.3)); }
  const geo = new THREE.LatheGeometry(pts, 20);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.12 * Math.cos(a * 10) * Math.sin((p.getY(i) / 0.3) * Math.PI); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, mat(0xc6701e, { roughness: 0.6 }));
  m.rotation.z = Math.PI / 2; m.position.set(0.15, 0.08, 0);
  const g = new THREE.Group(); g.add(m); return g;
}
export function crate(w = 0.6, d = 0.4, h = 0.22) {
  const g = new THREE.Group(), m = mat(0xa07a4a);
  const b = bx(w, 0.03, d, m); b.position.y = 0.015; g.add(b);
  for (const s of [-1, 1]) { const a = bx(w, h, 0.03, m); a.position.set(0, h / 2, s * d / 2); g.add(a); const c = bx(0.03, h, d, m); c.position.set(s * w / 2, h / 2, 0); g.add(c); }
  return g;
}

// Чайка: тяло и две крила, които махат (анимират се отвън чрез userData.wings).
export function gull() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 3, 8), mat(0xf4f4f0)); body.rotation.z = Math.PI / 2; g.add(body);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.06, 5), mat(0xe2a53a)); beak.rotation.z = -Math.PI / 2; beak.position.x = 0.15; g.add(beak);
  const wings = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    const w = bx(0.12, 0.01, 0.32, mat(0xdfe3e6)); w.position.z = s * 0.16; pivot.add(w);
    const tip = bx(0.08, 0.012, 0.08, mat(0x3a3d42)); tip.position.set(-0.02, 0, s * 0.3); pivot.add(tip);
    g.add(pivot); wings.push({ pivot, s });
  }
  g.userData.wings = wings;
  return g;
}
