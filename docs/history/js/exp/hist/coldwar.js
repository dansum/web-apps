// Берлинската стена при КПП „Чарли“ (улица „Фридрихщрасе“) — възстановка за „Студената война“ (9.3.2).
// Мерките са в метри. Север (Източен Берлин) е към −z, юг (Западен Берлин) — към +z. Стената е по z = 0.
// Опростено: граничната стена (бетонни плочи с тръба отгоре, вид от 70-те години), „ивицата на смъртта“
// с пясък, път за патрулите, лампи и сигнална ограда, вътрешна стена, наблюдателна кула, контролата на ГДР
// (бариери, зигзаг от бетонни блокове, сграда с навес), американската будка с чували с пясък и табелата.
// Употреба:
//   const b = buildBerlin(stage);  b.group, b.parts.get('wall'), b.cross(onDone), b.resetCross(), b.dispose()
import { THREE } from '../../kit.js';
import { Batch, box, cyl, figure, stride, rng } from './build.js';

// ---------- текстури (в метри: tw × th метра на едно повторение) ----------
function canvasTex(px, py, tw, th, draw) {
  const c = document.createElement('canvas'); c.width = px; c.height = py;
  draw(c.getContext('2d'), px, py);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / tw, 1 / th);
  t.anisotropy = 8;
  return t;
}
const noise = (g, w, h, n, seed, a = 0.06) => {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(${R() < 0.5 ? '40,40,40' : '255,255,255'},${R() * a})`; g.fillRect(R() * w, R() * h, 1 + R() * 3, 1 + R() * 3); }
};
const TX = {
  // Бетонни плочи по 1,2 м с фуги.
  concrete: () => canvasTex(128, 256, 1.2, 3.6, (g, w, h) => {
    g.fillStyle = '#b9b7b0'; g.fillRect(0, 0, w, h);
    const R = rng(5);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(90,88,80,${R() * 0.08})`; g.beginPath(); g.ellipse(R() * w, R() * h, 3 + R() * 14, 6 + R() * 30, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(60,58,52,0.25)'; for (let i = 0; i < 18; i++) g.fillRect(R() * w, h * 0.6 + R() * h * 0.4, 1, 10 + R() * 30);
    noise(g, w, h, 900, 9);
    g.fillStyle = '#7d7b74'; g.fillRect(0, 0, 3, h); g.fillRect(w - 2, 0, 2, h);
  }),
  // Графити по западната страна (80-те години): цветни петна, ивици и лица, без думи.
  graffiti: () => canvasTex(1024, 192, 19.2, 3.6, (g, w, h) => {
    g.fillStyle = '#c4c2bb'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 1500, 17);
    const R = rng(77), cols = ['#e2483d', '#f2c14e', '#3f8fd2', '#4caf6a', '#9b59b6', '#f08a3c', '#1f2a3a', '#ffffff', '#e86fa8'];
    for (let i = 0; i < 46; i++) {
      g.fillStyle = cols[Math.floor(R() * cols.length)]; g.globalAlpha = 0.6 + R() * 0.35;
      const x = R() * w, y = h * 0.25 + R() * h * 0.7, k = Math.floor(R() * 4);
      if (k === 0) { g.beginPath(); g.ellipse(x, y, 10 + R() * 34, 8 + R() * 22, R() * 3, 0, 7); g.fill(); }
      else if (k === 1) { g.save(); g.translate(x, y); g.rotate((R() - 0.5) * 0.8); g.fillRect(-30, -5, 60 + R() * 40, 8 + R() * 6); g.restore(); }
      else if (k === 2) { g.lineWidth = 4 + R() * 5; g.strokeStyle = g.fillStyle; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 5; s++) g.lineTo(x + s * 14, y + (s % 2 ? -18 : 12)); g.stroke(); }
      else { g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); g.fillStyle = '#1f2a3a'; g.globalAlpha = 0.9; g.fillRect(x - 7, y - 5, 4, 4); g.fillRect(x + 3, y - 5, 4, 4); g.fillRect(x - 6, y + 6, 12, 2.5); }
    }
    g.globalAlpha = 1;
    g.fillStyle = '#6f6d66'; for (let x = 0; x < w; x += w / 16) g.fillRect(x, 0, 2.5, h);
  }),
  // Изравнен (браздован) пясък в ивицата.
  sand: () => canvasTex(256, 256, 4, 4, (g, w, h) => {
    g.fillStyle = '#d8c79e'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150,130,90,0.35)'; g.lineWidth = 2;
    for (let x = 0; x < w; x += 9) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 2, h); g.stroke(); }
    noise(g, w, h, 2200, 21, 0.09);
  }),
  // Бетонни плочи с дупки — пътят на патрулите.
  slabs: () => canvasTex(256, 256, 3, 3, (g, w, h) => {
    g.fillStyle = '#a9a69d'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5e5b55'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
    for (let y = 18; y < h; y += 30) for (let x = 18; x < w; x += 30) { g.fillStyle = 'rgba(80,90,60,0.55)'; g.fillRect(x, y, 12, 12); }
    noise(g, w, h, 1200, 31);
  }),
  asphalt: () => canvasTex(256, 256, 6, 6, (g, w, h) => {
    g.fillStyle = '#6b6c6e'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 4000, 41, 0.12);
    const R = rng(43); g.strokeStyle = 'rgba(30,30,30,0.3)'; g.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) { g.beginPath(); let x = R() * w, y = R() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (R() - 0.5) * 40; y += (R() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
  }),
  sidewalk: () => canvasTex(128, 128, 1.2, 1.2, (g, w, h) => {
    g.fillStyle = '#b5b0a6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8f8a80'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h);
    noise(g, w, h, 500, 51);
  }),
  // Фасада на стара берлинска кооперация: един прозорец на един етаж (3,6 × 3,4 м).
  altbau: (base, seed) => canvasTex(128, 128, 3.6, 3.4, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    noise(g, w, h, 500, seed, 0.08);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(0, h - 10, w, 6);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, h - 12, w, 3);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(38, 22, 52, 76);
    g.fillStyle = '#2c3640'; g.fillRect(42, 26, 44, 68);
    g.fillStyle = 'rgba(160,190,210,0.25)'; g.fillRect(44, 28, 18, 30);
    g.fillStyle = '#e9e4d8'; g.fillRect(62, 26, 4, 68); g.fillRect(42, 52, 44, 4);
    g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(34, 98, 60, 6);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(34, 14, 60, 6);
  }),
  // Панелен блок: сиви плочи с фуги и прозорци.
  platte: () => canvasTex(128, 128, 3.6, 2.8, (g, w, h) => {
    g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, w, h);
    noise(g, w, h, 600, 61, 0.08);
    g.fillStyle = '#8c8980'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
    g.fillStyle = '#34404a'; g.fillRect(24, 34, 80, 54);
    g.fillStyle = '#efece4'; g.fillRect(62, 34, 4, 54); g.fillRect(24, 58, 80, 3);
    g.fillStyle = 'rgba(150,180,200,0.25)'; g.fillRect(26, 36, 34, 20);
  }),
  // Магазини на приземния етаж.
  shop: () => canvasTex(256, 128, 7.2, 4, (g, w, h) => {
    g.fillStyle = '#d9d2c2'; g.fillRect(0, 0, w, h);
    for (const x of [14, 140]) { g.fillStyle = '#26323a'; g.fillRect(x, 34, 100, 84); g.fillStyle = 'rgba(200,220,235,0.25)'; g.fillRect(x + 4, 38, 40, 40); }
    g.fillStyle = '#7a2e22'; g.fillRect(10, 12, 108, 16); g.fillStyle = '#2f5f7a'; g.fillRect(136, 12, 108, 16);
    noise(g, w, h, 600, 71);
  }),
  barrier: () => canvasTex(128, 16, 1.6, 0.2, (g, w, h) => { for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#d0362b'; g.fillRect(i * 32, 0, 32, h); } }),
  // Знаме на САЩ (опростено) и на ГДР (черно, червено, златисто с герба — опростен кръг).
  usflag: () => { const t = canvasTex(192, 104, 1, 1, (g, w, h) => {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, (i * h) / 13, w, h / 13 + 1); }
    g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * 0.4, h * 0.54);
    g.fillStyle = '#ffffff'; for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) g.fillRect(6 + c * 12, 5 + r * 10, 3, 3);
  }); t.repeat.set(1, 1); return t; },
  gdrflag: () => { const t = canvasTex(192, 116, 1, 1, (g, w, h) => {
    g.fillStyle = '#111111'; g.fillRect(0, 0, w, h / 3); g.fillStyle = '#dd0000'; g.fillRect(0, h / 3, w, h / 3); g.fillStyle = '#ffce00'; g.fillRect(0, (2 * h) / 3, w, h / 3 + 1);
    g.fillStyle = '#ffce00'; g.beginPath(); g.arc(w / 2, h / 2, 22, 0, 7); g.fill(); g.strokeStyle = '#2f6b2f'; g.lineWidth = 4; g.beginPath(); g.arc(w / 2, h / 2, 22, 0, 7); g.stroke();
  }); t.repeat.set(1, 1); return t; },
  // Табелата: преведена на български (истинската е на английски, руски, френски и немски).
  sign: () => { const t = canvasTex(512, 300, 1, 1, (g, w, h) => {
    g.fillStyle = '#f7f5ee'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = '#1b1b1b'; g.textAlign = 'center';
    g.font = 'bold 50px system-ui, Arial, sans-serif'; g.fillText('НАПУСКАТЕ', w / 2, 80);
    g.font = 'bold 42px system-ui, Arial, sans-serif'; g.fillText('АМЕРИКАНСКИЯ', w / 2, 136); g.fillText('СЕКТОР', w / 2, 186);
    g.fillStyle = '#555'; g.font = '24px system-ui, Arial, sans-serif';
    for (let i = 0; i < 3; i++) g.fillRect(70 + i * 20, 214 + i * 24, w - 140 - i * 40, 9);
  }); t.repeat.set(1, 1); return t; },
};

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });

export function buildBerlin(stage) {
  const group = new THREE.Group();
  group.name = 'berlin';
  const parts = new Map();
  const mats = {
    concrete: std({ map: TX.concrete() }), graffiti: std({ map: TX.graffiti() }), sand: std({ map: TX.sand(), roughness: 1 }),
    slabs: std({ map: TX.slabs() }), asphalt: std({ map: TX.asphalt(), roughness: 0.95 }), walk: std({ map: TX.sidewalk() }),
    platte: std({ map: TX.platte() }), shop: std({ map: TX.shop() }), barrier: std({ map: TX.barrier() }),
    altA: std({ map: TX.altbau('#d8c3a0', 3) }), altB: std({ map: TX.altbau('#c9b8a8', 5) }), altC: std({ map: TX.altbau('#b9a58a', 7) }), altE: std({ map: TX.altbau('#a9a49a', 9) }),
    roof: std({ color: 0x5b4a44 }), flatRoof: std({ color: 0x4a4a4c }), white: std({ color: 0xf2f0e8 }), dark: std({ color: 0x2b2e33, roughness: 0.6 }),
    glass: std({ color: 0x2c3a44, roughness: 0.2, metalness: 0.3 }), steel: std({ color: 0x5c6168, roughness: 0.5, metalness: 0.6 }),
    grey: std({ color: 0x8d8e8a }), paint: std({ color: 0xf4f1e6, roughness: 0.6 }), sandbag: std({ color: 0xb9a57a, roughness: 1 }),
    green: std({ color: 0x5f7d45 }), towerTop: std({ color: 0xd8d8d0 }), red: std({ color: 0xc0392b }),
  };
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xffe9a0, emissiveIntensity: 0.6 });

  // ----- земя, улици, тротоари -----
  const ground = new Batch();
  const G = ground.frame();
  G.box(mats.asphalt, 220, 0.02, 200, 0, -0.02, -10);
  G.box(mats.walk, 3.2, 0.14, 200, -6.6, 0, -10).box(mats.walk, 3.2, 0.14, 200, 6.6, 0, -10);       // тротоари на „Фридрихщрасе“
  G.box(mats.walk, 220, 0.14, 2.4, 0, 0, 9.4);                                                        // тротоар на запад, край „Цимерщрасе“
  G.box(mats.sand, 64, 0.03, 9, -40, 0, -5.5).box(mats.sand, 52, 0.03, 9, 49, 0, -5.5);              // пясъчна ивица
  G.box(mats.slabs, 64, 0.04, 3.2, -40, 0, -12).box(mats.slabs, 52, 0.04, 3.2, 49, 0, -12);          // път за патрулите
  G.box(mats.sand, 64, 0.025, 14, -40, 0, -21).box(mats.sand, 52, 0.025, 14, 49, 0, -21);
  group.add(ground.build({ cast: false }));
  // Бяла линия на границата на секторите през улицата.
  const line = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.25), std({ color: 0xffffff }));
  line.rotation.x = -Math.PI / 2; line.position.set(0, 0.02, 0.4); group.add(line);

  // ----- граничната стена (z = 0) и вътрешната стена (z = −28) -----
  const wallG = new THREE.Group(); wallG.userData.pickId = 'wall';
  const W = new Batch(), Wf = W.frame();
  for (const [x0, x1] of [[-72, -8], [8, 75]]) {
    const len = x1 - x0, cx = (x0 + x1) / 2;
    Wf.box(mats.concrete, len, 3.6, 0.2, cx, 0, 0);
    Wf.box(mats.graffiti, len, 3.4, 0.01, cx, 0.05, 0.106);
    Wf.box(mats.concrete, len, 0.15, 1.2, cx, 0, -0.7);                       // стъпалото на L-образните плочи (към изток)
    Wf.add(mats.concrete, cyl(0.2, len, 10).rotateZ(Math.PI / 2), cx + len / 2, 3.78, 0);   // тръбата отгоре
  }
  wallG.add(W.build());
  group.add(wallG); parts.set('wall', wallG);

  const stripG = new THREE.Group(); stripG.userData.pickId = 'strip';
  const S = new Batch(), Sf = S.frame();
  for (const [x0, x1] of [[-72, -8], [23, 75]]) {
    const len = x1 - x0, cx = (x0 + x1) / 2;
    Sf.box(mats.concrete, len, 2.9, 0.3, cx, 0, -28);                         // вътрешна стена
    // Сигнална ограда: стълбове и жици.
    for (let x = x0 + 1; x < x1; x += 3) Sf.box(mats.steel, 0.08, 2.2, 0.08, x, 0, -24);
    for (const y of [0.5, 1.0, 1.5, 2.0]) Sf.box(mats.steel, len, 0.02, 0.02, cx, y, -24);
    // Лампи по ивицата.
    for (let x = x0 + 6; x < x1; x += 16) { Sf.box(mats.grey, 0.18, 7, 0.18, x, 0, -16).box(mats.grey, 0.12, 0.12, 1.6, x, 6.9, -15.3); Sf.box(lamp, 0.5, 0.18, 0.4, x, 6.75, -14.6); }
  }
  // „Таралежи“ срещу коли в пясъка.
  const R = rng(91);
  for (let i = 0; i < 14; i++) {
    const x = R() < 0.5 ? -70 + R() * 58 : 26 + R() * 46, z = -3 - R() * 5, ry = R() * 3;
    const f = S.frame(x, 0, z, ry);
    for (const [rx, rz] of [[0.95, 0], [-0.95, 0.5], [0, -0.95]]) f.add(mats.steel, box(0.14, 1.6, 0.14).translate(0, -0.8, 0), 0, 0.62, 0, 0, rx, rz);
  }
  stripG.add(S.build());
  group.add(stripG); parts.set('strip', stripG);

  // ----- наблюдателна кула -----
  const towerG = new THREE.Group(); towerG.userData.pickId = 'tower';
  const T = new Batch(), Tf = T.frame(-30, 0, -18);
  Tf.box(mats.concrete, 2, 7.2, 2, 0, 0, 0);
  Tf.box(mats.towerTop, 3.4, 0.25, 3.4, 0, 7.2, 0);
  for (const [x, z, ry] of [[0, 1.6, 0], [0, -1.6, 0], [1.6, 0, Math.PI / 2], [-1.6, 0, Math.PI / 2]]) {
    const f = Tf.sub(x, 7.45, z, ry);
    f.box(mats.towerTop, 3.4, 0.9, 0.2, 0, 0, 0).box(mats.glass, 3.0, 1.0, 0.22, 0, 0.9, 0).box(mats.towerTop, 3.4, 0.35, 0.2, 0, 1.9, 0);
    for (const px of [-1.0, 0, 1.0]) f.box(mats.towerTop, 0.1, 1.0, 0.24, px, 0.9, 0);
  }
  Tf.box(mats.towerTop, 3.6, 0.2, 3.6, 0, 9.7, 0);
  for (const [x, z] of [[1.6, 1.6], [-1.6, 1.6], [1.6, -1.6], [-1.6, -1.6]]) Tf.box(mats.steel, 0.05, 0.6, 0.05, x, 9.9, z);
  for (const s of [-1, 1]) { Tf.box(mats.steel, 3.3, 0.05, 0.05, 0, 10.45, s * 1.6).box(mats.steel, 0.05, 0.05, 3.3, s * 1.6, 10.45, 0); }
  Tf.box(mats.dark, 0.7, 2.0, 0.05, 0, 0, 1.01);                               // врата
  towerG.add(T.build());
  // Прожектор на покрива, който бавно се върти, и конус светлина.
  const spot = new THREE.Group(); spot.position.set(-30, 10.2, -18);
  const lampHead = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 14), mats.steel); lampHead.rotation.x = Math.PI / 2; spot.add(lampHead);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.26, 14), lamp); lens.position.z = 0.26; spot.add(lens);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 16, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff3c0, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }));
  beam.rotation.x = -Math.PI / 2; beam.position.z = 8.2; beam.raycast = () => {}; spot.add(beam);
  spot.rotation.x = 0.45;
  towerG.add(spot);
  group.add(towerG); parts.set('tower', towerG);

  // ----- контролата на ГДР: бариери, зигзаг, сграда с навес, знаме -----
  const gdrG = new THREE.Group(); gdrG.userData.pickId = 'gdr';
  const C = new Batch(), Cf = C.frame();
  Cf.box(mats.platte, 12, 3.6, 16, 16, 0, -17).box(mats.flatRoof, 12.6, 0.3, 16.6, 16, 3.6, -17);   // контролна сграда
  for (let z = -23; z <= -11; z += 3) Cf.box(mats.glass, 0.1, 1.3, 1.8, 9.95, 1.2, z);              // прозорчета към платното
  Cf.box(mats.flatRoof, 6.4, 0.4, 10, 7, 4.4, -16);                                                  // навес над платното за колите
  for (const z of [-20.4, -11.6]) Cf.box(mats.steel, 0.3, 4.4, 0.3, 4.2, 0, z);
  Cf.box(mats.platte, 1.6, 2.5, 2.2, 4.8, 0, -17).box(mats.flatRoof, 1.9, 0.15, 2.5, 4.8, 2.5, -17).box(mats.glass, 0.05, 0.8, 1.2, 3.98, 1.2, -17);   // кабинка за паспортите
  for (const [x, z] of [[-2.4, -5], [2.4, -7.5], [-2.4, -10], [2.4, -21.5], [-2.4, -24]]) Cf.box(mats.paint, 5.2, 1.0, 0.8, x, 0, z);   // зигзаг
  Cf.box(mats.grey, 0.4, 1.0, 0.4, -4.6, 0, -3).box(mats.grey, 0.4, 1.0, 0.4, -4.6, 0, -26.5);        // стълбчета на бариерите
  Cf.box(mats.steel, 0.08, 9, 0.08, 9, 0, -3.5);                                                       // пилон за знамето
  Cf.box(mats.platte, 4, 2.6, 3, 20, 0, -4).box(mats.flatRoof, 4.4, 0.25, 3.4, 20, 2.6, -4);          // будка на граничарите
  gdrG.add(C.build());
  const boom = (z) => {
    const p = new THREE.Group(); p.position.set(-4.6, 0.9, z);
    const arm = new THREE.Mesh(box(9, 0.18, 0.18).translate(4.5, -0.09, 0), mats.barrier); p.add(arm);
    gdrG.add(p); return p;
  };
  const booms = [boom(-3), boom(-26.5)];
  const gdrFlag = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.45, 8, 1), std({ map: TX.gdrflag(), side: THREE.DoubleSide }));
  gdrFlag.position.set(10.2, 8.2, -3.5); gdrG.add(gdrFlag);
  group.add(gdrG); parts.set('gdr', gdrG);

  // ----- американската будка с чувалите и табелата -----
  const hutG = new THREE.Group(); hutG.userData.pickId = 'hut';
  const H = new Batch(), Hf = H.frame(0, 0, 14);
  Hf.box(mats.grey, 3.2, 0.25, 2.6, 0, 0, 0);
  Hf.box(mats.white, 2.6, 2.5, 2.0, 0, 0.25, 0);
  for (const [x, z, w, d] of [[0, 1.01, 2.0, 0.04], [0, -1.01, 2.0, 0.04], [1.31, 0, 0.04, 1.4], [-1.31, 0, 0.04, 1.4]]) Hf.box(mats.glass, w, 1.0, d, x, 1.35, z);
  Hf.box(mats.white, 3.0, 0.2, 2.4, 0, 2.75, 0).box(mats.white, 2.4, 0.5, 1.8, 0, 2.95, 0);
  // Чували с пясък пред будката (към изток).
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - (row % 2); i++) {
    const g = new THREE.SphereGeometry(0.34, 10, 6).scale(1.15, 0.42, 0.7);
    Hf.add(mats.sandbag, g, -1.4 + i * 0.7 + (row % 2) * 0.35, 0.16 + row * 0.28, -1.75);
  }
  Hf.box(mats.steel, 0.07, 6, 0.07, 1.1, 0, 0.8);
  hutG.add(H.build());
  const usFlag = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.86, 8, 1), std({ map: TX.usflag(), side: THREE.DoubleSide }));
  usFlag.position.set(1.95, 5.5, 14.8); hutG.add(usFlag);
  group.add(hutG); parts.set('hut', hutG);

  const signG = new THREE.Group(); signG.userData.pickId = 'sign';
  const SB = new Batch(), SBf = SB.frame(-7.2, 0, 6);
  SBf.box(mats.steel, 0.12, 3.0, 0.12, -1.5, 0, 0).box(mats.steel, 0.12, 3.0, 0.12, 1.5, 0, 0);
  signG.add(SB.build());
  const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.1, 0.08), [mats.paint, mats.paint, mats.paint, mats.paint, std({ map: TX.sign() }), mats.paint]);
  board.position.set(-7.2, 3.2, 6.05); signG.add(board);
  group.add(signG); parts.set('sign', signG);

  // ----- къщи: на запад стари кооперации, на изток панелни блокове и стари къщи -----
  const B = new Batch();
  const block = (x, z, w, d, h, m, roofM = mats.roof, shop = true) => {
    const f = B.frame(x, 0, z);
    f.box(m, w, h, d, 0, 0, 0);
    f.box(mats.grey, w + 0.5, 0.45, d + 0.5, 0, h, 0);
    f.add(roofM, new THREE.BoxGeometry(w, 2.2, d * 0.7).translate(0, h + 1.5, 0));
    if (shop) { f.box(mats.shop, w - 0.4, 3.6, 0.1, 0, 0, d / 2 + 0.05).box(mats.shop, 0.1, 3.6, d - 0.4, w / 2 + 0.05, 0, 0).box(mats.shop, 0.1, 3.6, d - 0.4, -w / 2 - 0.05, 0, 0); }
  };
  // Запад (юг, +z): по „Фридрихщрасе“ и по „Цимерщрасе“.
  // Ъгълът вляво е празен парцел (край стената на запад има много празни места след войната).
  B.frame(-19, 0, 24).box(std({ color: 0x8a9a5a, roughness: 1 }), 20, 0.05, 22, 0, 0, 0).box(mats.grey, 20, 1.2, 0.1, 0, 0, -11).box(mats.grey, 0.1, 1.2, 22, 10, 0, 0);
  block(17, 22, 18, 22, 17, mats.altB);
  block(-17, 48, 18, 22, 17, mats.altC); block(17, 48, 18, 22, 20.4, mats.altA);
  block(-44, 20, 30, 16, 17, mats.altB); block(46, 20, 30, 16, 20.4, mats.altC);
  // Изток (север, −z): зад вътрешната стена.
  block(-18, -42, 20, 14, 17, mats.altE, mats.flatRoof, false); block(22, -44, 24, 14, 22.4, mats.platte, mats.flatRoof, false);
  block(-50, -44, 34, 14, 22.4, mats.platte, mats.flatRoof, false); block(56, -44, 30, 14, 17, mats.altE, mats.flatRoof, false);
  group.add(B.build());

  // ----- хора, коли, живот -----
  const people = [];
  const addPerson = (look, x, z, ry = 0) => { const f = figure(look); f.position.set(x, 0, z); f.rotation.y = ry; group.add(f); return f; };
  // Американски военен при будката и граничари на ГДР.
  const GUARD = { tunic: 0x6f7864, legs: 0x5c6553, hair: 0x5c6553 };
  const soldier = addPerson({ tunic: 0x5c6b3c, legs: 0x4f5c34, hair: 0x4f5c34 }, 1.8, 12.2, Math.PI);
  const guardA = addPerson(GUARD, -3, -2);
  addPerson(GUARD, 6.5, -14, -Math.PI / 2);
  const patrol = addPerson(GUARD, -40, -12);
  // Минувачи на запад по тротоарите.
  const walkers = [];
  const looks = [{ tunic: 0x8a3b2f, legs: 0x2f3440 }, { tunic: 0x2f5f8f, legs: 0x3a3a3a }, { tunic: 0xc8a050, legs: 0x4a3a2c, long: true }, { tunic: 0x4f6f4f, legs: 0x2f3440 }, { tunic: 0x9a6aa0, legs: 0x2a2a2e, long: true }];
  [[-6.6, 40, 1], [6.6, 18, -1], [-6.6, 26, 1], [-30, 9.4, 1], [30, 9.4, -1]].forEach(([x, z, dir], i) => {
    const f = addPerson(looks[i], x, z);
    const alongX = Math.abs(x) > 20;
    walkers.push({ f, alongX, dir, base: alongX ? x : z, phase: i * 1.7 });
  });
  // Коли: „Трабант“ чака пред източната бариера, западна кола край тротоара.
  const car = (color, x, z, ry) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(box(1.5, 0.75, 3.5), std({ color, roughness: 0.5 })); body.position.y = 0.3; g.add(body);
    const cab = new THREE.Mesh(box(1.35, 0.55, 1.8), std({ color, roughness: 0.5 })); cab.position.set(0, 1.05, -0.2); g.add(cab);
    const gl = new THREE.Mesh(box(1.38, 0.4, 1.6), mats.glass); gl.position.set(0, 1.1, -0.2); g.add(gl);
    for (const sx of [-0.72, 0.72]) for (const sz of [-1.1, 1.1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 14), mats.dark); w.rotation.z = Math.PI / 2; w.position.set(sx, 0.3, sz); g.add(w); }
    g.position.set(x, 0, z); g.rotation.y = ry; group.add(g); return g;
  };
  const trabant = car(0x9db7c9, 2.2, -31, 0);
  car(0xc8b089, -4.0, 22, 0); car(0x8b2a2a, 4.0, 36, Math.PI);

  // Облаци и птици.
  const cloudM = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 1 });
  const clouds = [0, 1, 2, 3].map((i) => {
    const c = new THREE.Group();
    for (const [x, y, z, r] of [[0, 0, 0, 4], [4, 0.5, 1, 3], [-4, 0, -1, 3.2], [1, 2, 0, 2.8]]) { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), cloudM); s.position.set(x, y, z); c.add(s); }
    c.position.set(-80 + i * 50, 38 + (i % 2) * 6, -60 + i * 18); group.add(c); return c;
  });
  const birdM = new THREE.MeshBasicMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide });
  const birds = [0, 1, 2, 3, 4].map((i) => {
    const b = new THREE.Group();
    for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.18), birdM); w.position.x = s * 0.3; b.add(w); b.userData[s < 0 ? 'l' : 'r'] = w; }
    b.userData.phase = i * 1.3; group.add(b); return b;
  });

  // Пътникът, който минава от Изток на Запад (чужденец с паспорт).
  const traveller = figure({ tunic: 0xb5652e, legs: 0x2f3440 });
  traveller.userData.pickId = 'traveller';
  traveller.position.set(0, 0, -44); traveller.visible = false; group.add(traveller);
  const PATH = [[1.5, -44], [1.5, -30, 'b1'], [2.6, -26], [3.0, -17, 'wait'], [-0.3, -15.5], [-0.3, -11], [3.2, -8.8], [-0.4, -6.3], [0.3, -4.6, 'b0'], [0.3, 4], [-1.6, 11.5, 'hut'], [-1.6, 19], [-1.2, 34]];
  let crossing = null;
  function resetCross() {
    crossing = null; traveller.visible = false; traveller.position.set(1.5, 0, -44);
    booms.forEach((b) => { b.rotation.z = 0; });
    trabant.position.z = -31;
  }
  function cross(onEvent) {
    resetCross();
    traveller.visible = true;
    crossing = { i: 0, wait: 0, onEvent, lift: [0, 0] };
  }

  // Анимация.
  const stop = stage.tick((dt, t) => {
    if (!group.visible) return;
    spot.rotation.y = Math.sin(t * 0.35) * 1.1 + 0.2;
    usFlag.geometry.attributes.position.array.forEach((_, k, arr) => { if (k % 3 === 2) { const x = arr[k - 2]; arr[k] = Math.sin(t * 3 + x * 3) * 0.08 * (x + 0.8); } });
    usFlag.geometry.attributes.position.needsUpdate = true;
    gdrFlag.geometry.attributes.position.array.forEach((_, k, arr) => { if (k % 3 === 2) { const x = arr[k - 2]; arr[k] = Math.sin(t * 2.6 + x * 2.6) * 0.1 * (x + 1.2); } });
    gdrFlag.geometry.attributes.position.needsUpdate = true;
    soldier.rotation.y = Math.PI + Math.sin(t * 0.3) * 0.5;
    guardA.rotation.y = Math.sin(t * 0.25 + 1) * 0.8;
    // Патрулът ходи по пътя на ивицата напред-назад.
    const px = -40 + Math.sin(t * 0.08) * 26;
    patrol.position.x = px; patrol.rotation.y = Math.cos(t * 0.08) > 0 ? Math.PI / 2 : -Math.PI / 2; stride(patrol, t * 5, 0.8);
    for (const w of walkers) {
      const s = ((t * 1.3 + w.phase * 6) % 40) - 20;
      if (w.alongX) { w.f.position.x = w.base + s * w.dir; w.f.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2; }
      else { w.f.position.z = w.base + s * w.dir; w.f.rotation.y = w.dir > 0 ? 0 : Math.PI; }
      stride(w.f, t * 6 + w.phase, 0.9);
    }
    clouds.forEach((c, i) => { c.position.x += dt * (1 + i * 0.3); if (c.position.x > 110) c.position.x = -110; });
    birds.forEach((b, i) => {
      const a = t * 0.25 + b.userData.phase, r = 22 + i * 4;
      b.position.set(Math.cos(a) * r, 22 + i * 1.5 + Math.sin(t + i) * 0.6, Math.sin(a) * r - 10);
      b.rotation.y = -a; const f = Math.sin(t * 9 + i) * 0.5;
      b.userData.l.rotation.z = f; b.userData.r.rotation.z = -f;
    });
    // Пътникът.
    if (crossing) {
      const c = crossing;
      for (let k = 0; k < 2; k++) { const want = c.lift[k] ? 1.25 : 0; booms[k].rotation.z += (want - booms[k].rotation.z) * Math.min(1, dt * 3); }
      if (c.wait > 0) { c.wait -= dt; stride(traveller, 0, 0); return; }
      const tgt = PATH[c.i];
      if (!tgt) { crossing = null; c.onEvent && c.onEvent('done'); return; }
      const dx = tgt[0] - traveller.position.x, dz = tgt[1] - traveller.position.z, d = Math.hypot(dx, dz);
      const v = 4.2 * dt;
      if (d < v) {
        traveller.position.set(tgt[0], 0, tgt[1]);
        const tag = tgt[2];
        if (tag === 'b1') c.lift[1] = 1;
        if (tag === 'wait') { c.wait = 1.6; c.onEvent && c.onEvent('control'); }
        if (tag === 'b0') { c.lift[0] = 1; c.lift[1] = 0; c.wait = 0.6; }
        if (tag === 'hut') { c.wait = 1.2; c.onEvent && c.onEvent('west'); }
        c.i++;
      } else {
        traveller.position.x += (dx / d) * v; traveller.position.z += (dz / d) * v;
        traveller.rotation.y = Math.atan2(dx, dz);
        stride(traveller, t * 9, 1);
      }
    } else {
      // Без пътник „Трабантът“ леко потегля и спира.
      trabant.position.z = -31 + Math.max(0, Math.sin(t * 0.2)) * 1.2;
    }
  });

  stage.scene.add(group);
  return {
    group, parts, traveller, cross, resetCross,
    dispose() { stop(); stage.scene.remove(group); },
  };
}
