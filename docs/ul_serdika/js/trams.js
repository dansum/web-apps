// Two trams that run along the real tram tracks from OpenStreetMap and stop at the real stops.
// Shared by the three styles of the walk.
import * as THREE from './three.module.min.js';

const SEC = 8.6, GAP = 0.45, W = 2.4, H = 3.1, FLOOR = 0.38, CRUISE = 8.5;

// ---------------------------------------------------------------- track chains
function buildChains(lines) {
  const ways = lines.map((l) => ({ pts: l.pts, a: l.keys[0], b: l.keys[l.keys.length - 1] })).filter((w) => w.pts.length > 1);
  const dir = (p, q) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / L, (q[1] - p[1]) / L]; };
  const chains = [];
  for (const start of ways) {
    let pts = start.pts.slice(), end = start.b;
    const used = new Set([start]);
    for (let guard = 0; guard < 40; guard++) {
      const d0 = dir(pts[pts.length - 2], pts[pts.length - 1]);
      let best = null;
      for (const w of ways) {
        if (used.has(w)) continue;
        let cand = null;
        if (w.a === end) cand = w.pts; else if (w.b === end) cand = w.pts.slice().reverse();
        if (!cand) continue;
        const d1 = dir(cand[0], cand[1]), turn = d0[0] * d1[0] + d0[1] * d1[1];
        if (turn > 0.7 && (!best || turn > best.turn)) best = { w, cand, turn };
      }
      if (!best) break;
      used.add(best.w);
      pts = pts.concat(best.cand.slice(1));
      end = best.cand === best.w.pts ? best.w.b : best.w.a;
    }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    chains.push({ pts, cum, len: cum[cum.length - 1] });
  }
  return chains.sort((a, b) => b.len - a.len);
}
function at(ch, s) {
  s = Math.max(0, Math.min(ch.len, s));
  let lo = 0, hi = ch.cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ch.cum[m] <= s) lo = m; else hi = m; }
  const a = ch.pts[lo], b = ch.pts[hi], t = (s - ch.cum[lo]) / ((ch.cum[hi] - ch.cum[lo]) || 1);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function project(ch, p) {
  let best = null;
  for (let i = 0; i < ch.pts.length - 1; i++) {
    const a = ch.pts[i], b = ch.pts[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L2));
    const d = Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
    if (!best || d < best.d) best = { d, s: ch.cum[i] + Math.sqrt(L2) * t };
  }
  return best;
}

// ---------------------------------------------------------------- the tram itself
function roundedBox(w, h, d, r) {
  const g = new THREE.BoxGeometry(w, h, d, 6, 6, 10);
  const p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3(), lim = new THREE.Vector3(w / 2 - r, h / 2 - r, d / 2 - r);
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.copy(v).clamp(lim.clone().negate(), lim);
    const off = v.clone().sub(c);
    if (off.lengthSq() > 1e-8) v.copy(c).add(off.normalize().multiplyScalar(r));
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
// cream-yellow above, red below, a band of windows and a door
function sideTex() {
  return canvasTex(512, 192, (g, w, h) => {
    g.fillStyle = '#f2d34a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8282b'; g.fillRect(0, h * 0.68, w, h * 0.32);
    g.fillStyle = '#f6f0dc'; g.fillRect(0, h * 0.64, w, h * 0.04);
    g.fillStyle = '#5a5f66'; g.fillRect(0, 0, w, h * 0.07);
    for (let x = 14; x < w - 40; x += 62) {
      g.fillStyle = '#1d2a36'; g.fillRect(x, h * 0.16, 52, h * 0.38);
      g.fillStyle = 'rgba(160,200,230,.35)'; g.fillRect(x + 4, h * 0.18, 18, h * 0.32);
    }
    g.fillStyle = '#2a2f36'; g.fillRect(w - 44, h * 0.14, 34, h * 0.84);
    g.fillStyle = '#1d2a36'; g.fillRect(w - 40, h * 0.18, 12, h * 0.36); g.fillRect(w - 24, h * 0.18, 12, h * 0.36);
  });
}
function frontTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f2d34a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8282b'; g.fillRect(0, h * 0.66, w, h * 0.34);
    g.fillStyle = '#1d2a36'; g.fillRect(w * 0.08, h * 0.12, w * 0.84, h * 0.46);
    g.fillStyle = 'rgba(160,200,230,.3)'; g.fillRect(w * 0.12, h * 0.16, w * 0.3, h * 0.36);
    g.fillStyle = '#111'; g.fillRect(w * 0.2, h * 0.03, w * 0.6, h * 0.08);
    g.fillStyle = '#ffb02e'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.fillText('ЦЕНТЪР', w / 2, h * 0.095);
    g.fillStyle = '#fff6d0';
    g.beginPath(); g.arc(w * 0.2, h * 0.78, 13, 0, 7); g.arc(w * 0.8, h * 0.78, 13, 0, 7); g.fill();
  });
}

function makeTram(mats) {
  const group = new THREE.Group();
  const body = roundedBox(W, H - FLOOR, SEC, 0.45);
  const secs = [];
  for (let i = 0; i < 3; i++) {
    // groups of BoxGeometry: +x, -x, +y, -y, +z, -z
    const m = [mats.side, mats.side, mats.roof, mats.under, i === 0 ? mats.front : mats.joint, i === 2 ? mats.front : mats.joint];
    const mesh = new THREE.Mesh(body, m);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const holder = new THREE.Group();
    mesh.position.y = FLOOR + (H - FLOOR) / 2;
    holder.add(mesh);
    if (i === 1) {
      // pantograph
      const pg = new THREE.Group();
      const bar = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6);
      const a = new THREE.Mesh(bar, mats.metal); a.position.set(0, H + 0.55, -0.35); a.rotation.x = 0.75; pg.add(a);
      const b = new THREE.Mesh(bar, mats.metal); b.position.set(0, H + 0.55, 0.35); b.rotation.x = -0.75; pg.add(b);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 6), mats.metal); top.rotation.z = Math.PI / 2; top.position.y = H + 1.05; pg.add(top);
      holder.add(pg);
    }
    // wheels and bogies under the floor
    const bogie = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, W - 0.4, 12), mats.under);
    bogie.rotation.z = Math.PI / 2; bogie.position.set(0, 0.36, 0); holder.add(bogie);
    group.add(holder);
    secs.push(holder);
  }
  return { group, secs };
}

export function createTrams(world, { onBell } = {}) {
  const chains = buildChains(world.tramLines || []);
  const group = new THREE.Group();
  const list = [];
  if (!chains.length) return { group, update() {}, push: (x, z) => [x, z], nearest: () => null };
  const picked = [chains[0]];
  const mid = (ch) => at(ch, ch.len / 2);
  for (const ch of chains.slice(1)) {
    if (picked.length >= 2) break;
    const m = mid(ch);
    if (picked.every((p) => Math.hypot(...[0, 1].map((k) => mid(p)[k] - m[k])) > 40 && ch.len > 150)) picked.push(ch);
  }
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const mats = { side: lam({ map: sideTex() }), front: lam({ map: frontTex() }), roof: lam({ color: 0x9aa0a6 }), under: lam({ color: 0x2a2c30 }), joint: lam({ color: 0x1e2024 }), metal: lam({ color: 0x3a3d42 }) };
  picked.forEach((ch, i) => {
    const t = makeTram(mats);
    group.add(t.group);
    const stops = (world.tramStops || []).map((p) => project(ch, p)).filter((q) => q && q.d < 12).map((q) => q.s).sort((a, b) => a - b);
    list.push({ ch, ...t, s: ch.len * (0.25 + 0.4 * i), v: CRUISE * 0.6, dwell: 0, stops, lastStop: -1e9, segs: [] });
  });

  const tmp = new THREE.Vector3();
  function place(tr) {
    tr.segs.length = 0;
    tr.secs.forEach((holder, i) => {
      const sc = tr.s - i * (SEC + GAP);
      const a = at(tr.ch, sc - SEC / 2), b = at(tr.ch, sc + SEC / 2);
      holder.position.set((a[0] + b[0]) / 2, 0.02, (a[1] + b[1]) / 2);
      holder.rotation.y = Math.atan2(b[0] - a[0], b[1] - a[1]);
      tr.segs.push([a, b]);
    });
  }
  list.forEach(place);

  return {
    group,
    list, // for checks: each tram's line, place on it (s) and speed
    update(dt) {
      for (const tr of list) {
        if (tr.dwell > 0) {
          tr.dwell -= dt;
          if (tr.dwell <= 0 && onBell) onBell(tr.secs[0].position);
        } else {
          // the next stop ahead, if any
          const next = tr.stops.find((s) => s > tr.s + 0.5 && s - tr.lastStop > 30);
          const toStop = next != null ? next - tr.s : Infinity;
          const brake = (tr.v * tr.v) / (2 * 1.1);
          if (toStop < 0.6) { tr.v = 0; tr.dwell = 12; tr.lastStop = next; }
          else if (toStop <= brake + 1) tr.v = Math.max(0.8, tr.v - 1.1 * dt);
          else tr.v = Math.min(CRUISE, tr.v + 0.9 * dt);
          tr.s += tr.v * dt;
          // off the end of the line (far beyond the walking area): start again at the other end
          if (tr.s - 2 * (SEC + GAP) > tr.ch.len) { tr.s = 0; tr.lastStop = -1e9; }
        }
        place(tr);
      }
    },
    // keeps the walker out of the trams
    push(x, z, r = 0.35) {
      for (const tr of list) for (const [a, b] of tr.segs) {
        const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz || 1;
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
        const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz), R = W / 2 + r;
        if (d < R && d > 1e-6) { x = px + (x - px) * R / d; z = pz + (z - pz) * R / d; }
      }
      return [x, z];
    },
    // distance to the nearest tram and its speed (for the sound)
    nearest(x, z) {
      let best = null;
      for (const tr of list) {
        tmp.copy(tr.secs[1].position);
        const d = Math.hypot(tmp.x - x, tmp.z - z);
        if (!best || d < best.d) best = { d, v: tr.v };
      }
      return best;
    },
  };
}
