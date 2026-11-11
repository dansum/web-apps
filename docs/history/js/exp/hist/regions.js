// Исторически области върху живата карта (map.js): Княжество България, Източна Румелия,
// Южна Добруджа, Беломорието и др. от data/geo/bg-history.json.
// ВНИМАНИЕ: границите са опростена схема, начертана за курса; не е точна карта.
// Затова сцената винаги показва знак „Приблизителни граници“ (badge).
// Употреба:
//   const reg = await createRegions(stage, map, { ids: ['knyaz', 'rumelia'] });
//   reg.paint({ knyaz: 0x6fbf73, rumelia: 0xf2c94c });   // кои области се виждат и с какъв цвят
//   reg.screenOf('rumelia') → { x, y } за тестовете; обектите носят userData.pickId = id
import { labelSprite, mat, THREE } from '../../kit.js';

const cache = new Map();
function loadJson(url) {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('Областите не се заредиха'); return r.json(); }));
  return cache.get(url);
}

export async function createRegions(stage, map, opts = {}) {
  const { url = 'data/geo/bg-history.json', ids = null, y = 0.3, height = 0.07, names = {} } = opts;
  const data = await loadJson(url);
  const group = new THREE.Group();
  stage.scene.add(group);
  const regions = new Map();
  for (const r of data.regions) {
    if (ids && !ids.includes(r.id)) continue;
    const g = new THREE.Group();
    const m = mat(0xffffff, { transparent: true, opacity: 0.88 });
    for (const p of r.polygons) {
      const toV = ([lon, lat]) => { const v = map.pos(lon, lat); return new THREE.Vector2(v.x, -v.z); };
      const shape = new THREE.Shape(p[0].map(toV));
      for (const hole of p.slice(1)) shape.holes.push(new THREE.Path(hole.map(toV)));
      const mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false }), m);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = y;
      g.add(mesh);
      const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(p[0].map(([lon, lat]) => map.pos(lon, lat, y + height + 0.004))),
        new THREE.LineBasicMaterial({ color: 0x3b3b3b, transparent: true, opacity: 0.55 }));
      edge.raycast = () => {}; // линиите не се кликат (иначе ловят клик на цяла единица разстояние)
      g.add(edge);
    }
    const name = names[r.id] || r.name;
    const label = labelSprite(name, { size: 0.2, bg: 'rgba(255,255,255,0.8)', border: 'rgba(0,0,0,0)' });
    label.position.copy(map.pos(r.anchor[0], r.anchor[1], y + 0.45));
    label.visible = false;
    group.add(label);
    g.userData = { pickId: r.id, material: m, label, anchor: map.pos(r.anchor[0], r.anchor[1], y + height), name, phase: regions.size };
    group.add(g);
    regions.set(r.id, g);
  }
  // Котва за балончета: невидима точка в средата на областта.
  const anchors = new Map();
  for (const [id, g] of regions) {
    const a = new THREE.Object3D();
    a.position.copy(g.userData.anchor);
    group.add(a);
    anchors.set(id, a);
  }

  // Знак „Приблизителни граници“ върху сцената.
  const host = stage.renderer.domElement.parentElement;
  const badge = document.createElement('div');
  badge.className = 'map-approx';
  badge.textContent = `⚠ ${data.label || 'Приблизителни граници'}`;
  badge.title = data.source;
  Object.assign(badge.style, {
    position: 'absolute', left: '8px', bottom: '8px', zIndex: 3, padding: '3px 8px', borderRadius: '6px',
    background: 'rgba(255,248,220,0.92)', border: '1px solid #d8b75a', font: '600 12px/1.3 system-ui, sans-serif',
    color: '#6b4d00', pointerEvents: 'none',
  });
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(badge);

  // Мигане на избрана област (за подсказки и за „ето какво стана“).
  let blink = null;
  const stop = stage.tick((dt, t) => {
    for (const g of regions.values()) {
      const m = g.userData.material;
      m.opacity = blink === g.userData.pickId ? 0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 6)) : 0.88;
    }
  });

  // labels: true (всички), false или масив от id, чиито надписи се виждат.
  function paint(colors, { labels = true } = {}) {
    for (const [id, g] of regions) {
      const c = colors[id];
      g.visible = c != null;
      if (c != null) g.userData.material.color.setHex(c);
      g.userData.label.visible = c != null && (Array.isArray(labels) ? labels.includes(id) : labels);
    }
  }
  function setColor(id, c) { const g = regions.get(id); if (g) { g.visible = true; g.userData.material.color.setHex(c); g.userData.label.visible = true; } }
  function hide(id) { const g = regions.get(id); if (g) { g.visible = false; g.userData.label.visible = false; } }
  function screenOf(id) {
    const a = anchors.get(id);
    if (!a) return null;
    const v = a.getWorldPosition(new THREE.Vector3()).project(stage.camera);
    const r = stage.renderer.domElement.getBoundingClientRect();
    return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
  }
  return {
    group, regions, anchors, paint, setColor, hide, screenOf, source: data.source,
    anchor: (id) => anchors.get(id),
    blink(id) { blink = id; },
    dispose() { stop(); badge.remove(); stage.scene.remove(group); },
  };
}

// Цветове за картите (еднакви във всички преживявания).
export const COL = {
  bg: 0x5fb36a,        // България
  bgNew: 0x9ad18f,     // току-що присъединена земя
  auto: 0xf2c94c,      // автономна област под властта на султана
  otto: 0xd98b5f,      // Османската империя
  ro: 0xa98bd6,        // Румъния
  rs: 0x6fa3d9,        // Сърбия / КСХС
  gr: 0x7fc6c6,        // Гърция
  lost: 0xa9aab8,      // загубена или чужда земя (сива)
  pick: 0xf28c28,      // избрано от детето
};

// Надписи на съседите и моретата (исторически имена, без днешните граници) и облаци над картата.
export function mapDecor(stage, map, names = []) {
  const group = new THREE.Group();
  for (const n of names) {
    const l = labelSprite(n.text, { size: n.size || 0.2, color: n.sea ? '#1f5d8a' : '#5b5446', bg: 'rgba(255,255,255,0.55)', border: 'rgba(0,0,0,0)' });
    l.position.copy(map.pos(n.lon, n.lat, 0.45));
    group.add(l);
  }
  const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1 });
  const clouds = [0, 1, 2].map((i) => {
    const g = new THREE.Group();
    [[0, 0, 0, 0.42], [0.42, 0.05, 0.1, 0.32], [-0.42, 0, -0.05, 0.3], [0.1, 0.18, 0, 0.28]].forEach(([x, y, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cm);
      s.position.set(x, y, z);
      g.add(s);
    });
    g.position.set(-6 + i * 4.5, 3.4 + i * 0.25, -3.6 + i * 1.1);
    group.add(g);
    return g;
  });
  stage.scene.add(group);
  const stop = stage.tick((dt) => {
    clouds.forEach((c, i) => { c.position.x += dt * (0.15 + i * 0.05); if (c.position.x > 7) c.position.x = -7; });
  });
  return { group, dispose() { stop(); stage.scene.remove(group); } };
}

// Места на картите за влачене под линията на времето: на широк екран в един ред (редуват се две височини),
// на тесен — в два реда по-близо до средата, за да не излизат извън сцената.
export function cardSpots(n, narrow) {
  const cols = narrow ? Math.ceil(n / 2) : n;
  const width = narrow ? 6.6 : 9.2;
  return (i) => {
    const col = narrow ? i % cols : i, row = narrow ? Math.floor(i / cols) : i % 2;
    return { x: ((col + 0.5) / cols - 0.5) * width, z: 5.1 + row * 0.85 };
  };
}
