// Линия на времето в 3D: лента с деления, места („гнезда“) за събития, курсор за годината
// и карти, които детето влачи до мястото им.
// Употреба:
//   const tl = createTimeline(stage, { from: 600, to: 1000, z: 5, length: 9, tick: 100, fmt: romanCentury });
//   tl.addSlot('krum', { year: 803, label: 'Хан Крум' });
//   tl.addCard('laws', { label: 'Дава закони', x: -3, z: 6.4 });
//   tl.setCursor(893);  tl.slotAt(position) → id на най-близкото гнездо или null
import { labelSprite, mat, addHitBox, THREE } from '../../kit.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
export const romanCentury = (y) => `${ROMAN[Math.floor((y - 1) / 100) + 1] || ''} век`;
export const yearFmt = (y) => (y < 0 ? `${-y} г. пр.Хр.` : `${y} г.`);

export function createTimeline(stage, opts = {}) {
  const {
    from, to,
    x = 0, y = 0.25, z = 4.8,
    length = 9,
    tick = 100,                   // през колко години е делението
    tickLabel = (yr) => `${yr}`,  // надпис на делението
    centuryBands = true,          // редуващи се ивици за всеки век (по-лесно се четат векове)
    color = 0x0a2a66,
  } = opts;
  const group = new THREE.Group();
  group.position.set(x, y, z);
  stage.scene.add(group);
  const xOf = (yr) => ((yr - from) / (to - from) - 0.5) * length;
  const yearAt = (lx) => from + (lx / length + 0.5) * (to - from);

  const bar = new THREE.Mesh(new THREE.BoxGeometry(length + 0.3, 0.12, 0.36), mat(color));
  group.add(bar);
  if (centuryBands) {
    const c0 = Math.ceil(from / 100) * 100;
    for (let c = c0 - 100; c < to; c += 100) {
      const a = Math.max(from, c), bnd = Math.min(to, c + 100);
      if (bnd <= a) continue;
      const band = new THREE.Mesh(new THREE.BoxGeometry(xOf(bnd) - xOf(a), 0.02, 0.38),
        mat(Math.floor(c / 100) % 2 ? 0x14bf96 : 0x9fe3cf));
      band.position.set((xOf(a) + xOf(bnd)) / 2, 0.07, 0);
      group.add(band);
    }
  }
  for (let yr = Math.ceil(from / tick) * tick; yr <= to; yr += tick) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.5), mat(0xffffff));
    t.position.set(xOf(yr), 0.06, 0);
    group.add(t);
    const l = labelSprite(tickLabel(yr), { size: 0.2, bg: 'rgba(255,255,255,0.85)' });
    l.position.set(xOf(yr), -0.05, 0.55);
    group.add(l);
  }

  // Курсор на годината (за плъзгача).
  const cursor = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.06), mat(0xf28c28));
  stem.position.y = 0.35;
  const cursorLbl = labelSprite('', { size: 0.24 });
  cursorLbl.position.y = 0.95;
  cursor.add(stem, cursorLbl);
  cursor.visible = false;
  group.add(cursor);
  let cursorText = '';
  function setCursor(yr, text = yearFmt(Math.round(yr))) {
    cursor.visible = true;
    cursor.position.x = xOf(yr);
    if (text !== cursorText) {
      cursorText = text;
      const fresh = labelSprite(text, { size: 0.24 });
      cursorLbl.material.map?.dispose();
      cursorLbl.material = fresh.material;
      cursorLbl.scale.copy(fresh.scale);
    }
  }
  function hideCursor() { cursor.visible = false; }

  // Гнезда: кръгче върху лентата и надпис над него.
  const slots = new Map();
  // Близките гнезда се редуват на два реда, за да не се застъпват надписите и картите.
  function addSlot(id, { year, label, color: c = 0xffffff }) {
    const g = new THREE.Group();
    const near = [...slots.values()].filter((s) => Math.abs(s.position.x - xOf(year)) < 1.7);
    const row = near.some((s) => s.userData.row === 0) ? 1 : 0;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 10, 32), mat(c));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    g.add(ring);
    const lbl = labelSprite(label, { size: 0.22 });
    lbl.position.y = 0.6 + row * 0.42;
    g.add(lbl);
    if (row) {
      const stick = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.42, 0.025), mat(0x8899aa));
      stick.position.y = 0.6;
      g.add(stick);
    }
    g.position.x = xOf(year);
    g.userData = { pickId: id, ring, year, row, filled: null, baseColor: c };
    addHitBox(g, 0.5);
    group.add(g);
    slots.set(id, g);
    return g;
  }
  function markSlot(id, color) { const s = slots.get(id); if (s) s.userData.ring.material.color.setHex(color ?? s.userData.baseColor); }

  // Карти за влачене (живеят в сцената, не в групата, за да се влачат по пода).
  const cards = new Map();
  function addCard(id, { label, x: cx, z: cz, color: c = 0xfff4d6 }) {
    const g = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.5), mat(c));
    g.add(board);
    const lbl = labelSprite(label, { size: 0.2 });
    lbl.position.y = 0.35;
    g.add(lbl);
    g.position.set(cx, y, cz);
    g.userData = { dragId: id, pickId: id, home: new THREE.Vector3(cx, y, cz), board, label };
    addHitBox(g, 0.7);
    stage.scene.add(g);
    cards.set(id, g);
    return g;
  }
  // Най-близкото свободно гнездо до точка от сцената (или null, ако е далеч от лентата).
  function slotAt(p, { maxDist = 0.9 } = {}) {
    const local = group.worldToLocal(p.clone());
    if (Math.abs(local.z) > 1.0) return null;
    let best = null, bd = maxDist;
    for (const [id, s] of slots) {
      const dd = Math.abs(s.position.x - local.x);
      if (dd < bd && !s.userData.filled) { bd = dd; best = id; }
    }
    return best;
  }
  function placeCard(cardId, slotId) {
    const c = cards.get(cardId), s = slots.get(slotId);
    if (!c || !s) return;
    const wp = s.getWorldPosition(new THREE.Vector3());
    c.position.set(wp.x, y + 0.02 + s.userData.row * 0.02, wp.z - 0.75 - s.userData.row * 0.62);
    c.userData.locked = true;
    s.userData.filled = cardId;
  }
  function sendHome(cardId) { const c = cards.get(cardId); if (c) c.position.copy(c.userData.home); }

  function reset() {
    for (const [id, c] of cards) { c.position.copy(c.userData.home); c.userData.locked = false; c.visible = true; }
    for (const s of slots.values()) { s.userData.filled = null; s.userData.ring.material.color.setHex(s.userData.baseColor); }
    hideCursor();
  }
  function dispose() {
    stage.scene.remove(group);
    for (const c of cards.values()) stage.scene.remove(c);
  }

  return { group, xOf, yearAt, slots, cards, addSlot, markSlot, addCard, slotAt, placeCard, sendHome, setCursor, hideCursor, reset, dispose };
}
