/* БУМ – графики, свързани с работата на всеки човек.
   Всичко се рисува като SVG (400×300), без външни файлове.
   BUMArt.svg(person) → низ със SVG. */
(function () {
  'use strict';
  var W = 400, H = 300;

  /* Цветове по област: фон (два тона за градиент) и два акцента. */
  var PAL = {
    /* Фон в тъмносиньо на ОбР, акцентите – цветовете от логото на ОбР */
    math:    ['#0A2A66', '#2a0f4a', '#faaf42', '#d88ad7'],
    cs:      ['#0A2A66', '#063a3a', '#14BF96', '#faaf42'],
    physics: ['#0A2A66', '#0a3d66', '#28AAE1', '#faaf42'],
    astro:   ['#071c47', '#0A2A66', '#faaf42', '#9fc4ff'],
    chem:    ['#0A2A66', '#3a0f3a', '#f07ab5', '#14BF96'],
    bio:     ['#0A2A66', '#0f3d2a', '#8cc640', '#faaf42'],
    med:     ['#0A2A66', '#3d1530', '#f15b25', '#ffd8a8'],
    eng:     ['#0A2A66', '#2e2a3a', '#FA961E', '#28AAE1'],
    econ:    ['#0A2A66', '#123d3a', '#3CB44B', '#faaf42'],
    games:   ['#0A2A66', '#1b1f3a', '#f2ecdf', '#FA961E'],
    edu:     ['#0A2A66', '#3a2a14', '#faaf42', '#28AAE1'],
    earth:   ['#0A2A66', '#24331a', '#8cc640', '#28AAE1']
  };


  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function f(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function frame(p, uid, body) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="g' + uid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p[0] + '"/><stop offset="1" stop-color="' + p[1] + '"/></linearGradient>' +
      '<radialGradient id="r' + uid + '" cx=".75" cy=".2" r=".8"><stop offset="0" stop-color="' + p[2] + '" stop-opacity=".22"/><stop offset="1" stop-color="' + p[2] + '" stop-opacity="0"/></radialGradient>' +
      '<filter id="b' + uid + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#g' + uid + ')"/><rect width="' + W + '" height="' + H + '" fill="url(#r' + uid + ')"/>' +
      body + '</svg>';
  }
  function grid(c, step, op) {
    var s = '<g stroke="' + c + '" stroke-opacity="' + (op || 0.08) + '" stroke-width="1">';
    for (var x = step; x < W; x += step) s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '"/>';
    for (var y = step; y < H; y += step) s += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '"/>';
    return s + '</g>';
  }
  function glow(uid, inner) { return '<g filter="url(#b' + uid + ')" opacity=".7">' + inner + '</g>' + inner; }
  function stars(r, n, c) { var s = '<g fill="' + c + '">'; for (var i = 0; i < n; i++) s += '<circle cx="' + f(r() * W) + '" cy="' + f(r() * H) + '" r="' + f(r() * 1.3 + .3) + '" opacity="' + f(r() * .6 + .2) + '"/>'; return s + '</g>'; }
  function poly(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1]); }).join(''); }
  function hexPath(cx, cy, R) { var pts = []; for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i + Math.PI / 6; pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } return poly(pts) + 'Z'; }

  /* ---------- мотиви ---------- */
  var M = {};
  M.curve = function (r, p, u) {
    var s = grid(p[3], 25, .07) + '<g stroke="' + p[3] + '" stroke-opacity=".35"><line x1="0" y1="150" x2="400" y2="150"/><line x1="200" y1="0" x2="200" y2="300"/></g>';
    var inner = '';
    for (var k = 0; k < 3; k++) {
      var a = 30 + r() * 60, w = .012 + r() * .03, ph = r() * 6, b = r() * 20 - 10, pts = [];
      for (var x = 0; x <= W; x += 4) pts.push([x, 150 - a * Math.sin(w * x + ph) * Math.exp(-Math.pow((x - 200) / 260, 2)) - b]);
      inner += '<path d="' + poly(pts) + '" fill="none" stroke="' + (k ? p[3] : p[2]) + '" stroke-width="' + (k ? 1.5 : 3) + '" stroke-opacity="' + (k ? .6 : 1) + '"/>';
    }
    return s + glow(u, inner);
  };
  M.polynomial = function (r, p, u) {
    var cx = 200, cy = 150, R = 110, s = grid(p[3], 22, .06);
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + p[3] + '" stroke-opacity=".5" stroke-dasharray="4 5"/>';
    s += '<g stroke="' + p[3] + '" stroke-opacity=".3"><line x1="40" y1="150" x2="360" y2="150"/><line x1="200" y1="20" x2="200" y2="280"/></g>';
    var inner = '';
    for (var i = 0; i < 6; i++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r()) * R * .95, x = cx + d * Math.cos(a), y = cy + d * Math.sin(a);
      inner += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="5" fill="' + p[2] + '"/>';
      var a2 = a + r() - .5, d2 = d * (.4 + r() * .4);
      inner += '<circle cx="' + f(cx + d2 * Math.cos(a2)) + '" cy="' + f(cy + d2 * Math.sin(a2)) + '" r="4" fill="none" stroke="' + p[3] + '" stroke-width="2"/>';
    }
    return s + glow(u, inner);
  };
  M.graph = function (r, p, u) {
    var n = 16, pts = [], s = '', i, j;
    for (i = 0; i < n; i++) pts.push([30 + r() * 340, 25 + r() * 250]);
    var e = '';
    for (i = 0; i < n; i++) {
      var ds = pts.map(function (q, k) { return [Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), k]; }).sort(function (a, b) { return a[0] - b[0]; });
      for (j = 1; j <= 2; j++) e += '<line x1="' + f(pts[i][0]) + '" y1="' + f(pts[i][1]) + '" x2="' + f(pts[ds[j][1]][0]) + '" y2="' + f(pts[ds[j][1]][1]) + '"/>';
    }
    s += '<g stroke="' + p[3] + '" stroke-opacity=".45" stroke-width="1.5">' + e + '</g>';
    var path = [0], cur = 0;
    for (i = 0; i < 4; i++) { var best = -1, bd = 1e9; for (j = 0; j < n; j++) if (path.indexOf(j) < 0) { var d = Math.hypot(pts[j][0] - pts[cur][0], pts[j][1] - pts[cur][1]); if (d < bd) { bd = d; best = j; } } path.push(best); cur = best; }
    var inner = '<path d="' + poly(path.map(function (k) { return pts[k]; })) + '" fill="none" stroke="' + p[2] + '" stroke-width="3.5" stroke-linecap="round"/>';
    pts.forEach(function (q, k) { inner += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (path.indexOf(k) >= 0 ? 7 : 5) + '" fill="' + (path.indexOf(k) >= 0 ? p[2] : p[0]) + '" stroke="' + (path.indexOf(k) >= 0 ? p[2] : p[3]) + '" stroke-width="2"/>'; });
    return s + glow(u, inner);
  };
  M.binary = function (r, p, u) {
    var s = '<g font-family="ui-monospace,Menlo,Consolas,monospace" font-size="17" font-weight="700">';
    for (var y = 24; y < H; y += 26) for (var x = 12; x < W; x += 20) {
      var hi = r() < .12, b = r() < .5 ? '0' : '1';
      s += '<text x="' + x + '" y="' + y + '" fill="' + (hi ? p[2] : p[3]) + '" opacity="' + (hi ? 1 : f(.12 + r() * .25)) + '">' + b + '</text>';
    }
    return s + '</g>';
  };
  M.circuit = function (r, p, u) {
    var s = grid(p[3], 20, .05), tr = '';
    for (var i = 0; i < 18; i++) {
      var x = Math.round(r() * 20) * 20, y = Math.round(r() * 15) * 20, pts = [[x, y]];
      for (var k = 0; k < 3; k++) { if (k % 2 === 0) x += (r() < .5 ? -1 : 1) * Math.round(2 + r() * 6) * 20; else y += (r() < .5 ? -1 : 1) * Math.round(1 + r() * 4) * 20; pts.push([x, y]); }
      tr += '<path d="' + poly(pts) + '" fill="none"/><circle cx="' + pts[3][0] + '" cy="' + pts[3][1] + '" r="4" fill="' + p[0] + '"/>';
    }
    s += '<g stroke="' + p[3] + '" stroke-opacity=".55" stroke-width="2">' + tr + '</g>';
    var inner = '<rect x="150" y="100" width="100" height="100" rx="8" fill="' + p[0] + '" stroke="' + p[2] + '" stroke-width="3"/>';
    for (var j = 0; j < 5; j++) { inner += '<line x1="' + (162 + j * 19) + '" y1="88" x2="' + (162 + j * 19) + '" y2="100" stroke="' + p[2] + '" stroke-width="3"/><line x1="' + (162 + j * 19) + '" y1="200" x2="' + (162 + j * 19) + '" y2="212" stroke="' + p[2] + '" stroke-width="3"/>'; }
    inner += '<rect x="172" y="122" width="56" height="56" rx="4" fill="none" stroke="' + p[2] + '" stroke-opacity=".6"/>';
    return s + glow(u, inner);
  };
  M.wave = function (r, p, u) {
    var inner = '';
    for (var k = 0; k < 7; k++) {
      var pts = [], a = 18 + k * 6, w = .02 + r() * .015, ph = r() * 6;
      for (var x = 0; x <= W; x += 4) pts.push([x, 150 + a * Math.sin(w * x + ph + k * .5) * Math.cos(.006 * x + k)]);
      inner += '<path d="' + poly(pts) + '" fill="none" stroke="' + (k % 2 ? p[3] : p[2]) + '" stroke-width="' + (k === 3 ? 3 : 1.4) + '" stroke-opacity="' + f(.35 + .1 * k) + '"/>';
    }
    return glow(u, inner);
  };
  M.atom = function (r, p, u) {
    var cx = 200, cy = 150, inner = '', rot = r() * 60;
    for (var k = 0; k < 3; k++) {
      var a = rot + k * 60;
      inner += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="140" ry="44" fill="none" stroke="' + p[3] + '" stroke-width="2" stroke-opacity=".7" transform="rotate(' + f(a) + ' ' + cx + ' ' + cy + ')"/>';
      var t = r() * 6.28, ex = 140 * Math.cos(t), ey = 44 * Math.sin(t), ra = a * Math.PI / 180;
      inner += '<circle cx="' + f(cx + ex * Math.cos(ra) - ey * Math.sin(ra)) + '" cy="' + f(cy + ex * Math.sin(ra) + ey * Math.cos(ra)) + '" r="6" fill="' + p[2] + '"/>';
    }
    for (var i = 0; i < 7; i++) { var aa = i / 7 * 6.28; inner += '<circle cx="' + f(cx + 10 * Math.cos(aa)) + '" cy="' + f(cy + 10 * Math.sin(aa)) + '" r="8" fill="' + (i % 2 ? p[2] : p[3]) + '"/>'; }
    return stars(r, 40, p[3]) + glow(u, inner);
  };
  M.crystal = function (r, p, u) {
    var s = '', inner = '', R = 15;
    for (var row = 0; row < 12; row++) for (var col = 0; col < 16; col++) {
      var x = col * 27 + (row % 2) * 13.5 + 5, y = 300 - row * 23 - 10, h = 4 + Math.sin(col * .7 + r() * .3) * 2.5 + (col > 9 && col < 14 ? 3 : 0);
      if (row < h) s += '<path d="' + hexPath(x, y, R - 3) + '" fill="' + (row < 2 ? p[3] : p[2]) + '" fill-opacity="' + f(row < 2 ? .25 : .55 + r() * .3) + '" stroke="' + p[2] + '" stroke-opacity=".6"/>';
    }
    return grid(p[3], 30, .05) + glow(u, s);
  };
  M.molecule = function (r, p, u) {
    var inner = '', R = 30, cx = 90 + r() * 30, cy = 150, pts = [];
    for (var i = 0; i < 4; i++) {
      var x = cx + i * R * 1.73, y = cy + (i % 2 ? R * 0.5 : -R * 0.5) * 1.0;
      inner += '<path d="' + hexPath(x, y, R) + '" fill="none" stroke="' + p[2] + '" stroke-width="3"/>';
      if (r() < .6) inner += '<path d="' + hexPath(x, y, R * .62) + '" fill="none" stroke="' + p[3] + '" stroke-width="1.5" stroke-opacity=".7"/>';
      pts.push([x, y]);
    }
    for (var j = 0; j < 5; j++) { var q = pts[Math.floor(r() * pts.length)], a = r() * 6.28; var x2 = q[0] + 60 * Math.cos(a), y2 = q[1] + 60 * Math.sin(a); inner += '<line x1="' + f(q[0] + R * Math.cos(a)) + '" y1="' + f(q[1] + R * Math.sin(a)) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + p[3] + '" stroke-width="2"/><circle cx="' + f(x2) + '" cy="' + f(y2) + '" r="7" fill="' + p[3] + '"/>'; }
    return stars(r, 30, p[3]) + glow(u, inner);
  };
  M.orbit = function (r, p, u) {
    var inner = '<circle cx="120" cy="190" r="56" fill="' + p[3] + '" fill-opacity=".85"/><path d="M70 175 Q120 160 170 180" stroke="' + p[0] + '" stroke-opacity=".4" stroke-width="6" fill="none"/>';
    inner += '<ellipse cx="190" cy="160" rx="170" ry="70" fill="none" stroke="' + p[2] + '" stroke-width="2" stroke-dasharray="6 6" transform="rotate(-12 190 160)"/>';
    var t = r() * 2 + 4.2, x = 190 + 170 * Math.cos(t), y = 160 + 70 * Math.sin(t), a = -12 * Math.PI / 180;
    var X = 190 + (x - 190) * Math.cos(a) - (y - 160) * Math.sin(a), Y = 160 + (x - 190) * Math.sin(a) + (y - 160) * Math.cos(a);
    inner += '<circle cx="' + f(X) + '" cy="' + f(Y) + '" r="8" fill="' + p[2] + '"/><circle cx="330" cy="60" r="16" fill="' + p[2] + '" fill-opacity=".9"/>';
    return stars(r, 90, '#fff') + glow(u, inner);
  };
  M.stars = function (r, p, u) {
    var pts = [], inner = '';
    for (var i = 0; i < 7; i++) pts.push([60 + r() * 280, 40 + r() * 200]);
    pts.sort(function (a, b) { return a[0] - b[0]; });
    inner += '<path d="' + poly(pts) + '" fill="none" stroke="' + p[3] + '" stroke-width="1.5" stroke-opacity=".8"/>';
    pts.forEach(function (q) { inner += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + f(3 + r() * 3) + '" fill="' + p[2] + '"/>'; });
    inner += '<path d="M20 300 A 220 220 0 0 1 380 300" fill="none" stroke="' + p[3] + '" stroke-opacity=".25" stroke-width="1"/><path d="M60 300 A 180 180 0 0 1 340 300" fill="none" stroke="' + p[3] + '" stroke-opacity=".2"/>';
    return stars(r, 140, '#fff') + glow(u, inner);
  };
  M.dna = function (r, p, u) {
    var inner = '', a = [], b = [], ph = r() * 6;
    for (var x = 0; x <= W; x += 4) { a.push([x, 150 + 60 * Math.sin(x * .035 + ph)]); b.push([x, 150 - 60 * Math.sin(x * .035 + ph)]); }
    for (var x2 = 6; x2 < W; x2 += 14) { var y1 = 150 + 60 * Math.sin(x2 * .035 + ph); inner += '<line x1="' + x2 + '" y1="' + f(y1) + '" x2="' + x2 + '" y2="' + f(300 - y1) + '" stroke="' + (r() < .5 ? p[2] : p[3]) + '" stroke-width="3" stroke-opacity=".55"/>'; }
    inner += '<path d="' + poly(a) + '" fill="none" stroke="' + p[2] + '" stroke-width="4"/><path d="' + poly(b) + '" fill="none" stroke="' + p[3] + '" stroke-width="4"/>';
    return glow(u, inner);
  };
  M.cell = function (r, p, u) {
    var inner = '<circle cx="200" cy="150" r="128" fill="' + p[3] + '" fill-opacity=".06" stroke="' + p[3] + '" stroke-opacity=".5" stroke-width="2"/>';
    for (var i = 0; i < 22; i++) {
      var a = r() * 6.28, d = Math.sqrt(r()) * 105, x = 200 + d * Math.cos(a), y = 150 + d * Math.sin(a), rot = r() * 180, L = 22 + r() * 18;
      inner += '<rect x="' + f(x - L / 2) + '" y="' + f(y - 5) + '" width="' + f(L) + '" height="10" rx="5" fill="' + (r() < .3 ? p[3] : p[2]) + '" fill-opacity=".85" transform="rotate(' + f(rot) + ' ' + f(x) + ' ' + f(y) + ')"/>';
    }
    return glow(u, inner);
  };
  M.heart = function (r, p, u) {
    var pts = [], x = 0, y0 = 160;
    while (x < W) { pts.push([x, y0]); x += 30 + r() * 20; pts.push([x, y0]); pts.push([x + 6, y0 - 10]); pts.push([x + 12, y0 + 6]); pts.push([x + 18, y0 - 90 - r() * 20]); pts.push([x + 26, y0 + 40]); pts.push([x + 34, y0]); x += 40; }
    return grid(p[3], 20, .1) + glow(u, '<path d="' + poly(pts) + '" fill="none" stroke="' + p[2] + '" stroke-width="3" stroke-linejoin="round"/>');
  };
  M.chart = function (r, p, u) {
    var s = grid(p[3], 25, .07), n = 9, bw = 26, pts = [], v = 60 + r() * 30;
    for (var i = 0; i < n; i++) {
      v = Math.max(30, Math.min(220, v + (r() - .35) * 45)); var x = 40 + i * 38;
      s += '<rect x="' + x + '" y="' + f(270 - v) + '" width="' + bw + '" height="' + f(v) + '" rx="3" fill="' + p[3] + '" fill-opacity=".35"/>';
      pts.push([x + bw / 2, 270 - v - 20]);
    }
    var inner = '<path d="' + poly(pts) + '" fill="none" stroke="' + p[2] + '" stroke-width="3.5" stroke-linejoin="round"/>';
    pts.forEach(function (q) { inner += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="5" fill="' + p[2] + '"/>'; });
    return s + glow(u, inner);
  };
  function gearPath(cx, cy, R, n) {
    var d = '', r0 = R * .82;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, s = Math.PI / n;
      var pts = [[a - s * .55, r0], [a - s * .35, R], [a + s * .35, R], [a + s * .55, r0]];
      pts.forEach(function (q, k) { d += (i === 0 && k === 0 ? 'M' : 'L') + f(cx + q[1] * Math.cos(q[0])) + ' ' + f(cy + q[1] * Math.sin(q[0])); });
    }
    return d + 'Z';
  }
  M.gear = function (r, p, u) {
    var inner = '<path d="' + gearPath(150, 160, 85, 14) + '" fill="none" stroke="' + p[2] + '" stroke-width="3"/><circle cx="150" cy="160" r="22" fill="none" stroke="' + p[2] + '" stroke-width="3"/>';
    inner += '<path d="' + gearPath(272, 98, 52, 9) + '" fill="none" stroke="' + p[3] + '" stroke-width="3"/><circle cx="272" cy="98" r="13" fill="none" stroke="' + p[3] + '" stroke-width="3"/>';
    inner += '<path d="' + gearPath(300, 225, 38, 7) + '" fill="none" stroke="' + p[3] + '" stroke-width="2" stroke-opacity=".7"/>';
    return grid(p[3], 25, .05) + glow(u, inner);
  };
  M.bridge = function (r, p, u) {
    var inner = '', base = 205;
    inner += '<line x1="0" y1="' + (base - 60) + '" x2="400" y2="' + (base - 60) + '" stroke="' + p[2] + '" stroke-width="5"/>';
    inner += '<path d="M40 ' + base + ' Q200 ' + (base - 230) + ' 360 ' + base + '" fill="none" stroke="' + p[2] + '" stroke-width="4"/>';
    for (var x = 60; x <= 340; x += 20) { var t = (x - 40) / 320, y = base - 2 * t * (1 - t) * 230 / 1; inner += '<line x1="' + x + '" y1="' + (base - 60) + '" x2="' + x + '" y2="' + f(Math.min(base - 60, y)) + '" stroke="' + p[3] + '" stroke-opacity=".6"/>'; }
    var refl = '<path d="M40 ' + base + ' Q200 ' + (base + 150) + ' 360 ' + base + '" fill="none" stroke="' + p[2] + '" stroke-opacity=".25" stroke-width="3" stroke-dasharray="3 6"/>';
    var water = ''; for (var k = 0; k < 6; k++) water += '<line x1="' + f(r() * 300) + '" y1="' + (225 + k * 12) + '" x2="' + f(80 + r() * 320) + '" y2="' + (225 + k * 12) + '" stroke="' + p[3] + '" stroke-opacity=".2" stroke-width="2"/>';
    return water + refl + glow(u, inner);
  };
  M.chess = function (r, p, u) {
    var s = '', sz = 34, ox = 64, oy = 14;
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) if ((i + j) % 2) s += '<rect x="' + (ox + i * sz) + '" y="' + (oy + j * sz) + '" width="' + sz + '" height="' + sz + '" fill="' + p[2] + '" fill-opacity=".14"/>';
    s += '<rect x="' + ox + '" y="' + oy + '" width="' + sz * 8 + '" height="' + sz * 8 + '" fill="none" stroke="' + p[2] + '" stroke-opacity=".5"/>';
    var c = [Math.floor(r() * 3), 7], pts = [], mv = [[1, -2], [2, -1], [-1, -2], [1, -2], [2, 1], [-2, -1]];
    pts.push(c.slice());
    for (var k = 0; k < 5; k++) { var m = mv[Math.floor(r() * mv.length)], nx = c[0] + m[0], ny = c[1] + m[1]; if (nx < 0 || nx > 7 || ny < 0 || ny > 7) { nx = c[0] - m[0]; ny = c[1] - m[1]; } if (nx < 0 || nx > 7 || ny < 0 || ny > 7) continue; c = [nx, ny]; pts.push(c.slice()); }
    var P = pts.map(function (q) { return [ox + q[0] * sz + sz / 2, oy + q[1] * sz + sz / 2]; });
    var inner = '<path d="' + poly(P) + '" fill="none" stroke="' + p[3] + '" stroke-width="3" stroke-linejoin="round"/>';
    P.forEach(function (q, k) { inner += '<circle cx="' + f(q[0]) + '" cy="' + f(q[1]) + '" r="' + (k === P.length - 1 ? 9 : 5) + '" fill="' + p[3] + '"/>'; });
    inner += '<text x="' + f(P[0][0]) + '" y="' + f(P[0][1] + 9) + '" font-size="30" text-anchor="middle" fill="' + p[2] + '">♞</text>';
    return s + glow(u, inner);
  };
  M.plane = function (r, p, u) {
    var clouds = ''; for (var i = 0; i < 6; i++) { var x = r() * 400, y = 40 + r() * 220; clouds += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(30 + r() * 30) + '" ry="10" fill="' + p[3] + '" fill-opacity=".12"/>'; }
    var inner = '<path d="M20 260 C 120 250, 180 120, 300 90" fill="none" stroke="' + p[2] + '" stroke-width="3" stroke-dasharray="8 7"/>';
    inner += '<g transform="translate(318 82) rotate(-20)"><path d="M-26 0 L22 -3 Q30 0 22 3 Z" fill="' + p[2] + '"/><path d="M-2 -2 L-12 -22 L-4 -22 L10 -2 Z M-2 2 L-12 22 L-4 22 L10 2 Z" fill="' + p[2] + '"/><path d="M-24 -1 L-30 -10 L-25 -10 L-18 -1Z" fill="' + p[2] + '"/></g>';
    return clouds + grid(p[3], 40, .05) + glow(u, inner);
  };
  M.book = function (r, p, u) {
    var inner = '<path d="M60 90 Q130 70 200 95 Q270 70 340 90 L340 250 Q270 230 200 255 Q130 230 60 250 Z" fill="' + p[0] + '" stroke="' + p[2] + '" stroke-width="3"/><line x1="200" y1="95" x2="200" y2="255" stroke="' + p[2] + '" stroke-width="2"/>';
    for (var k = 0; k < 6; k++) { inner += '<line x1="80" y1="' + (115 + k * 20) + '" x2="' + f(150 + r() * 30) + '" y2="' + (112 + k * 20) + '" stroke="' + p[3] + '" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/><line x1="220" y1="' + (112 + k * 20) + '" x2="' + f(290 + r() * 30) + '" y2="' + (115 + k * 20) + '" stroke="' + p[3] + '" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>'; }
    var syms = ['1', '2', '3', '+', '=', 'π', '÷', '×', 'А', 'Б', '√', '∞'], fl = '';
    for (var i = 0; i < 12; i++) fl += '<text x="' + f(70 + r() * 260) + '" y="' + f(20 + r() * 60) + '" font-size="' + f(16 + r() * 14) + '" font-weight="700" fill="' + (i % 2 ? p[2] : p[3]) + '" opacity="' + f(.4 + r() * .6) + '" font-family="Georgia,serif">' + syms[i] + '</text>';
    return glow(u, inner) + fl;
  };
  M.leaf = function (r, p, u) {
    var out = '';
    function br(x, y, a, L, d) {
      if (d === 0 || L < 4) return;
      var x2 = x + L * Math.cos(a), y2 = y + L * Math.sin(a);
      out += '<line x1="' + f(x) + '" y1="' + f(y) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + (d < 3 ? p[2] : p[3]) + '" stroke-width="' + f(d * .9) + '" stroke-linecap="round"/>';
      br(x2, y2, a - .35 - r() * .25, L * (.68 + r() * .1), d - 1);
      br(x2, y2, a + .35 + r() * .25, L * (.68 + r() * .1), d - 1);
    }
    br(200, 300, -Math.PI / 2, 70, 8);
    return glow(u, out);
  };
  M.neural = function (r, p, u) {
    var layers = [4, 6, 6, 3], X = [70, 160, 250, 340], nodes = [], s = '', inner = '';
    layers.forEach(function (n, i) { nodes.push([]); for (var k = 0; k < n; k++) nodes[i].push([X[i], 150 + (k - (n - 1) / 2) * 42]); });
    for (var i = 0; i < 3; i++) nodes[i].forEach(function (a) { nodes[i + 1].forEach(function (b) { var w = r(); s += '<line x1="' + a[0] + '" y1="' + f(a[1]) + '" x2="' + b[0] + '" y2="' + f(b[1]) + '" stroke="' + (w > .8 ? p[2] : p[3]) + '" stroke-opacity="' + f(w > .8 ? .9 : .18) + '" stroke-width="' + (w > .8 ? 2 : 1) + '"/>'; }); });
    nodes.forEach(function (L) { L.forEach(function (q) { inner += '<circle cx="' + q[0] + '" cy="' + f(q[1]) + '" r="9" fill="' + p[0] + '" stroke="' + p[2] + '" stroke-width="3"/>'; }); });
    return s + glow(u, inner);
  };

  /* ---------- ръчно нарисувани за „10 БУМа“ ---------- */
  var C = {};
  C.atanasoff = function (r, p, u) {
    var s = M.binary(r, [p[0], p[1], p[2], p[3]], u).replace(/opacity="0\.\d+"/g, 'opacity=".12"');
    var inner = '', cx = 200, cy = 150;
    [118, 92].forEach(function (R, ring) {
      inner += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="' + p[3] + '" stroke-opacity=".5" stroke-width="1.5"/>';
      for (var i = 0; i < 32; i++) { var a = i / 32 * 6.283, on = r() < .5; inner += '<circle cx="' + f(cx + (R - 12) * Math.cos(a)) + '" cy="' + f(cy + (R - 12) * Math.sin(a)) + '" r="' + (on ? 5 : 3) + '" fill="' + (on ? p[2] : 'none') + '" stroke="' + p[2] + '" stroke-width="1.5"/>'; }
    });
    inner += '<circle cx="200" cy="150" r="52" fill="' + p[0] + '" stroke="' + p[2] + '" stroke-width="2"/><text x="200" y="146" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="18" fill="' + p[2] + '">0101</text><text x="200" y="168" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="12" fill="' + p[3] + '">ABC · 1942</text>';
    return s + glow(u, inner);
  };
  C.beron = function (r, p, u) {
    var fish = '<path d="M70 165 C 120 95, 250 90, 300 150 C 250 205, 130 215, 70 165 Z" fill="none" stroke="' + p[2] + '" stroke-width="4"/>' +
      '<path d="M300 150 L350 112 L340 152 L352 192 Z" fill="none" stroke="' + p[2] + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="M170 110 Q190 72 230 102" fill="none" stroke="' + p[2] + '" stroke-width="4"/><circle cx="110" cy="148" r="6" fill="' + p[2] + '"/>';
    var sc = '', sy = ['1', '2', '3', '4', '5', '+', '−', '×', '÷', '='];
    for (var i = 0; i < 14; i++) sc += '<text x="' + f(130 + (i % 7) * 22) + '" y="' + f(150 + Math.floor(i / 7) * 26) + '" font-family="Georgia,serif" font-size="18" font-weight="700" fill="' + p[3] + '" text-anchor="middle">' + sy[i % sy.length] + '</text>';
    var waves = ''; for (var k = 0; k < 4; k++) { var pts = []; for (var x = 0; x <= W; x += 6) pts.push([x, 245 + k * 12 + 4 * Math.sin(x * .05 + k)]); waves += '<path d="' + poly(pts) + '" fill="none" stroke="' + p[3] + '" stroke-opacity=".25" stroke-width="2"/>'; }
    return waves + glow(u, fish) + sc + '<text x="20" y="40" font-family="Georgia,serif" font-size="26" fill="' + p[2] + '" opacity=".8">А Б В</text>';
  };
  C.nadjakov = function (r, p, u) {
    var inner = '<rect x="80" y="200" width="240" height="22" rx="3" fill="' + p[3] + '" fill-opacity=".3" stroke="' + p[3] + '" stroke-width="2"/>';
    for (var i = 0; i < 9; i++) { var x = 100 + i * 25; inner += '<line x1="' + f(60 + i * 30) + '" y1="20" x2="' + x + '" y2="196" stroke="' + p[2] + '" stroke-width="2" stroke-opacity=".75"/>'; }
    for (var j = 0; j < 9; j++) { var xx = 100 + j * 25; inner += '<text x="' + xx + '" y="246" text-anchor="middle" font-size="18" font-weight="700" fill="' + p[2] + '">+</text><text x="' + xx + '" y="216" text-anchor="middle" font-size="16" font-weight="700" fill="' + p[0] + '">−</text>'; }
    inner += '<circle cx="50" cy="30" r="18" fill="' + p[2] + '"/>';
    return grid(p[3], 25, .05) + glow(u, inner) + '<rect x="290" y="40" width="80" height="104" rx="4" fill="none" stroke="' + p[3] + '" stroke-opacity=".5" stroke-dasharray="4 4"/>' + '<g stroke="' + p[3] + '" stroke-opacity=".5" stroke-width="3">' + '<line x1="302" y1="62" x2="356" y2="62"/><line x1="302" y1="80" x2="348" y2="80"/><line x1="302" y1="98" x2="358" y2="98"/><line x1="302" y1="116" x2="340" y2="116"/></g>';
  };
  C.stranski = function (r, p, u) {
    var s = '', sz = 20;
    for (var row = 0; row < 4; row++) for (var c = 0; c < 20; c++) s += '<rect x="' + (c * sz + 1) + '" y="' + (280 - row * sz) + '" width="' + (sz - 2) + '" height="' + (sz - 2) + '" rx="3" fill="' + p[3] + '" fill-opacity=".28"/>';
    var inner = '';
    for (var c2 = 0; c2 < 20; c2++) inner += '<rect x="' + (c2 * sz + 1) + '" y="' + (280 - 4 * sz) + '" width="' + (sz - 2) + '" height="' + (sz - 2) + '" rx="3" fill="' + p[2] + '" fill-opacity=".75"/>';
    [[2, 4], [9, 5], [15, 3]].forEach(function (isl) {
      for (var h = 0; h < isl[1]; h++) for (var k = h; k < isl[1] * 2 - 1 - h; k++) inner += '<rect x="' + ((isl[0] + k - isl[1] + 1) * sz + 1 + 10) + '" y="' + (280 - (5 + h) * sz) + '" width="' + (sz - 2) + '" height="' + (sz - 2) + '" rx="3" fill="' + p[2] + '"/>';
    });
    inner += '<circle cx="330" cy="40" r="7" fill="' + p[2] + '"/><path d="M330 50 Q 320 100 300 140" fill="none" stroke="' + p[2] + '" stroke-dasharray="3 5" stroke-width="2"/>';
    return s + glow(u, inner);
  };
  C.grigorov = function (r, p, u) {
    var inner = '<circle cx="200" cy="150" r="132" fill="' + p[3] + '" fill-opacity=".07" stroke="' + p[3] + '" stroke-width="3"/>';
    for (var c = 0; c < 7; c++) {
      var x = 120 + r() * 160, y = 80 + r() * 140, a = r() * Math.PI, n = 2 + Math.floor(r() * 4);
      for (var i = 0; i < n; i++) { var xx = x + i * 30 * Math.cos(a), yy = y + i * 30 * Math.sin(a); if (Math.hypot(xx - 200, yy - 150) < 112) inner += '<rect x="' + f(xx - 13) + '" y="' + f(yy - 5) + '" width="26" height="10" rx="5" fill="' + p[2] + '" transform="rotate(' + f(a * 57.3) + ' ' + f(xx) + ' ' + f(yy) + ')"/>'; }
    }
    for (var k = 0; k < 10; k++) { var aa = r() * 6.28, d = r() * 100; inner += '<circle cx="' + f(200 + d * Math.cos(aa)) + '" cy="' + f(150 + d * Math.sin(aa)) + '" r="' + f(4 + r() * 3) + '" fill="' + p[3] + '" fill-opacity=".7"/>'; }
    return glow(u, inner);
  };
  C.karamihailova = function (r, p, u) {
    var inner = '';
    for (var i = 0; i < 14; i++) { var a = r() * 6.28, L = 60 + r() * 120; inner += '<line x1="140" y1="150" x2="' + f(140 + L * Math.cos(a)) + '" y2="' + f(150 + L * Math.sin(a)) + '" stroke="' + (i % 3 ? p[3] : p[2]) + '" stroke-width="' + (i % 3 ? 1.5 : 3) + '" stroke-linecap="round"/>'; }
    inner += '<circle cx="140" cy="150" r="16" fill="' + p[2] + '"/>';
    var pts = []; for (var x = 0; x <= 120; x += 3) pts.push([260 + x, 70 + 120 * (1 - Math.exp(-x / 30))]);
    var ch = '<g stroke="' + p[3] + '" stroke-opacity=".5"><line x1="260" y1="60" x2="260" y2="200"/><line x1="260" y1="200" x2="385" y2="200"/></g><path d="' + poly(pts.map(function (q) { return [q[0], 270 - q[1]]; })) + '" fill="none" stroke="' + p[2] + '" stroke-width="3"/>';
    return stars(r, 50, p[3]) + glow(u, inner) + ch;
  };
  C.sendov = function (r, p, u) {
    var cx = 200, cy = 150, R = 115, s = M.polynomial(r, p, u);
    var a = r() * 6.28, d = R * .8, x = cx + d * Math.cos(a), y = cy + d * Math.sin(a);
    return s + '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + R + '" fill="' + p[2] + '" fill-opacity=".07" stroke="' + p[2] + '" stroke-width="2" stroke-dasharray="2 4"/><circle cx="' + f(x) + '" cy="' + f(y) + '" r="7" fill="' + p[2] + '"/>' +
      '<text x="18" y="285" font-family="Georgia,serif" font-style="italic" font-size="20" fill="' + p[3] + '">|z| ≤ 1  ⇒  |z − w| ≤ 1</text>';
  };
  C.georgieva = function (r, p, u) {
    var g = '<g fill="none" stroke="' + p[3] + '" stroke-opacity=".3" stroke-width="1.5"><circle cx="200" cy="150" r="120"/>';
    for (var k = 1; k < 4; k++) g += '<ellipse cx="200" cy="150" rx="' + (k * 40) + '" ry="120"/>';
    for (var j = -2; j <= 2; j++) { var y = 150 + j * 45, w = Math.sqrt(120 * 120 - (j * 45) * (j * 45)); g += '<line x1="' + f(200 - w) + '" y1="' + y + '" x2="' + f(200 + w) + '" y2="' + y + '"/>'; }
    g += '</g>';
    return g + M.chart(r, p, u).replace(grid(p[3], 25, .07), '');
  };
  C.koylazov = function (r, p, u) {
    var inner = '<circle cx="270" cy="170" r="70" fill="' + p[3] + '" fill-opacity=".18" stroke="' + p[3] + '" stroke-width="2"/><ellipse cx="248" cy="145" rx="22" ry="12" fill="#fff" fill-opacity=".35" transform="rotate(-30 248 145)"/>';
    inner += '<rect x="22" y="130" width="46" height="36" rx="6" fill="none" stroke="' + p[2] + '" stroke-width="3"/><path d="M68 140 L84 132 L84 164 L68 156 Z" fill="' + p[2] + '"/>';
    for (var i = 0; i < 6; i++) {
      var ty = 112 + i * 22, hy = 130 + i * 16, hx = 200 + Math.abs(hy - 170) * .6;
      inner += '<line x1="84" y1="148" x2="' + f(hx) + '" y2="' + f(hy) + '" stroke="' + p[2] + '" stroke-width="1.6" stroke-opacity=".9"/><line x1="' + f(hx) + '" y1="' + f(hy) + '" x2="350" y2="' + f(30 + i * 6) + '" stroke="' + p[2] + '" stroke-width="1.2" stroke-opacity=".5" stroke-dasharray="4 4"/>';
    }
    inner += '<circle cx="355" cy="34" r="14" fill="' + p[2] + '"/>';
    var px = ''; for (var k = 0; k < 40; k++) px += '<rect x="' + (10 + (k % 10) * 9) + '" y="' + (240 + Math.floor(k / 10) * 9) + '" width="8" height="8" fill="' + p[2] + '" opacity="' + f(.15 + r() * .6) + '"/>';
    return grid(p[3], 25, .05) + glow(u, inner) + px;
  };
  C.ivanov = function (r, p, u) {
    var inner = '<path d="M-40 330 A 300 300 0 0 1 440 330" fill="' + p[3] + '" fill-opacity=".25" stroke="' + p[3] + '" stroke-width="3"/>';
    inner += '<path d="M-20 170 A 260 160 0 0 1 420 170" fill="none" stroke="' + p[3] + '" stroke-width="1.5" stroke-dasharray="6 6"/>';
    inner += '<path d="M300 95 Q 330 160 318 250" fill="none" stroke="' + p[2] + '" stroke-width="3.5"/><path d="M318 250 l-6 -14 l12 2 z" fill="' + p[2] + '"/>';
    inner += '<g transform="translate(300 95)"><path d="M-9 -10 L9 -10 L13 8 L-13 8 Z" fill="' + p[2] + '"/><rect x="-28" y="-4" width="14" height="5" fill="' + p[2] + '" opacity=".7"/><rect x="14" y="-4" width="14" height="5" fill="' + p[2] + '" opacity=".7"/></g>';
    return stars(r, 110, '#fff') + glow(u, inner) + '<text x="20" y="40" font-family="ui-monospace,Menlo,monospace" font-size="14" fill="' + p[3] + '">СОЮЗ 33 · 1979</text>';
  };

  var uidN = 0;
  function svg(person, opts) {
    var p = PAL[person.field] || PAL.math, r = rng(hash(person.id || person.name || 'x'));
    var u = 'a' + (++uidN);
    var fn = (person.art && C[person.art]) || M[person.motif] || M.curve;
    return frame(p, u, fn(r, p, u));
  }

  /* ---------- нарисуван портрет (за измислените хора) ---------- */
  function avatar(a) {
    var u = 'v' + (++uidN), bg = a.bg || '#2b1d6b', skin = a.skin || '#e8b896', hair = a.hair || '#2a1a12', shirt = a.shirt || '#ffcf5c';
    var hairBack = a.long ? '<path d="M128 150 Q120 70 200 62 Q280 70 272 150 L282 268 Q200 290 118 268 Z" fill="' + hair + '"/>' : '';
    var hairTop = a.bald ? '<path d="M150 105 Q160 74 200 72 Q240 74 250 105 Q240 92 200 92 Q160 92 150 105Z" fill="' + hair + '" opacity=".9"/>'
      : '<path d="M142 132 Q138 70 200 66 Q262 70 258 132 Q246 96 200 98 Q170 98 150 118 Z" fill="' + hair + '"/>';
    var glasses = a.glasses ? '<g fill="none" stroke="#1b1b1b" stroke-width="3"><circle cx="178" cy="140" r="14"/><circle cx="222" cy="140" r="14"/><line x1="192" y1="140" x2="208" y2="140"/></g>' : '';
    var beard = a.beard ? '<path d="M160 160 Q200 214 240 160 Q236 196 200 202 Q164 196 160 160Z" fill="' + a.beard + '"/>' : '';
    return '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="' + u + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + bg + '"/><stop offset="1" stop-color="' + (a.bg2 || '#14123a') + '"/></linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#' + u + ')"/>' +
      '<circle cx="320" cy="80" r="60" fill="' + shirt + '" opacity=".18"/><circle cx="70" cy="330" r="90" fill="#fff" opacity=".05"/>' +
      hairBack +
      '<path d="M90 400 Q96 290 200 280 Q304 290 310 400 Z" fill="' + shirt + '"/>' +
      '<rect x="182" y="210" width="36" height="60" rx="14" fill="' + skin + '"/>' +
      '<ellipse cx="200" cy="148" rx="58" ry="70" fill="' + skin + '"/>' +
      hairTop + beard +
      '<circle cx="178" cy="142" r="4" fill="#1b1b1b"/><circle cx="222" cy="142" r="4" fill="#1b1b1b"/>' +
      '<path d="M182 182 Q200 194 218 182" fill="none" stroke="#7a3b2e" stroke-width="4" stroke-linecap="round"/>' +
      glasses +
      '<text x="200" y="384" text-anchor="middle" font-family="Lato,system-ui,sans-serif" font-weight="800" font-size="16" letter-spacing="2" fill="#fff" opacity=".85">ИЛЮСТРАЦИЯ</text>' +
      '</svg>';
  }

  window.BUMArt = { svg: svg, avatar: avatar, palette: PAL, motifs: Object.keys(M), esc: esc };
})();
