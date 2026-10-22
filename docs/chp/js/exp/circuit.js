// 6.1.7 „Електричен ток и електрически вериги“ — 3D работна маса с батерия, ключ, лампа, моторче и нагревател.
// Стъпки: опознай уредите → построй верига → проводник или изолатор → схеми и безопасност.
import { createStage, labelSprite, mat, zoneRing, addHitBox, cornerMenu, THREE, esc } from '../kit.js';
import { createShell, stepScore } from './shell.js';

const CSS = `
.circuit-sch { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
.circuit-sch .choice { flex-direction: column; gap: 2px; padding: 6px; align-items: stretch; }
.circuit-sch svg { width: 100%; height: auto; display: block; }
.circuit-sch .cap { font-size: 0.8rem; text-align: center; color: #556; }
.circuit-one { max-width: 210px; margin: 4px auto; display: block; }
.circuit-match { display: grid; gap: 6px; margin-top: 6px; }
.circuit-match .mrow { display: grid; gap: 3px; }
.circuit-match .mrow b { font-size: 0.9rem; }
.circuit-match .opts { display: flex; gap: 4px; flex-wrap: wrap; }
.circuit-match .choice { padding: 4px 9px; font-size: 0.85rem; }
.circuit-dev { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0; }
.circuit-dev .chip { cursor: pointer; }
.circuit-dev .chip.on { background: #1865f2; color: #fff; border-color: #1865f2; }
.circuit-dev .chip.done::after { content: " ✓"; color: #1fab54; }
.circuit-dev .chip.on.done::after { color: #fff; }
.circuit-multi .choice { padding: 7px 10px; }
.circuit-multi .choice .box { width: 1.1em; height: 1.1em; border: 2px solid #9aa7b8; border-radius: 4px; flex: none; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8em; }
.circuit-multi .choice.on .box { background: #1865f2; border-color: #1865f2; color: #fff; }
.circuit-multi .choice.on .box::after { content: "✓"; }
`;
function injectStyle() {
  if (document.getElementById('circuit-style')) return;
  const s = document.createElement('style');
  s.id = 'circuit-style';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ---------- описания ----------
const INFO = {
  battery: { label: 'Батерия', icon: '🔋', lift: 1.75,
    note: 'Източник на електрична енергия (4,5 V). Има два полюса — „+“ и „−“. Тя кара електроните в проводниците да се движат в една посока.' },
  lamp: { label: 'Лампа', icon: '💡', lift: 1.85,
    note: 'Консуматор. Превръща електричната енергия в <b>светлина</b> (и малко топлина). Свети само когато през нея тече ток.' },
  switch: { label: 'Ключ', icon: '🔘', lift: 1.15,
    note: 'Ключът (прекъсвачът) <b>затваря</b> и <b>отваря</b> веригата. Кликни го! Когато е отворен, токът спира.' },
  motor: { label: 'Моторче', icon: '⚙️', lift: 1.4,
    note: 'Консуматор. Превръща електричната енергия в <b>движение</b> (механично действие) — като във вентилатора, миксера и колите играчки.' },
  heater: { label: 'Нагревател', icon: '🔥', lift: 1.05,
    note: 'Нагревателна спирала. Превръща електричната енергия в <b>топлина</b> — като в ютията, чайника и тостера.' },
  gap: { label: 'Процеп', icon: '⬜', lift: 0.95, note: 'Тук се слага предметът, който изпитваме.' },
};
const WIRE_NOTE = 'Медна жичка в пластмасова обвивка. Медта е <b>проводник</b> — пропуска тока. Пластмасата е <b>изолатор</b> — не го пропуска и ни пази.';
const ELECTRON_NOTE = 'Електричният ток е <b>насочено движение на електрони</b>. В проводниците те текат от „−“ към „+“ на батерията. Виж сините точици в жиците!';
const SOCKET_NOTE = 'Контактът в стената дава <b>230 V</b> — около 50 пъти повече от батерията. Токът от него е <b>опасен за живота</b>! Никога не пъхай предмети в него.';

const DEVICES = ['lamp', 'motor', 'heater'];
const EFFECT = { lamp: 'light', motor: 'move', heater: 'heat' };
const EFFECT_NAME = { light: 'светлина', move: 'движение', heat: 'топлина' };

// Предмети за изпитване в процепа.
const OBJECTS = [
  { id: 'coin', label: 'Монета', full: 'металната монета', cond: 1, app: 'Металите провеждат ток — от тях се правят жиците и контактите.' },
  { id: 'clip', label: 'Кламер', full: 'стоманеният кламер', cond: 1, app: 'Стоманата е метал — провежда тока.' },
  { id: 'eraser', label: 'Гума', full: 'гумата', cond: 0, app: 'Гумата е изолатор — от гума са ръкавиците на електротехниците.' },
  { id: 'ruler', label: 'Линийка', full: 'пластмасовата линийка', cond: 0, app: 'Пластмасата е изолатор — с нея се обвиват жиците и щепселите.' },
  { id: 'graphite', label: 'Графит', full: 'графитът от молива', cond: 0.4, app: 'Графитът не е метал, но провежда ток — по-слабо от металите.' },
  { id: 'stick', label: 'Клечка', full: 'сухата дървена клечка', cond: 0, app: 'Сухото дърво е изолатор — от него са дръжките на някои инструменти.' },
  { id: 'glass', label: 'Стъкло', full: 'стъклената пръчица', cond: 0, app: 'Стъклото е изолатор — с него се държат жиците по електрическите стълбове.' },
];
const objById = Object.fromEntries(OBJECTS.map((o) => [o.id, o]));

// Разположение на уредите по стъпки.
const LAYOUT_MAIN = {
  battery: [-2.7, -0.2], switch: [-0.4, 1.4], lamp: [2.1, -0.1], motor: [-0.7, -1.95], heater: [1.3, -1.95], gap: [0, 0.5, false],
};
const PARK = { lamp: [3.3, -1.95], motor: [-0.7, -1.95], heater: [1.3, -1.95] };
const SLOT = [2.1, -0.1];
const LAYOUT_TEST = {
  battery: [-2.3, -1.0], lamp: [2.3, -1.0], gap: [0, 0.6, true], switch: [-1.7, -2.55], motor: [0, -2.55], heater: [1.7, -2.55],
};

// ---------- помощни модели ----------
function textPlane(text, w, h, { bg = '#ffffff', fg = '#1b2a3a', font = 'bold 120px system-ui, Arial, sans-serif' } = {}) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = Math.max(32, Math.round(256 * h / w));
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
}
function glowTexture(inner = 'rgba(255,240,170,1)', outer = 'rgba(255,200,80,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const brass = () => mat(0xc9a227, { metalness: 0.7, roughness: 0.35 });

function board(w = 1.3, d = 0.6, color = 0x8d6e63) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), mat(color, { roughness: 0.7 }));
  b.position.y = 0.06;
  b.castShadow = true; b.receiveShadow = true;
  return b;
}

// Извод (клема): метално копче, към което се закача проводник.
function terminal(comp, key, capColor = 0xc9a227) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.14, 10), brass());
  post.position.y = 0.07;
  const knobM = mat(capColor, { metalness: 0.5, roughness: 0.35, emissive: 0x000000 });
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 16), knobM);
  knob.position.y = 0.15;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffc107 }));
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.15;
  halo.visible = false;
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.13;
  g.add(post, knob, halo, hit);
  g.userData = { pickId: `T:${comp}:${key}`, knobM, halo, comp, key };
  return g;
}

function batteryModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.0, 0.55), mat(0x2f5fb3, { roughness: 0.45 }));
  body.position.y = 0.5;
  const band = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.3, 0.57), mat(0xf2b705, { roughness: 0.45 }));
  band.position.y = 0.82;
  const front = textPlane('4,5 V', 1.0, 0.42, { bg: '#2f5fb3', fg: '#ffffff' });
  front.position.set(0, 0.4, 0.278);
  const minus = textPlane('−', 0.26, 0.26, { bg: '#f2b705', fg: '#1b2a3a', font: 'bold 220px Arial' });
  minus.position.set(-0.4, 0.82, 0.29);
  const plus = textPlane('+', 0.26, 0.26, { bg: '#f2b705', fg: '#c62828', font: 'bold 220px Arial' });
  plus.position.set(0.4, 0.82, 0.29);
  g.add(body, band, front, minus, plus);
  const tm = terminal('battery', '-', 0x263238);
  tm.position.set(-0.4, 1.0, 0);
  const tp = terminal('battery', '+', 0xd32f2f);
  tp.position.set(0.4, 1.0, 0);
  g.add(tm, tp);
  g.userData.terms = { '-': tm, '+': tp };
  g.userData.bodyM = body.material;
  return g;
}

function lampModel() {
  const g = new THREE.Group();
  g.add(board());
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.28, 20), mat(0x37474f));
  sock.position.y = 0.26;
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 20), mat(0xb0bec5, { metalness: 0.7, roughness: 0.3 }));
  screw.position.y = 0.5;
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.172, 0.012, 6, 20), mat(0x90a4ae, { metalness: 0.7 }));
    r.rotation.x = Math.PI / 2;
    r.position.y = 0.43 + i * 0.065;
    g.add(r);
  }
  const glassM = new THREE.MeshStandardMaterial({ color: 0xfffbea, transparent: true, opacity: 0.32, roughness: 0.08, emissive: 0xffd54f, emissiveIntensity: 0, depthWrite: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 28, 20), glassM);
  bulb.position.y = 0.98;
  bulb.scale.y = 1.08;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.16, 20, 1, true), glassM);
  neck.position.y = 0.66;
  // нишка
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    pts.push(new THREE.Vector3(-0.13 + u * 0.26, 1.0 + Math.sin(u * Math.PI * 10) * 0.02, Math.cos(u * Math.PI * 10) * 0.02));
  }
  const filM = new THREE.MeshStandardMaterial({ color: 0x5d4037, emissive: 0xffb300, emissiveIntensity: 0 });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.01, 5), filM);
  const supM = mat(0x9e9e9e, { metalness: 0.6 });
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.42, 4), supM);
    w.position.set(s * 0.13, 0.8, 0);
    g.add(w);
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
  halo.position.y = 0.98;
  halo.scale.set(2.4, 2.4, 1);
  halo.raycast = () => {};
  const light = new THREE.PointLight(0xffd27a, 0, 6, 2);
  light.position.y = 1.0;
  g.add(sock, screw, bulb, neck, fil, halo, light);
  boardTrace(g);
  const ta = terminal('lamp', 'a'); ta.position.set(-0.45, 0.12, 0);
  const tb = terminal('lamp', 'b'); tb.position.set(0.45, 0.12, 0);
  g.add(ta, tb);
  g.userData.terms = { a: ta, b: tb };
  g.userData.fx = { glassM, filM, halo, light };
  return g;
}

// Тъмни „писти“ по дъсчицата от изводите към уреда.
function boardTrace(g, inner = 0.2) {
  const m = mat(0x3e2723);
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.45 - inner + 0.1, 0.01, 0.05), m);
    t.position.set(s * (inner + (0.45 - inner) / 2), 0.125, 0);
    g.add(t);
  }
}

function switchModel() {
  const g = new THREE.Group();
  g.add(board(1.3, 0.6, 0x6d4c41));
  const metal = mat(0xcfd8dc, { metalness: 0.75, roughness: 0.3 });
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.04), metal);
    cheek.position.set(-0.3, 0.23, s * 0.06);
    g.add(cheek);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.03), metal);
    clip.position.set(0.36, 0.21, s * 0.05);
    g.add(clip);
  }
  const pivot = new THREE.Group();
  pivot.position.set(-0.3, 0.29, 0);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.04, 0.06), metal);
  lever.position.x = 0.37;
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.22, 12), mat(0xe53935));
  handle.position.set(0.78, 0.09, 0);
  pivot.add(lever, handle);
  g.add(pivot);
  boardTrace(g, 0.3);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.8, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(0.02, 0.45, 0);
  g.add(hit);
  const ta = terminal('switch', 'a'); ta.position.set(-0.47, 0.12, 0.12);
  const tb = terminal('switch', 'b'); tb.position.set(0.47, 0.12, 0.12);
  g.add(ta, tb);
  g.userData.terms = { a: ta, b: tb };
  g.userData.pivot = pivot;
  return g;
}

function motorModel() {
  const g = new THREE.Group();
  g.add(board());
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.4), mat(0x546e7a));
  stand.position.y = 0.25;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.5, 22), mat(0xb0bec5, { metalness: 0.6, roughness: 0.35 }));
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.62, -0.05);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.08, 22), mat(0x78909c, { metalness: 0.5 }));
  cap.rotation.x = Math.PI / 2;
  cap.position.set(0, 0.62, 0.24);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8), brass());
  shaft.rotation.x = Math.PI / 2;
  shaft.position.set(0, 0.62, 0.36);
  const prop = new THREE.Group();
  prop.position.set(0, 0.62, 0.47);
  const bladeM = mat(0xff8f00);
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.rotation.z = (i / 3) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.02), bladeM);
    b.position.y = 0.24;
    b.rotation.y = 0.35;
    arm.add(b);
    prop.add(arm);
  }
  prop.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat(0xe65100)));
  g.add(stand, body, cap, shaft, prop);
  boardTrace(g);
  const ta = terminal('motor', 'a'); ta.position.set(-0.45, 0.12, 0.12);
  const tb = terminal('motor', 'b'); tb.position.set(0.45, 0.12, 0.12);
  g.add(ta, tb);
  g.userData.terms = { a: ta, b: tb };
  g.userData.fx = { prop, spin: 0 };
  return g;
}

function heaterModel() {
  const g = new THREE.Group();
  g.add(board());
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.18, 0.34), mat(0xf5f0e6));
  block.position.y = 0.21;
  const pts = [];
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    const a = u * Math.PI * 2 * 11;
    pts.push(new THREE.Vector3(-0.3 + u * 0.6, 0.42 + Math.sin(a) * 0.09, Math.cos(a) * 0.09));
  }
  const coilM = new THREE.MeshStandardMaterial({ color: 0x6d4c41, emissive: 0xff4a12, emissiveIntensity: 0, metalness: 0.4, roughness: 0.5 });
  const coil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 220, 0.018, 5), coilM);
  for (const s of [-1, 1]) {
    const hold = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.05), mat(0xf5f0e6));
    hold.position.set(s * 0.31, 0.38, 0);
    g.add(hold);
  }
  const wavesM = new THREE.SpriteMaterial({ map: glowTexture('rgba(255,140,60,0.9)', 'rgba(255,120,40,0)'), transparent: true, depthWrite: false, opacity: 0 });
  const waves = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(wavesM.clone());
    s.scale.set(0.22, 0.22, 1);
    s.userData.ph = i / 9;
    s.userData.x = -0.25 + (i % 5) * 0.125;
    s.raycast = () => {};
    g.add(s);
    waves.push(s);
  }
  const light = new THREE.PointLight(0xff6a2a, 0, 3, 2);
  light.position.y = 0.6;
  g.add(block, coil, light);
  boardTrace(g, 0.33);
  const ta = terminal('heater', 'a'); ta.position.set(-0.47, 0.12, 0.12);
  const tb = terminal('heater', 'b'); tb.position.set(0.47, 0.12, 0.12);
  g.add(ta, tb);
  g.userData.terms = { a: ta, b: tb };
  g.userData.fx = { coilM, waves, light };
  return g;
}

// Поставка с две щипки и процеп между тях.
function gapModel() {
  const g = new THREE.Group();
  g.add(board(1.5, 0.62, 0x455a64));
  const pad = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.36), new THREE.MeshBasicMaterial({ color: 0xffe082 }));
  pad.position.y = 0.125;
  g.add(pad);
  g.userData.pad = pad;
  for (const [s, c] of [[-1, 0xd32f2f], [1, 0x263238]]) {
    const jaw = new THREE.Group();
    jaw.position.set(s * 0.42, 0.12, 0);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.3), mat(c));
    base.position.y = 0.06;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.3), mat(0xcfd8dc, { metalness: 0.7, roughness: 0.3 }));
    tooth.position.set(-s * 0.1, 0.12, 0);
    jaw.add(base, tooth);
    g.add(jaw);
  }
  const ta = terminal('gap', 'a'); ta.position.set(-0.6, 0.12, -0.18);
  const tb = terminal('gap', 'b'); tb.position.set(0.6, 0.12, -0.18);
  g.add(ta, tb);
  g.userData.terms = { a: ta, b: tb };
  return g;
}

function objectModel(id) {
  const g = new THREE.Group();
  let m;
  switch (id) {
    case 'coin':
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 28), mat(0xd4a24c, { metalness: 0.85, roughness: 0.3 }));
      m.position.y = 0.025;
      g.add(m);
      { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 28), mat(0xb8862f, { metalness: 0.85, roughness: 0.3 }));
        rim.rotation.x = Math.PI / 2; rim.position.y = 0.052; g.add(rim); }
      break;
    case 'clip': {
      const p = [[-0.3, -0.06], [0.28, -0.06], [0.28, 0.07], [-0.24, 0.07], [-0.24, -0.02], [0.2, -0.02], [0.2, 0.03], [-0.1, 0.03]];
      const curve = new THREE.CatmullRomCurve3(p.map(([x, z]) => new THREE.Vector3(x, 0.03, z)), false, 'catmullrom', 0.2);
      m = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.018, 6), mat(0xcfd8dc, { metalness: 0.85, roughness: 0.25 }));
      g.add(m);
      break;
    }
    case 'eraser':
      m = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.16, 0.26), mat(0xf48fb1, { roughness: 0.9 }));
      m.position.y = 0.08;
      g.add(m);
      { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.165, 0.265), mat(0x42a5f5, { roughness: 0.9 })); b.position.set(0.13, 0.08, 0); g.add(b); }
      break;
    case 'ruler':
      m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.03, 0.22), new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.75, roughness: 0.2 }));
      m.position.y = 0.015;
      g.add(m);
      for (let i = 0; i < 11; i++) {
        const tick = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.005, i % 5 === 0 ? 0.09 : 0.05), mat(0x0d47a1));
        tick.position.set(-0.5 + i * 0.1, 0.033, -0.11 + (i % 5 === 0 ? 0.045 : 0.025));
        g.add(tick);
      }
      break;
    case 'graphite':
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 10), mat(0x37474f, { metalness: 0.4, roughness: 0.4 }));
      m.rotation.z = Math.PI / 2;
      m.position.y = 0.04;
      g.add(m);
      break;
    case 'stick':
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 8), mat(0xe2c290, { roughness: 0.9 }));
      m.rotation.z = Math.PI / 2;
      m.position.y = 0.045;
      g.add(m);
      break;
    case 'glass':
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 14), new THREE.MeshStandardMaterial({ color: 0xc8f1ff, transparent: true, opacity: 0.55, roughness: 0.05 }));
      m.rotation.z = Math.PI / 2;
      m.position.y = 0.06;
      g.add(m);
      break;
    default: break;
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ---------- схеми ----------
function schematic({ dev = 'lamp', sw = 'open', broken = false }) {
  const S = 'stroke="#1b2a3a" stroke-width="2.4" stroke-linecap="round" fill="none"';
  let s = `<svg viewBox="0 0 160 100" role="img"><rect x="0" y="0" width="160" height="100" fill="#fff"/>`;
  // батерия вляво
  s += `<line x1="24" y1="18" x2="24" y2="45" ${S}/><line x1="11" y1="45" x2="37" y2="45" ${S}/>`;
  s += `<line x1="18" y1="55" x2="30" y2="55" stroke="#1b2a3a" stroke-width="5.5" stroke-linecap="butt"/><line x1="24" y1="55" x2="24" y2="82" ${S}/>`;
  s += `<text x="42" y="44" font-size="13" font-weight="700" fill="#c62828">+</text><text x="42" y="63" font-size="13" font-weight="700" fill="#1b2a3a">−</text>`;
  // ключ отгоре
  if (sw === 'none') s += `<line x1="24" y1="18" x2="136" y2="18" ${S}/>`;
  else {
    s += `<line x1="24" y1="18" x2="68" y2="18" ${S}/><line x1="94" y1="18" x2="136" y2="18" ${S}/>`;
    s += `<circle cx="70" cy="18" r="2.6" fill="#1b2a3a"/><circle cx="92" cy="18" r="2.6" fill="#1b2a3a"/>`;
    s += sw === 'open' ? `<line x1="70" y1="18" x2="90" y2="5" ${S}/>` : `<line x1="70" y1="18" x2="92" y2="18" ${S}/>`;
  }
  // уред вдясно
  s += `<line x1="136" y1="18" x2="136" y2="38" ${S}/><circle cx="136" cy="50" r="12" ${S}/><line x1="136" y1="62" x2="136" y2="82" ${S}/>`;
  if (dev === 'lamp') s += `<line x1="127.5" y1="41.5" x2="144.5" y2="58.5" ${S}/><line x1="144.5" y1="41.5" x2="127.5" y2="58.5" ${S}/>`;
  else s += `<text x="136" y="55" font-size="14" font-weight="700" text-anchor="middle" fill="#1b2a3a">M</text>`;
  // долу
  if (broken) s += `<line x1="24" y1="82" x2="68" y2="82" ${S}/><line x1="94" y1="82" x2="136" y2="82" ${S}/>`;
  else s += `<line x1="24" y1="82" x2="136" y2="82" ${S}/>`;
  return s + '</svg>';
}

export function mount(container, opts) {
  injectStyle();
  let cur = null;
  const restart = () => { if (cur) cur.dispose(); cur = build(container, opts, restart); };
  cur = build(container, opts, restart);
  return { dispose() { if (cur) cur.dispose(); cur = null; } };
}

function build(container, { onComplete }, restart) {
  const STEPS = ['Опознай уредите', 'Построй верига', 'Проводник или изолатор?', 'Схеми и безопасност'];
  const shell = createShell(container, { steps: STEPS });
  const stage = createStage(shell.stageEl, {
    background: 0xe6edf5, camPos: [0, 6.2, 8.8], target: [0, 0.4, 0.2], shadows: false, maxDistance: 20, minDistance: 2.5,
  });
  const { scene, camera } = stage;
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };

  // ---------- стая и маса ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), mat(0xb9a48a));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 14), mat(0xf1ece2));
  wall.position.set(0, 3.5, -4.3);
  wall.receiveShadow = true;
  scene.add(floor, wall);
  const top = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.25, 6.6), mat(0xcfa46e, { roughness: 0.6 }));
  top.position.y = -0.125;
  top.receiveShadow = true;
  scene.add(top);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(9.7, 0.08, 6.7), mat(0xa77b45));
  edge.position.y = -0.25;
  scene.add(edge);
  for (const [x, z] of [[-4.4, -3], [4.4, -3], [-4.4, 3], [4.4, 3]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 0.25), mat(0x8b6236));
    leg.position.set(x, -1.45, z);
    scene.add(leg);
  }
  // Прозорец, часовник и контакт на стената.
  const win = new THREE.Group();
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.7), new THREE.MeshBasicMaterial({ color: 0xa7d8ff }));
  const frameM = mat(0xffffff);
  win.add(sky);
  for (const [w, h, x, y] of [[2.95, 0.1, 0, 0.9], [2.95, 0.1, 0, -0.9], [0.1, 1.9, -1.45, 0], [0.1, 1.9, 1.45, 0], [0.06, 1.7, 0, 0]]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameM);
    f.position.set(x, y, 0.02);
    win.add(f);
  }
  const cloud = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  cloud.scale.set(2.2, 0.8, 1);
  cloud.position.set(-0.6, 0.35, 0.01);
  win.add(cloud);
  win.position.set(0.3, 3.4, -4.28);
  scene.add(win);

  const clock = new THREE.Group();
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.55, 40), mat(0xffffff));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 40), mat(0x37474f));
  clock.add(face, rim);
  for (let i = 0; i < 12; i++) {
    const tk = new THREE.Mesh(new THREE.BoxGeometry(0.03, i % 3 ? 0.06 : 0.12, 0.01), mat(0x37474f));
    const a = (i / 12) * Math.PI * 2;
    tk.position.set(Math.sin(a) * 0.46, Math.cos(a) * 0.46, 0.01);
    tk.rotation.z = -a;
    clock.add(tk);
  }
  const hand = (len, w, color) => {
    const p = new THREE.Group();
    const h = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.01), mat(color));
    h.position.y = len / 2 - 0.04;
    p.add(h);
    p.position.z = 0.02;
    clock.add(p);
    return p;
  };
  const hH = hand(0.28, 0.05, 0x263238);
  const hM = hand(0.42, 0.035, 0x263238);
  const hS = hand(0.45, 0.012, 0xe53935);
  clock.position.set(-3.3, 3.5, -4.27);
  scene.add(clock);

  const socket = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.06), mat(0xfafafa, { roughness: 0.4 }));
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.04, 28), mat(0xe0e0e0));
  cup.rotation.x = Math.PI / 2;
  cup.position.z = 0.03;
  socket.add(plate, cup);
  for (const s of [-1, 1]) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), mat(0x212121));
    hole.position.set(s * 0.09, 0, 0.052);
    socket.add(hole);
  }
  const warn = textPlane('230 V', 0.62, 0.2, { bg: '#ffd54f', fg: '#1b2a3a', font: 'bold 64px system-ui, Arial' });
  warn.position.set(0, -0.48, 0.0);
  socket.add(warn);
  socket.position.set(3.4, 1.0, -4.25);
  socket.userData.pickId = 'socket';
  addHitBox(socket, 0.9);
  scene.add(socket);

  // Прашинки в светлината от прозореца.
  const dustN = 90;
  const dustGeo = new THREE.BufferGeometry();
  const dp = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dp[i * 3] = (Math.random() - 0.5) * 9; dp[i * 3 + 1] = Math.random() * 4; dp[i * 3 + 2] = (Math.random() - 0.5) * 7; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.6, depthWrite: false }));
  dust.raycast = () => {};
  scene.add(dust);

  // ---------- уреди ----------
  const comps = {
    battery: batteryModel(), switch: switchModel(), lamp: lampModel(), motor: motorModel(), heater: heaterModel(), gap: gapModel(),
  };
  const terms = {};
  for (const [id, g] of Object.entries(comps)) {
    g.userData.pickId = id;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const inf = INFO[id];
    const lbl = labelSprite(inf.label, { size: 0.26 });
    lbl.position.y = inf.lift - 0.2;
    g.add(lbl);
    stage.steadyLabel(lbl, 11);
    g.userData.label = lbl;
    scene.add(g);
    for (const t of Object.values(g.userData.terms)) terms[t.userData.pickId] = t;
  }
  comps.gap.userData.label.visible = false;
  const power = { lamp: 0, motor: 0, heater: 0 };
  const shown = { lamp: 0, motor: 0, heater: 0 };
  let switchClosed = false;
  let swAngle = 0.9;
  let shortOn = false;

  const moving = new Map();
  function place(id, x, z, dur = 0) {
    const g = comps[id];
    const to = new THREE.Vector3(x, 0, z);
    if (!dur) { g.position.copy(to); moving.delete(g); markDirty(id); return; }
    moving.set(g, { id, from: g.position.clone(), to, k: 0, dur });
  }
  function layout(L, dur = 0) {
    for (const [id, v] of Object.entries(L)) {
      place(id, v[0], v[1], dur);
      if (v.length > 2) comps[id].visible = v[2];
    }
  }

  // ---------- проводници ----------
  const WIRE_COLORS = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e24aa];
  let wires = [];
  let wireSeq = 0;
  const elGeo = new THREE.SphereGeometry(0.034, 8, 6);
  const elMat = new THREE.MeshBasicMaterial({ color: 0x1565ff });
  function tipOf(tid) { return terms[tid].localToWorld(new THREE.Vector3(0, 0.19, 0)); }
  function buildCurve(w) {
    const a = tipOf(w.t1); const b = tipOf(w.t2);
    const pts = [a, a.clone().add(new THREE.Vector3(0, 0.22, 0))];
    if (w.via) for (const v of w.via) pts.push(new THREE.Vector3(...v));
    else {
      const mid = a.clone().lerp(b, 0.5);
      mid.y = Math.max(a.y, b.y) + 0.28 + a.distanceTo(b) * 0.06;
      pts.push(mid);
    }
    pts.push(b.clone().add(new THREE.Vector3(0, 0.22, 0)), b);
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }
  function rebuildWire(w) {
    const curve = buildCurve(w);
    w.curve = curve;
    w.len = curve.getLength();
    for (const m of [w.ins, w.core, w.hit]) if (m.geometry) m.geometry.dispose();
    w.ins.geometry = new THREE.TubeGeometry(curve, 64, 0.055, 8);
    w.core.geometry = new THREE.TubeGeometry(curve, 64, 0.018, 6);
    w.hit.geometry = new THREE.TubeGeometry(curve, 24, 0.15, 6);
    w.anchor.position.copy(curve.getPointAt(0.5));
    const n = Math.max(5, Math.round(w.len / 0.2));
    while (w.els.length < n) {
      const e = new THREE.Mesh(elGeo, elMat);
      e.userData.u = Math.random();
      e.userData.ph = Math.random() * 20;
      w.group.add(e);
      w.els.push(e);
    }
    while (w.els.length > n) w.group.remove(w.els.pop());
    w.els.forEach((e, i) => { if (e.userData.base === undefined) e.userData.u = (i + Math.random() * 0.5) / n; e.userData.base = 1; });
  }
  function addWire(t1, t2, via = null) {
    const id = ++wireSeq;
    const color = WIRE_COLORS[(id - 1) % WIRE_COLORS.length];
    const group = new THREE.Group();
    group.userData.pickId = 'W:' + id;
    const ins = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.5, roughness: 0.3, depthWrite: false }));
    const core = new THREE.Mesh(new THREE.BufferGeometry(), mat(0xd9822b, { metalness: 0.6, roughness: 0.35 }));
    const hit = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ visible: false }));
    ins.castShadow = true;
    group.add(ins, core, hit);
    const anchor = new THREE.Object3D();
    scene.add(anchor);
    scene.add(group);
    const w = { id, t1, t2, via, group, ins, core, hit, anchor, els: [], dir: 0 };
    rebuildWire(w);
    wires.push(w);
    return w;
  }
  function removeWire(w) {
    scene.remove(w.group);
    scene.remove(w.anchor);
    for (const m of [w.ins, w.core, w.hit]) { m.geometry.dispose(); m.material.dispose(); }
    wires = wires.filter((x) => x !== w);
  }
  function clearWires() { for (const w of wires.slice()) removeWire(w); }
  const wireAt = (tid) => wires.find((w) => w.t1 === tid || w.t2 === tid);
  const dirty = new Set();
  function markDirty(compId) { dirty.add(compId); }

  // ---------- решаване на веригата ----------
  let gapObj = null; // предмет в процепа
  function solve() {
    let cur = 'T:battery:-';
    const path = [];
    const list = [];
    for (let guard = 0; guard < 16; guard++) {
      const w = wireAt(cur);
      if (!w) return { closed: false, list };
      const other = w.t1 === cur ? w.t2 : w.t1;
      path.push({ w, dir: w.t1 === cur ? 1 : -1 });
      const [, comp, key] = other.split(':');
      if (comp === 'battery') return key === '+' ? { closed: true, path, list } : { closed: false, list };
      list.push(comp);
      cur = `T:${comp}:${key === 'a' ? 'b' : 'a'}`;
    }
    return { closed: false, list };
  }
  let state = { closed: false, list: [] };
  function update() {
    const st = solve();
    const hasSw = st.list.includes('switch');
    const hasGap = st.list.includes('gap');
    const gapCond = gapObj ? objById[gapObj].cond : 0;
    st.flow = st.closed && (!hasSw || switchClosed) && (!hasGap || gapCond > 0);
    st.consumers = st.list.filter((c) => DEVICES.includes(c));
    st.short = st.flow && st.consumers.length === 0;
    const k = hasGap ? gapCond : 1;
    for (const d of DEVICES) power[d] = st.flow && st.consumers.includes(d) ? k : 0;
    for (const w of wires) w.dir = 0;
    if (st.flow) for (const p of st.path) p.w.dir = p.dir * (st.short ? 2.2 : k);
    shortOn = st.short;
    state = st;
    return st;
  }
  function setSwitch(on) {
    switchClosed = on;
    return update();
  }

  // ---------- анимация ----------
  const tmpV = new THREE.Vector3();
  stage.tick((dt, t) => {
    // часовник и прашинки
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    hS.rotation.z = -(sec / 60) * Math.PI * 2;
    hM.rotation.z = -((now.getMinutes() + sec / 60) / 60) * Math.PI * 2;
    hH.rotation.z = -(((now.getHours() % 12) + now.getMinutes() / 60) / 12) * Math.PI * 2;
    cloud.position.x = -1.2 + ((t * 0.03) % 2.4);
    const arr = dustGeo.attributes.position.array;
    for (let i = 0; i < dustN; i++) {
      arr[i * 3 + 1] += dt * 0.05;
      arr[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.03;
      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = 0.2;
    }
    dustGeo.attributes.position.needsUpdate = true;
    // плъзгане на уредите
    for (const [g, mv] of moving) {
      mv.k = Math.min(1, mv.k + dt / mv.dur);
      const e = mv.k < 0.5 ? 2 * mv.k * mv.k : 1 - Math.pow(-2 * mv.k + 2, 2) / 2;
      g.position.lerpVectors(mv.from, mv.to, e);
      g.position.y = Math.sin(e * Math.PI) * 0.35;
      markDirty(mv.id);
      if (mv.k >= 1) { g.position.copy(mv.to); moving.delete(g); }
    }
    if (dirty.size) {
      scene.updateMatrixWorld(true);
      for (const w of wires) {
        const c1 = w.t1.split(':')[1]; const c2 = w.t2.split(':')[1];
        if (dirty.has(c1) || dirty.has(c2)) rebuildWire(w);
      }
      dirty.clear();
    }
    // ключ
    const want = switchClosed ? 0 : 0.95;
    swAngle += (want - swAngle) * Math.min(1, dt * 10);
    comps.switch.userData.pivot.rotation.z = swAngle;
    // уреди
    for (const d of DEVICES) shown[d] += (power[d] - shown[d]) * Math.min(1, dt * 6);
    const L = comps.lamp.userData.fx;
    const flick = 1 + Math.sin(t * 37) * 0.015;
    L.glassM.emissiveIntensity = shown.lamp * 1.1 * flick;
    L.filM.emissiveIntensity = shown.lamp * 3;
    L.halo.material.opacity = Math.min(1, shown.lamp * 0.95);
    L.halo.scale.setScalar(1.2 + shown.lamp * 1.6);
    L.light.intensity = shown.lamp * 5;
    const M = comps.motor.userData.fx;
    M.spin += dt * shown.motor * 22;
    M.prop.rotation.z = -M.spin;
    const H = comps.heater.userData.fx;
    H.coilM.emissiveIntensity = shown.heater * 1.6 * (1 + Math.sin(t * 3) * 0.06);
    H.light.intensity = shown.heater * 2.5;
    for (const s of H.waves) {
      const u = (t * 0.45 + s.userData.ph) % 1;
      s.position.set(s.userData.x + Math.sin(t * 2 + s.userData.ph * 9) * 0.05, 0.5 + u * 0.9, Math.cos(t + s.userData.ph * 7) * 0.05);
      s.material.opacity = shown.heater * Math.sin(u * Math.PI) * 0.7;
      s.scale.setScalar(0.18 + u * 0.25);
    }
    // късо съединение: батерията почервенява и трепти
    const bm = comps.battery.userData.bodyM;
    bm.emissive.setRGB(shortOn ? 0.6 + Math.sin(t * 12) * 0.3 : 0, 0, 0);
    // електрони
    for (const w of wires) {
      for (const e of w.els) {
        const u0 = e.userData;
        if (w.dir) {
          u0.u = (u0.u + w.dir * dt * 0.55 / w.len + 1) % 1;
          w.curve.getPointAt(u0.u, e.position);
        } else {
          w.curve.getPointAt(u0.u, e.position);
          const ph = u0.ph;
          e.position.x += Math.sin(t * 17 + ph) * 0.012;
          e.position.y += Math.sin(t * 23 + ph * 1.7) * 0.012;
          e.position.z += Math.cos(t * 19 + ph * 2.3) * 0.012;
        }
      }
    }
    // избран извод мига
    if (pending) {
      const k = 0.5 + Math.sin(t * 8) * 0.5;
      terms[pending].userData.knobM.emissive.setRGB(k * 0.9, k * 0.6, 0);
    }
    // предметите в стъпка 3 се връщат по местата си
    for (const [g, mv] of objMoves) {
      mv.k = Math.min(1, mv.k + dt / mv.dur);
      const e = 1 - Math.pow(1 - mv.k, 3);
      g.position.lerpVectors(mv.from, mv.to, e);
      g.position.y = mv.to.y + Math.sin(e * Math.PI) * 0.4;
      if (mv.k >= 1) { g.position.copy(mv.to); objMoves.delete(g); }
    }
    if (comps.gap.visible) comps.gap.userData.pad.material.color.setHSL(0.13, 1, 0.68 + Math.sin(t * 3) * 0.08);
    tmpV.set(0, 0, 0);
  });

  // ---------- камера ----------
  function view(pos, tgt, dur = 1.0) {
    const asp = camera.aspect || 1.5;
    const k = Math.min(1.9, Math.max(1, 1.45 / asp));
    const p = new THREE.Vector3(...pos).sub(new THREE.Vector3(...tgt)).multiplyScalar(k).add(new THREE.Vector3(...tgt));
    stage.stopFollow();
    stage.flyTo(p.toArray(), tgt, dur);
  }
  const overview = () => view([0, 5.9, 7.9], [0, 0.4, 0]);

  // ---------- балончета ----------
  let tip = null;
  function say(anchor, html, cls = '', lift = null) {
    if (tip) tip.remove();
    let l = lift;
    if (l === null) l = anchor.userData && INFO[anchor.userData.pickId] ? INFO[anchor.userData.pickId].lift : 0.5;
    tip = stage.bubble(anchor, html, { lift: l, cls });
  }
  function clearTip() { if (tip) { tip.remove(); tip = null; } }
  const sayComp = (id, html, cls = '') => say(comps[id], html, cls, INFO[id].lift);

  // ---------- избор ----------
  let clickHandler = null;
  let pending = null;
  stage.onClick((hit) => { if (clickHandler) clickHandler(hit ? hit.root.userData.pickId : null, hit); });
  let hoverOn = false;
  let hovered = null;
  stage.onHover((root) => {
    if (hovered && hovered.userData.knobM && hovered.userData.pickId !== pending) hovered.userData.knobM.emissive.setRGB(0, 0, 0);
    hovered = root;
    if (hoverOn && root && root.userData.knobM && root.userData.pickId !== pending) root.userData.knobM.emissive.setRGB(0.25, 0.2, 0);
  });
  function clearPending() {
    if (!pending) return;
    terms[pending].userData.knobM.emissive.setRGB(0, 0, 0);
    terms[pending].userData.halo.visible = false;
    pending = null;
  }

  const scores = [];
  let menuHandler = null;
  const menu = cornerMenu(stage, {
    title: 'Уреди',
    items: [
      { id: 'battery', label: 'Батерия', icon: '🔋' },
      { id: 'lamp', label: 'Лампа', icon: '💡' },
      { id: 'switch', label: 'Ключ', icon: '🔘' },
      { id: 'wire', label: 'Проводник', icon: '〰️' },
      { id: 'electrons', label: 'Електрони', icon: '🔵' },
      { id: 'motor', label: 'Моторче', icon: '⚙️' },
      { id: 'heater', label: 'Нагревател', icon: '🔥' },
      { id: 'socket', label: 'Контакт', icon: '🔌' },
    ],
    onSelect: (id) => menuHandler && menuHandler(id),
  });

  function resetDevices() {
    for (const d of DEVICES) { power[d] = 0; }
  }

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    clearTip();
    menu.show(true);
    layout(LAYOUT_MAIN);
    scene.updateMatrixWorld(true);
    clearWires();
    addWire('T:battery:+', 'T:switch:a');
    addWire('T:switch:b', 'T:lamp:a');
    addWire('T:lamp:b', 'T:battery:-', [[2.95, 0.15, -0.8], [0, 0.15, -1.2], [-3.55, 0.15, -0.8]]);
    setSwitch(true);
    const seen = new Set();
    shell.task(`<p>На масата има проста електрическа верига и още два уреда.</p>
      <p><b>Разгледай поне 6 неща</b> — кликни върху тях или ги избери от менюто в ъгъла. Опитай да кликнеш и ключа!</p>`);
    const ctrl = shell.setControls('<div class="row"><button class="btn all">🔭 Цялата маса</button><button class="btn primary nx" disabled>Напред →</button></div>');
    const next = ctrl.querySelector('.nx');
    ctrl.querySelector('.all').addEventListener('click', () => { clearTip(); overview(); });
    const upd = () => shell.score(`Разгледани: ${seen.size} от 8`);
    upd();
    const visit = (id) => {
      let anchor; let html;
      if (id === 'wire' || id === 'electrons') {
        const w = wires[1];
        anchor = w.anchor;
        stage.focusOn(anchor, { dist: 4, height: 1.6, lift: 0 });
        html = id === 'wire' ? `<b>〰️ Проводник</b><br>${WIRE_NOTE}` : `<b>🔵 Електрони</b><br>${ELECTRON_NOTE}`;
        say(anchor, html, 'wide', 0.35);
      } else if (id === 'socket') {
        stage.stopFollow();
        stage.flyTo([2.2, 2.6, 0.6], [3.4, 1.1, -4.2]);
        say(socket, `<b>🔌 Контакт</b><br>${SOCKET_NOTE}`, 'wide', 0.45);
      } else {
        const g = comps[id];
        stage.focusOn(g, { dist: 4.2, height: 1.7, lift: 0.5 });
        let extra = '';
        if (id === 'switch') {
          setSwitch(!switchClosed);
          extra = switchClosed ? '<br>✔ Сега ключът е <b>затворен</b> — лампата свети.' : '<br>✖ Сега ключът е <b>отворен</b> — веригата е прекъсната и лампата угасна.';
        }
        if (id === 'lamp' && !switchClosed) extra = '<br><i>Сега не свети, защото ключът е отворен.</i>';
        say(g, `<b>${INFO[id].icon} ${INFO[id].label}</b><br>${INFO[id].note}${extra}`, 'wide');
      }
      seen.add(id);
      menu.mark(id);
      menu.setActive(id);
      upd();
      if (seen.size >= 6) {
        next.disabled = false;
        shell.msg('Браво! Можеш да продължиш или да разгледаш още.', 'good');
      }
    };
    clickHandler = (id) => {
      if (!id) { clearTip(); return; }
      if (id.startsWith('T:')) id = id.split(':')[1];
      else if (id.startsWith('W:')) id = 'wire';
      if (id === 'gap') return;
      visit(id);
    };
    menuHandler = visit;
    next.addEventListener('click', () => { menu.setActive(null); step2(); });
    overview();
  }

  // ---------- 2. Построй верига ----------
  function step2() {
    shell.step(1);
    clearTip();
    menu.show(false);
    menuHandler = null;
    clearWires();
    setSwitch(false);
    resetDevices();
    view([0, 5.6, 6.4], [0, 0.3, -0.1]);
    let mistakes = 0;
    let phase = 'build';
    let hinted = 0;
    hoverOn = true;
    const allowed = new Set(['battery', 'switch', 'lamp']);
    const drawTask = () => {
      if (phase !== 'build') return;
      shell.task(`<p><b>Свържи батерията, ключа и лампата</b> в затворена верига.</p>
        <p class="small">Кликни метално копче (извод), после друго копче — между тях се опъва проводник. Кликни проводник, за да го махнеш. Кликни ключа, за да го затвориш или отвориш.</p>`);
    };
    const upd = () => shell.score(`Проводници: ${wires.length} · грешки: ${mistakes}`);
    drawTask();
    upd();
    shell.setControls('<div class="row"><button class="btn clr">Махни всички проводници</button></div>')
      .querySelector('.clr').addEventListener('click', () => {
        if (phase !== 'build') return;
        clearPending(); clearWires(); update(); clearTip(); upd(); shell.msg('');
      });

    const after = () => {
      const st = update();
      upd();
      if (st.short) {
        mistakes++;
        upd();
        sayComp('battery', '⚠ <b>Късо съединение!</b> Батерията е свързана само с ключа, без уред. Токът става много силен и батерията се нагрява — опасно! Включи във веригата и лампата.', 'bad wide');
        shell.msg('Така не бива: във веригата няма консуматор.', 'bad');
        later(() => { setSwitch(false); }, 1600);
        return;
      }
      const full = st.closed && st.list.includes('switch') && st.list.includes('lamp');
      if (full && switchClosed) {
        phase = 'observe';
        hoverOn = false;
        clearPending();
        say(wires[0].anchor, '✔ <b>Веригата е затворена!</b> Сините точици са <b>електрони</b>. Сега те текат в една посока — от „−“ през уредите към „+“ на батерията. Това насочено движение е <b>електричен ток</b>.', 'good wide', 0.35);
        shell.msg('Лампата свети! 🎉', 'good');
        shell.task('<p>Лампата свети и токът тече.</p><p><b>Сега отвори ключа</b> и гледай електроните.</p>');
        return;
      }
      if (full && !switchClosed) {
        sayComp('switch', 'Веригата е свързана, но <b>ключът е отворен</b>. Кликни го, за да го затвориш!', '');
        shell.msg('Почти! Затвори ключа.', 'good');
        return;
      }
      if (st.closed && st.flow && !st.list.includes('switch')) {
        sayComp('lamp', 'Лампата свети, но как ще я изключиш? Включи във веригата и <b>ключа</b>. Кликни един проводник, за да го махнеш.', 'wide');
        shell.msg('');
        return;
      }
      if (wires.length >= 3 && !st.closed) {
        hinted++;
        shell.msg(hinted > 1 ? 'Подсказка: проследи пътя — от „−“ на батерията през ключа и лампата обратно до „+“.' : 'Веригата още не е затворена — някъде пътят на тока е прекъснат.', 'bad');
      }
    };

    const toggleSwitch = () => {
      setSwitch(!switchClosed);
      if (phase === 'observe' && !switchClosed) {
        phase = 'question';
        say(wires[0].anchor, 'Ключът <b>прекъсна веригата</b>. Електроните вече не текат в една посока — само трептят на място. Лампата угасна.', 'wide', 0.35);
        askQuestion();
        return;
      }
      if (phase === 'build') after();
    };

    clickHandler = (id) => {
      if (!id) return;
      if (id === 'switch') return toggleSwitch();
      if (phase !== 'build') {
        if (DEVICES.includes(id) || id === 'battery') sayComp(id, `<b>${INFO[id].icon} ${INFO[id].label}</b><br>${INFO[id].note}`, 'wide');
        return;
      }
      if (id.startsWith('W:')) {
        const w = wires.find((x) => 'W:' + x.id === id);
        if (w) { removeWire(w); clearTip(); after(); }
        return;
      }
      if (!id.startsWith('T:')) {
        if (INFO[id]) sayComp(id, `<b>${INFO[id].icon} ${INFO[id].label}</b><br>${INFO[id].note}`, 'wide');
        return;
      }
      const comp = id.split(':')[1];
      if (!allowed.has(comp)) {
        sayComp(comp, 'В тази задача използвай <b>батерията, ключа и лампата</b>. Моторчето и нагревателят ще ти трябват по-късно.', '');
        return;
      }
      if (pending === id) { clearPending(); shell.msg(''); return; }
      if (wireAt(id)) {
        shell.msg('От този извод вече има проводник. Кликни проводника, ако искаш да го махнеш.', 'bad');
        return;
      }
      if (!pending) {
        pending = id;
        terms[id].userData.halo.visible = true;
        shell.msg('Добре! Сега кликни втори извод.', '');
        return;
      }
      const c1 = pending.split(':')[1];
      if (c1 === comp) {
        mistakes++;
        upd();
        if (comp === 'battery') sayComp('battery', '⚠ Така свързваш „+“ и „−“ направо — това е <b>късо съединение</b>. Батерията се нагрява и бързо се изтощава. Токът трябва да мине през уред.', 'bad wide');
        else sayComp(comp, `Ако свържеш двата извода на ${comp === 'lamp' ? 'лампата' : 'ключа'} помежду им, токът ще мине покрай уреда. Свържи ги с <b>други</b> уреди.`, 'bad wide');
        shell.msg('Тази връзка не е вярна.', 'bad');
        clearPending();
        return;
      }
      const a = pending;
      clearPending();
      addWire(a, id);
      shell.msg('');
      clearTip();
      after();
    };

    function askQuestion() {
      shell.task(`<p><b>Кога свети лампата?</b></p><div class="choices">
        <button class="choice" data-i="0">Когато веригата е затворена — без прекъсване от „−“ до „+“ на батерията</button>
        <button class="choice" data-i="1">Когато поне един проводник е свързан с батерията</button>
        <button class="choice" data-i="2">Когато ключът е отворен</button></div>`);
      container.querySelectorAll('.xp-task .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.i === '0') {
          b.classList.add('right');
          container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
          shell.msg('Вярно! Токът тече само в затворена верига.', 'good');
          const c = shell.setControls('<button class="btn primary">Напред: други уреди →</button>');
          c.querySelector('button').addEventListener('click', partB);
        } else {
          mistakes++;
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg(b.dataset.i === '1' ? 'Не стига: токът трябва да има път през целия кръг и обратно до батерията.' : 'Не — при отворен ключ веригата е прекъсната.', 'bad');
          upd();
        }
      }));
    }

    // Част Б: смяна на уреда и действия на тока.
    function partB() {
      phase = 'swap';
      clearTip();
      let slotDev = 'lamp';
      const tried = new Set();
      const devLabel = { lamp: '💡 Лампа', motor: '⚙️ Моторче', heater: '🔥 Нагревател' };
      const drawB = () => {
        shell.task(`<p>Смени лампата с друг уред. <b>Затвори ключа</b> и виж какво прави токът във всеки уред.</p>
          <div class="circuit-dev">${DEVICES.map((d) => `<span class="chip ${d === slotDev ? 'on' : ''} ${tried.has(d) ? 'done' : ''}" data-d="${d}">${devLabel[d]}</span>`).join('')}</div>
          <p class="small">Изпробвани: ${tried.size} от 3</p>`);
        container.querySelectorAll('.circuit-dev .chip').forEach((ch) => ch.addEventListener('click', () => swap(ch.dataset.d)));
      };
      const check = () => {
        const st = update();
        if (st.flow && !tried.has(slotDev)) {
          tried.add(slotDev);
          const txt = {
            lamp: '💡 Лампата свети: електрична енергия → <b>светлина</b> (и малко топлина).',
            motor: '⚙️ Перката се върти: електрична енергия → <b>движение</b>.',
            heater: '🔥 Спиралата се нагорещява: електрична енергия → <b>топлина</b>.',
          }[slotDev];
          sayComp(slotDev, txt, 'good wide');
          drawB();
          if (tried.size === 3) later(match, 900);
        }
      };
      function swap(d) {
        if (d === slotDev || phase !== 'swap') return;
        const old = slotDev;
        slotDev = d;
        place(old, ...PARK[old], 0.7);
        place(d, ...SLOT, 0.7);
        for (const w of wires) {
          for (const k of ['t1', 't2']) {
            const [, c, key] = w[k].split(':');
            if (c === old) w[k] = `T:${d}:${key}`;
          }
        }
        clearTip();
        update();
        drawB();
        later(check, 750);
      }
      clickHandler = (id) => {
        if (id === 'switch') { setSwitch(!switchClosed); later(check, 200); return; }
        if (id && DEVICES.includes(id)) {
          if (id !== slotDev) { swap(id); return; }
          sayComp(id, `<b>${INFO[id].icon} ${INFO[id].label}</b><br>${INFO[id].note}`, 'wide');
        }
      };
      shell.setControls('');
      drawB();
      view([0.8, 5.4, 6.8], [0.6, 0.3, -0.4]);
      check();
    }

    function match() {
      phase = 'match';
      clearTip();
      const order = ['motor', 'lamp', 'heater'];
      const ans = {};
      shell.task(`<p><b>Кое е главното действие на тока в уреда?</b></p>
        <div class="circuit-match">${order.map((d) => `<div class="mrow" data-d="${d}"><b>${INFO[d].icon} ${INFO[d].label}</b><div class="opts">
          ${['light', 'heat', 'move'].map((e) => `<button class="choice" data-e="${e}">${EFFECT_NAME[e]}</button>`).join('')}</div></div>`).join('')}</div>`);
      const c = shell.setControls('<button class="btn primary chk" disabled>Провери</button>');
      const chk = c.querySelector('.chk');
      container.querySelectorAll('.circuit-match .mrow').forEach((row) => {
        row.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
          if (row.dataset.locked) return;
          row.querySelectorAll('.choice').forEach((x) => x.classList.remove('on', 'wrong'));
          b.classList.add('on');
          ans[row.dataset.d] = b.dataset.e;
          chk.disabled = Object.keys(ans).length < 3;
        }));
      });
      chk.addEventListener('click', () => {
        let wrong = 0;
        container.querySelectorAll('.circuit-match .mrow').forEach((row) => {
          const d = row.dataset.d;
          const b = row.querySelector(`.choice[data-e="${ans[d]}"]`);
          if (ans[d] === EFFECT[d]) { b.classList.add('right'); row.dataset.locked = '1'; } else { b.classList.add('wrong'); wrong++; }
        });
        if (wrong) {
          mistakes += wrong;
          upd();
          shell.msg('Някои не са верни. Спомни си какво видя: светеше ли, въртеше ли се, нагорещяваше ли се?', 'bad');
          return;
        }
        scores.push(stepScore(mistakes, 4));
        shell.msg(mistakes ? `Готово! Грешки: ${mistakes}.` : 'Без нито една грешка! 🎉', 'good');
        sayComp('heater', 'Токът има <b>светлинно</b>, <b>топлинно</b> и <b>механично</b> действие. Затова го използваме в лампи, печки и мотори.', 'wide');
        const c2 = shell.setControls('<button class="btn primary">Напред →</button>');
        c2.querySelector('button').addEventListener('click', () => { slotBack(); step3(); });
      });
    }
  }
  function slotBack() {
    // лампата се връща на мястото си
    for (const w of wires) for (const k of ['t1', 't2']) {
      const [, c, key] = w[k].split(':');
      if (c === 'motor' || c === 'heater') w[k] = `T:lamp:${key}`;
    }
  }

  // ---------- 3. Проводник или изолатор ----------
  const objs = {};
  const objMoves = new Map();
  let stopDrag = null;
  const rings = {};
  function step3() {
    shell.step(2);
    clearTip();
    hoverOn = false;
    clearPending();
    clearWires();
    setSwitch(true);
    layout(LAYOUT_TEST, 0.8);
    later(() => {
      scene.updateMatrixWorld(true);
      addWire('T:battery:+', 'T:gap:a');
      addWire('T:gap:b', 'T:lamp:a');
      addWire('T:lamp:b', 'T:battery:-', [[3.15, 0.15, -1.75], [0, 0.15, -1.95], [-3.15, 0.15, -1.75]]);
      update();
    }, 850);
    // предмети
    OBJECTS.forEach((o, i) => {
      const g = objectModel(o.id);
      const home = new THREE.Vector3(-2.7 + i * 0.9, 0, 2.15);
      g.position.copy(home);
      g.rotation.y = Math.PI / 2;
      g.userData = { pickId: 'O:' + o.id, dragId: o.id, home, homeRot: Math.PI / 2 };
      const lbl = labelSprite(o.label, { size: 0.22 });
      lbl.position.y = 0.42;
      g.add(lbl);
      stage.steadyLabel(lbl, 11);
      addHitBox(g, 0.55);
      scene.add(g);
      objs[o.id] = g;
    });
    for (const [k, x, name, color, css] of [['cond', -3.25, 'Проводници', 0x2fa84f, '#2fa84f'], ['ins', 3.25, 'Изолатори', 0x8e44ad, '#8e44ad']]) {
      const z = zoneRing(color, 0.95);
      z.position.set(x, 0.01, 0.6);
      const lbl = labelSprite(name, { size: 0.3, color: '#fff', bg: css, border: css });
      lbl.position.set(0, 0.35, 1.15);
      z.add(lbl);
      scene.add(z);
      rings[k] = { group: z, members: [] };
    }
    view([0, 6.6, 6.2], [0, 0, 0.45]);
    gapObj = null;
    let mistakes = 0;
    let sorted = 0;
    const upd = () => shell.score(`Разпределени: ${sorted} от ${OBJECTS.length} · грешки: ${mistakes}`);
    shell.task(`<p>Кои предмети пропускат тока? <b>Провлачи предмет в жълтия процеп</b> между щипките и виж лампата.</p>
      <p>После го провлачи в кръга <b>„Проводници“</b> или <b>„Изолатори“</b>.</p>`);
    shell.setControls('');
    upd();
    const gapPos = () => comps.gap.position;
    function toHome(g, dur = 0.5) {
      objMoves.set(g, { from: g.position.clone(), to: g.userData.home.clone(), k: 0, dur });
      g.rotation.y = g.userData.homeRot;
    }
    function takeOutOfGap() {
      if (!gapObj) return;
      gapObj = null;
      update();
    }
    clickHandler = (id) => {
      if (!id) return clearTip();
      if (id.startsWith('O:')) {
        const o = objById[id.slice(2)];
        say(objs[o.id], `<b>${esc(o.label)}</b> — ${esc(o.full)}.`, '', 0.75);
      } else if (id === 'lamp' || id === 'gap' || id === 'battery') {
        sayComp(id, `<b>${INFO[id].icon} ${INFO[id].label}</b><br>${INFO[id].note}`, 'wide');
      }
    };
    stopDrag = stage.enableDrag({
      planeY: 0,
      lift: 0.3,
      onStart: (g) => {
        clearTip();
        if (gapObj === g.userData.dragId) takeOutOfGap();
      },
      onDrop: (g, p) => {
        const id = g.userData.dragId;
        const o = objById[id];
        objMoves.delete(g);
        const gp = gapPos();
        if (Math.hypot(p.x - gp.x, p.z - gp.z) < 0.75) {
          if (gapObj && gapObj !== id) toHome(objs[gapObj]);
          gapObj = id;
          g.position.set(gp.x, 0.2, gp.z);
          g.rotation.y = 0;
          g.userData.tested = true;
          update();
          const html = o.cond >= 1
            ? `💡 <b>Лампата свети!</b> Токът минава през ${esc(o.full)}.`
            : o.cond > 0
              ? `💡 <b>Лампата свети слабо.</b> Токът минава през ${esc(o.full)}, но по-трудно.`
              : `⚫ <b>Лампата не свети.</b> Токът не минава през ${esc(o.full)}.`;
          sayComp('lamp', html, o.cond > 0 ? 'good' : '');
          shell.msg('');
          return;
        }
        let target = null;
        for (const k of Object.keys(rings)) {
          const zp = rings[k].group.position;
          if (Math.hypot(p.x - zp.x, p.z - zp.z) < 1.05) target = k;
        }
        if (!target) { toHome(g); return; }
        const right = (o.cond > 0 ? 'cond' : 'ins') === target;
        if (right) {
          const r = rings[target];
          const n = r.members.length;
          const slot = new THREE.Vector3(r.group.position.x + (n % 2 ? 0.35 : -0.35), 0, r.group.position.z - 0.55 + Math.floor(n / 2) * 0.42);
          r.members.push(id);
          objMoves.set(g, { from: g.position.clone(), to: slot, k: 0, dur: 0.3 });
          g.rotation.y = 0;
          g.userData.locked = true;
          sorted++;
          say(r.group, `✔ ${esc(o.app)}`, 'good wide', 0.9);
          shell.msg('Вярно!', 'good');
        } else {
          mistakes++;
          toHome(g);
          say(rings[target].group, g.userData.tested
            ? `✘ Спомни си какво направи лампата, когато ${esc(o.full)} беше в процепа.`
            : '✘ Не позна. Пробвай го първо в жълтия процеп — лампата ще ти подскаже.', 'bad wide', 0.9);
          shell.msg(mistakes >= 3 ? 'Подсказка: ако лампата свети — дори слабо — предметът е проводник.' : 'Не е вярно.', 'bad');
        }
        upd();
        if (sorted === OBJECTS.length) {
          stopDrag(); stopDrag = null;
          later(() => askApp(), 700);
        }
      },
    });
    function askApp() {
      clearTip();
      gapObj = null;
      update();
      shell.task(`<p>Кабелът на настолната лампа у дома има медни жички, покрити с пластмаса.</p>
        <p><b>Защо е направен така?</b></p><div class="choices">
        <button class="choice" data-i="1">Пластмасата провежда тока по-добре от медта</button>
        <button class="choice" data-i="0">Медта провежда тока, а пластмасата е изолатор и ни пази от токов удар</button>
        <button class="choice" data-i="2">Медта е само за здравина, а пластмасата — за цвят</button></div>`);
      container.querySelectorAll('.xp-task .choice').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.i === '0') {
          b.classList.add('right');
          container.querySelectorAll('.xp-task .choice').forEach((x) => { x.disabled = true; });
          scores.push(stepScore(mistakes, 4));
          shell.msg(mistakes ? `Вярно! Грешки в стъпката: ${mistakes}.` : 'Вярно! Без нито една грешка! 🎉', 'good');
          const c = shell.setControls('<button class="btn primary">Напред →</button>');
          c.querySelector('button').addEventListener('click', step4);
        } else {
          mistakes++;
          upd();
          b.classList.add('wrong');
          b.disabled = true;
          shell.msg('Не. Спомни си: металите са проводници, а пластмасата е изолатор.', 'bad');
        }
      }));
    }
  }

  // ---------- 4. Схеми и безопасност ----------
  function step4() {
    shell.step(3);
    clearTip();
    for (const g of Object.values(objs)) scene.remove(g);
    for (const k of Object.keys(rings)) scene.remove(rings[k].group);
    gapObj = null;
    clearWires();
    setSwitch(false);
    layout(LAYOUT_MAIN, 0.8);
    later(() => {
      scene.updateMatrixWorld(true);
      addWire('T:battery:+', 'T:switch:a');
      addWire('T:switch:b', 'T:lamp:a');
      addWire('T:lamp:b', 'T:battery:-', [[2.95, 0.15, -0.8], [0, 0.15, -1.2], [-3.55, 0.15, -0.8]]);
      update();
    }, 850);
    view([0, 5.6, 6.4], [0, 0.3, -0.1]);
    let mistakes = 0;
    const upd = () => shell.score(`Грешки: ${mistakes}`);
    upd();
    clickHandler = null;
    // А: коя схема отговаря на веригата
    const OPTS = [
      { id: 'nosw', svg: schematic({ dev: 'lamp', sw: 'none' }), why: 'В тази схема няма ключ, а на масата има.' },
      { id: 'ok', svg: schematic({ dev: 'lamp', sw: 'open' }) },
      { id: 'broken', svg: schematic({ dev: 'lamp', sw: 'open', broken: true }), why: 'Тук един проводник липсва — веригата е прекъсната отдолу, а на масата не е.' },
      { id: 'motor', svg: schematic({ dev: 'motor', sw: 'open' }), why: 'Кръгчето с „M“ е моторче, а на масата е лампа.' },
    ];
    shell.task(`<p>В схемите уредите се рисуват със знаци: батерия <b>⊣⊢</b>, лампа <b>⊗</b>, моторче <b>Ⓜ</b>, ключ — прекъсната черта.</p>
      <p><b>Коя схема отговаря на веригата на масата?</b></p>
      <div class="circuit-sch">${OPTS.map((o, i) => `<button class="choice" data-id="${o.id}">${o.svg}<span class="cap">Схема ${i + 1}</span></button>`).join('')}</div>`);
    shell.setControls('');
    container.querySelectorAll('.circuit-sch .choice').forEach((b) => b.addEventListener('click', () => {
      const o = OPTS.find((x) => x.id === b.dataset.id);
      if (o.id === 'ok') {
        b.classList.add('right');
        container.querySelectorAll('.circuit-sch .choice').forEach((x) => { x.disabled = true; });
        shell.msg('Вярно! Батерия, отворен ключ и лампа в един затворен кръг.', 'good');
        sayComp('switch', 'На схемата ключът е нарисуван <b>отворен</b> — точно като на масата.', 'good');
        const c = shell.setControls('<button class="btn primary">Напред →</button>');
        c.querySelector('button').addEventListener('click', partB);
      } else {
        mistakes++;
        upd();
        b.classList.add('wrong');
        b.disabled = true;
        shell.msg(o.why, 'bad');
      }
    }));

    // Б: подреди веригата по схема
    function partB() {
      clearTip();
      let slotDev = 'lamp';
      shell.task(`<p><b>Подреди веригата на масата по тази схема:</b></p>
        <div class="circuit-one">${schematic({ dev: 'motor', sw: 'closed' })}</div>
        <p class="small">Кликни уред на масата, за да го сложиш във веригата. Кликни ключа, за да го затвориш или отвориш.</p>`);
      const c = shell.setControls('<button class="btn primary">Готово</button>');
      clickHandler = (id) => {
        if (id === 'switch') { setSwitch(!switchClosed); return; }
        if (id && DEVICES.includes(id) && id !== slotDev) {
          const old = slotDev;
          slotDev = id;
          place(old, ...PARK[old], 0.7);
          place(id, ...SLOT, 0.7);
          for (const w of wires) for (const k of ['t1', 't2']) {
            const [, cc, key] = w[k].split(':');
            if (cc === old) w[k] = `T:${id}:${key}`;
          }
          update();
        }
      };
      c.querySelector('button').addEventListener('click', () => {
        if (slotDev === 'motor' && switchClosed) {
          clickHandler = null;
          shell.msg('Точно по схемата! Моторчето се върти.', 'good');
          sayComp('motor', '✔ Затворен ключ и моторче — точно като в схемата.', 'good');
          const c2 = shell.setControls('<button class="btn primary">Напред: безопасност →</button>');
          c2.querySelector('button').addEventListener('click', partC);
        } else {
          mistakes++;
          upd();
          shell.msg(slotDev !== 'motor' ? 'Виж уреда в схемата: кръгче с „M“ е моторче.' : 'Виж ключа в схемата: чертата е затворена.', 'bad');
        }
      });
    }

    // В: безопасност
    function partC() {
      clearTip();
      clickHandler = (id) => { if (id === 'socket') say(socket, `<b>🔌 Контакт</b><br>${SOCKET_NOTE}`, 'wide', 0.45); };
      stage.stopFollow();
      stage.flyTo([2.0, 2.4, 0.9], [3.2, 1.0, -4.2], 1.2);
      say(socket, `<b>🔌 Внимание!</b><br>${SOCKET_NOTE}`, 'wide', 0.45);
      const ITEMS = [
        { t: 'Пипам ключа на лампата с мокри ръце', bad: true },
        { t: 'Изключвам уреда от контакта, преди да го почистя', bad: false },
        { t: 'Пъхам пирон или кламер в контакта', bad: true },
        { t: 'Държа сешоара далеч от ваната и мивката', bad: false },
        { t: 'Изваждам щепсела, като дърпам кабела', bad: true },
        { t: 'Казвам на възрастен, ако видя оголен кабел', bad: false },
      ];
      shell.task(`<p>Токът от контакта може да причини <b>токов удар</b> — опасен за живота. Водата и мокрите ръце провеждат ток.</p>
        <p><b>Отбележи всички опасни действия:</b></p>
        <div class="choices circuit-multi">${ITEMS.map((it, i) => `<button class="choice" data-i="${i}"><span class="box"></span>${esc(it.t)}</button>`).join('')}</div>`);
      const c = shell.setControls('<button class="btn primary">Провери</button>');
      const btns = [...container.querySelectorAll('.circuit-multi .choice')];
      btns.forEach((b) => b.addEventListener('click', () => { if (!b.disabled) { b.classList.toggle('on'); b.classList.remove('wrong'); } }));
      c.querySelector('button').addEventListener('click', () => {
        let wrong = 0;
        let missed = 0;
        btns.forEach((b, i) => {
          const on = b.classList.contains('on');
          if (on && !ITEMS[i].bad) { wrong++; b.classList.add('wrong'); }
          if (!on && ITEMS[i].bad) missed++;
        });
        if (wrong || missed) {
          mistakes++;
          upd();
          shell.msg(wrong ? 'Някое от отбелязаните е безопасно — то ни пази.' : 'Има още опасни действия. Помисли за водата и металните предмети.', 'bad');
          return;
        }
        btns.forEach((b, i) => { b.disabled = true; if (ITEMS[i].bad) b.classList.add('right'); });
        scores.push(stepScore(mistakes, 4));
        shell.msg(mistakes ? `Вярно! Грешки в стъпката: ${mistakes}.` : 'Вярно! Без нито една грешка! 🎉', 'good');
        say(socket, '✔ Пази се от тока: сух, внимателен и далеч от контактите с метални предмети.', 'good wide', 0.45);
        const c2 = shell.setControls('<button class="btn primary">Виж резултата</button>');
        c2.querySelector('button').addEventListener('click', () => {
          clearTip();
          overview();
          const ratio = scores.reduce((a, b) => a + b, 0) / scores.length;
          shell.finish(ratio, onComplete, restart);
        });
      });
    }
  }

  step1();
  return {
    dispose() {
      for (const id of timers) clearTimeout(id);
      timers.clear();
      if (stopDrag) stopDrag();
      menu.remove();
      stage.dispose();
    },
  };
}
