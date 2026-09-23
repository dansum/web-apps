// Фонове на трите етапа: небе, планини, джунгла, земя и въздушни частици.

export const THEMES = {
  jungle: {
    skyTop: '#3aa0e0', skyBot: '#c4ecf6', sun: '#fff6c8', mount: '#86b3a8', mount2: '#5f9384',
    trees: '#2f6b3a', trees2: '#22552c', groundFar: '#86ad4a', groundNear: '#4a7a22', band: 'rgba(0,0,0,0.07)',
    path: '#c4a36a', path2: '#a88752', fog: 'rgba(215,240,230,0.55)', leaf: '#2e7d32', leaf2: '#1b5e20',
    trunk: '#7a5a38', rock: '#8a8a80', particles: 'pollen', props: ['palm', 'palm', 'fern', 'fern', 'rock'],
  },
  volcano: {
    skyTop: '#2a0c1e', skyBot: '#ff8a3d', sun: '#ffd27a', mount: '#5a2c34', mount2: '#3a1a22', volcano: true,
    trees: '#2c1a14', trees2: '#1d110d', groundFar: '#6e4a32', groundNear: '#3a2416', band: 'rgba(0,0,0,0.1)',
    path: '#8c5c3a', path2: '#6e4428', fog: 'rgba(255,130,70,0.35)', leaf: '#4a5a22', leaf2: '#2d3814',
    trunk: '#3a2a20', rock: '#4a3a36', particles: 'ash', props: ['dead', 'rock', 'rock', 'fern', 'dead'],
  },
  night: {
    skyTop: '#03061a', skyBot: '#1a2c58', moon: '#f2f0dc', stars: true, mount: '#1c2748', mount2: '#131c36',
    trees: '#0b1a1c', trees2: '#081314', groundFar: '#1e3a2a', groundNear: '#0d2016', band: 'rgba(0,0,0,0.12)',
    path: '#3a4a3a', path2: '#2a382c', fog: 'rgba(70,100,150,0.3)', leaf: '#1d4a2a', leaf2: '#12331c',
    trunk: '#3a2e24', rock: '#3c4448', particles: 'fireflies', props: ['palm', 'fern', 'fern', 'rock', 'palm'], dark: true,
  },
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const R = rng(7);
const RIDGE1 = Array.from({ length: 24 }, () => R());
const RIDGE2 = Array.from({ length: 32 }, () => R());
const CANOPY = Array.from({ length: 60 }, () => R());
const STARS = Array.from({ length: 120 }, () => [R(), R() * R(), R()]);

export function drawBackground(ctx, v, theme, t, travel) {
  const { W, H, hy } = v;
  // небе
  const g = ctx.createLinearGradient(0, 0, 0, hy);
  g.addColorStop(0, theme.skyTop);
  g.addColorStop(1, theme.skyBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, hy + 2);

  if (theme.stars) {
    for (const [x, y, b] of STARS) {
      const tw = 0.5 + 0.5 * Math.sin(t * (1 + b * 3) + x * 50);
      ctx.fillStyle = `rgba(255,255,240,${0.3 + 0.7 * tw * b})`;
      ctx.fillRect(x * W, y * hy, 1.5 + b, 1.5 + b);
    }
  }
  if (theme.sun) {
    const sx = W * 0.78, sy = hy * (theme.volcano ? 0.75 : 0.28), r = Math.min(W, H) * 0.07;
    const sg = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 3);
    sg.addColorStop(0, theme.sun);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(sx, sy, r * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.sun;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }
  if (theme.moon) {
    const mx = W * 0.2, my = hy * 0.3, r = Math.min(W, H) * 0.055;
    ctx.fillStyle = 'rgba(242,240,220,0.12)';
    ctx.beginPath(); ctx.arc(mx, my, r * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = theme.moon;
    ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(mx - r * 0.3, my - r * 0.2, r * 0.22, 0, Math.PI * 2); ctx.arc(mx + r * 0.35, my + r * 0.3, r * 0.15, 0, Math.PI * 2); ctx.fill();
  }

  const off = travel * 2;
  ridge(ctx, W, hy, RIDGE1, hy * 0.42, theme.mount, off * 0.2, 0.9);
  if (theme.volcano) drawVolcano(ctx, W, hy, t);
  ridge(ctx, W, hy, RIDGE2, hy * 0.26, theme.mount2, off * 0.45, 1.3);

  // мъгла на хоризонта
  const fg = ctx.createLinearGradient(0, hy - hy * 0.25, 0, hy);
  fg.addColorStop(0, 'rgba(0,0,0,0)');
  fg.addColorStop(1, theme.fog);
  ctx.fillStyle = fg;
  ctx.fillRect(0, hy - hy * 0.25, W, hy * 0.25);

  // линия на джунглата
  canopy(ctx, W, hy, theme.trees, H * 0.06, off * 0.8, 0);
  canopy(ctx, W, hy, theme.trees2, H * 0.035, off * 1.2, 30);

  // земя
  const gg = ctx.createLinearGradient(0, hy, 0, H);
  gg.addColorStop(0, theme.groundFar);
  gg.addColorStop(1, theme.groundNear);
  ctx.fillStyle = gg;
  ctx.fillRect(0, hy, W, H - hy);

  // ивици, които подсказват движение напред
  const spacing = 1.6;
  const start = travel % spacing;
  ctx.fillStyle = theme.band;
  for (let k = 0; k < 18; k += 2) {
    const z1 = 0.6 + k * spacing - start;
    const z2 = z1 + spacing;
    if (z1 <= 0.1) continue;
    const y1 = v.hy + v.camH * v.focal / z1;
    const y2 = v.hy + v.camH * v.focal / z2;
    ctx.fillRect(0, y2, W, Math.max(1, y1 - y2));
  }
  // пътека
  ctx.fillStyle = theme.path;
  ctx.beginPath();
  const zn = 0.7, zf = 40, pw = 0.8;
  const yN = v.hy + v.camH * v.focal / zn, yF = v.hy + v.camH * v.focal / zf;
  ctx.moveTo(W / 2 - pw * v.focal / zn, yN);
  ctx.quadraticCurveTo(W / 2 - pw * v.focal / 3, v.hy + v.camH * v.focal / 3, W / 2 - pw * v.focal / zf, yF);
  ctx.lineTo(W / 2 + pw * v.focal / zf, yF);
  ctx.quadraticCurveTo(W / 2 + pw * v.focal / 3, v.hy + v.camH * v.focal / 3, W / 2 + pw * v.focal / zn, yN);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = theme.path2;
  for (let k = 0; k < 14; k++) {
    const z = 1 + k * 1.1 - (travel % 1.1);
    if (z < 0.8) continue;
    const s = v.focal / z;
    const y = v.hy + v.camH * s;
    const x = W / 2 + Math.sin(k * 12.9 + Math.floor(travel / 1.1) * 3.7) * 0.5 * s;
    ctx.beginPath(); ctx.ellipse(x, y, 0.06 * s, 0.02 * s, 0, 0, Math.PI * 2); ctx.fill();
  }
}

function ridge(ctx, W, hy, pts, amp, col, off, freq) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, hy);
  const n = pts.length;
  const step = W / (n - 4) * freq;
  const shift = ((off % step) + step) % step;
  const base = Math.floor(off / step);
  for (let i = -1; i < n + 2; i++) {
    const x = i * step - shift;
    const h = pts[(((i + base) % n) + n) % n];
    ctx.lineTo(x, hy - amp * (0.35 + 0.65 * h));
    if (x > W + step) break;
  }
  ctx.lineTo(W, hy);
  ctx.closePath();
  ctx.fill();
}

function canopy(ctx, W, hy, col, r, off, seedOff) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, hy + 2);
  const step = r * 1.4;
  const shift = ((off % step) + step) % step;
  const base = Math.floor(off / step);
  for (let x = -step - shift, i = 0; x < W + step; x += step, i++) {
    const h = CANOPY[((i + base + seedOff) % CANOPY.length + CANOPY.length) % CANOPY.length];
    ctx.arc(x, hy - r * 0.3, r * (0.6 + h * 0.7), Math.PI, 0);
  }
  ctx.lineTo(W, hy + 2);
  ctx.closePath();
  ctx.fill();
}

function drawVolcano(ctx, W, hy, t) {
  const cx = W * 0.32, top = hy * 0.3, base = W * 0.42;
  ctx.fillStyle = '#2d1418';
  ctx.beginPath();
  ctx.moveTo(cx - base / 2, hy);
  ctx.lineTo(cx - W * 0.04, top);
  ctx.lineTo(cx + W * 0.04, top);
  ctx.lineTo(cx + base / 2, hy);
  ctx.closePath();
  ctx.fill();
  // лава
  ctx.strokeStyle = '#ff5a1f';
  ctx.lineWidth = Math.max(2, W * 0.004);
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.01, top);
  ctx.quadraticCurveTo(cx - W * 0.03, top + hy * 0.25, cx - W * 0.07, hy * 0.85);
  ctx.moveTo(cx + W * 0.02, top);
  ctx.quadraticCurveTo(cx + W * 0.05, top + hy * 0.3, cx + W * 0.04, hy * 0.9);
  ctx.stroke();
  const gl = ctx.createRadialGradient(cx, top, 0, cx, top, W * 0.12);
  gl.addColorStop(0, 'rgba(255,150,40,0.8)');
  gl.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.fillStyle = gl;
  ctx.beginPath(); ctx.arc(cx, top, W * 0.12, 0, Math.PI * 2); ctx.fill();
  // дим
  for (let i = 0; i < 7; i++) {
    const p = ((t * 0.08 + i / 7) % 1);
    const x = cx + Math.sin(p * 5 + i) * W * 0.03 + p * W * 0.08;
    const y = top - p * hy * 0.5;
    ctx.fillStyle = `rgba(60,40,45,${0.5 * (1 - p)})`;
    ctx.beginPath(); ctx.arc(x, y, W * (0.02 + p * 0.05), 0, Math.PI * 2); ctx.fill();
  }
}

// Въздушни частици — прашец, пепел, светулки
export function makeAmbient(n = 40) {
  return Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), s: Math.random(), p: Math.random() * 10 }));
}

export function drawAmbient(ctx, v, theme, parts, t, dt) {
  const { W, H } = v;
  for (const a of parts) {
    if (theme.particles === 'ash') {
      a.y += dt * (0.02 + a.s * 0.04);
      a.x += dt * 0.02 * Math.sin(t + a.p);
      if (a.y > 1) { a.y = 0; a.x = Math.random(); }
      ctx.fillStyle = a.s > 0.8 ? 'rgba(255,140,60,0.9)' : 'rgba(80,70,70,0.6)';
      ctx.fillRect(a.x * W, a.y * H, 2 + a.s * 3, 2 + a.s * 3);
    } else if (theme.particles === 'fireflies') {
      const x = (a.x + Math.sin(t * 0.3 + a.p) * 0.03) * W;
      const y = (0.35 + a.y * 0.6 + Math.cos(t * 0.4 + a.p) * 0.03) * H;
      const b = 0.5 + 0.5 * Math.sin(t * 3 + a.p * 7);
      ctx.fillStyle = `rgba(200,255,120,${b * 0.9})`;
      ctx.beginPath(); ctx.arc(x, y, 1.5 + a.s * 2, 0, Math.PI * 2); ctx.fill();
    } else {
      a.y -= dt * 0.01 * (0.5 + a.s);
      a.x += dt * 0.015 * Math.sin(t * 0.7 + a.p);
      if (a.y < 0) { a.y = 1; a.x = Math.random(); }
      ctx.fillStyle = 'rgba(255,255,220,0.55)';
      ctx.beginPath(); ctx.arc(a.x * W, a.y * H, 1 + a.s * 1.5, 0, Math.PI * 2); ctx.fill();
    }
  }
}

// Големи листа в долните ъгли — рамка като в кабина на аркада.
export function drawForeground(ctx, v, theme, t) {
  const { W, H } = v;
  const r = Math.min(W, H);
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side < 0 ? 0 : W, H);
    ctx.scale(side * -1, 1);
    for (let i = 0; i < 4; i++) {
      const sw = Math.sin(t * 0.9 + i + side) * 0.05;
      ctx.save();
      ctx.rotate(-0.25 - i * 0.28 + sw);
      ctx.fillStyle = i % 2 ? theme.leaf : theme.leaf2;
      const L = r * (0.32 - i * 0.03);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(L * 0.5, -L * 0.18, L, 0);
      ctx.quadraticCurveTo(L * 0.5, L * 0.12, 0, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
}
