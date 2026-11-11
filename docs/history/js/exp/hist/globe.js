// Глобус: сфера с континентите от Natural Earth (data/geo/world.json, днешни граници — само за ориентир).
// Сушата се рисува в canvas (равноъгълна проекция) и се слага като текстура — леко и за телефон.
// Употреба:
//   const globe = await createGlobe(stage, { radius: 3, center: [0, 4, 0] });
//   globe.pos(lon, lat, h) → точка в локалните мерки на глобуса (group); globe.world(lon, lat, h) → в сцената
//   globe.addPin(id, { lon, lat, label }) — карфица с pickId; globe.face(lon, lat) — завърта глобуса към камерата
//   globe.route(points, { color }) — път по дъгите на голям кръг; .at(time) дава точка, посока и изминати км
import { THREE, labelSprite, mat, addHitBox } from '../../kit.js';

const EARTH_KM = 6371;
const D2R = Math.PI / 180;
// Единичен вектор за дължина и ширина (съвпада с UV на SphereGeometry).
export function unit(lon, lat) {
  const l = lon * D2R, p = lat * D2R;
  return new THREE.Vector3(Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l));
}

let geoCache = null;
async function loadWorld(url) {
  if (!geoCache) geoCache = fetch(url).then((r) => { if (!r.ok) throw new Error('Картата не се зареди'); return r.json(); });
  return geoCache;
}

function paint(geo, W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
  // Океан: по-светъл край екватора, по-тъмен към полюсите.
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, '#5e8fb4'); sea.addColorStop(0.3, '#4f93c4'); sea.addColorStop(0.5, '#56a6d2'); sea.addColorStop(0.7, '#4f93c4'); sea.addColorStop(1, '#5e8fb4');
  ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
  // Лек „вълнист“ шум по водата.
  let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 6, y - 3, x + 12, y); ctx.stroke(); }
  const ring = (pts) => { ctx.beginPath(); pts.forEach(([lon, lat], i) => (i ? ctx.lineTo(X(lon), Y(lat)) : ctx.moveTo(X(lon), Y(lat)))); ctx.closePath(); };
  // Сушата: основен цвят, после пояси по ширина (пустини, тропици, студени земи) само върху сушата.
  ctx.save();
  ctx.fillStyle = '#7fae62';
  for (const p of geo.land) { ring(p); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-atop';
  const bands = ctx.createLinearGradient(0, 0, 0, H);
  const stop = (lat, col) => bands.addColorStop((90 - lat) / 180, col);
  stop(90, '#f4f6f6'); stop(70, '#e8ece6'); stop(62, '#a7b98c'); stop(50, '#86ad66'); stop(38, '#a9b276'); stop(30, '#d7c18a');
  stop(20, '#dcc48a'); stop(12, '#9ab868'); stop(0, '#5f9b4c'); stop(-12, '#79a95a'); stop(-24, '#c9b67e'); stop(-34, '#9db56c');
  stop(-50, '#8aa86a'); stop(-60, '#dfe5e2'); stop(-90, '#f6f8f8');
  ctx.globalAlpha = 0.85; ctx.fillStyle = bands; ctx.fillRect(0, 0, W, H);
  // Петна (гори, планини), за да не е еднообразно.
  ctx.globalAlpha = 1;
  for (let i = 0; i < 1600; i++) { ctx.fillStyle = `rgba(${r() > 0.5 ? '60,90,40' : '150,120,80'},${0.05 + r() * 0.08})`; ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 3 + r() * 10, 2 + r() * 6, r() * 3, 0, Math.PI * 2); ctx.fill(); }
  // Гренландия е покрита с лед.
  ctx.fillStyle = 'rgba(244,247,248,0.9)';
  for (const cn of geo.countries) if (cn.id === '304') for (const p of cn.rings) { ring(p); ctx.fill(); }
  ctx.restore();
  // Днешните граници — тънко и бледо, само за ориентир.
  ctx.strokeStyle = 'rgba(90,70,50,0.28)'; ctx.lineWidth = 1;
  for (const cn of geo.countries) for (const p of cn.rings) { ring(p); ctx.stroke(); }
  // Бреговете — по-плътно.
  ctx.strokeStyle = 'rgba(40,70,50,0.75)'; ctx.lineWidth = 1.6;
  for (const p of geo.land) { if (p.some(([, lat]) => lat < -85)) continue; ring(p); ctx.stroke(); }
  // Градусна мрежа и екватор.
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { ctx.beginPath(); ctx.moveTo(X(lon), 0); ctx.lineTo(X(lon), H); ctx.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); ctx.moveTo(0, Y(lat)); ctx.lineTo(W, Y(lat)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(200,60,40,0.45)'; ctx.setLineDash([8, 6]); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();
  // Маска на сушата за релефа.
  const m = document.createElement('canvas'); m.width = W / 2; m.height = H / 2;
  const mc = m.getContext('2d');
  mc.fillStyle = '#000'; mc.fillRect(0, 0, m.width, m.height);
  mc.fillStyle = '#fff'; mc.scale(0.5, 0.5);
  mc.beginPath();
  for (const p of geo.land) { p.forEach(([lon, lat], i) => (i ? mc.lineTo(X(lon), Y(lat)) : mc.moveTo(X(lon), Y(lat)))); mc.closePath(); }
  mc.fill();
  return { color: c, mask: m };
}

// Облаци: полупрозрачни петна в отделна, малко по-голяма сфера, която бавно се върти.
function cloudTex() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const ctx = c.getContext('2d');
  let s = 23; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 45; i++) {
    const x = r() * 1024, y = 60 + r() * 392, n = 4 + Math.floor(r() * 6);
    for (let k = 0; k < n; k++) {
      const gx = x + (r() - 0.5) * 70, gy = y + (r() - 0.5) * 18, rad = 10 + r() * 24;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export async function createGlobe(stage, { url = 'data/geo/world.json', radius = 3, center = [0, 0, 0], tex = 2048 } = {}) {
  const geo = await loadWorld(url);
  const R = radius;
  const root = new THREE.Group(); // стои на място (стойката)
  root.position.set(...center);
  const group = new THREE.Group(); // въртящото се кълбо
  root.add(group);
  stage.scene.add(root);
  const { color, mask } = paint(geo, tex, tex / 2);
  const map = new THREE.CanvasTexture(color); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const bump = new THREE.CanvasTexture(mask);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.5, roughness: 0.75, metalness: 0.02 }));
  sphere.userData.pickId = 'globe'; // кълбото спира кликовете към нещата на гърба му
  group.add(sphere);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.012, 48, 32), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, depthWrite: false, roughness: 1 }));
  clouds.raycast = () => {};
  group.add(clouds);
  // Ореол на въздуха.
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 48, 32), new THREE.MeshBasicMaterial({ color: 0x9fd3ff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false }));
  halo.raycast = () => {};
  root.add(halo);

  const pos = (lon, lat, h = 0) => unit(lon, lat).multiplyScalar(R + h);
  const world = (lon, lat, h = 0) => group.localToWorld(pos(lon, lat, h));
  const centerW = () => root.getWorldPosition(new THREE.Vector3());

  // ---- карфици и надписи, които се крият на гърба на кълбото ----
  const facing = []; // { obj, n (локална нормала), min }
  const pins = new Map();
  function addPin(id, { lon, lat, label, color = 0xd23b3b, size = 1, labelUp = 0 }) {
    const g = new THREE.Group();
    const n = unit(lon, lat);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3 * size, 6), mat(0x4a4a4a));
    stick.position.y = 0.15 * size;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07 * size, 14, 10), mat(color));
    head.position.y = 0.32 * size;
    g.add(stick, head);
    g.position.copy(pos(lon, lat));
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    g.userData = { pickId: id, head, baseColor: color, phase: pins.size * 0.9 };
    addHitBox(g, 0.22);
    group.add(g);
    let lbl = null;
    if (label) {
      lbl = labelSprite(label, { size: 0.27, bg: 'rgba(255,255,255,0.9)' });
      lbl.position.copy(pos(lon, lat, 0.48 * size + labelUp));
      group.add(lbl);
      stage.steadyLabel(lbl, 9);
      facing.push({ obj: lbl, n, min: 0.25 });
    }
    facing.push({ obj: g, n, min: -0.05, pin: true });
    g.userData.label = lbl;
    pins.set(id, g);
    return g;
  }
  function showPin(id, on = true) { const g = pins.get(id); if (!g) return; g.userData.on = on; g.visible = on; if (g.userData.label) g.userData.label.userData.on = on; }
  function colorPin(id, c) { const g = pins.get(id); if (g) g.userData.head.material.color.setHex(c ?? g.userData.baseColor); }
  function addLabel(text, lon, lat, { size = 0.27, color = '#1b3550', bg = 'rgba(255,255,255,0.55)', h = 0.06 } = {}) {
    const l = labelSprite(text, { size, color, bg, border: 'rgba(0,0,0,0)' });
    l.position.copy(pos(lon, lat, h));
    group.add(l);
    stage.steadyLabel(l, 9);
    facing.push({ obj: l, n: unit(lon, lat), min: 0.3 });
    return l;
  }
  // Нещо, закрепено върху кълбото (стои изправено по нормалата).
  function attach(obj, lon, lat, h = 0, heading = 0) {
    const n = unit(lon, lat);
    obj.position.copy(pos(lon, lat, h));
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    obj.quaternion.copy(q).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading));
    group.add(obj);
    facing.push({ obj, n, min: -0.1 });
    return obj;
  }

  // ---- пътища по дъги на голям кръг ----
  // points: [[lon, lat, време], …]; времето е в десетични години (1492.78 ≈ 12 октомври 1492 г.).
  function route(points, { color = 0xc0392b, width = 0.022, h = 0.025, dashed = false } = {}) {
    const dense = []; // { v: единичен вектор, t: време, km }
    let km = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const [lo1, la1, t1] = points[i], [lo2, la2, t2] = points[i + 1];
      const a = unit(lo1, la1), b = unit(lo2, la2);
      const ang = a.angleTo(b), n = Math.max(2, Math.ceil(ang / 0.02));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const f = k / n;
        const v = slerpV(a, b, ang, f);
        if (dense.length) km += v.angleTo(dense[dense.length - 1].v) * EARTH_KM;
        dense.push({ v, t: t1 + (t2 - t1) * f, km });
      }
    }
    const pts = dense.map((d) => d.v.clone().multiplyScalar(R + h));
    const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
    const SEG = Math.min(1200, pts.length * 2);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, width, 5, false),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, transparent: dashed, opacity: dashed ? 0.75 : 1 }));
    tube.raycast = () => {};
    group.add(tube);
    const r = {
      tube, dense, total: km,
      // Състояние в даден момент: точка, посока, изминати км и докъде е стигнала линията (0…1).
      at(time) {
        if (time <= dense[0].t) return { i: 0, f: 0, v: dense[0].v.clone(), dir: dense[1].v.clone().sub(dense[0].v).normalize(), km: 0, frac: 0 };
        let i = 1;
        while (i < dense.length - 1 && dense[i].t < time) i++;
        const A = dense[i - 1], B = dense[i];
        const f = B.t > A.t ? Math.min(1, Math.max(0, (time - A.t) / (B.t - A.t))) : 1;
        const v = A.v.clone().lerp(B.v, f).normalize();
        const dir = B.v.clone().sub(A.v).normalize();
        return { i, f, v, dir, km: A.km + (B.km - A.km) * f, frac: (i - 1 + f) / (dense.length - 1) };
      },
      draw(frac) { tube.geometry.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, frac)) * SEG) * 5 * 6); tube.visible = frac > 0.001; },
    };
    r.draw(0);
    return r;
  }
  // Кораб (или друго тяло, гледащо към +x) върху кълбото, по посока dir.
  const tmpM = new THREE.Matrix4();
  function placeOn(obj, v, dir, h = 0) {
    const up = v.clone().normalize();
    const fwd = dir.clone().addScaledVector(up, -dir.dot(up)).normalize();
    const side = new THREE.Vector3().crossVectors(fwd, up);
    tmpM.makeBasis(fwd, up, side);
    obj.quaternion.setFromRotationMatrix(tmpM);
    obj.position.copy(up).multiplyScalar(R + h);
  }

  // ---- завъртане на кълбото, за да гледа място към камерата ----
  const qTarget = new THREE.Quaternion();
  let turning = false;
  function faceQuat(lon, lat, elev = 0.27) {
    const l = lon * D2R, p = lat * D2R;
    const alpha = -Math.atan2(Math.cos(l), -Math.sin(l));
    const beta = p - elev;
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), alpha);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), beta);
    return qx.multiply(qy);
  }
  function face(lon, lat, { instant = false, elev } = {}) {
    qTarget.copy(faceQuat(lon, lat, elev));
    if (instant) group.quaternion.copy(qTarget);
    turning = !instant;
  }
  // Къде ще бъде мястото, след като кълбото се завърти (за камерата).
  const worldAfterTurn = (lon, lat, h = 0) => pos(lon, lat, h).applyQuaternion(qTarget).add(centerW());
  let follow = null; // функция, която връща [lon, lat] — кълбото следва движещ се кораб
  const camDir = new THREE.Vector3(), tmpN = new THREE.Vector3();
  const stop = stage.tick((dt, t) => {
    if (follow) { const [lo, la] = follow(); qTarget.copy(faceQuat(lo, la)); turning = true; }
    if (turning) {
      group.quaternion.slerp(qTarget, Math.min(1, dt * (follow ? 2.5 : 3.2)));
      if (!follow && group.quaternion.angleTo(qTarget) < 1e-3) { group.quaternion.copy(qTarget); turning = false; }
    }
    clouds.rotation.y += dt * 0.012;
    camDir.copy(stage.camera.position).sub(centerW()).normalize();
    for (const f of facing) {
      if (f.obj.userData.on === false) { f.obj.visible = false; continue; }
      tmpN.copy(f.n).applyQuaternion(group.quaternion);
      f.obj.visible = tmpN.dot(camDir) > f.min;
    }
    for (const g of pins.values()) g.userData.head.scale.setScalar(1 + Math.sin(t * 2.4 + g.userData.phase) * 0.15);
  });

  return {
    root, group, sphere, R, pos, world, pins, addPin, showPin, colorPin, addLabel, attach, route, placeOn,
    face, faceQuat, worldAfterTurn, centerW, facing,
    follow(fn) { follow = fn; if (!fn) turning = true; },
    source: geo.source,
    dispose() { stop(); stage.scene.remove(root); map.dispose(); bump.dispose(); },
  };
}

function slerpV(a, b, ang, f) {
  if (ang < 1e-6) return a.clone();
  const s = Math.sin(ang);
  return a.clone().multiplyScalar(Math.sin((1 - f) * ang) / s).addScaledVector(b, Math.sin(f * ang) / s);
}
