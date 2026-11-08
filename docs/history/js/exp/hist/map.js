// Жива карта: релефни (повдигнати) държави от Natural Earth, места с карфици и балончета.
// Употреба:
//   const map = await createMap(stage, { center: [25.4, 42.7], unitsPerDeg: 1.1, focus: '100' });
//   map.addPlace('pliska', { lon: 27.38, lat: 43.38, label: 'Плиска' });
//   map.pos(lon, lat) → THREE.Vector3 върху картата
import { labelSprite, mat, addHitBox, THREE } from '../../kit.js';

const cache = new Map();
async function loadGeo(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('Картата не се зареди'); return r.json(); }));
  return cache.get(url);
}

export async function createMap(stage, opts = {}) {
  const {
    url = 'data/geo/balkans.json',
    center = [25.4, 42.7],         // дължина, ширина в средата на сцената
    unitsPerDeg = 1.1,             // единици в сцената на един градус ширина
    focus = '100',                 // id на държавата, която се откроява (България)
    focusColor = 0x7cc47f,
    otherColor = 0xd9d2c0,
    seaColor = 0x6fb3dc,
    height = 0.12,
    showNames = true,
  } = opts;
  const geo = await loadGeo(url);
  const k = Math.cos((center[1] * Math.PI) / 180);
  const group = new THREE.Group();
  stage.scene.add(group);

  // Проекция: равноъгълна, сгъстена по дължина с cos(ширина) — достатъчно вярна за Балканите.
  const px = (lon) => (lon - center[0]) * k * unitsPerDeg;
  const pz = (lat) => -(lat - center[1]) * unitsPerDeg;
  const pos = (lon, lat, y = 0) => new THREE.Vector3(px(lon), y, pz(lat));

  // Море под всичко.
  const b = geo.bbox;
  const w = (b.e - b.w) * k * unitsPerDeg, d = (b.n - b.s) * unitsPerDeg;
  const sea = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat(seaColor));
  sea.position.set(px((b.w + b.e) / 2), -0.06, pz((b.s + b.n) / 2));
  group.add(sea);

  const countries = new Map();
  for (const c of geo.countries) {
    const isFocus = c.id === focus;
    const cg = new THREE.Group();
    const m = mat(isFocus ? focusColor : otherColor);
    let best = null;
    for (const ring of c.rings) {
      const shape = new THREE.Shape(ring.map(([lon, lat]) => new THREE.Vector2(px(lon), -pz(lat))));
      const h = isFocus ? height * 2 : height;
      const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
      const mesh = new THREE.Mesh(geom, m);
      mesh.rotation.x = -Math.PI / 2;
      cg.add(mesh);
      if (!best || ring.length > best.length) best = ring;
    }
    // Граници: тънка тъмна линия по ръба.
    for (const ring of c.rings) {
      const pts = ring.map(([lon, lat]) => pos(lon, lat, (isFocus ? height * 2 : height) + 0.005));
      const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: isFocus ? 0x2e6b33 : 0x8a826e }));
      cg.add(line);
    }
    let label = null;
    if (showNames && best) {
      const cx = best.reduce((s, p) => s + p[0], 0) / best.length;
      const cy = best.reduce((s, p) => s + p[1], 0) / best.length;
      label = labelSprite(c.name, { size: isFocus ? 0.3 : 0.22, color: isFocus ? '#1f4d24' : '#6b6455', bg: 'rgba(255,255,255,0.6)', border: 'rgba(0,0,0,0)' });
      label.position.copy(pos(cx, cy, 0.5));
      cg.add(label);
    }
    cg.userData = { countryId: c.id, material: m, baseColor: m.color.getHex(), label };
    group.add(cg);
    countries.set(c.id, cg);
  }

  // ----- места -----
  const places = new Map();
  function addPlace(id, { lon, lat, label, color = 0xd23b3b, icon = '', labelDx = 0 }) {
    const g = new THREE.Group();
    const base = countries.get(focus) ? height * 2 : height;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), mat(0x5a5a5a));
    stick.position.y = 0.25;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(color));
    head.position.y = 0.55;
    g.add(stick, head);
    const lbl = labelSprite(`${icon ? icon + ' ' : ''}${label}`, { size: 0.24 });
    lbl.position.set(labelDx, 0.95, 0);
    g.add(lbl);
    g.position.copy(pos(lon, lat, base));
    g.userData = { pickId: id, head, label: lbl, phase: places.size * 0.7, baseColor: color };
    addHitBox(g, 0.6);
    group.add(g);
    places.set(id, g);
    return g;
  }
  function showPlace(id, on = true) { const g = places.get(id); if (g) g.visible = on; }
  function colorPlace(id, color) { const g = places.get(id); if (g) g.userData.head.material.color.setHex(color ?? g.userData.baseColor); }
  function highlight(countryId, color) {
    const cg = countries.get(countryId);
    if (cg) cg.userData.material.color.setHex(color ?? cg.userData.baseColor);
  }

  // Живот: карфиците леко пулсират, морето „диша“.
  const seaBase = new THREE.Color(seaColor);
  const stop = stage.tick((dt, t) => {
    for (const g of places.values()) {
      const s = 1 + Math.sin(t * 2.2 + g.userData.phase) * 0.12;
      g.userData.head.scale.setScalar(s);
    }
    sea.material.color.copy(seaBase).offsetHSL(0, 0, Math.sin(t * 0.8) * 0.02);
  });

  return {
    group, countries, places, pos, addPlace, showPlace, colorPlace, highlight,
    source: geo.source,
    dispose() { stop(); stage.scene.remove(group); },
  };
}
