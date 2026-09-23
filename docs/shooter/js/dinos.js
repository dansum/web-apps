// Видовете динозаври и рисуването им с векторни форми.
// Всички координати са локални: краката са на y = 0, нагоре е отрицателно,
// динозавърът гледа надясно. Мащабът и посоката се задават отвън.

export const TYPES = {
  raptor: { kind: 'biped', shape: 'raptor', size: 1.0, hp: 1, speed: 1.9, points: 100, zig: 0.9,
    col: '#6fae3a', dark: '#3f6e1d', belly: '#d9ecae', stripe: '#355c18' },
  compy: { kind: 'biped', shape: 'raptor', size: 0.5, hp: 1, speed: 2.8, points: 150, zig: 1.6,
    col: '#d1b73c', dark: '#7d6a1a', belly: '#f3e9b0', stripe: '#6e5c12' },
  dilo: { kind: 'biped', shape: 'dilo', size: 1.05, hp: 2, speed: 1.3, points: 250, zig: 0.5, spits: true,
    col: '#3a9e8f', dark: '#1f5f55', belly: '#cdeee6', stripe: '#1b4c45', frill: '#ffcc33' },
  trike: { kind: 'quad', size: 1.2, hp: 3, speed: 1.0, points: 300, zig: 0.25,
    col: '#c07a3a', dark: '#7a4a1e', belly: '#efd2a8', frill: '#9c3b2a', spot: '#f2c14e' },
  ptero: { kind: 'flyer', size: 0.95, hp: 1, speed: 2.1, points: 200, zig: 1.2,
    col: '#8c6bb1', dark: '#583f7a', belly: '#e3d6f2', crest: '#e8553d' },
  trex: { kind: 'biped', shape: 'trex', size: 2.5, hp: 20, speed: 0.9, points: 5000, boss: true, zig: 0.15,
    col: '#5d7a3a', dark: '#34471f', belly: '#d8d2a0', stripe: '#2c3b18' },
};

export const BOSS_VARIANTS = {
  green: {},
  red: { col: '#b0472f', dark: '#5e2216', belly: '#ecc79c', stripe: '#4a1a10' },
  dark: { col: '#46566c', dark: '#1f2836', belly: '#a5b2c2', stripe: '#141b25' },
};

// Контур на тялото: [x, y, група]; групи: t — опашка, h — глава, b — тяло
const SHAPES = {
  raptor: {
    body: [[-1.0, -0.74, 't'], [-0.6, -0.75, 't'], [-0.2, -0.8, 'b'], [0.18, -0.78, 'b'], [0.34, -0.9, 'h'],
      [0.42, -1.02, 'h'], [0.6, -1.05, 'h'], [0.82, -0.97, 'h'], [0.82, -0.92, 'h'], [0.58, -0.88, 'h'],
      [0.4, -0.8, 'b'], [0.3, -0.62, 'b'], [0.05, -0.5, 'b'], [-0.22, -0.56, 'b'], [-0.6, -0.68, 't']],
    eye: [0.6, -0.985], eyeR: 0.04, mouth: [[0.56, -0.915], [0.82, -0.935]],
    hip: [-0.04, -0.62], thigh: 0.3, shin: 0.32, legW: [0.13, 0.06], stride: 0.26, lift: 0.14,
    arm: [[0.3, -0.72], [0.4, -0.66], [0.46, -0.6]],
    stripes: [[-0.5, -0.78], [-0.25, -0.82], [0.0, -0.84], [0.2, -0.82]],
    hits: [[0.62, -0.96, 0.17, 1], [0.02, -0.68, 0.3, 0], [-0.55, -0.7, 0.16, 0], [0.0, -0.3, 0.2, 0]],
  },
  dilo: {
    body: [[-0.95, -0.7, 't'], [-0.55, -0.72, 't'], [-0.15, -0.8, 'b'], [0.15, -0.8, 'b'], [0.28, -0.98, 'h'],
      [0.36, -1.14, 'h'], [0.52, -1.18, 'h'], [0.74, -1.12, 'h'], [0.74, -1.07, 'h'], [0.52, -1.04, 'h'],
      [0.36, -0.96, 'h'], [0.28, -0.68, 'b'], [0.02, -0.52, 'b'], [-0.25, -0.56, 'b'], [-0.6, -0.66, 't']],
    eye: [0.55, -1.12], eyeR: 0.035, mouth: [[0.5, -1.07], [0.74, -1.09]],
    hip: [-0.04, -0.62], thigh: 0.3, shin: 0.32, legW: [0.13, 0.06], stride: 0.24, lift: 0.12,
    arm: [[0.26, -0.72], [0.36, -0.66], [0.42, -0.6]],
    crest: true, neck: [0.33, -1.0],
    stripes: [[-0.45, -0.76], [-0.2, -0.82], [0.05, -0.84]],
    hits: [[0.55, -1.1, 0.16, 1], [0.0, -0.68, 0.3, 0], [0.3, -0.9, 0.12, 0], [-0.55, -0.7, 0.15, 0], [0.0, -0.3, 0.2, 0]],
  },
  trex: {
    body: [[-1.1, -0.62, 't'], [-0.6, -0.67, 't'], [-0.15, -0.8, 'b'], [0.2, -0.82, 'b'], [0.35, -0.94, 'h'],
      [0.55, -0.99, 'h'], [0.86, -0.92, 'h'], [0.92, -0.84, 'h'], [0.88, -0.75, 'h'], [0.56, -0.72, 'h'],
      [0.4, -0.64, 'b'], [0.3, -0.5, 'b'], [0.0, -0.4, 'b'], [-0.25, -0.46, 'b'], [-0.65, -0.57, 't']],
    eye: [0.6, -0.9], eyeR: 0.03, mouth: [[0.52, -0.79], [0.9, -0.8]],
    hip: [-0.05, -0.55], thigh: 0.27, shin: 0.3, legW: [0.2, 0.09], stride: 0.2, lift: 0.1,
    arm: [[0.33, -0.6], [0.4, -0.57], [0.43, -0.53]],
    stripes: [[-0.55, -0.68], [-0.3, -0.76], [-0.05, -0.8], [0.18, -0.82]],
    hits: [[0.68, -0.84, 0.2, 1], [0.0, -0.62, 0.34, 0], [-0.6, -0.62, 0.17, 0], [0.0, -0.28, 0.22, 0]],
  },
};

const QUAD_HITS = [[0.78, -0.56, 0.22, 1], [0.0, -0.55, 0.42, 0], [-0.6, -0.5, 0.25, 0], [0.55, -0.72, 0.22, 0], [0.0, -0.18, 0.28, 0]];
const FLYER_HITS = [[0.47, -0.1, 0.15, 1], [0, 0, 0.3, 0], [-0.1, -0.45, 0.32, 0], [-0.1, 0.3, 0.2, 0]];

export function hitCircles(d) {
  const T = TYPES[d.type];
  if (T.kind === 'quad') return QUAD_HITS;
  if (T.kind === 'flyer') return FLYER_HITS;
  return SHAPES[T.shape].hits;
}

// Къде са очите — нужно за нощния етап, където очите светят в тъмното.
export function eyePos(d) {
  const T = TYPES[d.type];
  if (T.kind === 'quad') return [0.73, -0.6];
  if (T.kind === 'flyer') return [0.43, -0.12];
  const S = SHAPES[T.shape];
  return [S.eye[0], S.eye[1] + headBob(d)];
}

function headBob(d) {
  return Math.sin(d.phase * 2) * 0.012 - (d.roar > 0 ? 0.03 : 0);
}

function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.beginPath();
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

function leg(ctx, hx, hy, phase, S, col, scale = 1) {
  const L1 = S.thigh, L2 = S.shin;
  const fx = hx + Math.sin(phase) * S.stride;
  const fy = -Math.max(0, Math.cos(phase)) * S.lift;
  const ax = fx - 0.07, ay = fy - 0.13;
  const dx = ax - hx, dy = ay - hy;
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.001);
  const a = Math.atan2(dy, dx);
  const c = Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)));
  const ang = a - Math.acos(c);
  const kx = hx + Math.cos(ang) * L1;
  const ky = hy + Math.sin(ang) * L1;
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = S.legW[0] * scale;
  ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.stroke();
  ctx.lineWidth = S.legW[1] * scale;
  ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(ax, ay); ctx.lineTo(fx + 0.12, fy); ctx.stroke();
  // нокти
  ctx.lineWidth = S.legW[1] * 0.45 * scale;
  ctx.strokeStyle = '#2a2a22';
  ctx.beginPath(); ctx.moveTo(fx + 0.1, fy); ctx.lineTo(fx + 0.16, fy + 0.01); ctx.stroke();
}

function eye(ctx, x, y, r, angry, glow) {
  ctx.fillStyle = glow || '#fffbe6';
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(x + r * 0.35, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
  if (angry) {
    ctx.strokeStyle = '#1a1a14';
    ctx.lineWidth = r * 0.6;
    ctx.beginPath(); ctx.moveTo(x - r * 1.4, y - r * 1.5); ctx.lineTo(x + r * 1.4, y - r * 0.7); ctx.stroke();
  }
}

function colors(d) {
  const T = TYPES[d.type];
  const base = { col: T.col, dark: T.dark, belly: T.belly, stripe: T.stripe, frill: T.frill, spot: T.spot, crest: T.crest };
  if (d.variant) Object.assign(base, BOSS_VARIANTS[d.variant]);
  if (d.flash > 0) {
    for (const k of Object.keys(base)) base[k] = '#ffffff';
  }
  return base;
}

export function drawDino(ctx, d) {
  const T = TYPES[d.type];
  if (T.kind === 'quad') drawQuad(ctx, d, colors(d));
  else if (T.kind === 'flyer') drawFlyer(ctx, d, colors(d));
  else drawBiped(ctx, d, colors(d), SHAPES[T.shape]);
}

function drawBiped(ctx, d, C, S) {
  const ph = d.phase;
  const hb = headBob(d);
  const tailSw = Math.sin(ph) * 0.04;
  const [hx, hy] = S.hip;
  // далечен крак
  leg(ctx, hx - 0.02, hy, ph + Math.PI, S, C.dark);
  // гребен/яка на дилофозавъра — зад главата
  if (S.crest && d.frill > 0) {
    const f = d.frill;
    ctx.fillStyle = C.frill;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.ellipse(S.neck[0], S.neck[1] + hb, 0.22 * f, 0.26 * f, -0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C.dark;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(S.neck[0], S.neck[1] + hb);
      ctx.lineTo(S.neck[0] + Math.cos(a) * 0.2 * f, S.neck[1] + hb + Math.sin(a) * 0.24 * f);
      ctx.stroke();
    }
  }
  const pts = S.body.map(([x, y, g]) => {
    if (g === 'h') return [x, y + hb];
    if (g === 't') return [x, y + tailSw * (x < -0.8 ? 2 : 1)];
    return [x, y];
  });
  // тяло
  smooth(ctx, pts);
  ctx.fillStyle = C.col;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = C.belly;
  ctx.beginPath();
  ctx.ellipse(0.12, -0.42, 0.42, 0.2, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.stripe;
  for (const [sx, sy] of S.stripes) {
    ctx.beginPath();
    ctx.ellipse(sx, sy, 0.045, 0.12, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  smooth(ctx, pts);
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 0.025;
  ctx.stroke();
  // бедро
  ctx.fillStyle = C.col;
  ctx.beginPath();
  ctx.ellipse(hx, hy, 0.16, 0.13, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // гребени на дилофозавъра
  if (S.crest) {
    ctx.fillStyle = C.frill || '#e33';
    ctx.strokeStyle = C.dark;
    for (let i = 0; i < 2; i++) {
      const o = i * 0.03;
      ctx.beginPath();
      ctx.moveTo(0.4 + o, -1.15 + hb);
      ctx.quadraticCurveTo(0.44 + o, -1.33 + hb, 0.66 + o, -1.16 + hb);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }
  // уста
  const open = d.roar > 0 ? 0.08 : (d.mouth || 0);
  const [m1, m2] = S.mouth;
  if (open > 0.005) {
    ctx.fillStyle = '#5a1010';
    ctx.beginPath();
    ctx.moveTo(m1[0], m1[1] + hb);
    ctx.lineTo(m2[0], m2[1] + hb - open * 0.4);
    ctx.lineTo(m2[0] - 0.04, m2[1] + hb + open);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const tx = m1[0] + (m2[0] - m1[0]) * (0.3 + i * 0.17);
      const ty = m1[1] + (m2[1] - m1[1]) * (0.3 + i * 0.17) + hb;
      ctx.beginPath(); ctx.moveTo(tx - 0.015, ty - 0.01); ctx.lineTo(tx + 0.015, ty - 0.01); ctx.lineTo(tx, ty + 0.03); ctx.fill();
    }
  } else {
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 0.018;
    ctx.beginPath(); ctx.moveTo(m1[0], m1[1] + hb); ctx.lineTo(m2[0], m2[1] + hb); ctx.stroke();
  }
  // ноздра
  ctx.fillStyle = C.dark;
  ctx.beginPath(); ctx.arc(m2[0] - 0.05, m2[1] + hb - 0.05, 0.012, 0, Math.PI * 2); ctx.fill();
  eye(ctx, S.eye[0], S.eye[1] + hb, S.eyeR, true);
  // ръка
  ctx.strokeStyle = C.dark;
  ctx.lineWidth = 0.045;
  ctx.lineCap = 'round';
  const armSw = Math.sin(ph * 2) * 0.02;
  ctx.beginPath();
  ctx.moveTo(S.arm[0][0], S.arm[0][1]);
  ctx.lineTo(S.arm[1][0], S.arm[1][1] + armSw);
  ctx.lineTo(S.arm[2][0], S.arm[2][1] + armSw);
  ctx.stroke();
  // близък крак
  leg(ctx, hx + 0.02, hy, ph, S, C.col);
}

function drawQuad(ctx, d, C) {
  const ph = d.phase;
  const hb = Math.sin(ph * 2) * 0.01;
  const legRect = (x, off, col) => {
    const lift = Math.max(0, Math.cos(ph + off)) * 0.06;
    const sw = Math.sin(ph + off) * 0.08;
    ctx.fillStyle = col;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(x - 0.09, -0.45);
    ctx.lineTo(x + 0.09, -0.45);
    ctx.lineTo(x + 0.08 + sw, -lift);
    ctx.lineTo(x - 0.1 + sw, -lift);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  legRect(-0.34, Math.PI, C.dark);
  legRect(0.3, 0, C.dark);
  const body = [[-1.05, -0.45], [-0.6, -0.62], [-0.1, -0.82], [0.35, -0.76], [0.55, -0.6], [0.5, -0.34],
    [0.0, -0.28], [-0.45, -0.33], [-0.78, -0.4]];
  const tail = Math.sin(ph) * 0.03;
  body[0][1] += tail;
  smooth(ctx, body);
  ctx.fillStyle = C.col; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = C.belly;
  ctx.beginPath(); ctx.ellipse(0, -0.25, 0.6, 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = C.dark;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(-0.55 + i * 0.22, -0.66 - Math.sin(i) * 0.05, 0.05, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  smooth(ctx, body);
  ctx.strokeStyle = C.dark; ctx.lineWidth = 0.025; ctx.stroke();
  // яка
  ctx.save();
  ctx.translate(0.55, -0.72 + hb);
  ctx.rotate(-0.3);
  ctx.fillStyle = C.frill;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.2, 0.32, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.dark; ctx.lineWidth = 0.03; ctx.stroke();
  ctx.fillStyle = C.spot;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 0.14 - 0.03, Math.sin(a) * 0.24, 0.03, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // глава
  const head = [[0.5, -0.72], [0.76, -0.68], [0.96, -0.5], [1.0, -0.42], [0.86, -0.36], [0.6, -0.4]].map(([x, y]) => [x, y + hb]);
  smooth(ctx, head);
  ctx.fillStyle = C.col; ctx.fill();
  ctx.strokeStyle = C.dark; ctx.lineWidth = 0.02; ctx.stroke();
  ctx.fillStyle = C.dark;
  ctx.beginPath(); ctx.moveTo(0.9, -0.46 + hb); ctx.lineTo(1.03, -0.4 + hb); ctx.lineTo(0.9, -0.36 + hb); ctx.fill();
  // рога
  ctx.fillStyle = '#f4ecd6';
  ctx.strokeStyle = '#8a7d5c';
  ctx.lineWidth = 0.012;
  const horn = (x, y, tx, ty, w) => {
    ctx.beginPath(); ctx.moveTo(x - w, y + hb); ctx.lineTo(tx, ty + hb); ctx.lineTo(x + w, y + hb + w); ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  horn(0.66, -0.66, 1.08, -0.95, 0.035);
  horn(0.72, -0.64, 1.12, -0.88, 0.03);
  horn(0.9, -0.52, 1.0, -0.66, 0.025);
  eye(ctx, 0.73, -0.6 + hb, 0.032, true);
  legRect(-0.26, 0, C.col);
  legRect(0.38, Math.PI, C.col);
}

function drawFlyer(ctx, d, C) {
  const f = Math.sin(d.phase * 1.6);
  const wing = (tipY, col, off) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = C.dark;
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.moveTo(0.15 + off, -0.04);
    ctx.quadraticCurveTo(0.1 + off, tipY * 0.6, -0.05 + off, tipY);
    ctx.quadraticCurveTo(-0.2 + off, tipY * 0.45, -0.42 + off, 0.02);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  };
  wing(-0.85 * f - 0.1, C.dark, 0.08);
  // опашка
  ctx.strokeStyle = C.dark; ctx.lineWidth = 0.03;
  ctx.beginPath(); ctx.moveTo(-0.25, 0.02); ctx.lineTo(-0.55, 0.06); ctx.stroke();
  // тяло
  ctx.fillStyle = C.col;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.3, 0.1, 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = C.dark; ctx.stroke();
  ctx.fillStyle = C.belly;
  ctx.beginPath(); ctx.ellipse(0.02, 0.05, 0.2, 0.04, 0, 0, Math.PI * 2); ctx.fill();
  // крака
  ctx.strokeStyle = C.dark; ctx.lineWidth = 0.025;
  ctx.beginPath(); ctx.moveTo(-0.12, 0.07); ctx.lineTo(-0.2, 0.2); ctx.moveTo(-0.05, 0.07); ctx.lineTo(-0.1, 0.2); ctx.stroke();
  // врат и глава
  ctx.fillStyle = C.col;
  ctx.beginPath();
  ctx.moveTo(0.22, -0.05);
  ctx.lineTo(0.38, -0.16);
  ctx.lineTo(0.2, -0.36);           // гребен
  ctx.lineTo(0.48, -0.17);
  ctx.lineTo(0.85, -0.06 + (d.mouth || 0) * 0.3);  // клюн
  ctx.lineTo(0.45, -0.05);
  ctx.lineTo(0.28, 0.04);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = C.crest;
  ctx.beginPath(); ctx.moveTo(0.36, -0.17); ctx.lineTo(0.2, -0.36); ctx.lineTo(0.43, -0.19); ctx.closePath(); ctx.fill();
  eye(ctx, 0.44, -0.12, 0.028, true);
  wing(-0.95 * f - 0.05, C.col, 0);
}

// Храсти, палми, камъни — декор, който минава покрай нас.
export function drawProp(ctx, p, theme) {
  const sw = Math.sin(p.t * 1.3 + p.seed * 10) * 0.04;
  if (p.kind === 'palm') {
    ctx.strokeStyle = theme.trunk;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.16;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0.25 * p.lean, -1.4, 0.4 * p.lean + sw, -2.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.02;
    for (let i = 1; i < 9; i++) {
      const y = -i * 0.3;
      const x = 0.25 * p.lean * (i / 9) * 1.6;
      ctx.beginPath(); ctx.moveTo(x - 0.08, y); ctx.lineTo(x + 0.08, y - 0.05); ctx.stroke();
    }
    const tx = 0.4 * p.lean + sw, ty = -2.8;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.55 + sw;
      const len = 1.1 + (i % 2) * 0.2;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.5 + 0.5;
      ctx.fillStyle = i % 2 ? theme.leaf : theme.leaf2;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo((tx + ex) / 2, ty + Math.sin(a) * len * 0.5 - 0.35, ex, ey);
      ctx.quadraticCurveTo((tx + ex) / 2, ty + Math.sin(a) * len * 0.5 - 0.05, tx, ty);
      ctx.fill();
    }
  } else if (p.kind === 'fern') {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + 0.3 + i * (Math.PI - 0.6) / 6 + sw;
      const len = 0.6 + (i % 3) * 0.15;
      ctx.fillStyle = i % 2 ? theme.leaf : theme.leaf2;
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len * 0.9;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(ex * 0.5 - 0.1, ey * 0.6 - 0.1, ex, ey);
      ctx.quadraticCurveTo(ex * 0.5 + 0.1, ey * 0.4 + 0.05, 0, 0);
      ctx.fill();
    }
  } else if (p.kind === 'rock') {
    ctx.fillStyle = theme.rock;
    ctx.beginPath();
    ctx.moveTo(-0.45, 0);
    ctx.quadraticCurveTo(-0.4, -0.35, -0.1, -0.42);
    ctx.quadraticCurveTo(0.3, -0.45, 0.45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.ellipse(-0.12, -0.3, 0.15, 0.06, -0.3, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === 'dead') {
    ctx.strokeStyle = theme.trunk;
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.14;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.05, -2.2); ctx.stroke();
    ctx.lineWidth = 0.07;
    ctx.beginPath();
    ctx.moveTo(0.03, -1.2); ctx.lineTo(0.6, -1.8);
    ctx.moveTo(0.04, -1.6); ctx.lineTo(-0.5, -2.1);
    ctx.moveTo(0.05, -2.0); ctx.lineTo(0.4, -2.5);
    ctx.stroke();
  }
}
