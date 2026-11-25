// Address labels that float in front of the buildings around you while you walk.
// Shared by the three styles of the walk. Turned on and off with N or in the settings.
import * as THREE from './three.module.min.js';

const KEY = 'serdika20-addresses';

export function createLabels(world, container, { maxDist = 55, max = 14 } = {}) {
  const spots = world.labelSpots || [];
  const els = [];
  let shown = [];
  let timer = 0;
  let on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
  const v = new THREE.Vector3();

  // the point of a ring nearest to (x, z), with the outward normal of that wall
  function nearest(ring, x, z) {
    let best = null;
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
      if (L2 < 0.01) continue;
      const t = Math.max(0.1, Math.min(0.9, ((x - a[0]) * dx + (z - a[1]) * dz) / L2));
      const px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) { const L = Math.sqrt(L2); best = { d, x: px, z: pz, nx: dz / L, nz: -dx / L }; }
    }
    return best;
  }
  // is the wall seen from where you stand, or is another building in the way?
  function seen(px, pz, qx, qz) {
    const L = Math.hypot(qx - px, qz - pz), n = Math.floor((L - 1) / 1.5);
    for (let k = 1; k <= n; k++) {
      const t = (k * 1.5) / L;
      if (world.insideBuilding(px + (qx - px) * t, pz + (qz - pz) * t)) return false;
    }
    return true;
  }
  function pick(player) {
    const out = [];
    for (const s of spots) {
      const [x0, z0, x1, z1] = s.bb;
      if (player.x < x0 - maxDist || player.x > x1 + maxDist || player.z < z0 - maxDist || player.z > z1 + maxDist) continue;
      const p = nearest(s.ring, player.x, player.z);
      if (!p || p.d > maxDist) continue;
      // only walls that face you
      if ((player.x - p.x) * p.nx + (player.z - p.z) * p.nz < 0) continue;
      const ax = p.x + p.nx * 0.7, az = p.z + p.nz * 0.7;
      if (!seen(player.x, player.z, ax, az)) continue;
      out.push({ s, x: ax, z: az, y: Math.min(5, Math.max(2.8, s.H * 0.45)), d: p.d });
    }
    out.sort((a, b) => a.d - b.d);
    return out.slice(0, max);
  }
  function el(i) {
    while (els.length <= i) {
      const e = document.createElement('div');
      e.className = 'addr-label';
      e.innerHTML = '<span class="a"></span><span class="n"></span>';
      e.hidden = true;
      container.appendChild(e);
      els.push(e);
    }
    return els[i];
  }
  function hideAll() { for (const e of els) e.hidden = true; }

  return {
    get on() { return on; },
    set(value) {
      on = !!value;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ }
      if (!on) hideAll();
      timer = 0;
    },
    update(player, camera, dt) {
      if (!on) return;
      timer -= dt;
      if (timer <= 0) { timer = 0.3; shown = pick(player); }
      const W = container.clientWidth, H = container.clientHeight;
      shown.forEach((l, i) => {
        const e = el(i);
        v.set(l.x, l.y, l.z).project(camera);
        const d = Math.hypot(player.x - l.x, player.z - l.z);
        if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) { e.hidden = true; return; }
        if (e.dataset.id !== String(l.s.id)) {
          e.dataset.id = l.s.id;
          e.querySelector('.a').textContent = l.s.addr || l.s.name;
          e.querySelector('.n').textContent = l.s.addr && l.s.name ? l.s.name : '';
        }
        const k = Math.max(0.65, Math.min(1, 1.15 - d / 70));
        e.style.transform = `translate(${((v.x + 1) / 2) * W}px, ${((1 - v.y) / 2) * H}px) translate(-50%, -100%) scale(${k.toFixed(3)})`;
        e.style.opacity = String(Math.max(0, Math.min(1, (maxDist - d) / 12)));
        e.hidden = false;
      });
      for (let i = shown.length; i < els.length; i++) els[i].hidden = true;
    },
  };
}
