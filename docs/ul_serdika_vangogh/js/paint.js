// Everything is painted with brush strokes on <canvas>, in the manner of Vincent van Gogh
// (Arles and Saint-Rémy period: chrome yellow, ultramarine, cobalt, viridian, vermilion).
// Facade textures stay light, so a per-building colour can tint the plaster.
import * as THREE from '../../ul_serdika/js/three.module.min.js';

let seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);
const pick = (a) => a[Math.floor(rnd() * a.length) % a.length];

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { repeat = true, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// colour with a little random variation in lightness and hue
function jit(hex, amt = 0.08) {
  const c = new THREE.Color(hex);
  const hsl = {}; c.getHSL(hsl);
  c.setHSL((hsl.h + R(-0.015, 0.015) + 1) % 1, Math.min(1, Math.max(0, hsl.s + R(-amt, amt))), Math.min(1, Math.max(0, hsl.l + R(-amt, amt))));
  return '#' + c.getHexString();
}

function curve(g, x0, y0, cx, cy, x1, y1, nx, ny, off) {
  g.beginPath();
  g.moveTo(x0 + nx * off, y0 + ny * off);
  g.quadraticCurveTo(cx + nx * off, cy + ny * off, x1 + nx * off, y1 + ny * off);
  g.stroke();
}

// One loaded brush stroke: body, bristle marks, a light ridge and a shadowed ridge (impasto).
// W/H: tile size, so strokes that cross the border are repeated on the other side (seamless tiling).
export function stroke(g, x, y, len, wid, ang, color, { bend = 0, W = 0, H = 0, ridge = 1 } = {}) {
  const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2, nx = -Math.sin(ang), ny = Math.cos(ang);
  const one = (ox, oy) => {
    const x0 = x + ox - dx, y0 = y + oy - dy, x1 = x + ox + dx, y1 = y + oy + dy;
    const cx = x + ox + nx * bend * len, cy = y + oy + ny * bend * len;
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = color; g.lineWidth = wid; curve(g, x0, y0, cx, cy, x1, y1, nx, ny, 0);
    // bristles
    g.lineWidth = Math.max(1, wid * 0.1);
    for (let k = 0; k < 4; k++) {
      g.strokeStyle = k % 2 ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.13)';
      curve(g, x0, y0, cx, cy, x1, y1, nx, ny, (k / 3 - 0.5) * wid * 0.7);
    }
    if (ridge) {
      g.lineWidth = Math.max(1, wid * 0.16);
      g.strokeStyle = `rgba(255,255,255,${0.22 * ridge})`; curve(g, x0, y0, cx, cy, x1, y1, nx, ny, -wid * 0.34);
      g.strokeStyle = `rgba(0,0,0,${0.2 * ridge})`; curve(g, x0, y0, cx, cy, x1, y1, nx, ny, wid * 0.36);
    }
  };
  one(0, 0);
  if (W) {
    const m = len + wid;
    for (const ox of [-W, 0, W]) for (const oy of [-H, 0, H]) {
      if (!ox && !oy) continue;
      if (x + ox > -m && x + ox < W + m && y + oy > -m && y + oy < H + m) one(ox, oy);
    }
  }
}

// Covers a rectangle with strokes. angle may be a number or a function (x, y) → angle.
function fill(g, x0, y0, w, h, colors, { len = 40, wid = 14, angle = 0, spread = 0.35, density = 1.5, bend = 0.12, W = 0, H = 0, ridge = 1, jitter = 0.07 } = {}) {
  const n = Math.ceil(density * w * h / (len * wid));
  for (let i = 0; i < n; i++) {
    const x = x0 + rnd() * w, y = y0 + rnd() * h;
    const a = (typeof angle === 'function' ? angle(x, y) : angle) + R(-spread, spread);
    stroke(g, x, y, len * R(0.7, 1.25), wid * R(0.75, 1.2), a, jit(pick(colors), jitter), { bend: R(-bend, bend), W, H, ridge });
  }
}

// wobbly outline, as if drawn with a loaded brush
function wobblyRect(g, x, y, w, h, color, lw) {
  g.strokeStyle = color; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
  const pts = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  g.beginPath();
  for (let i = 0; i <= 4; i++) {
    const [px, py] = pts[i % 4], [qx, qy] = pts[(i + 1) % 4];
    if (i === 0) g.moveTo(px + R(-2, 2), py + R(-2, 2));
    if (i < 4) g.quadraticCurveTo((px + qx) / 2 + R(-4, 4), (py + qy) / 2 + R(-4, 4), qx + R(-2, 2), qy + R(-2, 2));
  }
  g.stroke();
}

function clipRect(g, x, y, w, h, fn) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }

// ---------------------------------------------------------------- palettes
const PLASTER_LIGHT = ['#fbf4de', '#f6ecd0', '#fff6cf', '#eef1fa', '#f5ead9', '#fdf1c2', '#f1f4e4', '#f6e6e0'];
const GLASS = ['#1d3461', '#24476b', '#2f5d6e', '#1b2b4f', '#3a5f8a', '#284e7a', '#173a52'];
const SHUTTER = [['#3f7f5a', '#4f9a6a', '#2f6b4a'], ['#2e6b8f', '#3f86b0', '#24597a'], ['#5f8a3a', '#7aa04a', '#4a7a2e']];
const OUTLINE = '#1f2f6b';
const LIT = ['#ffd45a', '#ffb840', '#ffe68a', '#ff9f3a', '#fff0a8'];

// ---------------------------------------------------------------- facades (4 bays × 4 floors per tile)
function facade(kind) {
  const S = 1024, Bw = S / 4;
  const [c, g] = canvas(S);
  const [cn, gn] = canvas(S);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, S, S);
  const wrap = { W: S, H: S };
  if (kind === 'brick') {
    g.fillStyle = '#c86a43'; g.fillRect(0, 0, S, S);
    fill(g, 0, 0, S, S, ['#c9653d', '#d9784a', '#b3502f', '#e08a55', '#a8462c', '#d07040'], { len: 34, wid: 13, angle: 0, spread: 0.15, density: 1.8, ...wrap });
  } else if (kind === 'glass') {
    g.fillStyle = '#4f78a8'; g.fillRect(0, 0, S, S);
    fill(g, 0, 0, S, S, ['#4f7fb0', '#6a9cc9', '#3d6597', '#8ab8d9', '#2f5385', '#a9cde3'], { len: 60, wid: 18, angle: -0.9, spread: 0.3, density: 1.6, ...wrap });
  } else {
    g.fillStyle = '#f6eed6'; g.fillRect(0, 0, S, S);
    fill(g, 0, 0, S, S, PLASTER_LIGHT, { len: 46, wid: 18, angle: (x, y) => Math.PI / 2 + Math.sin(x * 0.02 + y * 0.013) * 0.6, spread: 0.4, density: 1.7, jitter: 0.05, ...wrap });
  }
  for (let fy = 0; fy < 4; fy++) {
    // painted cornice / floor band
    const y0 = fy * Bw + Bw - 14;
    if (kind !== 'glass') fill(g, 0, y0, S, 10, kind === 'brick' ? ['#f1e3c6', '#e8d4b0'] : ['#e9dcc0', '#dcd0e8', '#f8f0dc'], { len: 50, wid: 9, angle: 0, spread: 0.06, density: 2.2, W: S, H: 0, ridge: 0.6 });
    for (let bx = 0; bx < 4; bx++) {
      let w = Bw * (kind === 'panel' ? 0.46 : 0.36) * R(0.92, 1.08), h = Bw * (kind === 'panel' ? 0.46 : 0.56) * R(0.94, 1.06);
      if (kind === 'glass') { w = Bw * 0.82; h = Bw * 0.78; }
      const x = bx * Bw + (Bw - w) / 2 + R(-7, 7), y = fy * Bw + Bw * 0.18 + R(-6, 6);
      if (kind === 'glass') {
        wobblyRect(g, x, y, w, h, '#e7eef5', 7);
        if (rnd() < 0.4) clipRect(gn, x, y, w, h, () => fill(gn, x, y, w, h, LIT, { len: 30, wid: 12, angle: Math.PI / 2, density: 2.5, ridge: 0 }));
        continue;
      }
      // shutters
      if (kind === 'classic' && rnd() < 0.62) {
        const sc = pick(SHUTTER);
        for (const sx of [x - w * 0.46, x + w * 1.04]) {
          clipRect(g, sx, y, w * 0.42, h, () => fill(g, sx, y, w * 0.42, h, sc, { len: 22, wid: 9, angle: Math.PI / 2, spread: 0.15, density: 2.4, ridge: 0.7 }));
          wobblyRect(g, sx, y, w * 0.42, h, OUTLINE, 3);
        }
      }
      // glass: dark, cool, with a stroke of reflected sky
      clipRect(g, x, y, w, h, () => {
        fill(g, x, y, w, h, GLASS, { len: 26, wid: 11, angle: Math.PI / 2, spread: 0.25, density: 2.4, ridge: 0.5 });
        for (let k = 0; k < 2; k++) stroke(g, x + R(0.2, 0.8) * w, y + R(0.2, 0.6) * h, h * 0.45, 7, -1.1 + R(-0.2, 0.2), jit('#9cc3e0', 0.1), { ridge: 0 });
        if (rnd() < 0.4) fill(g, x, y, w * 0.25, h, ['#f0e2c0', '#e9d2a8'], { len: 24, wid: 8, angle: Math.PI / 2, density: 1.8, ridge: 0.4 }); // curtain
      });
      // frame and glazing bars
      g.strokeStyle = jit('#f5ecd0', 0.04); g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x + w / 2 + R(-2, 2), y + 2); g.lineTo(x + w / 2 + R(-2, 2), y + h - 2); g.stroke();
      g.beginPath(); g.moveTo(x + 2, y + h * 0.34 + R(-2, 2)); g.lineTo(x + w - 2, y + h * 0.34 + R(-2, 2)); g.stroke();
      wobblyRect(g, x, y, w, h, OUTLINE, 5);
      // sill
      stroke(g, x + w / 2, y + h + 7, w * 1.25, 9, R(-0.04, 0.04), jit('#f8f0dc', 0.05), { ridge: 0.8 });
      if ((kind === 'panel' || (bx === 1 && rnd() < 0.4))) {
        // balcony railing as quick dark strokes
        g.strokeStyle = OUTLINE; g.lineWidth = 3;
        g.beginPath(); g.moveTo(x - w * 0.3, y + h * 0.6); g.lineTo(x + w * 1.3, y + h * 0.6 + R(-3, 3)); g.stroke();
        for (let k = x - w * 0.3; k < x + w * 1.3; k += 9) { g.beginPath(); g.moveTo(k, y + h * 0.6); g.lineTo(k + R(-2, 2), y + h); g.stroke(); }
      }
      // night: some windows lit, painted in warm yellow
      if (rnd() < 0.42) clipRect(gn, x, y, w, h, () => {
        fill(gn, x, y, w, h, LIT, { len: 22, wid: 10, angle: Math.PI / 2, density: 2.6, ridge: 0 });
        gn.fillStyle = 'rgba(0,0,0,.7)'; gn.fillRect(x + w / 2 - 3, y, 6, h); gn.fillRect(x, y + h * 0.34 - 3, w, 6);
      });
    }
  }
  return [c, cn];
}

// ground floor: two shop fronts (2 × 4.5 m) or a plain base with small barred windows
function groundShop() {
  const W = 1024, H = 512, Bw = W / 2;
  const [c, g] = canvas(W, H), [cn, gn] = canvas(W, H);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, W, H);
  g.fillStyle = '#f6eed6'; g.fillRect(0, 0, W, H);
  fill(g, 0, 0, W, H, PLASTER_LIGHT, { len: 46, wid: 18, angle: Math.PI / 2, density: 1.6, W, H });
  for (let b = 0; b < 2; b++) {
    const x = b * Bw + 34, w = Bw - 68, y = H * 0.28, h = H * 0.68;
    // sign band
    clipRect(g, x - 10, H * 0.07, w + 20, H * 0.15, () => fill(g, x - 10, H * 0.07, w + 20, H * 0.15, ['#e7dcc4', '#d9cbe0', '#efe3c8'], { len: 50, wid: 14, angle: 0, density: 2 }));
    // shop window: warm interior seen from the street
    clipRect(g, x, y, w, h, () => {
      fill(g, x, y, w, h, ['#2a3d5c', '#3b4f6b', '#5a4a3a', '#7a5a2e', '#1f2f4f', '#a8783a'], { len: 30, wid: 14, angle: Math.PI / 2, spread: 0.4, density: 2.2 });
      for (let k = 0; k < 6; k++) stroke(g, x + rnd() * w, y + R(0.4, 0.9) * h, 26, 12, R(0, 3), jit(pick(['#e9b44a', '#c94a3a', '#4a8a5a', '#e7d27a']), 0.1));
      stroke(g, x + w * 0.3, y + h * 0.3, h * 0.6, 8, -1.2, jit('#a9c9e0', 0.08), { ridge: 0 });
    });
    clipRect(gn, x, y, w, h, () => fill(gn, x, y, w, h, LIT, { len: 30, wid: 14, angle: Math.PI / 2, density: 2.5, ridge: 0 }));
    const dx = b === 0 ? x + w - 128 : x + 18;
    clipRect(g, dx, y + 10, 110, h - 10, () => fill(g, dx, y + 10, 110, h - 10, ['#5a3a22', '#6b4a2e', '#4a2f1e', '#3f5a3a'], { len: 30, wid: 12, angle: Math.PI / 2, density: 2.4 }));
    wobblyRect(g, dx, y + 10, 110, h - 10, OUTLINE, 5);
    g.strokeStyle = jit('#e8dcc0', 0.04); g.lineWidth = 8; g.beginPath(); g.moveTo(x + w / 3, y); g.lineTo(x + w / 3 + R(-3, 3), y + h); g.stroke();
    wobblyRect(g, x, y, w, h, OUTLINE, 6);
  }
  return [c, cn];
}
function groundPlain() {
  const W = 1024, H = 512, Bw = W / 2;
  const [c, g] = canvas(W, H), [cn, gn] = canvas(W, H);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, W, H);
  g.fillStyle = '#efe6d2'; g.fillRect(0, 0, W, H);
  fill(g, 0, 0, W, H, ['#efe6d2', '#e3dcef', '#f4e8c8', '#dfe3ea', '#efdcc8'], { len: 40, wid: 18, angle: 0, spread: 0.2, density: 1.7, W, H });
  // stone base
  fill(g, 0, H * 0.82, W, H * 0.18, ['#9a93b8', '#8a8aa8', '#a9a0c0', '#7f86a8'], { len: 40, wid: 14, angle: 0, density: 2.2, W, H: 0 });
  for (let b = 0; b < 2; b++) {
    const w = Bw * 0.3, h = H * 0.38, x = b * Bw + (Bw - w) / 2 + R(-6, 6), y = H * 0.22;
    clipRect(g, x, y, w, h, () => fill(g, x, y, w, h, GLASS, { len: 24, wid: 10, angle: Math.PI / 2, density: 2.4 }));
    g.strokeStyle = OUTLINE; g.lineWidth = 4;
    for (let k = 0; k <= 5; k++) { g.beginPath(); g.moveTo(x + k * w / 5, y); g.lineTo(x + k * w / 5 + R(-2, 2), y + h); g.stroke(); }
    wobblyRect(g, x, y, w, h, OUTLINE, 5);
    if (rnd() < 0.35) clipRect(gn, x, y, w, h, () => fill(gn, x, y, w, h, LIT, { len: 20, wid: 9, angle: Math.PI / 2, density: 2.5, ridge: 0 }));
  }
  return [c, cn];
}

// ---------------------------------------------------------------- ground and roofs (world-space UVs)
function cobbles(colors, gap) {
  // like the street in "Café Terrace at Night": uneven dabs of violet, blue, orange and ochre
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = gap; g.fillRect(0, 0, S, S);
  const n = 13, cs = S / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const px = x * cs + (y % 2) * cs / 2 + R(-5, 5), py = y * cs + cs / 2 + R(-5, 5);
    const col = jit(pick(colors), 0.12), rx = cs * R(0.36, 0.5), ry = cs * R(0.28, 0.42), a = R(-0.6, 0.6);
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      if (px + ox < -cs || px + ox > S + cs || py + oy < -cs || py + oy > S + cs) continue;
      g.fillStyle = col;
      g.beginPath(); g.ellipse(px + ox, py + oy, rx, ry, a, 0, Math.PI * 2); g.fill();
      stroke(g, px + ox - 3, py + oy - 4, rx * 1.1, ry * 0.7, a + R(-0.3, 0.3), jit(col, 0.14), { ridge: 1.3 });
      if (rnd() < 0.5) stroke(g, px + ox + 4, py + oy + 3, rx * 0.8, ry * 0.4, a + R(-0.5, 0.5), jit(pick(colors), 0.1), { ridge: 0.6 });
    }
  }
  return c;
}
function strokesTile(base, colors, opts, S = 512) {
  const [c, g] = canvas(S);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  fill(g, 0, 0, S, S, colors, { W: S, H: S, ...opts });
  return c;
}
function paving() {
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#9b8fb0'; g.fillRect(0, 0, S, S);
  const n = 8, cs = S / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const base = pick(['#dcc690', '#e6d3a4', '#cfb17c', '#d8c6b0', '#e2c6a4', '#c9bcd6', '#e8d9a8']);
    clipRect(g, x * cs + 3, y * cs + 3, cs - 6, cs - 6, () => fill(g, x * cs, y * cs, cs, cs, [base, jit(base, 0.08)], { len: 30, wid: 13, angle: (x + y) % 2 ? 0 : Math.PI / 2, spread: 0.3, density: 2 }));
  }
  return c;
}
function leaves() {
  // light strokes on a transparent ground; the tree colour tints them, the gaps give a brushy outline
  const S = 512; const [c, g] = canvas(S);
  g.clearRect(0, 0, S, S);
  fill(g, 0, 0, S, S, ['#b8c9a0', '#a9bf98', '#c3c9a8'], { len: 34, wid: 13, angle: (x, y) => Math.atan2(y - S / 2, x - S / 2) + Math.PI / 2, spread: 0.5, density: 0.9, W: S, H: S, bend: 0.3 });
  fill(g, 0, 0, S, S, ['#f4f7e0', '#e6f0c8', '#fff7c8', '#dfeee8', '#cfe3c0', '#fffbe8', '#e8f4ff'], { len: 30, wid: 11, angle: (x, y) => Math.atan2(y - S / 2, x - S / 2) + Math.PI / 2, spread: 0.6, density: 1.1, W: S, H: S, bend: 0.35 });
  return c;
}
function door() {
  const [c, g] = canvas(128, 256);
  fill(g, 0, 0, 128, 256, ['#3f6f8f', '#2e5a7a', '#4f86a0', '#3a6a5a'], { len: 40, wid: 14, angle: Math.PI / 2, density: 2.2 });
  wobblyRect(g, 8, 8, 52, 240, OUTLINE, 5); wobblyRect(g, 68, 8, 52, 240, OUTLINE, 5);
  clipRect(g, 16, 22, 36, 100, () => fill(g, 16, 22, 36, 100, GLASS, { len: 20, wid: 8, angle: Math.PI / 2, density: 2.5 }));
  clipRect(g, 76, 22, 36, 100, () => fill(g, 76, 22, 36, 100, GLASS, { len: 20, wid: 8, angle: Math.PI / 2, density: 2.5 }));
  stroke(g, 60, 160, 20, 8, Math.PI / 2, '#e8b830'); stroke(g, 70, 160, 20, 8, Math.PI / 2, '#e8b830');
  return c;
}
function awning() {
  // the yellow terrace awning of the café
  const [c, g] = canvas(512, 256);
  g.fillStyle = '#f2b72e'; g.fillRect(0, 0, 512, 256);
  fill(g, 0, 0, 512, 256, ['#f5c33a', '#f2a72a', '#ffd862', '#e8952a', '#f7cf4a'], { len: 60, wid: 18, angle: Math.PI / 2, spread: 0.25, density: 2, W: 512, H: 256 });
  // scalloped edge with a dark line
  g.strokeStyle = '#c8682a'; g.lineWidth = 8;
  for (let x = 0; x < 512; x += 64) { g.beginPath(); g.arc(x + 32, 230, 32, 0, Math.PI); g.stroke(); }
  return c;
}
function halo() {
  // concentric rings of strokes, like the lamps and stars of the Arles paintings
  const S = 256; const [c, g] = canvas(S);
  g.clearRect(0, 0, S, S);
  for (let r = 118; r > 6; r -= 9) {
    const a = 0.05 + 0.6 * Math.pow(1 - r / 118, 2);
    const col = r < 30 ? '#fffbe0' : r < 60 ? '#ffe27a' : r < 90 ? '#ffc04a' : '#ffd890';
    for (let k = 0; k < 18; k++) {
      const t0 = rnd() * Math.PI * 2, t1 = t0 + R(0.3, 0.9);
      g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = R(4, 8); g.lineCap = 'round';
      g.beginPath(); g.arc(S / 2, S / 2, r + R(-2, 2), t0, t1); g.stroke();
    }
  }
  g.globalAlpha = 1;
  return c;
}

function pool() {
  const S = 256; const [c, g] = canvas(S);
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,214,110,0.95)'); gr.addColorStop(0.45, 'rgba(255,190,80,0.45)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 120; i++) stroke(g, R(0, S), R(0, S), 30, 10, R(0, 3), 'rgba(0,0,0,0.25)', { ridge: 0 });
  return c;
}

export function makeTextures(maxAniso = 8) {
  seed = 20250;
  const o = { aniso: maxAniso };
  const two = (fn) => { const [d, n] = fn(); return { day: tex(d, o), night: tex(n, o) }; };
  return {
    facade: { classic: two(() => facade('classic')), panel: two(() => facade('panel')), glass: two(() => facade('glass')), brick: two(() => facade('brick')) },
    ground: { shop: two(groundShop), plain: two(groundPlain) },
    asphalt: tex(strokesTile('#5b5f86', ['#5a5f8c', '#6c6e98', '#4e5680', '#7a7aa6', '#6b7a9e', '#8a86a8', '#4a5a7a'], { len: 60, wid: 20, angle: 0, spread: 0.25, density: 1.6 }), o),
    sett: tex(cobbles(['#6b6fa8', '#8a7fb5', '#5f86b0', '#c99a5b', '#d9b06a', '#7c7aa0', '#a58f6c', '#e0a35a'], '#2c2f4a'), o),
    settYellow: tex(cobbles(['#e0b04a', '#f2c45a', '#d9a03a', '#c9a060', '#e8c070'], '#5a4a2a'), o),
    paving: tex(paving(), o),
    pavers: tex(strokesTile('#d0a888', ['#e0b890', '#d49a78', '#e8c8a0', '#c9a0b0', '#dcb08a'], { len: 32, wid: 14, angle: 0, spread: 1.6, density: 1.9 }), o),
    grass: tex(strokesTile('#4f7a3a', ['#5f8f3a', '#7aa53f', '#9cbf4a', '#3f6f3a', '#2f5e4a', '#c9c25a', '#6fa06a', '#3e7f6f'], { len: 30, wid: 8, angle: -Math.PI / 2, spread: 0.7, density: 2.2, bend: 0.3 }), o),
    dirt: tex(strokesTile('#c08a4a', ['#d09a52', '#b8783a', '#e0b06a', '#a86a3a', '#c9a070'], { len: 30, wid: 12, angle: 0, spread: 1.5, density: 1.8 }, 256), o),
    roofTiles: tex(strokesTile('#b84a2a', ['#c5552f', '#d8693a', '#a9442a', '#e0874a', '#9a3b2a', '#c96a3a'], { len: 28, wid: 13, angle: 0, spread: 0.12, density: 2.2, bend: 0.25 }), o),
    roofFlat: tex(strokesTile('#7a7aa0', ['#7a7aa0', '#8a8ab0', '#6a7090', '#9a90b0', '#6f80a0'], { len: 44, wid: 16, angle: 0.4, spread: 0.6, density: 1.7 }, 256), o),
    bark: tex(strokesTile('#4a3a2a', ['#5a3e2b', '#6b4a33', '#3e3a5a', '#7a5a3a', '#2e3a4a'], { len: 40, wid: 10, angle: Math.PI / 2, spread: 0.15, density: 2.2 }, 128), o),
    leaves: tex(leaves(), o),
    door: tex(door(), { ...o, repeat: false }),
    awning: tex(awning(), o),
    halo: tex(halo(), { ...o, repeat: false }),
    pool: tex(pool(), { ...o, repeat: false }),
  };
}

// ---------------------------------------------------------------- painted signs
// Same call shape as the realistic version's textTexture; the lettering is hand-written (Caveat).
export function textTexture(lines, { bg = '#14365f', fg = '#ffffff', font = '600 64px sans-serif', pad = 26, border = null, minW = 0, h = 0 } = {}) {
  const toHand = (f) => {
    const m = f.match(/(\d{3})?\s*(\d+)px/);
    const size = m ? parseInt(m[2], 10) : 64;
    return `700 ${Math.round(size * 1.25)}px "Caveat", "Marck Script", cursive`;
  };
  const arr = (Array.isArray(lines) ? lines : [lines]).map((l) => (typeof l === 'string' ? { t: l, f: font } : l)).map((l) => ({ t: l.t, f: toHand(l.f || font) }));
  const [, m] = canvas(8);
  let w = minW; const lh = [];
  for (const s of arr) { m.font = s.f; w = Math.max(w, m.measureText(s.t).width); lh.push(parseInt(s.f.match(/(\d+)px/)[1], 10) * 1.05); }
  const W = Math.min(2048, Math.ceil(w + pad * 2.4));
  const Hh = h || Math.ceil(lh.reduce((a, b) => a + b, 0) + pad * 1.1);
  const [c, g] = canvas(W, Hh);
  g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
  fill(g, 0, 0, W, Hh, [bg, jit(bg, 0.06), jit(bg, 0.1)], { len: Math.min(60, W / 3), wid: 14, angle: 0, spread: 0.2, density: 1.8, ridge: 0.7 });
  wobblyRect(g, 5, 5, W - 10, Hh - 10, border || OUTLINE, 7);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = (Hh - lh.reduce((a, b) => a + b, 0)) / 2;
  arr.forEach((s, i) => {
    g.font = s.f;
    g.save(); g.translate(W / 2, y + lh[i] / 2 + 2); g.rotate(R(-0.02, 0.02));
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.25)'; g.strokeText(s.t, 0, 0, W - pad);
    g.fillStyle = fg; g.fillText(s.t, 0, 0, W - pad);
    g.restore();
    y += lh[i];
  });
  const t = tex(c, { repeat: false });
  t.userData = { aspect: W / Hh };
  return t;
}

// ---------------------------------------------------------------- crooked world
// Walls lean and bow a little more the higher they go, like the houses at Auvers.
// Applied to every material in world space, so neighbouring surfaces stay joined.
export const WOBBLE_GLSL = `
vec3 vgWobble(vec3 p) {
  float h = clamp(p.y, 0.0, 80.0);
  float lean = h * 0.028;
  float f = smoothstep(0.0, 2.5, h);
  return vec3(
    sin(p.z * 0.045 + p.x * 0.013) * lean + sin(p.y * 0.33 + p.x * 0.11 + p.z * 0.05) * 0.14 * f,
    sin(p.x * 0.08 + p.z * 0.07) * 0.08 * f,
    cos(p.x * 0.05 - p.z * 0.017) * lean + sin(p.y * 0.29 + p.z * 0.12 - p.x * 0.04) * 0.14 * f);
}
`;
function patchVertex(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\n' + WOBBLE_GLSL)
    .replace('#include <project_vertex>', `
      vec4 mvPosition = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        mvPosition = instanceMatrix * mvPosition;
      #endif
      vec4 vgW = modelMatrix * mvPosition;
      vgW.xyz += vgWobble( vgW.xyz );
      mvPosition = viewMatrix * vgW;
      gl_Position = projectionMatrix * mvPosition;`)
    .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
      #if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
        worldPosition.xyz += vgWobble( worldPosition.xyz );
      #endif`);
}
const patched = new WeakSet();
export function paintify(mat) {
  if (!mat || patched.has(mat)) return mat;
  patched.add(mat);
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); patchVertex(sh); };
  mat.customProgramCacheKey = () => 'vg-wobble';
  mat.needsUpdate = true;
  return mat;
}
const depthCache = new Map();
export function depthMaterialFor(mat) {
  const key = mat.alphaTest > 0 && mat.map ? mat.map.uuid + mat.alphaTest : 'plain';
  if (!depthCache.has(key)) {
    const d = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    if (key !== 'plain') { d.map = mat.map; d.alphaTest = mat.alphaTest; }
    paintify(d);
    depthCache.set(key, d);
  }
  return depthCache.get(key);
}
