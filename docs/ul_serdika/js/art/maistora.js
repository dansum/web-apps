// Textures in the spirit of Vladimir Dimitrov – the Master (1882–1960):
// pure flat colours, firm dark contours, folk embroidery ("шевици"), apples and flowers.
// Same keys as makeTextures() in paint.js, so the world builder can use either.
import { canvas, tex, setSeed, rnd, R, pick, jit, clipRect, pool } from './paint.js';

const INK = '#2a1712';
const RED = '#d7262b', VERM = '#e8452c', YEL = '#f5c518', ORA = '#f08a1c', EMER = '#1e9e5a', SAP = '#5dae2e', COB = '#2c5db8', TURQ = '#1fa3a0', ROSE = '#e86a8a', WHITE = '#fbf3e0';
const LIT = '#ffd04a';

// a little grain, like tempera on board
function grain(g, x, y, w, h, n = 1, a = 0.06) {
  for (let i = 0; i < w * h * 0.004 * n; i++) {
    g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${R(0, a)})` : `rgba(60,30,10,${R(0, a)})`;
    g.fillRect(x + rnd() * w, y + rnd() * h, R(1, 3), R(1, 3));
  }
}
function flat(g, x, y, w, h, color, n = 1) { g.fillStyle = color; g.fillRect(x, y, w, h); grain(g, x, y, w, h, n); }
function outline(g, lw = 5) { g.strokeStyle = INK; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke(); }

// embroidery band: red rhombuses with black hearts, green triangles, yellow dots (step must divide the tile width)
function shevitsa(g, x, y, w, h, step = 64, colors = [RED, EMER, YEL]) {
  flat(g, x, y, w, h, WHITE, 0.5);
  g.fillStyle = INK; g.fillRect(x, y, w, 3); g.fillRect(x, y + h - 3, w, 3);
  for (let k = 0; k < w / step; k++) {
    const cx = x + k * step + step / 2, cy = y + h / 2, rr = h * 0.38;
    g.beginPath(); g.moveTo(cx, cy - rr); g.lineTo(cx + rr, cy); g.lineTo(cx, cy + rr); g.lineTo(cx - rr, cy); g.closePath();
    g.fillStyle = colors[0]; g.fill();
    g.beginPath(); g.moveTo(cx, cy - rr * 0.4); g.lineTo(cx + rr * 0.4, cy); g.lineTo(cx, cy + rr * 0.4); g.lineTo(cx - rr * 0.4, cy); g.closePath();
    g.fillStyle = INK; g.fill();
    for (const s of [-1, 1]) {
      const tx = cx + s * step * 0.32;
      g.beginPath(); g.moveTo(tx, cy - rr * 0.6); g.lineTo(tx + s * rr * 0.5, cy); g.lineTo(tx, cy + rr * 0.6); g.closePath(); g.fillStyle = colors[1]; g.fill();
    }
    g.fillStyle = colors[2]; g.beginPath(); g.arc(x + k * step, cy, rr * 0.22, 0, 7); g.fill();
  }
}

// a tulip, the most common motif of Bulgarian folk ornament
function tulip(g, cx, cy, s, petal = RED) {
  g.strokeStyle = EMER; g.lineWidth = s * 0.12; g.beginPath(); g.moveTo(cx, cy + s * 0.9); g.lineTo(cx, cy + s * 0.1); g.stroke();
  g.fillStyle = SAP;
  for (const d of [-1, 1]) { g.beginPath(); g.ellipse(cx + d * s * 0.28, cy + s * 0.55, s * 0.28, s * 0.1, d * 0.6, 0, 7); g.fill(); }
  g.fillStyle = petal;
  g.beginPath(); g.moveTo(cx - s * 0.35, cy - s * 0.2); g.quadraticCurveTo(cx - s * 0.4, cy + s * 0.25, cx, cy + s * 0.25); g.quadraticCurveTo(cx + s * 0.4, cy + s * 0.25, cx + s * 0.35, cy - s * 0.2);
  g.lineTo(cx + s * 0.18, cy - s * 0.02); g.lineTo(cx, cy - s * 0.32); g.lineTo(cx - s * 0.18, cy - s * 0.02); g.closePath(); g.fill();
  outline(g, 2);
}

function windowBox(g, gn, x, y, w, h, frame, lit, arch = true) {
  // frame
  g.fillStyle = frame; g.fillRect(x - 12, y - 12, w + 24, h + 24); g.beginPath(); g.rect(x - 12, y - 12, w + 24, h + 24); outline(g, 4);
  // lunette with a tulip
  if (arch) {
    g.beginPath(); g.moveTo(x - 12, y - 12); g.arc(x + w / 2, y - 12, w / 2 + 12, Math.PI, 0); g.closePath();
    g.fillStyle = frame; g.fill(); outline(g, 4);
    g.beginPath(); g.arc(x + w / 2, y - 12, w / 2, Math.PI, 0); g.closePath(); g.fillStyle = YEL; g.fill(); outline(g, 3);
    tulip(g, x + w / 2, y - 12 - w * 0.28, w * 0.32, frame === RED ? COB : RED);
  }
  // glass: flat blue with two lighter panes and white bars
  g.fillStyle = '#1d3f7a'; g.fillRect(x, y, w, h);
  g.fillStyle = '#3f6fb8'; g.fillRect(x + 4, y + 4, w / 2 - 8, h * 0.3); g.fillRect(x + w / 2 + 4, y + 4, w / 2 - 8, h * 0.3);
  g.fillStyle = WHITE; g.fillRect(x + w / 2 - 4, y, 8, h); g.fillRect(x, y + h * 0.36, w, 7);
  g.beginPath(); g.rect(x, y, w, h); outline(g, 4);
  if (lit) {
    gn.fillStyle = LIT; gn.fillRect(x, y, w, h);
    gn.fillStyle = '#000'; gn.fillRect(x + w / 2 - 4, y, 8, h); gn.fillRect(x, y + h * 0.36, w, 7);
  }
}
// a box of red geraniums on the sill
function geraniums(g, x, y, w) {
  g.fillStyle = '#a0522d'; g.fillRect(x - 6, y, w + 12, 16); g.beginPath(); g.rect(x - 6, y, w + 12, 16); outline(g, 3);
  for (let i = 0; i < w / 9; i++) {
    const px = x + rnd() * w, py = y - R(4, 18);
    g.fillStyle = SAP; g.beginPath(); g.arc(px, py + 6, R(4, 7), 0, 7); g.fill();
    g.fillStyle = pick([RED, VERM, ROSE]); g.beginPath(); g.arc(px + R(-3, 3), py, R(3, 5), 0, 7); g.fill();
  }
}

function facade(kind) {
  const S = 1024, Bw = S / 4;
  const [c, g] = canvas(S), [cn, gn] = canvas(S);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, S, S);
  if (kind === 'glass') {
    flat(g, 0, 0, S, S, COB, 0.5);
    for (let fy = 0; fy < 4; fy++) for (let bx = 0; bx < 4; bx++) {
      const x = bx * Bw + 14, y = fy * Bw + 20, w = Bw - 28, h = Bw - 40;
      g.fillStyle = pick(['#3f6fb8', '#4f86c8', TURQ]); g.fillRect(x, y, w, h); g.beginPath(); g.rect(x, y, w, h); outline(g, 5);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x + w * 0.1, y + h); g.lineTo(x + w * 0.45, y); g.lineTo(x + w * 0.6, y); g.lineTo(x + w * 0.25, y + h); g.fill();
      if (rnd() < 0.4) { gn.fillStyle = LIT; gn.fillRect(x, y, w, h); }
    }
    return [c, cn];
  }
  flat(g, 0, 0, S, S, kind === 'brick' ? '#e07a4a' : WHITE, 1.2);
  if (kind === 'brick') {
    g.strokeStyle = 'rgba(42,23,18,.35)'; g.lineWidth = 2;
    for (let y = 0; y < S; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); for (let x = (y / 16) % 2 * 16; x < S; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } }
  }
  const frames = [COB, EMER, RED, TURQ];
  for (let fy = 0; fy < 4; fy++) {
    shevitsa(g, 0, fy * Bw + Bw - 26, S, 22, 64, fy % 2 ? [COB, RED, YEL] : [RED, EMER, YEL]);
    for (let bx = 0; bx < 4; bx++) {
      const w = Bw * (kind === 'panel' ? 0.44 : 0.34), h = Bw * (kind === 'panel' ? 0.38 : 0.44);
      const x = bx * Bw + (Bw - w) / 2, y = fy * Bw + Bw * (kind === 'panel' ? 0.26 : 0.3);
      windowBox(g, gn, x, y, w, h, frames[(bx + fy) % 4], rnd() < 0.42, kind !== 'panel');
      if (rnd() < 0.5) geraniums(g, x, y + h + 13, w);
    }
  }
  // left pilaster stays plain (short walls show it)
  g.fillStyle = WHITE; g.fillRect(0, 0, 10, S);
  return [c, cn];
}

function groundShop() {
  const W = 1024, H = 512, Bw = W / 2;
  const [c, g] = canvas(W, H), [cn, gn] = canvas(W, H);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, W, H);
  flat(g, 0, 0, W, H, WHITE, 1);
  shevitsa(g, 0, 18, W, 26, 64, [RED, COB, YEL]);
  for (let b = 0; b < 2; b++) {
    const x = b * Bw + 40, w = Bw - 80, y = H * 0.3, h = H * 0.66;
    // arched shop window, warm inside
    g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w * 0.25); g.quadraticCurveTo(x + w / 2, y - w * 0.12, x + w, y + w * 0.25); g.lineTo(x + w, y + h); g.closePath();
    g.fillStyle = ORA; g.fill(); outline(g, 6);
    for (let k = 0; k < 7; k++) { g.fillStyle = pick([RED, YEL, EMER, ROSE]); g.beginPath(); g.arc(x + R(0.1, 0.9) * w, y + R(0.5, 0.9) * h, R(10, 22), 0, 7); g.fill(); outline(g, 2); }
    g.fillStyle = INK; g.fillRect(x + w / 3, y + w * 0.1, 6, h); g.fillRect(x + 2 * w / 3, y + w * 0.1, 6, h);
    gn.save(); gn.beginPath(); gn.moveTo(x, y + h); gn.lineTo(x, y + w * 0.25); gn.quadraticCurveTo(x + w / 2, y - w * 0.12, x + w, y + w * 0.25); gn.lineTo(x + w, y + h); gn.closePath(); gn.fillStyle = LIT; gn.fill(); gn.restore();
  }
  g.fillStyle = TURQ; g.fillRect(0, H - 24, W, 24); g.fillStyle = INK; g.fillRect(0, H - 26, W, 3);
  g.fillStyle = WHITE; g.fillRect(0, 0, 10, H);
  return [c, cn];
}
function groundPlain() {
  const W = 1024, H = 512, Bw = W / 2;
  const [c, g] = canvas(W, H), [cn, gn] = canvas(W, H);
  gn.fillStyle = '#000'; gn.fillRect(0, 0, W, H);
  flat(g, 0, 0, W, H, WHITE, 1);
  flat(g, 0, H * 0.7, W, H * 0.3, '#c0563a', 1);
  shevitsa(g, 0, H * 0.7 - 12, W, 24, 64, [EMER, RED, YEL]);
  for (let b = 0; b < 2; b++) {
    const w = Bw * 0.3, h = H * 0.3, x = b * Bw + (Bw - w) / 2, y = H * 0.24;
    windowBox(g, gn, x, y, w, h, b ? EMER : COB, rnd() < 0.3, false);
  }
  g.fillStyle = WHITE; g.fillRect(0, 0, 10, H);
  return [c, cn];
}

// mosaic street: shared jittered corners give a seamless pattern of flat stones with dark joints
function mosaic(colors, joint) {
  const S = 512, n = 12, cs = S / n; const [c, g] = canvas(S);
  g.fillStyle = joint; g.fillRect(0, 0, S, S);
  const J = []; for (let j = 0; j <= n; j++) { J.push([]); for (let i = 0; i <= n; i++) J[j].push([R(-0.22, 0.22) * cs, R(-0.22, 0.22) * cs]); }
  for (let i = 0; i <= n; i++) J[n][i] = J[0][i]; for (let j = 0; j <= n; j++) J[j][n] = J[j][0];
  const P = (i, j) => [i * cs + J[j][i][0], j * cs + J[j][i][1]];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const col = jit(pick(colors), 0.06);
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
      g.beginPath(); q.forEach(([x, y], k) => { const sx = x + ox + (q[(k + 2) % 4][0] - x) * 0.07, sy = y + oy + (q[(k + 2) % 4][1] - y) * 0.07; k ? g.lineTo(sx, sy) : g.moveTo(sx, sy); });
      g.closePath(); g.fillStyle = col; g.fill();
    }
  }
  grain(g, 0, 0, S, S, 1.5, 0.08);
  return c;
}
function tiles(base, motif) {
  const S = 512, n = 8, cs = S / n; const [c, g] = canvas(S);
  flat(g, 0, 0, S, S, base, 1);
  g.strokeStyle = INK; g.lineWidth = 3;
  for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * cs, 0); g.lineTo(k * cs, S); g.stroke(); g.beginPath(); g.moveTo(0, k * cs); g.lineTo(S, k * cs); g.stroke(); }
  for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
    const x = (i * cs) % S, y = (j * cs) % S;
    g.fillStyle = motif;
    for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) { g.beginPath(); g.arc(x + dx, y + dy, 5, 0, 7); g.fill(); }
    g.fillStyle = YEL; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
  }
  return c;
}
function meadow() {
  // green with little flowers, as in the Master's Kyustendil pictures
  const S = 512; const [c, g] = canvas(S);
  flat(g, 0, 0, S, S, '#3cae4a', 1);
  g.strokeStyle = '#237a33'; g.lineWidth = 2.5;
  for (let i = 0; i < 900; i++) { const x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R(-3, 3), y - R(6, 12)); g.stroke(); }
  for (let i = 0; i < 70; i++) {
    const x = rnd() * S, y = rnd() * S, r = R(4, 7), col = pick([WHITE, YEL, RED, ROSE, '#6a8ae8']);
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.fillStyle = col;
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.arc(x + ox + Math.cos(a) * r, y + oy + Math.sin(a) * r, r * 0.6, 0, 7); g.fill(); }
      g.fillStyle = col === YEL ? ORA : YEL; g.beginPath(); g.arc(x + ox, y + oy, r * 0.45, 0, 7); g.fill();
    }
  }
  return c;
}
function scallops(colors) {
  // rows of half-round tiles
  const S = 512, cw = 32, rh = 26; const [c, g] = canvas(S);
  flat(g, 0, 0, S, S, colors[0], 0.5);
  for (let y = -rh; y < S + rh; y += rh) for (let x = -cw; x < S + cw; x += cw) {
    const ox = ((y / rh) & 1) * cw / 2;
    g.beginPath(); g.moveTo(x + ox, y); g.lineTo(x + ox, y + rh * 0.4); g.arc(x + ox + cw / 2, y + rh * 0.4, cw / 2, Math.PI, 0, true); g.lineTo(x + ox + cw, y); g.closePath();
    g.fillStyle = pick(colors); g.fill(); outline(g, 2.5);
  }
  return c;
}
function plainTile(base, dots, S = 256) {
  const [c, g] = canvas(S);
  flat(g, 0, 0, S, S, base, 1.4);
  g.fillStyle = dots;
  for (let y = 16; y < S; y += 32) for (let x = 16; x < S; x += 32) { g.beginPath(); g.arc(x, y, 2.5, 0, 7); g.fill(); }
  return c;
}
function bark() {
  const [c, g] = canvas(128);
  flat(g, 0, 0, 128, 128, '#6b3e22', 1);
  g.strokeStyle = INK; g.lineWidth = 3;
  for (let x = 8; x < 128; x += 18) { g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 6, 40, x - 6, 80, x, 128); g.stroke(); }
  return c;
}
// leaves (and apples) on a transparent ground; the layout is the same for every season
function leaves(season) {
  const S = 512; const [c, g] = canvas(S);
  g.clearRect(0, 0, S, S);
  setSeed(4242);
  const greens = { summer: ['#2e9e48', '#4cb84a', '#7cc63e', '#1f7a3e', '#a6d46a'], autumn: ['#f5c518', '#f08a1c', '#e8452c', '#d9a030', '#a6b43a'], winter: ['#f4f8ff', '#dfe8f8', '#ffffff', '#cfdcf0'] }[season];
  for (let i = 0; i < 520; i++) {
    const x = rnd() * S, y = rnd() * S, r = R(18, 28), a = rnd() * Math.PI, col = pick(greens);
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      const px = x + ox, py = y + oy; if (px < -20 || px > S + 20 || py < -20 || py > S + 20) continue;
      g.fillStyle = col; g.beginPath(); g.ellipse(px, py, r, r * 0.55, a, 0, 7); g.fill();
      g.strokeStyle = 'rgba(42,23,18,.8)'; g.lineWidth = 2.5; g.stroke();
      g.strokeStyle = 'rgba(42,23,18,.35)'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(px - Math.cos(a) * r * 0.7, py - Math.sin(a) * r * 0.7); g.lineTo(px + Math.cos(a) * r * 0.7, py + Math.sin(a) * r * 0.7); g.stroke();
    }
  }
  if (season !== 'winter') for (let i = 0; i < 26; i++) {
    const x = R(26, S - 26), y = R(26, S - 26), r = R(14, 19);
    g.fillStyle = season === 'autumn' ? pick([RED, '#f2b52e']) : pick([RED, RED, VERM]);
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.18, -0.6, 0, 7); g.fill();
    g.fillStyle = EMER; g.beginPath(); g.ellipse(x + r * 0.3, y - r * 1.05, r * 0.4, r * 0.18, 0.5, 0, 7); g.fill();
  }
  return c;
}
function door() {
  const [c, g] = canvas(128, 256);
  flat(g, 0, 0, 128, 256, WHITE, 0.5);
  g.beginPath(); g.moveTo(6, 256); g.lineTo(6, 60); g.arc(64, 60, 58, Math.PI, 0); g.lineTo(122, 256); g.closePath(); g.fillStyle = COB; g.fill(); outline(g, 5);
  g.fillStyle = TURQ; g.fillRect(16, 90, 42, 150); g.fillRect(70, 90, 42, 150);
  g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(16, 90, 42, 150); g.strokeRect(70, 90, 42, 150);
  tulip(g, 64, 44, 40, RED);
  g.fillStyle = YEL; g.beginPath(); g.arc(60, 170, 5, 0, 7); g.arc(68, 170, 5, 0, 7); g.fill();
  return c;
}
function awning() {
  const [c, g] = canvas(512, 256);
  for (let x = 0; x < 512; x += 32) { g.fillStyle = (x / 32) % 2 ? WHITE : RED; g.fillRect(x, 0, 32, 256); }
  grain(g, 0, 0, 512, 256, 1);
  g.strokeStyle = INK; g.lineWidth = 3; for (let x = 0; x <= 512; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 256); g.stroke(); }
  g.fillStyle = YEL; for (let x = 0; x < 512; x += 64) { g.beginPath(); g.arc(x + 32, 228, 30, 0, Math.PI); g.fill(); g.stroke(); }
  return c;
}
// an eight-pointed folk star (the rosette of the embroideries) as the glow of a lamp at night
function rosette() {
  const S = 256; const [c, g] = canvas(S);
  g.clearRect(0, 0, S, S);
  const star = (r0, r1, col, a = 0.9) => {
    g.beginPath();
    for (let k = 0; k < 16; k++) { const a2 = k / 16 * Math.PI * 2 - Math.PI / 2, r = k % 2 ? r1 : r0; g.lineTo(S / 2 + Math.cos(a2) * r, S / 2 + Math.sin(a2) * r); }
    g.closePath(); g.globalAlpha = a; g.fillStyle = col; g.fill(); g.globalAlpha = 1;
  };
  star(120, 60, '#f08a1c', 0.35); star(90, 48, '#f5c518', 0.6); star(56, 30, '#fff3b0', 0.9);
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(S / 2, S / 2, 16, 0, 7); g.fill();
  return c;
}

export function makeTexturesMaistora(maxAniso = 8) {
  setSeed(1882);
  const o = { aniso: maxAniso };
  const two = (fn) => { const [d, n] = fn(); return { day: tex(d, o), night: tex(n, o) }; };
  const season = { summer: tex(leaves('summer'), o), autumn: tex(leaves('autumn'), o), winter: tex(leaves('winter'), o) };
  setSeed(1960);
  return {
    facade: { classic: two(() => facade('classic')), panel: two(() => facade('panel')), glass: two(() => facade('glass')), brick: two(() => facade('brick')) },
    ground: { shop: two(groundShop), plain: two(groundPlain) },
    asphalt: tex(plainTile('#4a5a8a', '#6f80b0', 256), o),
    sett: tex(mosaic(['#d9a030', '#c0563a', '#e8c070', '#8a9a3a', '#d98a6a', '#b8743a', '#e0b890'], INK), o),
    settYellow: tex(mosaic(['#f5c518', '#e8b030', '#f2d060', '#d9a030'], INK), o),
    paving: tex(tiles('#f0dca8', VERM), o),
    pavers: tex(tiles('#e8b890', COB), o),
    grass: tex(meadow(), o),
    dirt: tex(plainTile('#d9a030', '#a0522d', 256), o),
    roofTiles: tex(scallops(['#d7262b', '#e8452c', '#c0392b', '#f06a3a']), o),
    roofFlat: tex(plainTile('#c8a878', '#8a5a3a', 256), o),
    bark: tex(bark(), o),
    leaves: season.summer, leavesSeason: season,
    door: tex(door(), { ...o, repeat: false }),
    awning: tex(awning(), o),
    halo: tex(rosette(), { ...o, repeat: false }),
    pool: tex(pool(), { ...o, repeat: false }),
  };
}
