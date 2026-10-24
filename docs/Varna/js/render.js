// Изометрично рисуване на картата и сградите. Няма картинки — всичко се рисува в кода.
import { N, idx, inside, WATER } from './map.js';
import { BUILDINGS } from './buildings.js';

export const HW = 32, HH = 16; // половин ширина и половин височина на плочка
export const proj = (i, j) => [(i - j) * HW, (i + j) * HH];

const TERRAIN = {
  grass: ['#a3d27c', '#9bcc74'], hill: ['#7fb565', '#78ae5e'], beach: ['#f4e0a4', '#efd99a'],
  sea: ['#2f8fcf', '#2b89c8'], lake: ['#46a3ad', '#419ca6'], canal: ['#2c80bf', '#2a7bb8'],
};

// Колко висока е сградата — за да знаем къде да сложим знака „няма път“.
const TOP = { house: 30, block: 52, shop: 22, office: 60, factory: 50, port: 46, hotel: 46, school: 40, clinic: 32,
  park: 26, bus: 24, chitalishte: 36, cathedral: 70, theatre: 46, museum: 38, terme: 26, seaStation: 64, bridge: 50 };

const hash = (i, j) => ((i * 73856093) ^ (j * 19349663)) >>> 0;

function poly(ctx, pts, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let n = 1; n < pts.length; n++) ctx.lineTo(pts[n][0], pts[n][1]);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

// f < 1 потъмнява цвета, f > 1 го изсветлява.
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255]
    .map(v => Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function diamond(i, j, f = 1) {
  const [x, y] = proj(i + 0.5, j + 0.5), dx = HW * f, dy = HH * f;
  return [[x, y - dy], [x + dx, y], [x, y + dy], [x - dx, y]];
}

function box(ctx, x, y, f, h, color, top) {
  const dx = HW * f, dy = HH * f;
  poly(ctx, [[x - dx, y], [x, y + dy], [x, y + dy - h], [x - dx, y - h]], color);
  poly(ctx, [[x, y + dy], [x + dx, y], [x + dx, y - h], [x, y + dy - h]], shade(color, 0.78));
  poly(ctx, [[x, y - dy - h], [x + dx, y - h], [x, y + dy - h], [x - dx, y - h]], top || shade(color, 1.18));
}

function roof(ctx, x, y, f, h, rh, color) {
  const dx = HW * f, dy = HH * f, a = [x, y - h - rh];
  const L = [x - dx, y - h], R = [x + dx, y - h], T = [x, y - dy - h], B = [x, y + dy - h];
  poly(ctx, [L, T, a], shade(color, 1.1));
  poly(ctx, [T, R, a], shade(color, 0.9));
  poly(ctx, [L, B, a], color);
  poly(ctx, [B, R, a], shade(color, 0.72));
}

// Четириъгълник върху лявата (L) или дясната (R) стена; u е по хоризонтала, v — по височината.
function faceQuad(x, y, f, h, side, u0, u1, v0, v1) {
  const dx = HW * f, dy = HH * f;
  const [sx, sy, ex, ey] = side === 'L' ? [x - dx, y, x, y + dy] : [x, y + dy, x + dx, y];
  const p = (u, v) => [sx + (ex - sx) * u, sy + (ey - sy) * u - v * h];
  return [p(u0, v0), p(u1, v0), p(u1, v1), p(u0, v1)];
}

function windows(ctx, x, y, f, h, rows, cols, color, from = 0, to = 1) {
  for (const side of ['L', 'R']) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const v0 = from + (to - from) * (r + 0.25) / rows, v1 = from + (to - from) * (r + 0.72) / rows;
        poly(ctx, faceQuad(x, y, f, h, side, (c + 0.25) / cols, (c + 0.75) / cols, v0, v1), color);
      }
    }
  }
}

function columns(ctx, x, y, f, h, n, color) {
  for (const side of ['L', 'R']) {
    for (let c = 0; c < n; c++) {
      const u = (c + 0.5) / n;
      poly(ctx, faceQuad(x, y, f, h, side, u - 0.06, u + 0.06, 0, 0.85), color);
    }
  }
}

function tree(ctx, x, y, s = 1, pine = false) {
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(x - 1.5 * s, y - 8 * s, 3 * s, 8 * s);
  if (pine) {
    poly(ctx, [[x, y - 26 * s], [x + 8 * s, y - 6 * s], [x - 8 * s, y - 6 * s]], '#2f7a3c');
    poly(ctx, [[x, y - 26 * s], [x + 8 * s, y - 6 * s], [x, y - 6 * s]], '#286a33');
    return;
  }
  ctx.beginPath(); ctx.arc(x, y - 14 * s, 8 * s, 0, Math.PI * 2); ctx.fillStyle = '#4f9a40'; ctx.fill();
  ctx.beginPath(); ctx.arc(x + 3 * s, y - 12 * s, 5 * s, 0, Math.PI * 2); ctx.fillStyle = '#438a36'; ctx.fill();
  ctx.beginPath(); ctx.arc(x - 3 * s, y - 17 * s, 3.5 * s, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fill();
}

function dome(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.95, 0, Math.PI, 0); ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.25, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x, y - r - 6); ctx.moveTo(x - 2.5, y - r - 4); ctx.lineTo(x + 2.5, y - r - 4); ctx.stroke();
  ctx.lineWidth = 1;
}

function flag(ctx, x, y) {
  ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 18); ctx.stroke();
  ['#ffffff', '#00966e', '#d62612'].forEach((c, n) => { ctx.fillStyle = c; ctx.fillRect(x, y - 18 + n * 3, 10, 3); });
}

const DRAW = {
  house(ctx, x, y) {
    box(ctx, x, y + 2, 0.55, 15, '#f1dcb5');
    windows(ctx, x, y + 2, 0.55, 15, 1, 2, '#5a7d9a', 0.15, 0.85);
    roof(ctx, x, y + 2, 0.62, 15, 13, '#c8553d');
  },
  block(ctx, x, y) {
    box(ctx, x, y, 0.72, 48, '#d8d3cb');
    windows(ctx, x, y, 0.72, 48, 6, 3, '#6f8ea8', 0.04, 0.98);
  },
  shop(ctx, x, y) {
    box(ctx, x, y, 0.7, 16, '#fbf6ee');
    windows(ctx, x, y, 0.7, 16, 1, 2, '#8fc3e0', 0.05, 0.6);
    for (const side of ['L', 'R']) {
      for (let n = 0; n < 6; n++) {
        poly(ctx, faceQuad(x, y, 0.7, 16, side, n / 6, (n + 1) / 6, 0.7, 1), n % 2 ? '#ffffff' : '#e0483e');
      }
    }
  },
  office(ctx, x, y) {
    box(ctx, x, y, 0.6, 56, '#6fa8d0');
    windows(ctx, x, y, 0.6, 56, 9, 3, '#bfe1f5', 0.03, 0.98);
  },
  factory(ctx, x, y, t) {
    box(ctx, x, y, 0.8, 20, '#a99b8a');
    windows(ctx, x, y, 0.8, 20, 1, 4, '#5e5348', 0.25, 0.7);
    box(ctx, x + 9, y - 3, 0.14, 44, '#8a6f5a');
    for (let n = 0; n < 4; n++) {
      const p = (t * 0.35 + n / 4) % 1;
      ctx.beginPath(); ctx.arc(x + 9 + p * 10, y - 50 - p * 28, 4 + p * 7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,120,120,${0.55 * (1 - p)})`; ctx.fill();
    }
  },
  port(ctx, x, y) {
    poly(ctx, [[x, y - 14], [x + 28, y], [x, y + 14], [x - 28, y]], '#b9b4aa');
    box(ctx, x - 10, y + 3, 0.22, 9, '#d9573b');
    box(ctx, x - 3, y + 7, 0.22, 9, '#2f7bbf');
    box(ctx, x - 10, y - 6, 0.22, 9, '#3f9a52');
    ctx.strokeStyle = '#e8a33a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 10, y + 2); ctx.lineTo(x + 10, y - 40); ctx.lineTo(x + 26, y - 30); ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = '#555';
    ctx.beginPath(); ctx.moveTo(x + 24, y - 31); ctx.lineTo(x + 24, y - 14); ctx.stroke();
  },
  hotel(ctx, x, y) {
    box(ctx, x, y, 0.65, 40, '#ffffff');
    windows(ctx, x, y, 0.65, 40, 5, 3, '#4fb0d8', 0.05, 0.95);
    box(ctx, x, y - 40, 0.3, 4, '#f2a541');
  },
  school(ctx, x, y) {
    box(ctx, x, y, 0.78, 22, '#f2c14e');
    windows(ctx, x, y, 0.78, 22, 2, 4, '#ffffff', 0.08, 0.92);
    flag(ctx, x + 4, y - 26);
  },
  clinic(ctx, x, y) {
    box(ctx, x, y, 0.72, 24, '#f7f7f7');
    windows(ctx, x, y, 0.72, 24, 2, 3, '#9cc8de', 0.1, 0.9);
    ctx.fillStyle = '#e03a3a';
    ctx.fillRect(x - 7, y - 26, 14, 4); ctx.fillRect(x - 2, y - 30, 4, 12);
  },
  park(ctx, x, y, t, i, j) {
    poly(ctx, diamond(i, j, 0.95), '#7cc25c');
    poly(ctx, [[x - 22, y - 2], [x - 18, y - 4], [x + 22, y + 2], [x + 18, y + 4]], '#e8d9a6');
    tree(ctx, x - 12, y - 6, 0.85); tree(ctx, x + 12, y - 4, 0.75); tree(ctx, x - 2, y + 8, 0.9);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(x + 6, y + 4, 8, 2);
  },
  bus(ctx, x, y) {
    box(ctx, x - 4, y, 0.32, 12, '#b9dcef', '#3d7fb0');
    ctx.strokeStyle = '#444'; ctx.beginPath(); ctx.moveTo(x + 10, y + 2); ctx.lineTo(x + 10, y - 20); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 10, y - 22, 5, 0, Math.PI * 2); ctx.fillStyle = '#1f6fb8'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('A', x + 10, y - 19.5);
  },
  chitalishte(ctx, x, y) {
    box(ctx, x, y, 0.66, 22, '#ead9b5');
    columns(ctx, x, y, 0.66, 22, 3, '#fffaf0');
    roof(ctx, x, y, 0.7, 22, 10, '#b5523b');
  },
  cathedral(ctx, x, y) {
    box(ctx, x, y, 0.78, 28, '#efe4cf');
    windows(ctx, x, y, 0.78, 28, 1, 3, '#7a5b3d', 0.2, 0.85);
    box(ctx, x, y - 28, 0.34, 14, '#efe4cf');
    dome(ctx, x, y - 44, 9, '#e3b341');
    dome(ctx, x - 18, y - 28, 5, '#e3b341');
    dome(ctx, x + 18, y - 28, 5, '#e3b341');
    dome(ctx, x, y - 20, 5, '#e3b341');
  },
  theatre(ctx, x, y) {
    box(ctx, x, y, 0.82, 30, '#f2e3c4');
    columns(ctx, x, y, 0.82, 30, 4, '#ffffff');
    box(ctx, x, y - 30, 0.5, 6, '#d9c7a0');
    dome(ctx, x, y - 38, 8, '#4d8f7a');
  },
  museum(ctx, x, y) {
    box(ctx, x, y, 0.82, 24, '#e7dcc8');
    windows(ctx, x, y, 0.82, 24, 2, 4, '#7b6a52', 0.1, 0.9);
    roof(ctx, x, y, 0.86, 24, 10, '#a8503a');
    ctx.fillStyle = '#e3b341'; ctx.beginPath(); ctx.arc(x, y - 30, 3, 0, Math.PI * 2); ctx.fill();
  },
  terme(ctx, x, y) {
    poly(ctx, [[x, y - 14], [x + 28, y], [x, y + 14], [x - 28, y]], '#d8c39a');
    const wall = (wx, wy, h) => {
      box(ctx, wx, wy, 0.2, h, '#c08a5a');
    };
    wall(x - 14, y - 2, 22); wall(x, y - 8, 16); wall(x + 14, y - 2, 24); wall(x, y + 6, 12);
    ctx.fillStyle = '#5b3d26';
    ctx.beginPath(); ctx.ellipse(x - 14, y - 12, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 14, y - 13, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  },
  seaStation(ctx, x, y) {
    box(ctx, x, y, 0.78, 24, '#f4efe4');
    windows(ctx, x, y, 0.78, 24, 2, 4, '#5c88b0', 0.1, 0.9);
    box(ctx, x + 6, y - 2, 0.2, 52, '#f4efe4');
    roof(ctx, x + 6, y - 2, 0.24, 52, 9, '#3f6f8f');
  },
  bridge(ctx, x, y, t, i, j) {
    const up = 24;
    const a = proj(i + 0.25, j), b = proj(i + 0.75, j), c = proj(i + 0.75, j + 1), d = proj(i + 0.25, j + 1);
    const lift = p => [p[0], p[1] - up];
    poly(ctx, [b, c, [c[0], c[1] - up], [b[0], b[1] - up]], 'rgba(60,70,80,.25)');
    ctx.strokeStyle = '#8b96a0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x - 4, y - up); ctx.moveTo(x + 6, y - 2); ctx.lineTo(x + 6, y - up); ctx.stroke();
    ctx.lineWidth = 1;
    poly(ctx, [lift(a), lift(b), lift(c), lift(d)], '#9aa3ab');
    poly(ctx, [lift(b), lift(c), [c[0], c[1] - up + 4], [b[0], b[1] - up + 4]], '#6d7780');
    ctx.strokeStyle = '#f5f5f5'; ctx.setLineDash([3, 3]);
    const m1 = proj(i + 0.5, j), m2 = proj(i + 0.5, j + 1);
    ctx.beginPath(); ctx.moveTo(m1[0], m1[1] - up); ctx.lineTo(m2[0], m2[1] - up); ctx.stroke();
    ctx.setLineDash([]);
  },
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cam = { x: 0, y: 0, z: 1 };
    this.resize();
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.canvas.width = this.w * this.dpr; this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
  }

  center() {
    const z = Math.max(0.55, Math.min(1.6, Math.min(this.w / (N * HW * 2 * 0.7), this.h / (N * HH * 2 * 0.75))));
    const [cx, cy] = proj(N * 0.48, N * 0.5);
    this.cam = { z, x: this.w / 2 - cx * z, y: this.h / 2 - cy * z };
  }

  screenToTile(sx, sy) {
    const a = (sx - this.cam.x) / this.cam.z / HW, b = (sy - this.cam.y) / this.cam.z / HH;
    return { i: Math.floor((a + b) / 2), j: Math.floor((b - a) / 2) };
  }

  zoomAt(sx, sy, factor) {
    const z = Math.max(0.4, Math.min(3, this.cam.z * factor));
    const wx = (sx - this.cam.x) / this.cam.z, wy = (sy - this.cam.y) / this.cam.z;
    this.cam.z = z; this.cam.x = sx - wx * z; this.cam.y = sy - wy * z;
  }

  draw(s, ev, view, t) {
    const { ctx, dpr, cam } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#2a86c4';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * cam.x, dpr * cam.y);

    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) this.tile(s, i, j, t);

    if (view.overlay) this.overlay(s, ev, view.overlay);
    if (view.radius) this.radius(view.radius);
    if (view.hover && inside(view.hover.i, view.hover.j)) {
      poly(ctx, diamond(view.hover.i, view.hover.j), view.hover.ok ? 'rgba(255,255,255,.3)' : 'rgba(230,60,60,.35)');
      ctx.lineWidth = 2;
      poly(ctx, diamond(view.hover.i, view.hover.j), null, view.hover.ok ? '#ffffff' : '#e03a3a');
      ctx.lineWidth = 1;
    }

    for (let sum = 0; sum <= 2 * N - 2; sum++) {
      for (let i = Math.max(0, sum - N + 1); i <= Math.min(N - 1, sum); i++) {
        const j = sum - i, k = idx(i, j), b = s.b[k];
        const [x, y] = proj(i + 0.5, j + 0.5);
        if (b && b !== 'road') {
          DRAW[b](ctx, x, y, t, i, j);
          if (ev.inactive.has(k)) this.noRoad(x, y - (TOP[b] || 40) - 8, t);
        } else if (!b && s.trees[k]) {
          const h = hash(i, j);
          tree(ctx, x + (h % 9) - 4, y + ((h >> 4) % 5) - 2, 0.8 + (h % 5) / 20, s.terrain[k] === 'hill');
        }
      }
    }
  }

  tile(s, i, j, t) {
    const { ctx } = this, k = idx(i, j), ter = s.terrain[k];
    const h = hash(i, j), pts = diamond(i, j);
    poly(ctx, pts, TERRAIN[ter][h & 1]);
    if (WATER.has(ter)) {
      if (h % 4 === 0) {
        const [x, y] = proj(i + 0.5, j + 0.5), o = Math.sin(t * 1.5 + i * 0.7 + j * 0.4) * 4;
        ctx.strokeStyle = 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.moveTo(x - 9 + o, y); ctx.quadraticCurveTo(x - 4 + o, y - 3, x + o, y); ctx.stroke();
      }
    } else {
      poly(ctx, pts, null, 'rgba(0,0,0,.05)');
    }
    if (s.b[k] === 'road') this.road(s, i, j);
  }

  road(s, i, j) {
    const { ctx } = this;
    poly(ctx, diamond(i, j, 0.98), '#8d939a');
    const [x, y] = proj(i + 0.5, j + 0.5);
    ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
    let any = false;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = inside(i + di, j + dj) && s.b[idx(i + di, j + dj)];
      if (n && BUILDINGS[n].road) {
        const [ex, ey] = proj(i + 0.5 + di / 2, j + 0.5 + dj / 2);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        any = true;
      }
    }
    ctx.setLineDash([]); ctx.lineWidth = 1;
    if (!any) { ctx.fillStyle = '#f2f2f2'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
  }

  // Оцветява домовете според фактора: червено е зле, зелено е добре.
  overlay(s, ev, factor) {
    const { ctx } = this;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) poly(ctx, diamond(i, j), 'rgba(20,30,50,.18)');
    if (factor === 'nature' || factor === 'health') {
      ev.pollution.forEach((p, k) => {
        if (p > 1) poly(ctx, diamond(k % N, (k / N) | 0), `rgba(120,80,40,${Math.min(0.55, p / 60)})`);
      });
    }
    for (const [k, v] of ev.local) {
      if (v[factor] === undefined) continue;
      const hue = Math.round(v[factor] * 1.2);
      poly(ctx, diamond(k % N, (k / N) | 0), `hsla(${hue},80%,50%,.75)`);
    }
    s.b.forEach((t, k) => {
      if (t && BUILDINGS[t].serve && BUILDINGS[t].serve.f === factor) {
        ctx.lineWidth = 2.5;
        poly(ctx, diamond(k % N, (k / N) | 0), null, '#ffffff');
        ctx.lineWidth = 1;
      }
    });
  }

  radius({ i, j, r, color }) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (inside(i + di, j + dj) && Math.hypot(di, dj) <= r) poly(this.ctx, diamond(i + di, j + dj), color);
      }
    }
  }

  noRoad(x, y, t) {
    const { ctx } = this, bob = Math.sin(t * 4) * 2;
    ctx.beginPath(); ctx.arc(x, y + bob, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#e03a3a'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', x, y + bob + 0.5);
    ctx.textBaseline = 'alphabetic';
  }
}
