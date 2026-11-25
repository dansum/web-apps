// Rain: thin slanted streaks that fall around you. Shared by the three styles of the walk.
// amount goes smoothly from 0 to 1, so the sky, the light and the sound can follow it.
import * as THREE from './three.module.min.js';

const KEY = 'serdika20-rain';

export function createRain(scene, { count = 2600, box = 32, top = 22, color = 0xd0dceb, opacity = 0.75 } = {}) {
  const pos = new Float32Array(count * 6), speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 2 - 1) * box, y = Math.random() * top, z = (Math.random() * 2 - 1) * box;
    pos.set([x, y + 0.9, z, x, y, z], i * 6);
    speed[i] = 8 + Math.random() * 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.visible = false;
  scene.add(lines);
  let on = false, amount = 0;
  try { on = localStorage.getItem(KEY) === '1'; } catch { /* storage blocked */ }
  const wind = 0.12; // slant: metres sideways per metre of fall

  return {
    get on() { return on; },
    get amount() { return amount; },
    set(value) { on = !!value; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* ignore */ } },
    update(dt, cam) {
      amount += ((on ? 1 : 0) - amount) * Math.min(1, dt * 0.8);
      if (amount < 0.01) { lines.visible = false; return; }
      lines.visible = true;
      mat.opacity = opacity * amount;
      const n = Math.floor(count * Math.min(1, amount * 1.2));
      geo.setDrawRange(0, n * 2);
      for (let i = 0; i < n; i++) {
        const o = i * 6;
        let x = pos[o + 3], y = pos[o + 4] - speed[i] * dt, z = pos[o + 5];
        if (y < 0) { y += top; x = cam.x + (Math.random() * 2 - 1) * box; z = cam.z + (Math.random() * 2 - 1) * box; }
        if (x - cam.x > box) x -= 2 * box; else if (cam.x - x > box) x += 2 * box;
        if (z - cam.z > box) z -= 2 * box; else if (cam.z - z > box) z += 2 * box;
        // bottom of the streak, then its top (0.9 m higher, blown a little sideways)
        pos[o + 3] = x; pos[o + 4] = y; pos[o + 5] = z;
        pos[o] = x - wind * 0.9; pos[o + 1] = y + 0.9; pos[o + 2] = z;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
