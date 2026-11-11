// 6.3.7 „Полова система и съзряване“ — кабинет по биология: две стилизирани схеми (женска и мъжка полова система,
// цветни форми, не в мащаб), „микроскоп“ с яйцеклетка и сперматозоиди, развитие на зародиша по месеци, петима
// съученици на една и съща възраст, които растат всеки със свое темпо, и рафт за лична хигиена.
// Стъпки: опознай → оплождане и развитие (клик по схемата, избор, плъзгач „Месеци“, подреждане) → съзряване (етапи на
// живота, плъзгач „Възраст“, промени при двата пола, свое темпо) → грижа за себе си (хигиена, отговорност, към кого с въпроси).
import { mat, labelSprite, THREE } from '../kit.js';
import { scaffold, explore, choice, nextBtn, finishBtn, view, stepScore } from './labkit.js';
import { sortTask, orderTask, pickTask } from './labtasks.js';
import { organMat, glassMat, tube, curveOf } from './anatomy.js';
import { badge, spot, tagOn } from './bio6.js';
import { lerp, clamp01 } from './nature3.js';

const FX = -4.3; // женската схема
const MX = -1.5; // мъжката схема
const LX = 1.5; // „микроскопът“
const TX = 4.9; // съучениците
const SX = 8.4; // рафтът за хигиена

// Развитие преди раждането (приблизително, по месеци след оплождането).
const MONTHS = [
  { from: 0, t: 'Оплодената яйцеклетка се дели: 2, 4, 8 клетки… Около седмица след оплождането зародишът се прикрепва към стената на матката.' },
  { from: 1, t: 'Зародишът е мъничък. Оформя се сърцето и към края на първия месец то започва да бие.' },
  { from: 2, t: 'Оформят се основните органи. Появяват се ръчички и крачета.' },
  { from: 3, t: 'След втория месец зародишът се нарича <b>плод</b>. Органите му вече са оформени и растат.' },
  { from: 4, t: 'Плодът расте бързо и се движи. Около средата на бременността майката започва да усеща движенията му.' },
  { from: 6, t: 'Плодът продължава да расте и да наддава. Белите му дробове узряват.' },
  { from: 9, t: 'Около 9 месеца след оплождането бебето се ражда. Новороденото обикновено е около 50 cm.' },
];
const monthOf = (m) => MONTHS.filter((s) => m >= s.from).pop();

// Съучениците: всички са на една възраст, но бързият растеж започва при всеки в различно време.
const TEENS = [
  { name: 'Мира', girl: true, shirt: 0xe76f51, hair: 0x5d3a1a, h0: 0.86, gain: 0.2, c: 10.8 },
  { name: 'Ники', girl: false, shirt: 0x2a9d8f, hair: 0x2b2118, h0: 0.84, gain: 0.3, c: 13.6 },
  { name: 'Деси', girl: true, shirt: 0x9b5de5, hair: 0x8d5524, h0: 0.82, gain: 0.21, c: 12.4 },
  { name: 'Иво', girl: false, shirt: 0x457b9d, hair: 0x6b4226, h0: 0.88, gain: 0.3, c: 12.7 },
  { name: 'Ани', girl: true, shirt: 0xf4a261, hair: 0x1f1a17, h0: 0.85, gain: 0.18, c: 11.6 },
];
const heightAt = (p, age) => p.h0 + p.gain / (1 + Math.exp(-(age - p.c) / 0.7));

export function mount(container, { onComplete }) {
  const STEPS = ['Опознай', 'Оплождане и развитие', 'Съзряване', 'Грижа за себе си'];
  const ctx = scaffold(container, { steps: STEPS, stage: { background: 0xeef3f8, camPos: [2, 4, 15], target: [2, 1.6, 0], maxDistance: 26 } });
  const { shell, stage, scene } = ctx;
  const note = badge(shell, '⚠ Схема — органите и клетките не са в мащаб');

  // ---------- Кабинет ----------
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), mat(0xd9cbb3)); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  for (let i = -12; i <= 12; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.005, 30), mat(0xc8b89d)); s.position.set(i * 1.1 + 2, 0.003, 0); scene.add(s); }
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(50, 14), mat(0xe6eef6)); wall.position.set(2, 7, -2.6); scene.add(wall);
  const skirting = new THREE.Mesh(new THREE.BoxGeometry(50, 0.18, 0.05), mat(0xb0bec5)); skirting.position.set(2, 0.09, -2.57); scene.add(skirting);
  // прозорец със завеса, която леко се люлее
  const win = new THREE.Group(); win.position.set(4.9, 3.9, -2.55); scene.add(win);
  win.add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6, 0.06), mat(0xffffff)));
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), new THREE.MeshBasicMaterial({ color: 0xa8d8f0 })); sky.position.z = 0.04; win.add(sky);
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.03), mat(0xffffff)); bar1.position.z = 0.06; win.add(bar1);
  const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.9, 0.04), mat(0x8ecae6)); curtain.position.set(-1.45, -0.05, 0.12); win.add(curtain);
  // часовник
  const clock = new THREE.Group(); clock.position.set(1.5, 4.6, -2.55); scene.add(clock);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 28), mat(0xffffff)); face.rotation.x = Math.PI / 2; clock.add(face);
  const rimC = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 28), mat(0x37474f)); clock.add(rimC);
  const handM = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.01), mat(0x263238)); handM.geometry.translate(0, 0.12, 0); handM.position.z = 0.04; clock.add(handM);
  const handH = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.17, 0.01), mat(0x263238)); handH.geometry.translate(0, 0.08, 0); handH.position.z = 0.045; handH.rotation.z = -1.2; clock.add(handH);
  // саксия с растение
  const plant = new THREE.Group(); plant.position.set(11.5, 0, -1.9); scene.add(plant);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 14), mat(0xbc6c25)); pot.position.y = 0.25; plant.add(pot);
  const leaves = [];
  for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 6), mat(0x52b788)); l.scale.set(0.45, 1.3, 0.2); l.position.set(Math.cos(i * 0.9) * 0.15, 0.85 + (i % 3) * 0.15, Math.sin(i * 0.9) * 0.15); l.rotation.z = Math.cos(i * 0.9) * 0.5; plant.add(l); leaves.push(l); }

  const tags = {}; // етикетите на органите (показват се, след като органът е разгледан)
  const tag = (id, parent, text, pos) => { const l = tagOn(stage, parent, text, pos, 0.15, 7); l.visible = false; (tags[id] = tags[id] || []).push(l); return l; };
  const showTags = (ids, v = true) => ids.forEach((id) => (tags[id] || []).forEach((l) => { l.visible = v; }));
  const ORGANS = ['ovary', 'tube', 'uterus', 'testis', 'duct'];

  // табло на статив
  function board(x, title, color) {
    const g = new THREE.Group(); g.position.set(x, 0, -1.4); scene.add(g);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.7, 0.08), mat(0xfdfdfb)); panel.position.y = 2.05; g.add(panel);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.72, 2.82, 0.06), mat(color)); frame.position.set(0, 2.05, -0.03); g.add(frame);
    for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.8, 8), mat(0x78909c)); leg.position.set(sx * 1.0, 0.36, 0); g.add(leg); }
    const foot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.5), mat(0x78909c)); foot.position.y = 0.03; g.add(foot);
    tagOn(stage, g, title, [0, 3.62, 0.1], 0.17, 9);
    const d = new THREE.Group(); d.position.set(0, 2.0, 0.08); g.add(d); // схемата е в равнината z = 0 на d
    return { g, d };
  }

  // ---------- Женска полова система (схема) ----------
  const F = board(FX, 'Женска полова система', 0xf4a3b5);
  const uterusM = organMat(0xff8fab);
  const uterus = new THREE.Mesh(new THREE.LatheGeometry([[0, -0.5], [0.1, -0.48], [0.15, -0.36], [0.27, -0.08], [0.37, 0.22], [0.36, 0.4], [0.22, 0.5], [0, 0.51]].map(([r, y]) => new THREE.Vector2(r, y)), 24), uterusM);
  uterus.scale.z = 0.45; uterus.position.y = 0.1; F.d.add(uterus);
  const cavity = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), organMat(0xffc2d1)); cavity.scale.set(1.3, 1.6, 0.4); cavity.position.set(0, 0.22, 0.16); F.d.add(cavity);
  const vag = tube([[0, -0.38, 0], [0, -0.7, 0.02], [0, -1.0, 0]], 0.08, organMat(0xf7b2c4), 12); F.d.add(vag);
  const tubeM = organMat(0xffb3c6);
  const tubeC = [1, -1].map((s) => curveOf([[s * 0.34, 0.5, 0], [s * 0.62, 0.68, 0.02], [s * 0.95, 0.56, 0.02], [s * 1.02, 0.3, 0.02]]));
  tubeC.forEach((c) => { F.d.add(tube(c, 0.045, tubeM, 24)); });
  for (const s of [1, -1]) { // ресничките на края на яйцепровода
    for (let k = 0; k < 5; k++) { const fi = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.12, 5), tubeM); fi.position.set(s * (0.96 + k * 0.025), 0.2, 0.02); fi.rotation.z = s * (0.3 - k * 0.15); F.d.add(fi); }
  }
  const ovaryM = organMat(0xcdb4db);
  const ovaries = [1, -1].map((s) => {
    const o = new THREE.Group(); o.position.set(s * 0.78, 0.08, 0.02); F.d.add(o);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), ovaryM); b.scale.set(1.25, 0.8, 0.6); o.add(b);
    for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), organMat(0xfff3c4)); f.position.set(Math.cos(k * 1.7) * 0.1, Math.sin(k * 1.7) * 0.05, 0.08); o.add(f); }
    return o;
  });
  // малка яйцеклетка, която тръгва от яйчника по яйцепровода
  const eggDot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffd166, emissiveIntensity: 0.6 }));
  eggDot.visible = false; F.d.add(eggDot);
  const eggPath = curveOf([[0.8, 0.12, 0.08], [1.02, 0.25, 0.08], [0.95, 0.56, 0.08], [0.62, 0.68, 0.08], [0.34, 0.5, 0.08], [0.1, 0.3, 0.12], [0, 0.18, 0.2]]);
  const at = {
    ovary: spot(ovaries[1], 'ovary', [0, 0, 0], 0.2),
    ovary2: spot(ovaries[0], 'ovary', [0, 0, 0], 0.2),
    tube: spot(F.d, 'tube', [0.62, 0.68, 0], 0.15),
    tube2: spot(F.d, 'tube', [-0.62, 0.68, 0], 0.15),
    uterus: spot(F.d, 'uterus', [0, 0.1, 0.1], 0.3),
  };
  tag('ovary', F.d, 'яйчник', [-0.95, -0.2, 0.1]);
  tag('tube', F.d, 'яйцепровод', [0.75, 0.95, 0.1]);
  tag('uterus', F.d, 'матка', [0.48, -0.25, 0.1]);
  tag('uterus', F.d, 'влагалище', [0.42, -0.85, 0.1]);

  // ---------- Мъжка полова система (схема) ----------
  const M = board(MX, 'Мъжка полова система', 0x90caf9);
  const testM = organMat(0x90caf9);
  const testes = [1, -1].map((s) => {
    const o = new THREE.Group(); o.position.set(s * 0.32, -0.72, 0.02); M.d.add(o);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), testM); b.scale.set(0.9, 1.25, 0.6); o.add(b);
    const epi = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 4, 8), organMat(0x64b5f6)); epi.position.set(s * 0.15, 0.02, 0.02); o.add(epi);
    return o;
  });
  const ductM = organMat(0x5e9fd6);
  const ductC = [1, -1].map((s) => curveOf([[s * 0.47, -0.6, 0.04], [s * 0.6, -0.1, 0.04], [s * 0.62, 0.45, 0.04], [s * 0.38, 0.72, 0.04], [s * 0.16, 0.5, 0.06], [s * 0.05, 0.08, 0.08]]));
  ductC.forEach((c) => M.d.add(tube(c, 0.035, ductM, 30)));
  const prostate = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), organMat(0x80cbc4)); prostate.scale.set(1.1, 0.85, 0.55); prostate.position.set(0, -0.05, 0.04); M.d.add(prostate);
  for (const s of [1, -1]) { const v = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 4, 8), organMat(0xb39ddb)); v.position.set(s * 0.26, 0.2, 0.02); v.rotation.z = s * 0.7; M.d.add(v); }
  const dots = []; // сперматозоиди (точици), които се движат по семепроводите
  for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), mat(0xe3f2fd)); M.d.add(d); dots.push({ d, c: ductC[i % 2], k: i / 6 }); }
  Object.assign(at, {
    testis: spot(testes[1], 'testis', [0, 0, 0], 0.2),
    testis2: spot(testes[0], 'testis', [0, 0, 0], 0.2),
    duct: spot(M.d, 'duct', [0.6, 0.2, 0.04], 0.15),
    duct2: spot(M.d, 'duct', [-0.6, 0.2, 0.04], 0.15),
  });
  tag('testis', M.d, 'семенник', [-0.72, -0.95, 0.1]);
  tag('duct', M.d, 'семепровод', [0.85, 0.9, 0.1]);
  tag('duct', M.d, 'простатна жлеза', [0, -0.32, 0.12]);
  tag('duct', M.d, 'семенно мехурче', [-0.72, 0.42, 0.1]);

  // ---------- „Микроскоп“: яйцеклетка, сперматозоиди, развитие ----------
  const lens = new THREE.Group(); lens.position.set(LX, 0, -1.0); scene.add(lens);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.0, 10), mat(0x546e7a)); stand.position.y = 0.5; lens.add(stand);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.08, 20), mat(0x455a64)); base.position.y = 0.04; lens.add(base);
  const view0 = new THREE.Group(); view0.position.y = 2.15; lens.add(view0);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.12, 48), new THREE.MeshBasicMaterial({ color: 0x1d3557 })); view0.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 10, 48), mat(0x90a4ae, { metalness: 0.4, roughness: 0.4 })); view0.add(ring);
  tagOn(stage, lens, 'Под микроскоп (увеличено)', [0, 3.55, 0.1], 0.16, 9);
  // яйцеклетка
  const egg = new THREE.Group(); egg.position.z = 0.3; view0.add(egg);
  const zona = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 20), glassMat(0xfff1e6, 0.35, { emissive: 0xffd166, emissiveIntensity: 0 })); egg.add(zona);
  const cyto = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 20), organMat(0xffe5b4)); egg.add(cyto);
  const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), organMat(0xf4a261)); nuc.position.set(0.08, 0.06, 0.34); egg.add(nuc);
  egg.scale.z = 0.5;
  // делящи се клетки (2, 4, 8)
  const cluster = new THREE.Group(); cluster.position.z = 0.3; cluster.visible = false; view0.add(cluster);
  const cellM = organMat(0xffe5b4);
  const cells = [];
  for (let i = 0; i < 8; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), cellM); cluster.add(c); cells.push(c); }
  const layout = (n) => { // разположение на n клетки в топче
    const P = { 1: [[0, 0, 0]], 2: [[-0.2, 0, 0], [0.2, 0, 0]], 4: [[-0.18, 0.18, 0], [0.18, 0.18, 0], [-0.18, -0.18, 0], [0.18, -0.18, 0]] }[n]
      || [[-0.16, 0.16, 0.12], [0.16, 0.16, 0.12], [-0.16, -0.16, 0.12], [0.16, -0.16, 0.12], [-0.16, 0.16, -0.12], [0.16, 0.16, -0.12], [-0.16, -0.16, -0.12], [0.16, -0.16, -0.12]];
    const r = { 1: 0.42, 2: 0.24, 4: 0.19, 8: 0.16 }[n];
    cells.forEach((c, i) => { c.visible = i < n; if (i < n) { c.position.set(...P[i]); c.scale.setScalar(r / 0.2); } });
  };
  layout(1);
  const shellOut = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), glassMat(0xfff1e6, 0.25)); cluster.add(shellOut);
  // сперматозоиди: глава и опашка от точици, която се вълнува
  const spermM = organMat(0xbde0fe, { emissive: 0x4895ef, emissiveIntensity: 0.25 });
  const tailM = organMat(0xdbeafe);
  const sperms = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group(); g.position.z = 0.45; view0.add(g);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), spermM); head.scale.set(1.5, 1, 0.8); g.add(head);
    const tail = [];
    for (let k = 1; k <= 9; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.016 - k * 0.0009, 6, 4), tailM); s.position.x = -0.04 - k * 0.042; g.add(s); tail.push(s); }
    sperms.push({ g, tail, a: i * 0.9, r: 0.72 + (i % 3) * 0.1, r0: 0.72 + (i % 3) * 0.1, sp: 0.35 + (i % 4) * 0.06, ph: i * 1.3 });
  }
  // зародиш / плод в околоплодния мехур (стилизиран)
  const fetus = new THREE.Group(); fetus.position.z = 0.3; fetus.visible = false; view0.add(fetus);
  const sac = new THREE.Mesh(new THREE.SphereGeometry(0.85, 28, 20), glassMat(0xbde0fe, 0.22)); fetus.add(sac);
  const placenta = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 12), organMat(0xe5989b)); placenta.scale.set(0.35, 1, 1); placenta.position.set(-0.78, 0.25, 0); fetus.add(placenta);
  const babyM = organMat(0xffcdb2);
  const baby = new THREE.Group(); baby.position.set(0.1, -0.05, 0); fetus.add(baby);
  const bHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), babyM); bHead.position.set(0.1, 0.32, 0); baby.add(bHead);
  const bBody = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 14), babyM); bBody.scale.set(0.95, 1.2, 0.85); bBody.position.set(-0.02, -0.1, 0); baby.add(bBody);
  const limbs = [];
  const limb = (pos, rz, len) => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, len, 4, 8), babyM); l.position.set(...pos); l.rotation.z = rz; baby.add(l); limbs.push(l); return l; };
  limb([0.18, 0.02, 0.14], 0.9, 0.18); limb([0.14, -0.3, 0.14], 1.4, 0.24); limb([0.16, -0.36, -0.1], 1.2, 0.24); limb([0.2, 0.0, -0.12], 0.7, 0.16);
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe63946, emissive: 0xe63946, emissiveIntensity: 0.5 })); heart.position.set(0.1, -0.02, 0.22); baby.add(heart);
  const cord = tube([[-0.7, 0.2, 0], [-0.45, -0.1, 0.12], [-0.2, -0.05, 0.1], [0.0, -0.2, 0.15]], 0.035, organMat(0xf28482), 16); fetus.add(cord);
  const eggAt = spot(egg, 'egg', [0, 0, 0], 0.45);
  const spermAt = spot(view0, 'sperm', [0.75, -0.5, 0.45], 0.25);
  const lensAt = spot(view0, null, [0, 0.55, 0.3]);
  const S = { mode: 'swim', t: 0, month: -1, win: null }; // mode: swim → fert → split → cells (→ плъзгача за месеците)

  function setMonth(m) {
    S.month = m;
    const cellStage = m < 1;
    cluster.visible = cellStage; fetus.visible = !cellStage; egg.visible = false;
    sperms.forEach((s) => { s.g.visible = false; });
    if (cellStage) { layout(8); return; }
    const k = clamp01((m - 1) / 8);
    fetus.scale.setScalar(lerp(0.22, 1.18, Math.pow(k, 0.8)));
    limbs.forEach((l) => { l.visible = m >= 2; l.scale.setScalar(clamp01((m - 1.5) / 2) * 0.8 + 0.2); });
    bHead.scale.setScalar(lerp(1.15, 0.95, k));
    baby.rotation.z = lerp(0.6, 1.4, clamp01((m - 6) / 3));
    heart.visible = m >= 1;
  }
  function resetCells() {
    S.mode = 'swim'; S.t = 0; S.month = -1; S.win = null;
    egg.visible = true; cluster.visible = false; fetus.visible = false;
    zona.material.emissiveIntensity = 0;
    sperms.forEach((s) => { s.g.visible = true; s.g.scale.setScalar(1); s.r = s.r0; });
    layout(1);
    eggDot.visible = false;
  }

  // ---------- Съученици ----------
  const teens = TEENS.map((p, i) => {
    const g = new THREE.Group(); g.position.set(TX - 2 + i * 1.0, 0, 0.2 + (i % 2) * 0.25); scene.add(g);
    const skin = mat(0xf1c6a5);
    const pants = mat(i % 2 ? 0x34495e : 0x3d5a80);
    for (const s of [1, -1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.78, 4, 8), pants); l.position.set(s * 0.12, 0.48, 0); g.add(l); const sh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.26), mat(0xfafafa)); sh.position.set(s * 0.12, 0.04, 0.04); g.add(sh); }
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 4, 12), mat(p.shirt)); torso.scale.z = 0.7; torso.position.y = 1.32; g.add(torso);
    const arms = [];
    for (const s of [1, -1]) { const a = new THREE.Group(); a.position.set(s * 0.3, 1.6, 0); g.add(a); const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.56, 4, 8), mat(p.shirt)); m.position.y = -0.3; a.add(m); const h = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), skin); h.position.y = -0.66; a.add(h); arms.push(a); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.14, 8), skin); neck.position.y = 1.79; g.add(neck);
    const head = new THREE.Group(); head.position.y = 2.05; g.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), skin));
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.235, 16, 10, 0, Math.PI * 2, 0, 1.4), mat(p.hair)); hair.rotation.x = -0.35; head.add(hair);
    if (p.girl) { const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 4, 8), mat(p.hair)); back.position.set(0, -0.12, -0.12); back.scale.z = 0.6; head.add(back); }
    for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 4), mat(0x2b2118)); e.position.set(s * 0.08, 0.03, 0.2); head.add(e); }
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 4, 10, Math.PI), mat(0xb5524c)); smile.rotation.z = Math.PI; smile.position.set(0, -0.07, 0.205); head.add(smile);
    tagOn(stage, g, p.name, [0, 2.55, 0], 0.13, 8);
    return { p, g, arms, ph: i * 1.1 };
  });
  const teensAt = spot(scene, 'teens', [TX, 1.4, 0.3], 0.6);
  const setAge = (age) => { teens.forEach((tn) => { tn.g.scale.setScalar(heightAt(tn.p, age)); }); };
  setAge(10);

  // ---------- Рафт за хигиена ----------
  const shelf = new THREE.Group(); shelf.position.set(SX, 0, -2.1); scene.add(shelf);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.0, 0.7), mat(0xf5f5f5)); cab.position.y = 0.5; shelf.add(cab);
  for (const sx of [-0.52, 0.52]) { const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.86, 0.03), mat(0xe0e7ee)); door.position.set(sx, 0.5, 0.36); shelf.add(door); const kn = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat(0x90a4ae)); kn.position.set(sx - Math.sign(sx) * 0.38, 0.55, 0.39); shelf.add(kn); }
  const mirror = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.04), new THREE.MeshStandardMaterial({ color: 0xcfe8f3, metalness: 0.6, roughness: 0.08 })); mirror.position.set(0, 2.0, -0.3); shelf.add(mirror);
  const mFrame = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.22, 0.03), mat(0xb0bec5)); mFrame.position.set(0, 2.0, -0.33); shelf.add(mFrame);
  const top = 1.0;
  const soap = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.12, 4, 8), mat(0x95d5b2)); soap.rotation.z = Math.PI / 2; soap.scale.set(1, 1, 0.7); soap.position.set(-0.8, top + 0.06, 0.1); shelf.add(soap);
  const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.14, 0.03, 16), mat(0xffffff)); dish.position.set(-0.8, top + 0.015, 0.1); shelf.add(dish);
  const towels = new THREE.Group(); towels.position.set(-0.3, top, 0.05); shelf.add(towels);
  [0x48cae4, 0xffb703, 0xef476f].forEach((c, i) => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.32), mat(c)); t.position.y = 0.04 + i * 0.085; towels.add(t); const st = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.02, 0.33), mat(0xffffff)); st.position.y = 0.04 + i * 0.085; towels.add(st); });
  const deo = new THREE.Group(); deo.position.set(0.2, top, 0.1); shelf.add(deo);
  { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 12), mat(0x5e60ce)); b.position.y = 0.15; deo.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.063, 0.08, 12), mat(0xffffff)); c.position.y = 0.34; deo.add(c); }
  const cup = new THREE.Group(); cup.position.set(0.55, top, 0.12); shelf.add(cup);
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.2, 12), mat(0xffd6a5)); c.position.y = 0.1; cup.add(c);
    [0x4cc9f0, 0xf72585].forEach((col, i) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.02), mat(col)); h.position.set(i ? 0.025 : -0.025, 0.28, 0); h.rotation.z = i ? -0.15 : 0.15; cup.add(h); }); }
  const shirt = new THREE.Group(); shirt.position.set(0.88, top, 0.05); shelf.add(shirt);
  { const a = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.28), mat(0xffffff)); a.position.y = 0.03; shirt.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 0.28), mat(0xa8dadc)); b.position.y = 0.09; shirt.add(b); }
  const bubbles = [];
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.035 + (i % 3) * 0.012, 10, 8), glassMat(0xe0fbfc, 0.45)); shelf.add(b); bubbles.push({ b, ph: i / 6 }); }
  const shelfAt = spot(shelf, 'shelf', [0, 1.25, 0.1], 0.6);
  // табелка „Имам въпрос?“ — родител, учител, лекар
  const sign = new THREE.Group(); sign.position.set(SX + 1.7, 2.3, -2.5); scene.add(sign);
  const sb = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.04), mat(0xfff8e1)); sign.add(sb);
  const sf = new THREE.Mesh(new THREE.BoxGeometry(1.28, 1.48, 0.03), mat(0xf4a261)); sf.position.z = -0.02; sign.add(sf);
  [['Имам въпрос?', 0.48, 0.2], ['родител', 0.13, 0.18], ['учител', -0.15, 0.18], ['лекар', -0.43, 0.18]].forEach(([t, y, sz]) => { const l = labelSprite(t, { size: sz }); l.position.set(0, y, 0.06); sign.add(l); });
  const askAt = spot(sign, 'ask', [0, 0.45, 0.05], 0.5);
  const askSide = spot(sign, null, [-1.45, -0.1, 0.1]); // балончетата в стъпка 4 са встрани от табелката

  // ---------- Жива сцена ----------
  const tmpV = new THREE.Vector3();
  stage.tick((dt, t) => {
    S.t += dt;
    // сперматозоидите плуват около яйцеклетката
    sperms.forEach((s, i) => {
      if (!s.g.visible) return;
      if (S.mode === 'swim' || (S.mode === 'fert' && i !== 0)) {
        if (S.mode === 'fert') s.r = Math.max(0.6, s.r - dt * 0.05);
        s.a += dt * s.sp;
        s.g.position.set(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r * 0.85, 0.45);
        s.g.rotation.z = s.a + Math.PI / 2 + Math.PI;
      } else if (S.mode === 'fert' && i === 0) { // един сперматозоид стига до яйцеклетката
        const k = clamp01(S.t / 2.2);
        const ang = 0.6;
        const r = lerp(1.0, 0.5, k);
        s.g.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 0.45);
        s.g.rotation.z = ang + Math.PI;
        if (k >= 1) s.g.scale.setScalar(Math.max(0.01, 1 - (S.t - 2.2) * 1.5));
      }
      s.tail.forEach((b, k) => { b.position.y = Math.sin(t * 14 - k * 0.8 + s.ph) * 0.012 * k * 0.5; });
    });
    if (S.mode === 'fert') {
      zona.material.emissiveIntensity = clamp01((S.t - 2.0) * 1.2) * 0.6;
      if (S.t > 3.2) { sperms.forEach((s) => { s.g.visible = false; }); S.mode = 'split'; S.t = 0; egg.visible = false; cluster.visible = true; layout(1); }
    }
    if (S.mode === 'split') {
      layout(S.t < 0.8 ? 1 : S.t < 1.8 ? 2 : S.t < 2.8 ? 4 : 8);
      if (S.t > 3) { S.mode = 'cells'; if (S.win) { const f = S.win; S.win = null; f(); } }
    }
    egg.rotation.y = Math.sin(t * 0.4) * 0.3;
    cluster.rotation.y = t * 0.3;
    if (fetus.visible) { baby.position.y = -0.05 + Math.sin(t * 0.9) * 0.03; baby.rotation.y = Math.sin(t * 0.5) * 0.25; heart.scale.setScalar(1 + Math.max(0, Math.sin(t * 9)) * 0.35); }
    // точката-яйцеклетка по яйцепровода
    if (eggDot.visible) { const k = (eggDot.userData.k || 0) + dt * 0.18; eggDot.userData.k = k > 1.25 ? 0 : k; eggPath.getPoint(clamp01(eggDot.userData.k), tmpV); eggDot.position.copy(tmpV); }
    dots.forEach((o) => { o.k = (o.k + dt * 0.12) % 1; o.c.getPoint(o.k, tmpV); o.d.position.copy(tmpV); });
    // съучениците дишат и се оглеждат
    teens.forEach((tn) => { tn.arms.forEach((a, k) => { a.rotation.z = (k ? -1 : 1) * (0.08 + Math.sin(t * 1.2 + tn.ph) * 0.04); }); tn.g.rotation.y = Math.sin(t * 0.4 + tn.ph) * 0.2; });
    bubbles.forEach((o) => { const k = (t * 0.25 + o.ph) % 1; o.b.position.set(-0.8 + Math.sin(k * 9 + o.ph * 6) * 0.12, 1.12 + k * 1.1, 0.1 + Math.cos(k * 7) * 0.05); o.b.scale.setScalar(k < 0.9 ? 1 : (1 - k) * 10); });
    leaves.forEach((l, i) => { l.rotation.x = Math.sin(t * 0.9 + i) * 0.06; });
    curtain.rotation.z = Math.sin(t * 0.7) * 0.03;
    handM.rotation.z = -t * 0.1;
    uterusM.emissive.setHex(0xff8fab); uterusM.emissiveIntensity = S.month >= 0 ? 0.15 + Math.sin(t * 2) * 0.05 : 0;
  });

  // Общ изглед: целият кабинет. На широк екран сцената е изместена надясно, за да не я закрива менюто в ъгъла.
  const overview = () => ((shell.stageEl.clientWidth || 600) >= 480
    ? view(ctx, [-0.3, 2.2, -1], 11.3, { halfH: 2.6, elev: 0.25 })
    : view(ctx, [2.5, 2.2, -1], 8.6, { halfH: 2.6, elev: 0.25 }));

  // ---------- 1. Опознай ----------
  function step1() {
    shell.step(0);
    ctx.clearTip();
    resetCells(); setAge(10);
    showTags(ORGANS, false);
    overview();
    const it = (id, label, icon, n, obj, dist = 3.2, lift = 0) => ({ id, label, icon, note: n, obj: () => obj, dist, lift, bubble: 0.45 });
    const ex = explore(ctx, {
      title: 'Разгледай',
      intro: '<p>Човекът се размножава <b>полово</b>: нов живот започва, когато се слеят две <b>полови клетки</b> — от майката и от бащата. Органите, в които те се образуват, са <b>половата система</b>.</p><p><b>Разгледай всичко</b> от менюто в ъгъла.</p>',
      items: [
        it('ovary', 'Яйчници', '🟣', 'Двата <b>яйчника</b> са женските полови жлези. В тях узряват <b>яйцеклетките</b>. Яйчниците отделят и женски полови хормони.', at.ovary, 2.6),
        it('tube', 'Яйцепроводи', '〰️', 'По <b>яйцепровода</b> узрялата яйцеклетка се придвижва от яйчника към матката. Обикновено тук става оплождането.', at.tube, 2.6),
        it('uterus', 'Матка', '🩷', 'В <b>матката</b> се развива бебето през бременността. Матката е свързана с външната среда чрез влагалището.', at.uterus, 2.6),
        it('testis', 'Семенници', '🔵', 'Двата <b>семенника</b> са мъжките полови жлези. В тях се образуват <b>сперматозоидите</b>. Семенниците отделят и мъжки полови хормони.', at.testis, 2.6),
        it('duct', 'Семепроводи и жлези', '〰️', 'По <b>семепроводите</b> сперматозоидите излизат от семенниците. <b>Простатната жлеза</b> и <b>семенните мехурчета</b> отделят течност, в която сперматозоидите плуват.', at.duct, 2.6),
        it('egg', 'Яйцеклетка', '🥚', '<b>Яйцеклетката</b> е женската полова клетка. Тя е голяма (около 0,1 mm — колкото точица) и сама не се движи.', eggAt, 2.8),
        it('sperm', 'Сперматозоид', '💧', '<b>Сперматозоидът</b> е мъжката полова клетка. Той е много по-малък от яйцеклетката и плува с опашка.', spermAt, 2.8),
        it('teens', 'Съученици', '🧒', 'Всички са на 10 години, но ще растат и ще се променят в различно време. Всеки съзрява със <b>свое темпо</b>.', teensAt, 4.5, 0.3),
        it('shelf', 'Рафт за хигиена', '🧼', 'Сапун, собствена кърпа, дезодорант, четка за зъби и чисто бельо — помощници в грижата за тялото.', shelfAt, 3.2),
        it('ask', 'Имам въпрос?', '❓', 'Въпросите за тялото са нормални. Най-точните отговори ще получиш от <b>родител</b>, <b>учител</b> или <b>лекар</b>.', askAt, 4.2, 0.2),
      ],
      onNext: step2,
    });
    const orig = ctx.menuPick;
    const show = (id) => { if (ORGANS.includes(id)) showTags([id]); };
    ctx.menuPick = (id) => { orig(id); show(id); };
    ctx.click = (id) => { if (!id) return ctx.clearTip(); ex.visit(id); show(id); };
  }

  // ---------- 2. Оплождане и развитие ----------
  function step2() {
    shell.step(1);
    ctx.clearTip();
    showTags(ORGANS, false);
    view(ctx, [(FX + MX) / 2, 2.0, -1.4], 2.9, { halfH: 1.6, elev: 0.12 });
    shell.task('<p>Надписите са скрити. <b>Кликни върху органа</b>, в който узряват <b>яйцеклетките</b>.</p>');
    ctx.answer = 'ovary';
    pickTask(ctx, {
      ok: (id) => (ORGANS.includes(id) ? id === 'ovary' : null),
      onWrong: (id, m) => {
        const why = { testis: 'Това е семенник — в него се образуват сперматозоиди. Той е от мъжката система.', uterus: 'В матката се развива бебето, но яйцеклетките узряват другаде.', tube: 'По яйцепровода яйцеклетката само минава.', duct: 'Това е от мъжката система.' }[id];
        shell.msg(`${why}${m >= 2 ? ' Подсказка: търси малките жлези отстрани на женската схема.' : ''}`, 'bad');
      },
      onRight: (id, m) => {
        ctx.click = null; ctx.answer = null;
        showTags(ORGANS);
        eggDot.visible = true; eggDot.userData.k = 0;
        ctx.say(at.ovary, 'Да! След съзряването всеки месец в единия яйчник обикновено узрява по една яйцеклетка и тръгва по яйцепровода.', 'wide', 0.4);
        shell.msg('Вярно!', 'good');
        fert(m);
      },
    });
    function fert(m0) {
      shell.task('<p>Проследи пътя на яйцеклетката по схемата.</p>');
      choice(ctx, {
        q: 'Къде обикновено се срещат яйцеклетката и сперматозоидът (става оплождането)?',
        options: [
          { t: 'В яйцепровода.', ok: true, why: 'Вярно! Да видим оплождането под микроскоп.' },
          { t: 'В яйчника.', ok: false, why: 'В яйчника яйцеклетката само узрява. После тя тръгва на път. Накъде?' },
          { t: 'В семенника.', ok: false, why: 'Семенникът е мъжки орган — там се образуват сперматозоидите.' },
        ],
        hint: 'Яйцеклетката се движи от яйчника към матката. Срещата е по пътя.',
        mistakes: m0,
        onRight: (m) => {
          ctx.clearTip();
          view(ctx, [LX, 2.35, -1.0], 1.5, { halfH: 1.75, elev: 0.08 });
          const c = shell.setControls('<p>Под микроскопа: яйцеклетка и много сперматозоиди.</p><div class="row"><button class="btn primary go">▶ Оплождане</button></div>');
          c.querySelector('.go').addEventListener('click', (e) => {
            e.target.disabled = true;
            S.mode = 'fert'; S.t = 0;
            ctx.say(lensAt, 'Само <b>един</b> сперматозоид се слива с яйцеклетката.', 'wide', 0.5);
            S.win = () => {
              ctx.say(lensAt, '✔ Оплодената яйцеклетка се дели: 2, 4, 8 клетки… Така започва развитието на нов човек. Той наследява белези и от майката, и от бащата.', 'good wide', 0.5);
              months(m);
            };
          }, { once: true });
        },
      });
    }
    function months(m0) {
      let mistakes = m0;
      const asks = [
        { q: 'Спри, когато зародишът <b>вече се нарича плод</b>.', ok: (v) => v >= 3 && v <= 8, ans: 3, hint: 'Прочети в балончето кога зародишът се нарича плод.' },
        { q: 'Спри, когато бебето е <b>готово да се роди</b>.', ok: (v) => v >= 9, ans: 9, hint: 'Бременността продължава около 9 месеца.' },
      ];
      let k = 0;
      shell.msg('');
      shell.task(`<p>В матката зародишът се развива около <b>9 месеца</b>. Храна и кислород получава от майката чрез <b>плацентата</b> и <b>пъпната връв</b>.</p>
        <label class="small">Месеци след оплождането: <b class="mv">0</b><input class="slider ms" type="range" min="0" max="9" step="1" value="0"></label>
        <p class="aq"></p><p class="small">Сроковете са приблизителни.</p>`);
      const sl = container.querySelector('.ms');
      let info = null;
      const upd = () => {
        const v = +sl.value; container.querySelector('.mv').textContent = v; setMonth(v);
        if (!info) { ctx.clearTip(); info = stage.bubble(lensAt, '', { lift: 0.5, cls: 'wide' }); }
        info.set(`<b>${v === 0 ? 'Първите дни' : `Месец ${v}`}:</b> ${monthOf(v).t}`);
      };
      sl.addEventListener('input', upd);
      const c = shell.setControls('<div class="row"><button class="btn primary chk">Провери</button></div>');
      const ask = () => { container.querySelector('.aq').innerHTML = asks[k].q; ctx.answer = asks[k].ans; };
      ask();
      c.querySelector('.chk').addEventListener('click', () => {
        if (!asks[k].ok(+sl.value)) { mistakes++; shell.msg(`Не е този момент.${mistakes >= 2 ? ' Подсказка: ' + asks[k].hint : ''}`, 'bad'); return; }
        shell.msg('Вярно!', 'good');
        k++;
        if (k < asks.length) { ask(); return; }
        ctx.answer = null; sl.disabled = true;
        if (info) { info.remove(); info = null; }
        ctx.say(lensAt, '✔ Новороденото обикновено е около 50 cm. След раждането то расте и се развива още много години.', 'good wide', 0.5);
        orderTask(ctx, {
          q: 'Подреди събитията от узряването на яйцеклетката до раждането.',
          items: ['яйцеклетката узрява в яйчника', 'оплождане в яйцепровода', 'зародишът се прикрепва в матката', 'развитие около 9 месеца', 'раждане'],
          hint: 'Проследи пътя: яйчник → яйцепровод → матка.',
          mistakes,
          onDone: (m) => { ctx.scores[0] = stepScore(m, 3); nextBtn(ctx, 'Напред →', step3); },
        });
      });
      upd();
    }
  }

  // ---------- 3. Съзряване ----------
  function step3() {
    shell.step(2);
    ctx.clearTip();
    view(ctx, [TX, 1.8, 0.3], 3.0, { halfH: 2.1, elev: 0.15 });
    shell.task('<p>Човек се развива през целия си живот.</p>');
    orderTask(ctx, {
      q: 'Подреди етапите от развитието на човека.',
      items: ['вътреутробно развитие', 'детство', 'юношество (пубертет)', 'зрялост', 'старост'],
      hint: 'Развитието започва още преди раждането.',
      onDone: (m0) => ages(m0),
    });
    function ages(m0) {
      shell.task(`<p><b>Юношеството</b> (пубертетът) е времето, когато детето постепенно съзрява. Половите жлези започват да отделят повече <b>полови хормони</b> и тялото се променя.</p>
        <label class="small">Възраст: <b class="av">10</b> години<input class="slider as" type="range" min="10" max="16" step="1" value="10"></label>
        <p class="small">Плъзни и наблюдавай петимата съученици.</p>`);
      const sl = container.querySelector('.as');
      const seenAges = new Set([10]);
      const c = shell.setControls('<div class="row"><button class="btn primary nx2" disabled>Продължи</button></div>');
      const upd = () => {
        const a = +sl.value; container.querySelector('.av').textContent = a; setAge(a); seenAges.add(a);
        ctx.say(teensAt, a <= 11 ? 'Всички са на една и съща възраст, но не са еднакви.' : a <= 13 ? 'Някои вече растат бързо, а други — още не. Това е нормално.' : 'Накрая всички са пораснали, но всеки в свое време.', 'wide', 2.0);
        if (seenAges.has(16) && seenAges.size >= 4) c.querySelector('.nx2').disabled = false;
      };
      sl.addEventListener('input', upd); upd();
      c.querySelector('.nx2').addEventListener('click', () => {
        sl.disabled = true;
        choice(ctx, {
          q: 'Мира и Деси са на 12 години. Мира вече порасна много, а Деси — още не. Кое е вярно?',
          options: [
            { t: 'И двете се развиват нормално: всеки съзрява със свое темпо.', ok: true, why: 'Вярно! Промените започват при всеки в различно време — по-рано или по-късно.' },
            { t: 'Деси изостава и с нея нещо не е наред.', ok: false, why: 'Видя на плъзгача: всеки започва да расте бързо в различна възраст.' },
            { t: 'Мира е пораснала твърде рано и трябва да се тревожи.', ok: false, why: 'Видя на плъзгача: при някои растежът започва по-рано, при други — по-късно.' },
          ],
          hint: 'Погледни отново как растат петимата съученици.',
          mistakes: m0,
          onRight: (m1) => changes(m1),
        });
      }, { once: true });
    }
    function changes(m1) {
      shell.task('<p>Кои промени при съзряването са общи, и кои са особени за момичетата или за момчетата?</p>');
      sortTask(ctx, {
        bins: ['Момичета', 'Момчета', 'И при двата пола'],
        items: [
          { t: 'Бърз растеж на тялото', bin: 2, why: 'И момичетата, и момчетата растат бързо.' },
          { t: 'Окосмяване под мишниците', bin: 2, why: 'Това е общо за двата пола.' },
          { t: 'Засилено потене и понякога акне', bin: 2, why: 'Хормоните засилват работата на кожните жлези и при двата пола.' },
          { t: 'Промени в настроението', bin: 2, why: 'Хормоните влияят и на чувствата. Това е нормално.' },
          { t: 'Започва менструалният цикъл', bin: 0, why: 'Менструалният цикъл е признак, че яйчниците са започнали да работят.' },
          { t: 'Развиват се гърдите', bin: 0, why: 'Това е особеност при момичетата.' },
          { t: 'Гласът мутира и става по-плътен', bin: 1, why: 'Гласът се променя при момчетата.' },
          { t: 'Появява се окосмяване по лицето', bin: 1, why: 'Брадата и мустаците се появяват при момчетата.' },
        ],
        hint: 'Първо помисли кои промени стават и при двата пола.',
        mistakes: m1,
        onDone: (m) => {
          ctx.say(teensAt, 'При момичетата съзряването обикновено започва малко по-рано, отколкото при момчетата.', 'wide', 2.0);
          ctx.scores[1] = stepScore(m, 3);
          nextBtn(ctx, 'Напред →', step4);
        },
      });
    }
  }

  // ---------- 4. Грижа за себе си ----------
  function step4() {
    shell.step(3);
    ctx.clearTip();
    view(ctx, [SX + 0.6, 1.5, -2.1], 2.4, { halfH: 1.4, elev: 0.2 });
    shell.task('<p>Растящото тяло има нужда от повече грижа. Кое е добър навик?</p>');
    sortTask(ctx, {
      bins: ['Добър навик', 'Не е добра идея'],
      items: [
        { t: 'Къпя се всеки ден, особено след спорт.', bin: 0, why: 'Потта е благоприятна среда за микробите. Душът ги отмива.' },
        { t: 'Сменям бельото и чорапите всеки ден.', bin: 0, why: 'Чистото бельо пази кожата и половите органи от микроби.' },
        { t: 'Използвам само собствена кърпа и бельо.', bin: 0, why: 'Чрез общи кърпи и бельо се пренасят микроби.' },
        { t: 'Давам кърпата си на приятел.', bin: 1, why: 'Кърпите не се споделят — по тях се пренасят микроби.' },
        { t: 'Чопля пъпките по лицето.', bin: 1, why: 'Така се внасят микроби и остават белези. Лицето се мие с вода и мек сапун.' },
        { t: 'Спя достатъчно, движа се и се храня пълноценно.', bin: 0, why: 'Растящото тяло има нужда от сън, движение и пълноценна храна.' },
        { t: 'Ходя на профилактични прегледи при лекар.', bin: 0, why: 'Прегледите откриват проблемите рано, когато се лекуват най-лесно.' },
      ],
      hint: 'Помага ли това да пазим тялото чисто и здраво?',
      onDone: (m0) => {
        view(ctx, [SX + 1.0, 2.0, -2.3], 2.0, { halfH: 1.3, elev: 0.1 });
        ctx.say(askSide, 'Въпросите са нормални. Питай някого, на когото имаш доверие.', 'wide', 0.2);
        choice(ctx, {
          q: 'Притеснява те промяна в тялото ти и имаш въпрос. Какво е най-добре да направиш?',
          options: [
            { t: 'Питам родител, учител или лекар.', ok: true, why: 'Вярно! Те ще ти дадат точен и спокоен отговор.' },
            { t: 'Пазя го в тайна и се тревожа сам.', ok: false, why: 'Не е нужно да се тревожиш сам. Има хора, които могат да помогнат.' },
            { t: 'Вярвам на първото, което прочета в интернет.', ok: false, why: 'В интернет има и неверни неща. Кой може да ти отговори точно?' },
          ],
          hint: 'Помисли за хора, на които имаш доверие.',
          mistakes: m0,
          onRight: (m1) => {
            ctx.clearTip();
            choice(ctx, {
              q: 'Защо ранните сексуални контакти са риск за здравето на юношите?',
              options: [
                { t: 'Организмът още не е напълно развит, а има риск от нежелана бременност и от полово предавани инфекции.', ok: true, why: 'Вярно. Отговорността към собственото здраве включва и разбирането на тези рискове.' },
                { t: 'Няма никакъв риск.', ok: false, why: 'В юношеството тялото още съзрява. Помисли пак.' },
                { t: 'Защото забавят растежа на косата.', ok: false, why: 'Това няма връзка. Помисли какво още не е завършило в юношеството.' },
              ],
              hint: 'Тялото в юношеството още съзрява.',
              mistakes: m1,
              onRight: (m2) => {
                ctx.say(askSide, 'Пазим репродуктивното си здраве: хигиена, прегледи при лекар, отговорни решения и въпроси към хора, на които имаме доверие.', 'good wide', 0.2);
                ctx.scores[2] = stepScore(m2, 3);
                finishBtn(ctx, onComplete, restart);
              },
            });
          },
        });
      },
    });
  }

  function restart() {
    ctx.scores.length = 0;
    ctx.ratio = null;
    ctx.answer = null;
    step1();
  }
  step1();
  return { dispose() { note.remove(); stage.dispose(); } };
}
