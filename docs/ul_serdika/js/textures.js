// Procedural textures drawn on <canvas>. No image files are needed.
// Facade textures are mostly white/light grey so a per-building vertex colour can tint the plaster.
import * as THREE from './three.module.min.js';

let seed = 12345;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const R = (a, b) => a + rnd() * (b - a);

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
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

function noise(g, w, h, amount, alpha = 0.06, size = 1) {
  for (let i = 0; i < amount; i++) {
    const v = rnd() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${R(0.01, alpha)})`;
    g.fillRect(R(0, w), R(0, h), R(size, size * 3), R(size, size * 3));
  }
}

// ---------------------------------------------------------------- facades
// One tile = 4 bays × 4 floors. A bay is one window wide; in world space a bay is ~3.4 m and a floor ~3.2 m.
// The left-most column of pixels is plaster, so very short walls (u = 0) show bare wall.

function windowShape(g, x, y, w, h, opts, lit) {
  const { frame = '#f4f1ea', glass = ['#2c3540', '#53606c'], shutters = false, arch = false, sill = true, cornice = true, balcony = false } = opts;
  // surround / cornice moulding
  if (cornice) {
    g.fillStyle = 'rgba(0,0,0,.10)';
    g.fillRect(x - w * 0.16, y - h * 0.13, w * 1.32, h * 0.06);
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.fillRect(x - w * 0.16, y - h * 0.15, w * 1.32, h * 0.03);
  }
  // reveal shadow
  g.fillStyle = 'rgba(0,0,0,.22)';
  g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = frame;
  g.fillRect(x, y, w, h);
  // glass with sky reflection gradient
  const gx = x + w * 0.09, gy = y + h * 0.06, gw = w * 0.82, gh = h * 0.88;
  let gr;
  if (lit) {
    gr = g.createLinearGradient(gx, gy, gx, gy + gh);
    gr.addColorStop(0, '#f6d89a'); gr.addColorStop(1, '#d9a85f');
  } else {
    gr = g.createLinearGradient(gx, gy, gx + gw, gy + gh);
    gr.addColorStop(0, glass[1]); gr.addColorStop(0.55, glass[0]); gr.addColorStop(1, glass[1]);
  }
  g.fillStyle = gr;
  if (arch) {
    g.beginPath();
    g.moveTo(gx, gy + gw / 2);
    g.arc(gx + gw / 2, gy + gw / 2, gw / 2, Math.PI, 0);
    g.lineTo(gx + gw, gy + gh); g.lineTo(gx, gy + gh); g.closePath(); g.fill();
  } else g.fillRect(gx, gy, gw, gh);
  // curtains (random)
  if (!lit && rnd() < 0.45) {
    g.fillStyle = `rgba(${R(200, 240)},${R(195, 230)},${R(180, 220)},${R(0.35, 0.7)})`;
    const cw = gw * R(0.15, 0.35);
    g.fillRect(gx, gy, cw, gh); g.fillRect(gx + gw - cw, gy, cw, gh);
  }
  // mullions
  g.fillStyle = frame;
  g.fillRect(gx + gw / 2 - 2, gy, 4, gh);
  g.fillRect(gx, gy + gh * 0.32, gw, 3);
  if (shutters) {
    const open = rnd() < 0.6;
    g.fillStyle = opts.shutterColor || '#5d6b52';
    if (open) {
      g.fillRect(x - w * 0.42, y, w * 0.4, h); g.fillRect(x + w * 1.02, y, w * 0.4, h);
      g.fillStyle = 'rgba(0,0,0,.25)';
      for (let k = 0; k < h; k += 7) { g.fillRect(x - w * 0.42, y + k, w * 0.4, 2); g.fillRect(x + w * 1.02, y + k, w * 0.4, 2); }
    } else if (rnd() < 0.4) {
      // roller blind half down (very common in Sofia)
      const d = gh * R(0.2, 0.9);
      g.fillStyle = `rgb(${R(150, 200)},${R(140, 190)},${R(120, 170)})`;
      g.fillRect(gx, gy, gw, d);
      g.fillStyle = 'rgba(0,0,0,.18)';
      for (let k = 0; k < d; k += 5) g.fillRect(gx, gy + k, gw, 1);
    }
  }
  if (sill) {
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - w * 0.12, y + h + 2, w * 1.24, 6);
    g.fillStyle = '#efece4'; g.fillRect(x - w * 0.12, y + h, w * 1.24, 5);
  }
  if (balcony) {
    // a small balcony with railing
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x - w * 0.35, y + h - 4, w * 1.7, 8);
    g.fillStyle = '#e9e6de'; g.fillRect(x - w * 0.35, y + h - 6, w * 1.7, 6);
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 2;
    g.strokeRect(x - w * 0.33, y + h * 0.62, w * 1.66, h * 0.36);
    for (let k = x - w * 0.33; k < x + w * 1.33; k += 7) { g.beginPath(); g.moveTo(k, y + h * 0.62); g.lineTo(k, y + h * 0.98); g.stroke(); }
  }
}

function facadeClassic(lit) {
  const S = 1024, B = S / 4;
  const [c, g] = canvas(S);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  noise(g, S, S, 9000, 0.05, 1);
  // stains / weathering streaks
  for (let i = 0; i < 40; i++) {
    const x = R(0, S), y = R(0, S);
    const gr = g.createLinearGradient(x, y, x, y + R(40, 160));
    gr.addColorStop(0, 'rgba(60,55,45,.10)'); gr.addColorStop(1, 'rgba(60,55,45,0)');
    g.fillStyle = gr; g.fillRect(x, y, R(6, 30), 160);
  }
  for (let fy = 0; fy < 4; fy++) {
    // floor cornice / string course
    g.fillStyle = 'rgba(0,0,0,.07)'; g.fillRect(0, fy * B + B - 10, S, 6);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, fy * B + B - 13, S, 3);
    for (let bx = 0; bx < 4; bx++) {
      const w = B * 0.36, h = B * 0.58;
      const x = bx * B + (B - w) / 2, y = fy * B + B * 0.2;
      const style = { shutters: true, arch: fy === 3 && rnd() < 0.3, balcony: (bx === 1 || bx === 2) && rnd() < 0.35, shutterColor: ['#5d6b52', '#6b5a48', '#7d7a70'][fy % 3] };
      windowShape(g, x, y, w, h, style, lit && rnd() < 0.35);
      // AC unit, satellite dish: everyday Sofia detail
      if (rnd() < 0.12) { g.fillStyle = '#e8e8e4'; g.fillRect(x + w * 1.1, y + h * 0.65, w * 0.5, h * 0.25); g.fillStyle = '#999'; for (let k = 0; k < 5; k++) g.fillRect(x + w * 1.13 + k * 5, y + h * 0.69, 2, h * 0.17); }
    }
  }
  // corner pilaster at the left edge (keeps the u=0 column plain)
  g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, 14, S);
  return c;
}

function facadePanel(lit) {
  const S = 1024, B = S / 4;
  const [c, g] = canvas(S);
  g.fillStyle = '#f2f2ef'; g.fillRect(0, 0, S, S);
  noise(g, S, S, 12000, 0.08, 1);
  for (let fy = 0; fy < 4; fy++) {
    for (let bx = 0; bx < 4; bx++) {
      const x0 = bx * B, y0 = fy * B;
      g.fillStyle = 'rgba(0,0,0,.18)';
      g.fillRect(x0, y0 + B - 3, B, 3); g.fillRect(x0 + B - 3, y0, 3, B);
      const loggia = bx % 2 === 0;
      const w = loggia ? B * 0.7 : B * 0.45, h = loggia ? B * 0.62 : B * 0.45;
      const x = x0 + (B - w) / 2, y = y0 + B * 0.18;
      if (loggia) {
        // glazed-in balcony (very typical)
        g.fillStyle = '#d9d6cc'; g.fillRect(x - 6, y + h * 0.55, w + 12, h * 0.45 + 6);
        g.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < w; k += 12) g.fillRect(x + k, y + h * 0.55, 2, h * 0.45);
        windowShape(g, x, y, w, h * 0.55, { frame: '#e8e8e8', cornice: false, sill: false }, lit && rnd() < 0.35);
      } else windowShape(g, x, y, w, h, { frame: '#ececec', cornice: false, shutters: true, shutterColor: '#8e8a80' }, lit && rnd() < 0.35);
    }
  }
  return c;
}

function facadeGlass(lit) {
  const S = 512, B = S / 4;
  const [c, g] = canvas(S);
  const gr = g.createLinearGradient(0, 0, S, S);
  gr.addColorStop(0, '#5c7488'); gr.addColorStop(0.5, '#33465a'); gr.addColorStop(1, '#6d8597');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) {
    if (lit && rnd() < 0.4) { g.fillStyle = 'rgba(250,225,170,.75)'; g.fillRect(bx * B + 4, fy * B + 16, B - 8, B - 20); }
    g.fillStyle = `rgba(255,255,255,${R(0, 0.08)})`; g.fillRect(bx * B, fy * B, B, B);
  }
  g.fillStyle = '#c9cdd0';
  for (let k = 0; k <= 4; k++) { g.fillRect(k * B - 3, 0, 6, S); g.fillRect(0, k * B - 3, S, 10); }
  for (let k = 0; k < 4; k++) g.fillRect(k * B + B / 2 - 1, 0, 2, S);
  return c;
}

function facadeBrick(lit) {
  const S = 1024, B = S / 4;
  const [c, g] = canvas(S);
  g.fillStyle = '#c9c2b8'; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 12) for (let x = -((y / 12) % 2) * 14; x < S; x += 28) {
    const v = R(0.85, 1.1);
    g.fillStyle = `rgb(${172 * v},${92 * v},${66 * v})`; g.fillRect(x + 1, y + 1, 26, 10);
  }
  for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) {
    const w = B * 0.4, h = B * 0.55;
    windowShape(g, bx * B + (B - w) / 2, fy * B + B * 0.2, w, h, { frame: '#efe9dd', cornice: false, arch: rnd() < 0.3 }, lit && rnd() < 0.35);
  }
  return c;
}

// Ground floor: shop fronts (2 bays of ~4.5 m) and plain plinth with an entrance.
function groundShop(lit) {
  const W = 1024, H = 512, B = W / 2;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  noise(g, W, H, 4000, 0.07);
  for (let b = 0; b < 2; b++) {
    const x = b * B + 30, w = B - 60;
    // sign band
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x - 10, H * 0.08, w + 20, H * 0.14);
    // shop window
    g.fillStyle = '#3a3c3a'; g.fillRect(x - 6, H * 0.27, w + 12, H * 0.73);
    const gr = g.createLinearGradient(x, H * 0.3, x + w, H);
    if (lit) { gr.addColorStop(0, '#ffe7b0'); gr.addColorStop(1, '#e4b56c'); } else { gr.addColorStop(0, '#5d6e7a'); gr.addColorStop(0.5, '#253039'); gr.addColorStop(1, '#4d5d69'); }
    g.fillStyle = gr; g.fillRect(x, H * 0.3, w, H * 0.68);
    // goods / interior hints
    for (let k = 0; k < 10; k++) { g.fillStyle = `hsla(${R(0, 360)},40%,${lit ? 70 : 45}%,.35)`; g.fillRect(x + R(0, w - 40), H * R(0.55, 0.85), R(20, 60), R(20, 70)); }
    // door
    const dx = b === 0 ? x + w - 130 : x + 20;
    g.fillStyle = '#2a2a2a'; g.fillRect(dx, H * 0.32, 110, H * 0.68);
    g.fillStyle = lit ? '#f3d18c' : '#3c4a54'; g.fillRect(dx + 10, H * 0.36, 90, H * 0.6);
    g.fillStyle = '#c9c9c9'; g.fillRect(dx + 80, H * 0.62, 6, 40);
    // mullions
    g.fillStyle = '#3a3c3a'; g.fillRect(x + w / 3, H * 0.3, 5, H * 0.7);
    // stone plinth
    g.fillStyle = '#8f8b84'; g.fillRect(x - 6, H * 0.94, w + 12, H * 0.06);
  }
  g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, 14, H);
  return c;
}

function groundPlain(lit) {
  const W = 1024, H = 512, B = W / 2;
  const [c, g] = canvas(W, H);
  g.fillStyle = '#e9e6e0'; g.fillRect(0, 0, W, H);
  // rusticated stone base (horizontal grooves)
  for (let y = H * 0.1; y < H; y += 46) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, y, W, 4); }
  noise(g, W, H, 5000, 0.08);
  // graffiti tags appear on many ground floors in the centre
  if (rnd() < 0.9) for (let k = 0; k < 3; k++) {
    g.strokeStyle = `hsla(${R(0, 360)},60%,35%,.55)`; g.lineWidth = R(3, 7);
    g.beginPath(); let px = R(40, W - 200), py = R(H * 0.6, H * 0.85); g.moveTo(px, py);
    for (let s = 0; s < 8; s++) { px += R(10, 30); py += R(-30, 30); g.lineTo(px, py); }
    g.stroke();
  }
  for (let b = 0; b < 2; b++) {
    const w = B * 0.3, h = H * 0.4;
    windowShape(g, b * B + (B - w) / 2, H * 0.22, w, h, { frame: '#ece9e1', cornice: false, sill: true, shutters: false }, lit && rnd() < 0.3);
    // window grille
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 3;
    for (let k = 0; k <= 5; k++) { g.beginPath(); g.moveTo(b * B + (B - w) / 2 + k * w / 5, H * 0.22); g.lineTo(b * B + (B - w) / 2 + k * w / 5, H * 0.62); g.stroke(); }
  }
  g.fillStyle = '#8a857c'; g.fillRect(0, H * 0.93, W, H * 0.07);
  g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, 0, 14, H);
  return c;
}

// ---------------------------------------------------------------- ground surfaces (world-space UVs)
function asphalt() {
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#56585a'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60000; i++) { const v = R(40, 130); g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(R(0, S), R(0, S), R(1, 2.5), R(1, 2.5)); }
  // patches and cracks
  for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${R(20, 60)},${R(20, 60)},${R(20, 60)},.18)`; g.fillRect(R(0, S), R(0, S), R(40, 160), R(30, 120)); }
  g.strokeStyle = 'rgba(25,25,25,.5)'; g.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) { g.beginPath(); let x = R(0, S), y = R(0, S); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += R(-18, 18); y += R(-18, 18); g.lineTo(x, y); } g.stroke(); }
  return c;
}

function sett(yellow = false) {
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = yellow ? '#5e5530' : '#3f3f3f'; g.fillRect(0, 0, S, S);
  const n = 16, cs = S / n;
  for (let y = 0; y < n; y++) for (let x = -1; x < n; x++) {
    const ox = (y % 2) * cs / 2, v = R(0.8, 1.15);
    g.fillStyle = yellow ? `rgb(${196 * v},${170 * v},${82 * v})` : `rgb(${128 * v},${126 * v},${122 * v})`;
    const px = x * cs + ox + 2, py = y * cs + 2;
    g.beginPath(); g.roundRect ? g.roundRect(px, py, cs - 4, cs - 4, 5) : g.rect(px, py, cs - 4, cs - 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(px + 2, py + 2, cs - 10, 4);
  }
  return c;
}

function paving() {
  // 40 × 40 cm grey concrete slabs, the standard Sofia sidewalk
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#8c8a86'; g.fillRect(0, 0, S, S);
  const n = 8, cs = S / n;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = R(0.86, 1.06);
    g.fillStyle = `rgb(${168 * v},${165 * v},${158 * v})`; g.fillRect(x * cs + 1.5, y * cs + 1.5, cs - 3, cs - 3);
    if (rnd() < 0.08) { g.strokeStyle = 'rgba(40,40,40,.4)'; g.beginPath(); g.moveTo(x * cs + R(0, cs), y * cs); g.lineTo(x * cs + R(0, cs), y * cs + cs); g.stroke(); }
  }
  noise(g, S, S, 20000, 0.1);
  // gum spots
  for (let i = 0; i < 50; i++) { g.fillStyle = 'rgba(50,50,50,.25)'; g.beginPath(); g.arc(R(0, S), R(0, S), R(1, 3), 0, 7); g.fill(); }
  return c;
}

function pavers() {
  // interlocking concrete pavers (squares, pedestrian zones, parking lots)
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#6e6a64'; g.fillRect(0, 0, S, S);
  const w = 32, h = 16;
  for (let y = 0; y < S / h; y++) for (let x = -1; x < S / w + 1; x++) {
    const v = R(0.85, 1.1), ox = (y % 2) * w / 2;
    g.fillStyle = `rgb(${176 * v},${160 * v},${146 * v})`; g.fillRect(x * w + ox + 1, y * h + 1, w - 2, h - 2);
  }
  noise(g, S, S, 10000, 0.08);
  return c;
}

function grass() {
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#4f6b34'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 70000; i++) { g.fillStyle = `hsla(${R(70, 105)},${R(30, 55)}%,${R(18, 42)}%,.6)`; g.fillRect(R(0, S), R(0, S), 1.5, R(2, 5)); }
  for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(110,90,50,.18)'; g.beginPath(); g.arc(R(0, S), R(0, S), R(6, 30), 0, 7); g.fill(); }
  return c;
}

function dirt() {
  const S = 256; const [c, g] = canvas(S);
  g.fillStyle = '#8b7a5e'; g.fillRect(0, 0, S, S);
  noise(g, S, S, 20000, 0.15, 1);
  return c;
}

function roofTiles() {
  const S = 512; const [c, g] = canvas(S);
  g.fillStyle = '#6b2f1f'; g.fillRect(0, 0, S, S);
  const rows = 16, cols = 16, rh = S / rows, cw = S / cols;
  for (let y = 0; y < rows; y++) for (let x = -1; x < cols; x++) {
    const v = R(0.8, 1.12), ox = (y % 2) * cw / 2;
    const gr = g.createLinearGradient(0, y * rh, 0, y * rh + rh);
    gr.addColorStop(0, `rgb(${150 * v},${68 * v},${44 * v})`); gr.addColorStop(1, `rgb(${110 * v},${46 * v},${30 * v})`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(x * cw + ox + cw / 2, y * rh + rh * 0.55, cw / 2 - 1, rh * 0.55, 0, 0, Math.PI); g.fill();
    g.fillRect(x * cw + ox + 1, y * rh, cw - 2, rh * 0.55);
  }
  // moss & dirt
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${R(40, 70)},${R(50, 70)},${R(30, 40)},.2)`; g.beginPath(); g.arc(R(0, S), R(0, S), R(5, 25), 0, 7); g.fill(); }
  return c;
}

function roofFlat() {
  const S = 256; const [c, g] = canvas(S);
  g.fillStyle = '#7d7b78'; g.fillRect(0, 0, S, S);
  noise(g, S, S, 16000, 0.2, 1);
  g.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < S; k += 64) g.fillRect(k, 0, 2, S);
  return c;
}

function bark() {
  const S = 128; const [c, g] = canvas(S);
  g.fillStyle = '#5a4a3c'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${R(20, 60)},${R(15, 45)},${R(10, 35)},.5)`; g.fillRect(R(0, S), R(0, S), R(1, 3), R(8, 30)); }
  return c;
}

function leaves() {
  // clusters of leaves on a transparent background; tinted per tree with instance colours
  const S = 512; const [c, g] = canvas(S);
  // shaded inner foliage (semi-transparent, so winter can thin it out with alphaTest)
  g.fillStyle = 'rgba(105,105,105,0.42)'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 3600; i++) {
    const x = R(0, S), y = R(0, S), r = R(6, 13), a = R(0, Math.PI * 2), v = R(150, 255);
    g.fillStyle = `rgba(${v},${v},${v},${R(0.5, 1).toFixed(2)})`;
    g.beginPath(); g.ellipse(x, y, r, r * 0.5, a, 0, Math.PI * 2); g.fill();
    g.strokeStyle = `rgba(0,0,0,.25)`; g.lineWidth = 1; g.beginPath(); g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke();
  }
  return c;
}

export function makeTextures(maxAniso = 8) {
  seed = 12345;
  const o = { aniso: maxAniso };
  const pair = (fn) => tex(fn(false), o);
  return {
    facade: { classic: pair(facadeClassic), panel: pair(facadePanel), glass: pair(facadeGlass), brick: pair(facadeBrick) },
    ground: { shop: pair(groundShop), plain: pair(groundPlain) },
    asphalt: tex(asphalt(), o), sett: tex(sett(false), o), settYellow: tex(sett(true), o),
    paving: tex(paving(), o), pavers: tex(pavers(), o), grass: tex(grass(), o), dirt: tex(dirt(), o),
    roofTiles: tex(roofTiles(), o), roofFlat: tex(roofFlat(), o), bark: tex(bark(), o), leaves: tex(leaves(), o),
  };
}

// ---------------------------------------------------------------- text signs
export function textTexture(lines, { bg = '#14365f', fg = '#ffffff', font = '600 64px "Sofia Sans", "Segoe UI", sans-serif', pad = 26, border = null, minW = 0, h = 0, radius = 8 } = {}) {
  const [c0, m] = canvas(8);
  m.font = font;
  const arr = Array.isArray(lines) ? lines : [lines];
  const sizes = arr.map((l) => (typeof l === 'string' ? { t: l, f: font } : l));
  let w = minW, lh = [];
  for (const s of sizes) { m.font = s.f || font; w = Math.max(w, m.measureText(s.t).width); lh.push(parseInt((s.f || font).match(/(\d+)px/)[1], 10) * 1.2); }
  const W = Math.min(2048, Math.ceil(w + pad * 2));
  const Hh = h || Math.ceil(lh.reduce((a, b) => a + b, 0) + pad * 1.2);
  const [c, g] = canvas(W, Hh);
  g.fillStyle = bg;
  if (g.roundRect) { g.beginPath(); g.roundRect(0, 0, W, Hh, radius); g.fill(); } else g.fillRect(0, 0, W, Hh);
  if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(5, 5, W - 10, Hh - 10); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  let y = (Hh - lh.reduce((a, b) => a + b, 0)) / 2;
  sizes.forEach((s, i) => { g.font = s.f || font; g.fillText(s.t, W / 2, y + lh[i] / 2, W - pad); y += lh[i]; });
  const t = tex(c, { repeat: false });
  t.userData = { aspect: W / Hh };
  return t;
}
