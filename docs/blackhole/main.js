/* Дупката — 3D игра: дупка в земята поглъща всичко, което е по-малко от нея, и расте.
   Всички модели се строят от прости форми в кода. Без реклами, без външни файлове освен three.js. */
import * as THREE from './three.module.min.js';

// ================= помощни =================
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* без запис */ } },
};
const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* няма */ } };
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
let rng = Math.random;
const R = () => rng();
const RR = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];

// ================= настройки на играта =================
const GROW = 0.045;          // колко расте дупката от глътнатата маса
const LEVEL_TIME = 100;      // секунди за ниво
const BATTLE_TIME = 120;     // секунди за битка
const STARS = [0.4, 0.7, 0.95];
const THEMES = ['park', 'city', 'farm', 'downtown'];
const THEME_NAMES = { park: 'Парк', city: 'Квартал', farm: 'Ферма', downtown: 'Център', battle: 'Битка' };
const PLAYER_COLOR = '#7c3aed';
const BOTS = [
  { name: 'Бобо', color: '#ef4444' },
  { name: 'Мира', color: '#f59e0b' },
  { name: 'Зико', color: '#10b981' },
  { name: 'Лора', color: '#3b82f6' },
];

const save = {
  coins: store.get('dup.coins', 0),
  level: store.get('dup.level', 1),
  up: Object.assign({ size: 0, speed: 0, time: 0 }, store.get('dup.up', {})),
  sound: store.get('dup.sound', true),
};
function persist() { store.set('dup.coins', save.coins); store.set('dup.level', save.level); store.set('dup.up', save.up); store.set('dup.sound', save.sound); }
const UPGRADES = [
  { id: 'size', ic: '⭕', nm: 'Размер', max: 10 },
  { id: 'speed', ic: '💨', nm: 'Скорост', max: 10 },
  { id: 'time', ic: '⏱️', nm: 'Време', max: 10 },
];
const upCost = (lvl) => Math.round(60 * Math.pow(1.55, lvl));
const startR = () => 0.8 + 0.08 * save.up.size;
const speedMul = () => 1 + 0.06 * save.up.speed;
const extraTime = () => 6 * save.up.time;

// ================= рендериране =================
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true, powerPreference: 'high-performance' });
const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const SKY = new THREE.Color('#8fd3ff');
const scene = new THREE.Scene();
scene.background = SKY;
scene.fog = new THREE.Fog(SKY, 60, 160);
const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 500);

const hemi = new THREE.HemisphereLight('#ffffff', '#8a9a70', 1.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3dc', 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

// Материал за всички обекти: цветове по върхове, плоско осветяване и потъмняване под земята.
const objMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
objMat.onBeforeCompile = (sh) => {
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nvarying float vWY;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvWY = (modelMatrix * vec4(transformed, 1.0)).y;');
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vWY;')
    .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb *= clamp(1.0 + vWY * 0.32, 0.06, 1.0);');
};

// ================= модели от прости форми =================
const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 12),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cone: new THREE.ConeGeometry(1, 1, 12),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cone6: new THREE.ConeGeometry(1, 1, 6),
  ico: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  sph: new THREE.SphereGeometry(1, 10, 7),
};
const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function part(L, g, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  L.push({ g, c, m: new THREE.Matrix4().compose(_p, _q, _s) });
}
// кутия с дъно на височина y
const Bx = (L, c, w, h, d, x = 0, y = 0, z = 0, ry = 0) => part(L, G.box, c, x, y + h / 2, z, w, h, d, 0, ry, 0);
const Cy = (L, c, r, h, x = 0, y = 0, z = 0, g = G.cyl) => part(L, g, c, x, y + h / 2, z, r, h, r);
const Co = (L, c, r, h, x = 0, y = 0, z = 0, g = G.cone, ry = 0) => part(L, g, c, x, y + h / 2, z, r, h, r, 0, ry, 0);
const Ba = (L, c, r, x, y, z, sy = 1, g = G.ico) => part(L, g, c, x, y, z, r, r * sy, r);
const wheel = (L, x, z, r = 0.3, w = 0.24) => part(L, G.cyl, '#1f2937', x, r, z, r, w, r, Math.PI / 2, 0, 0);

function merge(parts) {
  let n = 0;
  const list = parts.map((p) => {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    g.applyMatrix4(p.m);
    n += g.attributes.position.count;
    return [g, new THREE.Color(p.c)];
  });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let o = 0;
  for (const [g, c] of list) {
    const cnt = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
    o += cnt;
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

const PAL = {
  skin: ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'],
  shirt: ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#f8fafc'],
  pants: ['#1e3a8a', '#374151', '#78350f', '#111827', '#64748b'],
  car: ['#ef4444', '#3b82f6', '#f8fafc', '#facc15', '#10b981', '#334155', '#f97316', '#a78bfa', '#06b6d4'],
  wall: ['#fde68a', '#fecaca', '#bfdbfe', '#d9f99d', '#fbcfe8', '#e9d5ff', '#fed7aa', '#f5f5f4'],
  roof: ['#b91c1c', '#7c2d12', '#1e3a8a', '#374151', '#9a3412', '#065f46'],
  block: ['#e5e7eb', '#fcd34d', '#93c5fd', '#fca5a5', '#c4b5fd', '#a7f3d0', '#fdba74', '#cbd5e1'],
  leaf: ['#4ade80', '#22c55e', '#16a34a', '#65a30d', '#84cc16', '#15803d'],
  flower: ['#f43f5e', '#facc15', '#f472b6', '#a78bfa', '#fb923c', '#ffffff'],
};

// Каталог: r = „отпечатък“ — дупката трябва да е поне толкова голяма, за да го глътне.
const T = {
  cone: { r: 0.3, nv: 1, b(L) { Bx(L, '#f97316', 0.6, 0.06, 0.6); Co(L, '#f97316', 0.27, 0.72, 0, 0.05); Cy(L, '#ffffff', 0.17, 0.1, 0, 0.32, 0); } },
  person: { r: 0.35, nv: 10, b(L) {
    const sk = pick(PAL.skin), sh = pick(PAL.shirt), pa = pick(PAL.pants);
    Bx(L, pa, 0.13, 0.48, 0.16, 0, 0, -0.09); Bx(L, pa, 0.13, 0.48, 0.16, 0, 0, 0.09);
    Bx(L, sh, 0.26, 0.5, 0.42, 0, 0.46, 0);
    Bx(L, sh, 0.12, 0.42, 0.1, 0, 0.52, -0.26); Bx(L, sh, 0.12, 0.42, 0.1, 0, 0.52, 0.26);
    Ba(L, sk, 0.17, 0, 1.12, 0, 1, G.sph);
    Bx(L, pick(['#3f2a14', '#111827', '#a16207', '#7c2d12', '#e5e7eb']), 0.3, 0.1, 0.3, 0, 1.2, 0);
  } },
  bin: { r: 0.35, nv: 2, b(L) { const c = pick(['#16a34a', '#2563eb', '#4b5563']); Cy(L, c, 0.28, 0.8); Cy(L, '#1f2937', 0.31, 0.07, 0, 0.8, 0); } },
  hydrant: { r: 0.3, nv: 1, b(L) { Cy(L, '#dc2626', 0.17, 0.6); Ba(L, '#dc2626', 0.17, 0, 0.6, 0, 0.8, G.sph); part(L, G.cyl, '#b91c1c', 0, 0.38, 0, 0.08, 0.5, 0.08, Math.PI / 2, 0, 0); } },
  bench: { r: 0.8, nv: 2, b(L) {
    const w = pick(['#a16207', '#92400e', '#166534']);
    Bx(L, w, 1.6, 0.08, 0.45, 0, 0.42, 0); Bx(L, w, 1.6, 0.4, 0.07, 0, 0.55, -0.22);
    Bx(L, '#374151', 0.08, 0.45, 0.45, -0.7); Bx(L, '#374151', 0.08, 0.45, 0.45, 0.7);
  } },
  lamp: { r: 0.35, nv: 1, b(L) { Cy(L, '#374151', 0.2, 0.15); Cy(L, '#374151', 0.07, 4.2); Bx(L, '#374151', 0.7, 0.12, 0.2, 0.3, 4.1); Bx(L, '#fde68a', 0.4, 0.06, 0.16, 0.45, 4.04); } },
  bush: { r: 0.6, nv: 3, b(L) { const c = pick(PAL.leaf); Ba(L, c, 0.62, 0, 0.45, 0, 0.8, G.ico1); Ba(L, c, 0.4, 0.35, 0.4, 0.2, 0.9, G.ico1); } },
  flowers: { r: 0.45, nv: 4, b(L) { Cy(L, '#c2410c', 0.36, 0.4); Ba(L, '#15803d', 0.32, 0, 0.5, 0, 0.6); const f = pick(PAL.flower); for (let i = 0; i < 4; i++) Ba(L, f, 0.1, Math.cos(i * 1.6) * 0.2, 0.68, Math.sin(i * 1.6) * 0.2); } },
  tree: { r: 1.0, nv: 5, b(L) {
    const c = pick(PAL.leaf), h = RR(1.5, 2.1);
    Cy(L, '#7c4a1e', 0.2, h + 0.6);
    Ba(L, c, RR(1.1, 1.35), 0, h + 0.9, 0, 0.95, G.ico1);
    Ba(L, c, RR(0.7, 0.9), RR(-0.3, 0.3), h + 1.8, RR(-0.3, 0.3), 0.9, G.ico1);
  } },
  pine: { r: 0.9, nv: 3, b(L) { const c = pick(['#166534', '#15803d', '#14532d']); Cy(L, '#7c4a1e', 0.18, 0.8); Co(L, c, 1.1, 2.0, 0, 0.6, 0); Co(L, c, 0.8, 1.6, 0, 1.8, 0); Co(L, c, 0.5, 1.2, 0, 2.9, 0); } },
  car: { r: 1.2, nv: 9, b(L) {
    const c = PAL.car[Math.floor(R() * PAL.car.length)];
    Bx(L, c, 2.2, 0.55, 1.05, 0, 0.25); Bx(L, '#9cc9f0', 1.2, 0.48, 0.96, -0.1, 0.8); Bx(L, c, 1.24, 0.08, 1.0, -0.1, 1.28);
    Bx(L, '#fef3c7', 0.05, 0.14, 0.26, 1.1, 0.5, 0.32); Bx(L, '#fef3c7', 0.05, 0.14, 0.26, 1.1, 0.5, -0.32);
    Bx(L, '#b91c1c', 0.05, 0.14, 0.26, -1.1, 0.5, 0.32); Bx(L, '#b91c1c', 0.05, 0.14, 0.26, -1.1, 0.5, -0.32);
    wheel(L, 0.68, 0.5); wheel(L, 0.68, -0.5); wheel(L, -0.68, 0.5); wheel(L, -0.68, -0.5);
  } },
  bus: { r: 2.8, nv: 3, b(L) {
    const c = pick(['#f59e0b', '#2563eb', '#dc2626']);
    Bx(L, c, 5.4, 1.9, 1.95, 0, 0.35); Bx(L, '#1e3a5f', 5.0, 0.62, 1.99, -0.1, 1.2); Bx(L, '#1e3a5f', 0.05, 0.8, 1.6, 2.7, 1.1);
    Bx(L, '#f8fafc', 5.42, 0.1, 1.97, 0, 2.25);
    for (const x of [-1.8, 1.7]) { wheel(L, x, 0.95, 0.42, 0.3); wheel(L, x, -0.95, 0.42, 0.3); }
  } },
  truck: { r: 2.3, nv: 3, b(L) {
    const c = pick(['#dc2626', '#1d4ed8', '#16a34a']);
    Bx(L, c, 1.5, 1.6, 1.9, 1.75, 0.35); Bx(L, '#9cc9f0', 0.05, 0.6, 1.6, 2.5, 1.2);
    Bx(L, pick(['#f8fafc', '#e5e7eb', '#fbbf24']), 3.4, 2.2, 2.0, -0.75, 0.4);
    for (const x of [1.6, -0.4, -1.6]) { wheel(L, x, 0.95, 0.4, 0.3); wheel(L, x, -0.95, 0.4, 0.3); }
  } },
  kiosk: { r: 1.3, nv: 3, b(L) {
    const c = pick(PAL.wall), s = pick(['#ef4444', '#2563eb', '#16a34a']);
    Bx(L, c, 2.0, 2.1, 1.6); Bx(L, '#1e3a5f', 1.4, 0.7, 0.05, 0, 1.0, 0.8); Bx(L, s, 2.3, 0.2, 1.9, 0, 2.1); Bx(L, '#ffffff', 2.3, 0.12, 1.92, 0, 2.3);
  } },
  busstop: { r: 1.5, nv: 1, b(L) {
    Bx(L, '#9cc9f0', 2.6, 2.0, 0.06, 0, 0.1, -0.5); Bx(L, '#374151', 2.9, 0.12, 1.2, 0, 2.1, 0);
    Bx(L, '#374151', 0.1, 2.1, 0.1, -1.35, 0, -0.5); Bx(L, '#374151', 0.1, 2.1, 0.1, 1.35, 0, -0.5);
    Bx(L, '#a16207', 1.8, 0.08, 0.4, 0, 0.45, -0.25);
  } },
  fountain: { r: 2.0, nv: 1, b(L) {
    Cy(L, '#cbd5e1', 2.0, 0.5); Cy(L, '#60a5fa', 1.75, 0.52); Cy(L, '#cbd5e1', 0.3, 1.5);
    Cy(L, '#cbd5e1', 0.8, 0.15, 0, 1.4, 0); Ba(L, '#93c5fd', 0.4, 0, 1.8, 0, 1.4, G.sph);
  } },
  statue: { r: 1.1, nv: 2, b(L) {
    const c = pick(['#b45309', '#64748b']);
    Bx(L, '#d6d3d1', 1.4, 1.2, 1.4); Cy(L, c, 0.25, 1.1, 0, 1.2, 0); Ba(L, c, 0.2, 0, 2.5, 0, 1, G.sph);
    part(L, G.box, c, 0.3, 2.3, 0, 0.12, 0.7, 0.12, 0, 0, -0.8);
  } },
  gazebo: { r: 2.3, nv: 2, b(L) {
    const c = pick(['#f8fafc', '#fde68a']);
    Cy(L, '#d6d3d1', 2.3, 0.25, 0, 0, 0, G.cyl6);
    for (let i = 0; i < 6; i++) Cy(L, c, 0.1, 2.3, Math.cos(i * Math.PI / 3) * 2, 0.2, Math.sin(i * Math.PI / 3) * 2);
    Co(L, pick(PAL.roof), 2.7, 1.4, 0, 2.4, 0, G.cone6);
  } },
  slide: { r: 1.7, nv: 2, b(L) {
    const c = pick(['#ef4444', '#3b82f6', '#facc15']);
    Bx(L, '#f8fafc', 1.0, 1.8, 1.0, -1.0); Bx(L, c, 1.1, 0.1, 1.1, -1.0, 1.8);
    part(L, G.box, c, 0.35, 1.0, 0, 2.2, 0.08, 0.8, 0, 0, -0.75);
    Bx(L, '#374151', 0.08, 1.8, 0.08, -1.45, 0, 0.45); Bx(L, '#374151', 0.08, 1.8, 0.08, -1.45, 0, -0.45);
  } },
  house: { r: 3.1, nv: 8, b(L) {
    const w = pick(PAL.wall), rf = pick(PAL.roof);
    Bx(L, w, 5, 3, 5); part(L, G.cone4, rf, 0, 3 + 1.2, 0, 3.95, 2.4, 3.95, 0, Math.PI / 4, 0);
    Bx(L, '#7c2d12', 0.9, 1.7, 0.1, 0, 0, 2.5);
    for (const x of [-1.6, 1.6]) Bx(L, '#bfe3ff', 0.9, 0.9, 0.1, x, 1.4, 2.5);
    for (const z of [-1.2, 1.2]) { Bx(L, '#bfe3ff', 0.1, 0.9, 0.9, 2.5, 1.4, z); Bx(L, '#bfe3ff', 0.1, 0.9, 0.9, -2.5, 1.4, z); }
    Bx(L, '#78716c', 0.6, 1.6, 0.6, 1.3, 3.6, -1.0);
  } },
  shop: { r: 3.8, nv: 5, b(L) {
    const w = pick(PAL.wall), s = pick(['#ef4444', '#2563eb', '#16a34a', '#f59e0b']);
    Bx(L, w, 7, 3.6, 5); Bx(L, '#1e3a5f', 5.6, 1.6, 0.1, 0, 0.3, 2.5);
    for (let i = 0; i < 6; i++) Bx(L, i % 2 ? '#ffffff' : s, 7.2 / 6, 0.18, 1.3, -3.0 + i * 1.2, 2.25, 2.95);
    Bx(L, s, 3, 0.7, 0.15, 0, 2.8, 2.55); Bx(L, '#a8a29e', 7.2, 0.3, 5.2, 0, 3.6);
  } },
  block: { r: 4.7, nv: 6, b(L, v) {
    const c = pick(PAL.block), h = 9 + (v % 4) * 3;
    Bx(L, c, 8, h, 8);
    for (let y = 1.2; y < h - 1; y += 3) { Bx(L, '#1e3a5f', 8.06, 1.0, 6.6, 0, y); Bx(L, '#1e3a5f', 6.6, 1.0, 8.06, 0, y); }
    Bx(L, '#64748b', 8.3, 0.35, 8.3, 0, h); Bx(L, '#94a3b8', 2, 1.2, 1.6, 1.5, h + 0.35, -1.5);
    Bx(L, '#7c2d12', 1.4, 2.0, 0.1, 0, 0, 4.0);
  } },
  tower: { r: 5.8, nv: 4, b(L, v) {
    const c = pick(['#cbd5e1', '#93c5fd', '#a5b4fc', '#e2e8f0']), h = 22 + v * 3;
    Bx(L, c, 9, h, 9);
    for (let y = 1.5; y < h - 1; y += 2.5) { Bx(L, '#1e3a5f', 9.06, 1.2, 7.6, 0, y); Bx(L, '#1e3a5f', 7.6, 1.2, 9.06, 0, y); }
    Bx(L, '#475569', 6, 2, 6, 0, h); Cy(L, '#475569', 0.15, 5, 0, h + 2, 0); Ba(L, '#ef4444', 0.3, 0, h + 7.1, 0, 1, G.sph);
  } },
  // ферма
  hay: { r: 0.8, nv: 1, b(L) { part(L, G.cyl, '#e8c25a', 0, 0.62, 0, 0.62, 1.2, 0.62, 0, 0, Math.PI / 2); part(L, G.cyl, '#d4a73c', 0, 0.62, 0, 0.5, 1.22, 0.5, 0, 0, Math.PI / 2); } },
  haystack: { r: 1.6, nv: 1, b(L) { for (const [x, y] of [[-0.65, 0], [0.65, 0], [0, 0.8]]) Bx(L, '#e8c25a', 1.25, 0.8, 1.8, x, y); } },
  cow: { r: 1.0, nv: 3, b(L) {
    const c = pick(['#f8fafc', '#78350f', '#f5f5f4']), sp = c === '#78350f' ? '#f8fafc' : '#111827';
    Bx(L, c, 1.6, 0.75, 0.75, 0, 0.55); Bx(L, sp, 0.6, 0.5, 0.78, -0.3, 0.7); Bx(L, sp, 0.4, 0.4, 0.78, 0.4, 0.6);
    Bx(L, c, 0.55, 0.5, 0.48, 0.95, 0.95); Bx(L, '#fda4af', 0.2, 0.25, 0.4, 1.25, 0.9);
    Bx(L, '#e5e7eb', 0.08, 0.2, 0.08, 0.95, 1.45, 0.18); Bx(L, '#e5e7eb', 0.08, 0.2, 0.08, 0.95, 1.45, -0.18);
    for (const x of [-0.6, 0.6]) for (const z of [-0.25, 0.25]) Bx(L, c, 0.15, 0.55, 0.15, x, 0, z);
  } },
  sheep: { r: 0.65, nv: 2, b(L) {
    Ba(L, '#f8fafc', 0.55, 0, 0.75, 0, 0.8, G.ico1); Bx(L, '#1f2937', 0.35, 0.35, 0.3, 0.55, 0.8);
    for (const x of [-0.25, 0.25]) for (const z of [-0.2, 0.2]) Bx(L, '#1f2937', 0.1, 0.45, 0.1, x, 0, z);
  } },
  pig: { r: 0.65, nv: 1, b(L) {
    Bx(L, '#f9a8d4', 1.0, 0.55, 0.6, 0, 0.28); Bx(L, '#f9a8d4', 0.35, 0.4, 0.45, 0.6, 0.38); Bx(L, '#f472b6', 0.1, 0.18, 0.22, 0.8, 0.45);
    for (const x of [-0.3, 0.3]) for (const z of [-0.18, 0.18]) Bx(L, '#f472b6', 0.12, 0.3, 0.12, x, 0, z);
  } },
  chicken: { r: 0.25, nv: 2, b(L) { const c = pick(['#f8fafc', '#b45309']); Ba(L, c, 0.2, 0, 0.3, 0, 0.9, G.sph); Ba(L, c, 0.12, 0.15, 0.5, 0, 1, G.sph); Bx(L, '#f59e0b', 0.1, 0.05, 0.05, 0.28, 0.5); Bx(L, '#dc2626', 0.06, 0.08, 0.04, 0.15, 0.62); } },
  fence: { r: 0.9, nv: 1, b(L) { for (const x of [-1.4, 0, 1.4]) Bx(L, '#a16207', 0.12, 1.0, 0.12, x); Bx(L, '#ca8a04', 3, 0.12, 0.06, 0, 0.4); Bx(L, '#ca8a04', 3, 0.12, 0.06, 0, 0.75); } },
  tractor: { r: 1.6, nv: 2, b(L) {
    const c = pick(['#16a34a', '#dc2626']);
    Bx(L, c, 1.9, 0.9, 1.0, 0.3, 0.5); Bx(L, c, 1.0, 1.2, 1.1, -0.5, 1.0); Bx(L, '#9cc9f0', 0.9, 0.6, 1.12, -0.5, 1.35);
    Bx(L, '#1f2937', 1.1, 0.1, 1.2, -0.5, 2.2); Cy(L, '#374151', 0.08, 0.6, 0.9, 1.3, 0);
    wheel(L, -0.6, 0.7, 0.7, 0.4); wheel(L, -0.6, -0.7, 0.7, 0.4); wheel(L, 0.9, 0.6, 0.4, 0.3); wheel(L, 0.9, -0.6, 0.4, 0.3);
  } },
  barn: { r: 4.3, nv: 2, b(L) {
    const c = pick(['#b91c1c', '#9a3412']);
    Bx(L, c, 7, 4.5, 6); part(L, G.cone4, '#44403c', 0, 4.5 + 1.6, 0, 5.2, 3.2, 4.6, 0, Math.PI / 4, 0);
    Bx(L, '#f8fafc', 2.6, 3.0, 0.1, 0, 0, 3.0); Bx(L, c, 2.2, 2.6, 0.12, 0, 0.2, 3.0);
    part(L, G.box, '#f8fafc', 0, 1.5, 3.08, 0.15, 3.3, 0.05, 0, 0, 0.75); part(L, G.box, '#f8fafc', 0, 1.5, 3.08, 0.15, 3.3, 0.05, 0, 0, -0.75);
  } },
  silo: { r: 1.8, nv: 2, b(L) { const c = pick(['#cbd5e1', '#e5e7eb']); Cy(L, c, 1.6, 7); for (let y = 1; y < 7; y += 1.5) Cy(L, '#94a3b8', 1.63, 0.15, 0, y, 0); Ba(L, '#94a3b8', 1.6, 0, 7, 0, 0.6, G.sph); } },
  windmill: { r: 2.3, nv: 1, b(L) {
    Co(L, '#f5f5f4', 2.0, 9, 0, 0, 0, G.cone6); Bx(L, '#7c2d12', 1.1, 1.1, 1.3, 0, 7.6, 0.4);
    for (let i = 0; i < 4; i++) part(L, G.box, '#f8fafc', Math.cos(i * Math.PI / 2 + 0.4) * 2.3, 8.2 + Math.sin(i * Math.PI / 2 + 0.4) * 2.3, 1.2, 4.6, 0.7, 0.08, 0, 0, i * Math.PI / 2 + 0.4);
  } },
  trough: { r: 0.9, nv: 1, b(L) { Bx(L, '#78716c', 1.8, 0.5, 0.7); Bx(L, '#60a5fa', 1.6, 0.05, 0.5, 0, 0.47); } },
};

const geoCache = new Map();
function geoFor(type, v) {
  const key = type + ':' + v;
  let g = geoCache.get(key);
  if (!g) {
    const saved = rng;
    rng = mulberry32(hashStr(key));
    const L = [];
    T[type].b(L, v);
    rng = saved;
    g = merge(L);
    geoCache.set(key, g);
  }
  return g;
}

// ================= свят =================
let world = null; // { L, objs, ground, ... }
let objs = [];
let occ = [];
let holes = [];
let player = null;
const groundMat = new THREE.MeshLambertMaterial({
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.NotEqualStencilFunc,
  stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp,
});
let groundMesh = null;

function free(x, z, r) {
  const L = world.L;
  if (Math.abs(x) > L - r * 0.6 || Math.abs(z) > L - r * 0.6) return false;
  for (const o of occ) {
    const d = r + o.r * 0.9;
    if (Math.abs(o.x - x) < d && Math.abs(o.z - z) < d && (o.x - x) ** 2 + (o.z - z) ** 2 < d * d) return false;
  }
  return true;
}
function block(x, z, r) { occ.push({ x, z, r }); }

function spawn(type, x, z, ry, opts = {}) {
  const def = T[type];
  if (!opts.force && !free(x, z, def.r)) return null;
  const v = opts.v != null ? opts.v : Math.floor(R() * (def.nv || 1));
  const geo = geoFor(type, v);
  const bb = geo.boundingBox;
  const sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
  const mesh = new THREE.Mesh(geo, objMat);
  if (ry == null) ry = R() * Math.PI * 2;
  mesh.position.set(x, 0, z);
  mesh.rotation.y = ry;
  mesh.castShadow = def.r > 0.4;
  mesh.receiveShadow = def.r >= 1.5;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  scene.add(mesh);
  const o = { type, mesh, x, y: 0, z, ry, r: def.r, h: sy, v: Math.pow(sx * sy * sz, 0.72), dead: false, fall: null, mover: null, wob: 0 };
  objs.push(o);
  occ.push({ x, z, r: def.r });
  world.total += o.v;
  return o;
}

// ---------- земя (рисувана в canvas) ----------
function makeGroundCanvas(E, base) {
  const size = 2048;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const ppu = size / (2 * E);
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  const P = {
    g, ppu,
    X: (x) => (x + E) * ppu,
    rect(x0, z0, x1, z1, c) { g.fillStyle = c; g.fillRect(P.X(x0), P.X(z0), (x1 - x0) * ppu, (z1 - z0) * ppu); },
    circle(x, z, r, c) { g.fillStyle = c; g.beginPath(); g.arc(P.X(x), P.X(z), r * ppu, 0, Math.PI * 2); g.fill(); },
    ring(x, z, r, w, c) { g.strokeStyle = c; g.lineWidth = w * ppu; g.beginPath(); g.arc(P.X(x), P.X(z), r * ppu, 0, Math.PI * 2); g.stroke(); },
    line(x0, z0, x1, z1, w, c, dash) { g.strokeStyle = c; g.lineWidth = w * ppu; g.setLineDash(dash ? dash.map((d) => d * ppu) : []); g.beginPath(); g.moveTo(P.X(x0), P.X(z0)); g.lineTo(P.X(x1), P.X(z1)); g.stroke(); g.setLineDash([]); },
  };
  return { cv, P };
}
let decor = [];
function addDecor(L, E) {
  // гора отвъд края на картата — само за красота, не се гълта
  const saved = rng;
  for (let x = -E + 3; x < E - 2; x += 4.5) for (const sgn of [-1, 1]) for (let k = 0; k < 3; k++) {
    for (const [px, pz] of [[x + RR(-1, 1), sgn * (L + 3 + k * 5 + RR(-1, 1))], [sgn * (L + 3 + k * 5 + RR(-1, 1)), x + RR(-1, 1)]]) {
      const m = new THREE.Mesh(geoFor(R() < 0.5 ? 'pine' : 'tree', Math.floor(R() * 3)), objMat);
      m.position.set(px, 0, pz); m.rotation.y = R() * 6; const sc = RR(1.1, 1.8); m.scale.set(sc, sc, sc);
      m.matrixAutoUpdate = false; m.updateMatrix(); scene.add(m); decor.push(m);
    }
  }
  rng = saved;
}
function finishGround(cv, E) {
  addDecor(world.L, E);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const geo = new THREE.PlaneGeometry(2 * E, 2 * E);
  geo.rotateX(-Math.PI / 2);
  groundMat.map = tex;
  groundMat.needsUpdate = true;
  groundMesh = new THREE.Mesh(geo, groundMat);
  groundMesh.receiveShadow = true;
  groundMesh.renderOrder = -2;
  scene.add(groundMesh);
}
function mowStripes(P, L, c) { for (let x = -L; x < L; x += 6) P.rect(x, -L, x + 3, L, c); }
function border(P, L) { P.line(-L, -L, L, -L, 0.5, 'rgba(0,0,0,.18)'); P.line(L, -L, L, L, 0.5, 'rgba(0,0,0,.18)'); P.line(L, L, -L, L, 0.5, 'rgba(0,0,0,.18)'); P.line(-L, L, -L, -L, 0.5, 'rgba(0,0,0,.18)'); }

// ---------- движещи се ----------
function walker(o, cx, cz, rad, speed) { if (o) o.mover = { kind: 'wander', cx, cz, rad, tx: cx, tz: cz, speed, wait: R() * 2 }; }
function driver(o, axis, road, dir, lane, speed) { if (o) { o.mover = { kind: 'drive', axis, road, dir, lane, speed }; } }
function liner(o, axis, line, a, b, speed) { if (o) o.mover = { kind: 'line', axis, line, a, b, dir: R() < 0.5 ? 1 : -1, speed }; }

// ---------- оформления ----------
function layoutPark(L) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#7fcf6a');
  mowStripes(P, L, '#78c763');
  const ringR = L * 0.55;
  P.ring(0, 0, ringR, 3, '#e9d8a6');
  P.line(-L, 0, L, 0, 3, '#e9d8a6'); P.line(0, -L, 0, L, 3, '#e9d8a6');
  P.circle(0, 0, 6, '#e9d8a6'); P.ring(0, 0, 6, 0.4, '#d6c08a');
  block(0, 0, 0.1);
  const ponds = [[-L * 0.55, -L * 0.6, 5], [L * 0.6, L * 0.55, 4.5]];
  for (const [x, z, r] of ponds) { P.circle(x, z, r + 0.6, '#c9b98a'); P.circle(x, z, r, '#5ab4e8'); P.circle(x - r * 0.3, z - r * 0.3, r * 0.3, '#7cc6ef'); block(x, z, r + 0.5); }
  border(P, L);
  finishGround(cv, E);

  spawn('fountain', 0, 0, 0, { force: true });
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; spawn('bench', Math.cos(a) * 4.6, Math.sin(a) * 4.6, -a + Math.PI / 2); }
  const steps = Math.round(2 * Math.PI * ringR / 7);
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    if (i % 2 === 0) spawn('lamp', c * (ringR + 2.2), s * (ringR + 2.2), -a);
    else spawn('bench', c * (ringR - 2.4), s * (ringR - 2.4), -a - Math.PI / 2);
    if (i % 3 === 1) spawn(R() < 0.5 ? 'bin' : 'flowers', c * (ringR + 2.4), s * (ringR + 2.4));
  }
  for (let i = -L + 4; i < L - 3; i += 7) { if (Math.abs(i) < 8) continue; spawn('lamp', i, 2.3, 0); spawn('lamp', 2.3, i, 0); spawn(R() < 0.5 ? 'bin' : 'flowers', i + 2, -2.3); }
  const big = [['gazebo', 2], ['kiosk', 4], ['statue', 3], ['slide', 3]];
  for (const [t, n] of big) for (let k = 0, tries = 0; k < n && tries < 200; tries++) if (spawn(t, RR(-L + 4, L - 4), RR(-L + 4, L - 4))) k++;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.3; spawn('house', Math.cos(a) * (L - 4), Math.sin(a) * (L - 4), -a + Math.PI / 2); }
  scatter(['tree', 'tree', 'pine'], Math.round(L * L * 0.075), L);
  scatter(['bush', 'flowers'], Math.round(L * L * 0.03), L);
  scatter(['cone', 'bin'], 6, L);
  for (let i = 0, k = 0; i < 400 && k < L * 1.3; i++) {
    const x = RR(-L + 2, L - 2), z = RR(-L + 2, L - 2);
    const o = spawn('person', x, z); if (o) { walker(o, x, z, 3.5, RR(0.7, 1.3)); k++; }
  }
}

function scatter(types, n, L, area) {
  let k = 0;
  for (let i = 0; i < n * 8 && k < n; i++) {
    const x = area ? RR(area[0], area[2]) : RR(-L + 1.5, L - 1.5);
    const z = area ? RR(area[1], area[3]) : RR(-L + 1.5, L - 1.5);
    if (spawn(pick(types), x, z)) k++;
  }
}

function layoutCity(L0, kind) {
  const Bp = 26, roadW = 7, side = 2.4;
  const n = Math.max(2, Math.round((2 * L0) / Bp));
  const L = (n * Bp) / 2;
  world.L = L;
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#7fcf6a');
  const lines = [];
  for (let k = 0; k <= n; k++) lines.push(-L + k * Bp);
  // тротоари и парцели
  const lots = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x0 = lines[i] + roadW / 2, x1 = lines[i + 1] - roadW / 2;
    const z0 = lines[j] + roadW / 2, z1 = lines[j + 1] - roadW / 2;
    P.rect(x0, z0, x1, z1, '#cfd4da');
    lots.push([x0 + side, z0 + side, x1 - side, z1 - side, x0, z0, x1, z1]);
  }
  // пътища
  for (const c of lines) {
    P.rect(c - roadW / 2, -L - roadW / 2, c + roadW / 2, L + roadW / 2, '#4b5563');
    P.rect(-L - roadW / 2, c - roadW / 2, L + roadW / 2, c + roadW / 2, '#4b5563');
  }
  for (const c of lines) {
    P.line(c, -L, c, L, 0.2, '#f8fafc', [1.6, 1.6]);
    P.line(-L, c, L, c, 0.2, '#f8fafc', [1.6, 1.6]);
  }
  for (const cx of lines) for (const cz of lines) { P.rect(cx - roadW / 2, cz - roadW / 2, cx + roadW / 2, cz + roadW / 2, '#4b5563'); }
  for (const cx of lines) for (const cz of lines) {
    for (let k = -2.5; k <= 2.5; k += 1) {
      P.rect(cx + k - 0.3, cz - roadW / 2 - 1.6, cx + k + 0.3, cz - roadW / 2 - 0.2, '#f8fafc');
      P.rect(cx - roadW / 2 - 1.6, cz + k - 0.3, cx - roadW / 2 - 0.2, cz + k + 0.3, '#f8fafc');
    }
  }
  for (const c of lines) { block(c, 0, 0); }

  const weights = kind === 'downtown'
    ? { houses: 1, apartments: 4, tower: 3, park: 1.2, shops: 2.5, parking: 1 }
    : { houses: 5, apartments: 1.6, tower: 0.4, park: 1.4, shops: 1.6, parking: 0.8 };
  const pickLot = () => { let tot = 0; for (const k in weights) tot += weights[k]; let r = R() * tot; for (const k in weights) { r -= weights[k]; if (r <= 0) return k; } return 'houses'; };

  for (const lot of lots) {
    const [a0, b0, a1, b1, s0, t0, s1, t1] = lot;
    const cx = (a0 + a1) / 2, cz = (b0 + b1) / 2, w = a1 - a0;
    const type = pickLot();
    const lawn = type === 'houses' || type === 'park';
    P.rect(a0, b0, a1, b1, lawn ? '#86d46f' : type === 'parking' ? '#6b7280' : '#e2e5e9');
    if (type === 'houses') {
      const q = w / 4;
      for (const dx of [-q, q]) for (const dz of [-q, q]) spawn('house', cx + dx, cz + dz, dz > 0 ? 0 : Math.PI);
      scatter(['tree', 'bush', 'flowers', 'bush'], 10, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
      if (R() < 0.6) spawn('car', cx, cz, R() < 0.5 ? 0 : Math.PI / 2);
    } else if (type === 'apartments') {
      if (kind === 'downtown' && R() < 0.5) {
        const q = w / 4;
        for (const dx of [-q, q]) for (const dz of [-q, q]) spawn(R() < 0.5 ? 'shop' : 'house', cx + dx, cz + dz, dz > 0 ? 0 : Math.PI);
      } else {
        spawn('block', cx, cz, 0, { force: true });
        scatter(['tree', 'bench', 'car', 'bush'], 8, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
      }
    } else if (type === 'tower') {
      spawn('tower', cx, cz, 0, { force: true });
      scatter(['bench', 'flowers', 'person', 'tree'], 8, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
    } else if (type === 'park') {
      P.circle(cx, cz, 3.6, '#e9d8a6');
      spawn(R() < 0.6 ? 'fountain' : 'gazebo', cx, cz, 0, { force: true });
      scatter(['tree', 'tree', 'pine', 'bench', 'bush', 'flowers', 'slide'], 16, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
      for (let i = 0; i < 4; i++) { const x = RR(a0 + 1, a1 - 1), z = RR(b0 + 1, b1 - 1); const o = spawn('person', x, z); walker(o, x, z, 3, RR(0.6, 1.2)); }
    } else if (type === 'shops') {
      spawn('shop', cx, cz - w / 4, Math.PI, { force: true }); spawn('shop', cx, cz + w / 4, 0, { force: true });
      scatter(['kiosk', 'bench', 'person', 'bin', 'flowers', 'cone'], 7, 0, [a0 + 0.8, b0 + 0.8, a1 - 0.8, b1 - 0.8]);
    } else {
      for (let x = a0 + 1.6; x < a1 - 1; x += 2.6) {
        P.line(x - 1.3, b0 + 1, x - 1.3, b0 + 5, 0.12, '#f8fafc'); P.line(x - 1.3, b1 - 5, x - 1.3, b1 - 1, 0.12, '#f8fafc');
        if (R() < 0.75) spawn('car', x, b0 + 3, Math.PI / 2 + (R() < 0.5 ? Math.PI : 0), { force: true });
        if (R() < 0.75) spawn('car', x, b1 - 3, Math.PI / 2 + (R() < 0.5 ? Math.PI : 0), { force: true });
      }
      if (R() < 0.5) spawn('truck', cx, cz, 0);
      spawn('kiosk', cx + w / 3, cz, 0);
    }
    // тротоар: лампи, кошчета, дървета, хора
    const sm = side / 2;
    const edges = [[s0 + sm, t0 + sm, s1 - sm, t0 + sm, 'x'], [s0 + sm, t1 - sm, s1 - sm, t1 - sm, 'x'], [s0 + sm, t0 + sm, s0 + sm, t1 - sm, 'z'], [s1 - sm, t0 + sm, s1 - sm, t1 - sm, 'z']];
    for (const [x0, z0, x1, z1, ax] of edges) {
      const len = ax === 'x' ? x1 - x0 : z1 - z0;
      for (let d = 2; d < len - 1; d += 4.2) {
        const x = ax === 'x' ? x0 + d : x0, z = ax === 'x' ? z0 : z0 + d;
        const r = R();
        const t = r < 0.3 ? 'lamp' : r < 0.45 ? 'tree' : r < 0.58 ? 'bin' : r < 0.66 ? 'hydrant' : r < 0.74 ? 'bench' : r < 0.78 ? 'busstop' : null;
        if (t) spawn(t, x, z, ax === 'x' ? (z0 > (t0 + t1) / 2 ? 0 : Math.PI) : (x0 > (s0 + s1) / 2 ? -Math.PI / 2 : Math.PI / 2));
      }
      for (let k = 0; k < 2; k++) {
        const d = RR(1, len - 1);
        const x = ax === 'x' ? x0 + d : x0, z = ax === 'x' ? z0 : z0 + d;
        const o = spawn('person', x, z, ax === 'x' ? 0 : Math.PI / 2);
        if (o) liner(o, ax, ax === 'x' ? z0 : x0, ax === 'x' ? x0 : z0, ax === 'x' ? x1 : z1, RR(0.8, 1.4));
      }
    }
  }
  // трафик
  const lane = 1.7;
  for (const c of lines) {
    for (const axis of ['x', 'z']) {
      const nCars = Math.round(n * 1.1);
      for (let i = 0; i < nCars; i++) {
        const dir = R() < 0.5 ? 1 : -1;
        const along = RR(-L + 4, L - 4);
        const laneC = axis === 'z' ? c - lane * dir : c + lane * dir;
        const x = axis === 'x' ? along : laneC, z = axis === 'x' ? laneC : along;
        const r = R();
        const t = r < 0.08 ? 'bus' : r < 0.16 ? 'truck' : 'car';
        const ry = axis === 'x' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
        const o = spawn(t, x, z, ry);
        driver(o, axis, c, dir, lane, t === 'car' ? RR(4, 6.5) : RR(3, 4.5));
      }
    }
  }
  for (let i = 0; i < n * 2; i++) { const c = pick(lines); spawn('cone', c + RR(-3, 3), RR(-L + 2, L - 2)); }
  border(P, L);
  finishGround(cv, E);
}

function layoutFarm(L) {
  const E = L + 30;
  const { cv, P } = makeGroundCanvas(E, '#8fd36a');
  mowStripes(P, L, '#88cc63');
  P.rect(-2.5, -E, 2.5, E, '#c9a46c'); P.rect(-E, -2.5, E, 2.5, '#c9a46c');
  block(0, 0, 0);
  const quads = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const roles = ['yard', 'field', 'pen', 'field2'];
  // разбъркай ролите
  for (let i = roles.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [roles[i], roles[j]] = [roles[j], roles[i]]; }
  quads.forEach(([sx, sz], qi) => {
    const a0 = sx < 0 ? -L + 2 : 4, a1 = sx < 0 ? -4 : L - 2;
    const b0 = sz < 0 ? -L + 2 : 4, b1 = sz < 0 ? -4 : L - 2;
    const cx = (a0 + a1) / 2, cz = (b0 + b1) / 2;
    const role = roles[qi];
    if (role === 'field' || role === 'field2') {
      P.rect(a0 + 1, b0 + 1, a1 - 1, b1 - 1, role === 'field' ? '#a8794f' : '#d9c45a');
      for (let x = a0 + 2; x < a1 - 1; x += 1.6) P.line(x, b0 + 1.3, x, b1 - 1.3, 0.3, role === 'field' ? '#8c6239' : '#c4ae45');
      scatter(['hay', 'hay', 'haystack'], Math.round((a1 - a0) * (b1 - b0) / 30), 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
      spawn('tractor', cx, cz, R() * 6);
      scatter(['tree', 'pine'], 6, 0, [a0, b0, a1, b1]);
    } else if (role === 'pen') {
      const p0 = a0 + 2, p1 = a1 - 2, q0 = b0 + 2, q1 = b1 - 2;
      P.rect(p0, q0, p1, q1, '#a3dc7f');
      for (let x = p0 + 1.5; x < p1 - 1; x += 3) { spawn('fence', x, q0, 0, { force: true }); spawn('fence', x, q1, 0, { force: true }); }
      for (let z = q0 + 1.5; z < q1 - 1; z += 3) { spawn('fence', p0, z, Math.PI / 2, { force: true }); spawn('fence', p1, z, Math.PI / 2, { force: true }); }
      spawn('trough', cx, cz, 0);
      const animals = ['cow', 'cow', 'sheep', 'sheep', 'pig'];
      for (let i = 0, k = 0; i < 300 && k < Math.round((p1 - p0) * (q1 - q0) / 18); i++) {
        const x = RR(p0 + 2, p1 - 2), z = RR(q0 + 2, q1 - 2);
        const o = spawn(pick(animals), x, z);
        if (o) { walker(o, x, z, 3, RR(0.4, 0.8)); k++; }
      }
    } else {
      P.rect(a0 + 1, b0 + 1, a1 - 1, b1 - 1, '#d6c39a');
      spawn('barn', cx - 3, cz - 3, R() < 0.5 ? 0 : Math.PI / 2, { force: true });
      spawn('silo', cx + 6, cz - 5);
      spawn('silo', cx + 6, cz - 1);
      spawn('house', cx + 4, cz + 6, 0);
      spawn('tractor', cx - 6, cz + 6, 0.5);
      spawn('windmill', cx - 8, cz + 8 > b1 - 3 ? cz : cz + 8, 0);
      for (let i = 0; i < 18; i++) { const x = RR(a0 + 2, a1 - 2), z = RR(b0 + 2, b1 - 2); const o = spawn('chicken', x, z); walker(o, x, z, 2, RR(0.6, 1.1)); }
      scatter(['hay', 'haystack', 'trough', 'bush', 'person'], 10, 0, [a0 + 2, b0 + 2, a1 - 2, b1 - 2]);
    }
  });
  for (let d = -L + 3; d < L - 2; d += 5) { if (Math.abs(d) < 4) continue; spawn('tree', -3.6, d); spawn('tree', 3.6, d + 2.5); spawn('fence', d, -3.6, 0); spawn('fence', d + 2.5, 3.6, 0); }
  for (const s of [-1, 1]) { const o = spawn('tractor', s * RR(8, L - 8), 0, 0); if (o) driver(o, 'x', 0, s, 1.2, 2.5); }
  spawn('windmill', L - 5, -L + 5, 0); spawn('windmill', -L + 5, L - 5, 0);
  border(P, L);
  finishGround(cv, E);
}

// ================= дупки =================
const discMat = new THREE.MeshBasicMaterial({
  colorWrite: false, depthWrite: false,
  stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
});
const discGeo = new THREE.CircleGeometry(1, 56).rotateX(-Math.PI / 2);
const ringGeo = new THREE.RingGeometry(1, 1.07, 64).rotateX(-Math.PI / 2);
function wallGeo(color) {
  const g = new THREE.CylinderGeometry(1, 1, 40, 48, 8, true);
  g.translate(0, -20, 0);
  // по-тъмен преход, за да изглежда дълбока
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const top = new THREE.Color(color).multiplyScalar(0.35), bot = new THREE.Color('#000000');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = clamp(-pos.getY(i) / 4, 0, 1);
    c.copy(top).lerp(bot, t);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function makeHole(name, color, x, z, R0, bot) {
  const grp = new THREE.Group();
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.position.y = 0.003;
  disc.renderOrder = -3;
  const wall = new THREE.Mesh(wallGeo(color), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  const bottom = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: '#000000', fog: false }));
  bottom.position.y = -39;
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color }));
  ring.position.y = 0.025;
  grp.add(disc, wall, bottom, ring);
  scene.add(grp);
  const label = document.createElement('div');
  label.className = 'label';
  $('labels').appendChild(label);
  const h = { name, color, x, z, vx: 0, vz: 0, R: R0, R0, mass: 0, grp, label, bot, alive: true, respawn: 0, eaten: 0, score: 0, think: 0, tx: x, tz: z };
  holes.push(h);
  return h;
}
const targetR = (h) => Math.sqrt(h.R0 * h.R0 + GROW * h.mass);

// ================= състояние на играта =================
let mode = 'menu';      // menu | level | battle
let state = 'menu';     // menu | play | pause | end
let timeLeft = 0, levelNo = 1, theme = 'park';
let elapsed = 0;
let sweep = 0;

function clearWorld() {
  for (const o of objs) scene.remove(o.mesh);
  for (const h of holes) { scene.remove(h.grp); h.label.remove(); h.grp.traverse((m) => { if (m.material && m.material !== discMat) m.material.dispose(); }); }
  if (groundMesh) { scene.remove(groundMesh); groundMesh.geometry.dispose(); if (groundMat.map) groundMat.map.dispose(); groundMesh = null; }
  for (const m of decor) scene.remove(m);
  objs = []; occ = []; holes = []; player = null; decor = [];
}

function buildLevel(n) {
  clearWorld();
  levelNo = n;
  theme = THEMES[(n - 1) % THEMES.length];
  const cycle = Math.floor((n - 1) / THEMES.length);
  rng = mulberry32(1000 + n * 7919);
  world = { L: 0, total: 0 };
  if (theme === 'park') { world.L = 28 + cycle * 5; layoutPark(world.L); }
  else if (theme === 'farm') { world.L = 36 + cycle * 5; layoutFarm(world.L); }
  else layoutCity(theme === 'city' ? 40 + cycle * 6 : 46 + cycle * 6, theme);
  rng = Math.random;
  player = makeHole('Ти', PLAYER_COLOR, 0, theme === 'park' ? 9 : 0, startR(), false);
}

function buildBattle() {
  clearWorld();
  theme = 'battle';
  rng = mulberry32(Math.floor(Math.random() * 1e9));
  world = { L: 0, total: 0 };
  layoutCity(48, R() < 0.5 ? 'city' : 'downtown');
  rng = Math.random;
  const L = world.L;
  const R0 = 0.9 + 0.04 * save.up.size;
  player = makeHole('Ти', PLAYER_COLOR, 0, 0, R0, false);
  const spots = [[-L * 0.6, -L * 0.6], [L * 0.6, -L * 0.6], [-L * 0.6, L * 0.6], [L * 0.6, L * 0.6]];
  BOTS.forEach((b, i) => {
    const h = makeHole(b.name, b.color, spots[i][0], spots[i][1], 0.9, true);
    h.skill = 0.84 + i * 0.05;
  });
}

// ================= вход =================
const input = { x: 0, z: 0, active: false, ox: 0, oy: 0, id: null };
const keys = new Set();
const joy = $('joy'), joyKnob = joy.querySelector('b');
canvas.addEventListener('pointerdown', (e) => {
  if (state !== 'play') return;
  e.preventDefault();
  input.active = true; input.id = e.pointerId; input.ox = e.clientX; input.oy = e.clientY; input.x = 0; input.z = 0;
  joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.style.display = 'block';
  joyKnob.style.transform = '';
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* нищо */ }
  audio();
}, { passive: false });
canvas.addEventListener('pointermove', (e) => {
  if (!input.active || e.pointerId !== input.id) return;
  let dx = e.clientX - input.ox, dy = e.clientY - input.oy;
  const max = 55;
  const len = Math.hypot(dx, dy);
  if (len > max) {
    // джойстикът „следва“ пръста, за да няма мъртва зона при обръщане
    input.ox += (dx / len) * (len - max); input.oy += (dy / len) * (len - max);
    joy.style.left = input.ox + 'px'; joy.style.top = input.oy + 'px';
    dx = e.clientX - input.ox; dy = e.clientY - input.oy;
  }
  input.x = dx / max; input.z = dy / max;
  joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
});
const endPointer = (e) => { if (e.pointerId === input.id) { input.active = false; input.x = 0; input.z = 0; joy.style.display = 'none'; } };
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
window.addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase());
  if ((e.key === 'Escape' || e.key === 'p') && (state === 'play' || state === 'pause')) { if (state === 'play') pause(); else resume(); }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
function readInput() {
  let x = input.x, z = input.z;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) z -= 1;
  if (keys.has('s') || keys.has('arrowdown')) z += 1;
  if (window.__dupkaBot) { x = window.__dupkaBot.x; z = window.__dupkaBot.z; }
  const len = Math.hypot(x, z);
  if (len > 1) { x /= len; z /= len; }
  return [x, z];
}

// ================= звук =================
let actx = null;
function audio() {
  if (!save.sound) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f, dur, type = 'sine', vol = 0.12, slide = 0, delay = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}
let lastPop = 0;
function popSound(r) {
  const now = performance.now();
  if (now - lastPop < 45) return;
  lastPop = now;
  const f = clamp(900 / Math.pow(r + 0.3, 0.8), 90, 1200);
  tone(f, 0.12 + r * 0.04, 'sine', 0.1 + Math.min(r, 4) * 0.02, f * 0.5);
  if (r > 2) tone(70, 0.4, 'triangle', 0.18, 35);
}
const sfx = {
  grow() { tone(523, 0.1, 'triangle', 0.08); tone(784, 0.14, 'triangle', 0.08, 0, 0.08); },
  star() { [0, 4, 7, 12].forEach((s, i) => tone(523 * Math.pow(2, s / 12), 0.2, 'triangle', 0.09, 0, i * 0.07)); },
  eatHole() { tone(300, 0.6, 'sawtooth', 0.12, 50); },
  tick() { tone(1000, 0.05, 'square', 0.05); },
  end() { [0, 4, 7].forEach((s, i) => tone(392 * Math.pow(2, s / 12), 0.25, 'triangle', 0.1, 0, i * 0.12)); },
};

// ================= надписи =================
const v3 = new THREE.Vector3();
function toScreen(x, y, z) {
  v3.set(x, y, z).project(camera);
  return [(v3.x * 0.5 + 0.5) * window.innerWidth, (-v3.y * 0.5 + 0.5) * window.innerHeight, v3.z < 1];
}
function floatText(x, z, text) {
  const [sx, sy, ok] = toScreen(x, 1.5, z);
  if (!ok) return;
  const el = document.createElement('div');
  el.className = 'float'; el.textContent = text;
  el.style.left = sx + 'px'; el.style.top = sy + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
let bannerT = 0;
function banner(text, small) {
  const el = $('banner');
  el.textContent = text;
  if (small) { const s = document.createElement('small'); s.textContent = small; el.appendChild(s); }
  el.classList.add('show');
  clearTimeout(bannerT);
  bannerT = setTimeout(() => el.classList.remove('show'), 1800);
}

// ================= обновяване =================
const qY = new THREE.Quaternion(), qT = new THREE.Quaternion(), axisY = new THREE.Vector3(0, 1, 0), tAxis = new THREE.Vector3();
let starsGot = 0;

function update(dt) {
  elapsed += dt;
  timeLeft -= dt;
  const L = world.L;

  // играч
  if (player.alive) {
    const [ix, iz] = readInput();
    const sp = (6 + player.R * 1.1) * speedMul();
    player.vx = lerp(player.vx, ix * sp, 1 - Math.exp(-dt * 10));
    player.vz = lerp(player.vz, iz * sp, 1 - Math.exp(-dt * 10));
  }
  for (const h of holes) {
    if (h.bot && h.alive) botThink(h, dt);
    if (h.safe > 0) { h.safe -= dt; h.grp.children[3].visible = Math.floor(h.safe * 6) % 2 === 0 || h.safe <= 0; }
    if (!h.alive) {
      h.R = lerp(h.R, 0.01, 1 - Math.exp(-dt * 8));
      h.respawn -= dt;
      if (h.respawn <= 0) respawnHole(h);
    } else {
      h.R = lerp(h.R, targetR(h), 1 - Math.exp(-dt * 4));
      h.x = clamp(h.x + h.vx * dt, -L + h.R * 0.5, L - h.R * 0.5);
      h.z = clamp(h.z + h.vz * dt, -L + h.R * 0.5, L - h.R * 0.5);
    }
    h.grp.position.set(h.x, 0, h.z);
    h.grp.scale.set(Math.max(h.R, 0.01), 1, Math.max(h.R, 0.01));
  }

  // дупка гълта дупка (битка)
  if (mode === 'battle') {
    for (const a of holes) for (const b of holes) {
      if (a === b || !a.alive || !b.alive || b.safe > 0) continue;
      if (a.R > b.R * 1.12 && Math.hypot(a.x - b.x, a.z - b.z) < a.R - b.R * 0.4) {
        b.alive = false; b.respawn = 3;
        a.mass += b.mass * 0.4 + 4;
        b.mass *= 0.5;
        sfx.eatHole(); buzz(60);
        if (b === player) banner('Глътна те ' + a.name + '!', 'Връщаш се след малко');
        else if (a === player) { banner('Глътна ' + b.name + '!'); player.score += 50; }
      }
    }
  }

  // обекти
  for (const o of objs) {
    if (o.dead) continue;
    if (o.fall) { updateFall(o, dt); continue; }
    if (o.mover) move(o, dt);
    let wob = 0;
    for (const h of holes) {
      if (!h.alive) continue;
      const dx = o.x - h.x, dz = o.z - h.z;
      const lim = h.R + o.r;
      if (dx > lim || dx < -lim || dz > lim || dz < -lim) continue;
      const d = Math.hypot(dx, dz);
      if (o.r <= h.R * 0.95) {
        if (d < h.R - o.r * 0.35) { startFall(o, h); break; }
      } else if (d < h.R * 0.9) {
        wob = Math.max(wob, 1 - d / h.R);
      }
    }
    if (o.fall) continue;
    if (wob > 0 || o.wob > 0) {
      o.wob = wob;
      const m = o.mesh;
      m.position.set(o.x, 0, o.z);
      m.rotation.set(Math.sin(elapsed * 22) * 0.05 * wob, o.ry, Math.cos(elapsed * 19) * 0.05 * wob);
      m.updateMatrix();
    }
  }
  if (++sweep % 120 === 0) objs = objs.filter((o) => !o.dead);

  // край
  if (mode === 'level') {
    const pct = player.eaten / world.total;
    const s = STARS.filter((x) => pct >= x).length;
    if (s > starsGot) { starsGot = s; sfx.star(); banner('⭐'.repeat(s)); }
    if (pct >= 0.995) { timeLeft = 0; }
  }
  if (timeLeft <= 0) endRound();
}

function startFall(o, h) {
  o.fall = { h, vy: 0, ang: 0 };
  o.mover = null;
  o.mesh.castShadow = false;
}
function updateFall(o, dt) {
  const f = o.fall, h = f.h;
  const k = 1 - Math.exp(-dt * 3);
  o.x += (h.x - o.x) * k; o.z += (h.z - o.z) * k;
  f.vy -= 22 * dt; o.y += f.vy * dt;
  f.ang = Math.min(f.ang + dt * 2.6, 1.4);
  const dx = h.x - o.x, dz = h.z - o.z;
  tAxis.set(dz, 0, -dx);
  if (tAxis.lengthSq() < 1e-6) tAxis.set(1, 0, 0);
  tAxis.normalize();
  qY.setFromAxisAngle(axisY, o.ry);
  qT.setFromAxisAngle(tAxis, -f.ang);
  o.mesh.quaternion.copy(qT).multiply(qY);
  o.mesh.position.set(o.x, o.y, o.z);
  o.mesh.updateMatrix();
  if (o.y < -(o.h + 4) || o.y < -30) consume(o, h);
}
function consume(o, h) {
  o.dead = true;
  scene.remove(o.mesh);
  const before = Math.floor(targetR(h) * 10);
  h.mass += o.v;
  h.eaten += o.v;
  const pts = Math.max(1, Math.round(o.v * 10));
  h.score += pts;
  if (h === player) {
    popSound(o.r);
    if (o.r >= 1) { floatText(h.x, h.z, '+' + pts); buzz(8); }
    if (Math.floor(targetR(h) * 10) > before && Math.floor(targetR(h)) > Math.floor(before / 10)) sfx.grow();
  }
}

function move(o, dt) {
  const m = o.mover, L = world.L;
  if (m.kind === 'wander') {
    if (m.wait > 0) { m.wait -= dt; return; }
    const dx = m.tx - o.x, dz = m.tz - o.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { m.tx = m.cx + RR(-m.rad, m.rad); m.tz = m.cz + RR(-m.rad, m.rad); m.wait = Math.random() * 2.5; return; }
    o.x += (dx / d) * m.speed * dt; o.z += (dz / d) * m.speed * dt;
    o.ry = Math.atan2(-dz, dx);
  } else if (m.kind === 'line') {
    let p = (m.axis === 'x' ? o.x : o.z) + m.dir * m.speed * dt;
    if (p > m.b) { p = m.b; m.dir = -1; } else if (p < m.a) { p = m.a; m.dir = 1; }
    if (m.axis === 'x') { o.x = p; o.z = m.line; o.ry = m.dir > 0 ? 0 : Math.PI; }
    else { o.z = p; o.x = m.line; o.ry = m.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  } else if (m.kind === 'drive') {
    let p = (m.axis === 'x' ? o.x : o.z) + m.dir * m.speed * dt;
    if (Math.abs(p) > L - 3) { p = Math.sign(p) * (L - 3); m.dir = -m.dir; }
    const laneC = m.axis === 'z' ? m.road - m.lane * m.dir : m.road + m.lane * m.dir;
    if (m.axis === 'x') { o.x = p; o.z = lerp(o.z, laneC, 1 - Math.exp(-dt * 3)); o.ry = m.dir > 0 ? 0 : Math.PI; }
    else { o.z = p; o.x = lerp(o.x, laneC, 1 - Math.exp(-dt * 3)); o.ry = m.dir > 0 ? -Math.PI / 2 : Math.PI / 2; }
  }
  o.mesh.position.set(o.x, 0, o.z);
  o.mesh.rotation.set(0, o.ry, 0);
  o.mesh.updateMatrix();
}

function botThink(h, dt) {
  h.think -= dt;
  if (h.think <= 0) {
    h.think = 0.3 + Math.random() * 0.3;
    let tx = null, tz = null;
    // опасност
    let fx = 0, fz = 0;
    for (const o of holes) {
      if (o === h || !o.alive) continue;
      const d = Math.hypot(o.x - h.x, o.z - h.z);
      if (o.R > h.R * 1.12 && d < 3 + o.R * 1.6) { fx += (h.x - o.x) / (d + 0.1); fz += (h.z - o.z) / (d + 0.1); }
    }
    if (fx || fz) { tx = h.x + fx * 10; tz = h.z + fz * 10; }
    else {
      // плячка: по-малка дупка
      let bestS = 0;
      for (const o of holes) {
        if (o === h || !o.alive) continue;
        const d = Math.hypot(o.x - h.x, o.z - h.z);
        if (h.R > o.R * 1.15 && !(o.safe > 0) && d < 12 + h.R * 1.5) { const s = 40 / (d + 1); if (s > bestS) { bestS = s; tx = o.x; tz = o.z; } }
      }
      // обекти
      if (tx === null) {
        let best = 0;
        const reach = 18 + h.R * 3;
        for (const o of objs) {
          if (o.dead || o.fall || o.r > h.R * 0.93) continue;
          const dx = o.x - h.x, dz = o.z - h.z;
          if (Math.abs(dx) > reach || Math.abs(dz) > reach) continue;
          const s = o.v / (Math.hypot(dx, dz) + 2);
          if (s > best) { best = s; tx = o.x; tz = o.z; }
        }
      }
      if (tx === null) { tx = (Math.random() * 2 - 1) * world.L * 0.8; tz = (Math.random() * 2 - 1) * world.L * 0.8; }
    }
    h.tx = tx; h.tz = tz;
  }
  const dx = h.tx - h.x, dz = h.tz - h.z, d = Math.hypot(dx, dz);
  const sp = (6 + h.R * 1.1) * h.skill * (d > 0.3 ? 1 : 0);
  h.vx = lerp(h.vx, d > 0.01 ? (dx / d) * sp : 0, 1 - Math.exp(-dt * 6));
  h.vz = lerp(h.vz, d > 0.01 ? (dz / d) * sp : 0, 1 - Math.exp(-dt * 6));
}
function respawnHole(h) {
  const L = world.L;
  let best = null, bestD = -1;
  for (let i = 0; i < 12; i++) {
    const x = (Math.random() * 2 - 1) * L * 0.85, z = (Math.random() * 2 - 1) * L * 0.85;
    let md = Infinity;
    for (const o of holes) if (o !== h && o.alive) md = Math.min(md, Math.hypot(o.x - x, o.z - z));
    if (md > bestD) { bestD = md; best = [x, z]; }
  }
  h.x = best[0]; h.z = best[1]; h.vx = h.vz = 0;
  h.alive = true; h.R = 0.2; h.safe = 3;
  if (h === player) banner('Пак си в играта!');
}

// ================= камера, HUD =================
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt, snap) {
  const h = player;
  const aspect = window.innerWidth / window.innerHeight;
  const k = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
  const r = Math.max(h.R, 0.8);
  const height = (9 + r * 3.6) * k, back = (6 + r * 2.6) * k;
  const tp = new THREE.Vector3(h.x, height, h.z + back);
  const tl = new THREE.Vector3(h.x, 0, h.z - r * 0.4);
  if (snap) { camPos.copy(tp); camLook.copy(tl); }
  else { const f = 1 - Math.exp(-dt * 5); camPos.lerp(tp, f); camLook.lerp(tl, f); }
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  scene.fog.near = height * 2.2; scene.fog.far = height * 5.5;
  // слънце и сенки следват играча
  const S = 18 + r * 7;
  sun.position.set(h.x + 20, 40 + r * 4, h.z + 14);
  sun.target.position.set(h.x, 0, h.z);
  const sc = sun.shadow.camera;
  if (sc.right !== S) { sc.left = -S; sc.right = S; sc.top = S; sc.bottom = -S; sc.near = 1; sc.far = 120 + r * 10; sc.updateProjectionMatrix(); }
}

let hudT = 0;
function updateHud(dt) {
  hudT -= dt;
  // етикети над дупките
  for (const h of holes) {
    const show = mode === 'battle' && h.alive;
    if (!show) { h.label.style.display = 'none'; continue; }
    const [sx, sy, ok] = toScreen(h.x, 0, h.z - h.R * 1.05);
    h.label.style.display = ok ? 'block' : 'none';
    h.label.style.left = sx + 'px'; h.label.style.top = sy + 'px';
    h.label.textContent = (h.safe > 0 ? '🛡 ' : '') + h.name + ' · ' + Math.round(h.R * 10);
  }
  if (hudT > 0) return;
  hudT = 0.2;
  const t = Math.max(0, Math.ceil(timeLeft));
  $('timer').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
  $('timer').classList.toggle('low', t <= 10);
  if (t <= 5 && t > 0 && Math.ceil(timeLeft) !== Math.ceil(timeLeft + 0.2)) sfx.tick();
  $('sizeInfo').textContent = 'Размер ' + Math.round(player.R * 10);
  if (mode === 'level') {
    const pct = clamp(player.eaten / world.total, 0, 1);
    $('progFill').style.width = (pct * 100).toFixed(1) + '%';
    ['m1', 'm2', 'm3'].forEach((id, i) => $(id).classList.toggle('on', pct >= STARS[i]));
  } else {
    const rank = [...holes].sort((a, b) => b.R - a.R);
    $('board').innerHTML = rank.map((h, i) => `<div class="${h === player ? 'me' : ''}"><span><i style="background:${h.color}"></i>${i + 1}. ${h.name}</span><span>${Math.round(h.R * 10)}</span></div>`).join('');
  }
}

// ================= екрани и потоци =================
function show(id) {
  for (const s of ['scrMenu', 'scrPause', 'scrLevelEnd', 'scrBattleEnd']) $(s).hidden = s !== id;
  $('hud').hidden = !(id === null || id === 'scrPause');
}
function startLevel(n) {
  mode = 'level';
  buildLevel(n);
  timeLeft = LEVEL_TIME + extraTime();
  elapsed = 0; starsGot = 0;
  $('lvlName').textContent = 'Ниво ' + n + ' · ' + THEME_NAMES[theme];
  $('progress').hidden = false; $('board').hidden = true;
  updateCamera(0, true);
  state = 'play';
  show(null);
  banner(THEME_NAMES[theme], 'Глътни колкото можеш повече');
  audio();
}
function startBattle() {
  mode = 'battle';
  buildBattle();
  timeLeft = BATTLE_TIME;
  elapsed = 0;
  $('lvlName').textContent = 'Битка';
  $('progress').hidden = true; $('board').hidden = false;
  updateCamera(0, true);
  state = 'play';
  show(null);
  banner('Битка!', 'Стани най-голямата дупка');
  audio();
}
function pause() { if (state !== 'play') return; state = 'pause'; input.active = false; input.x = input.z = 0; joy.style.display = 'none'; show('scrPause'); }
function resume() { state = 'play'; last = performance.now(); show(null); }

function endRound() {
  state = 'end';
  input.active = false; input.x = input.z = 0; joy.style.display = 'none';
  sfx.end();
  if (mode === 'level') {
    const pct = clamp(player.eaten / world.total, 0, 1);
    const stars = STARS.filter((x) => pct >= x).length;
    const coins = Math.round(player.score / 25) + stars * 25;
    save.coins += coins;
    if (stars >= 1 && levelNo >= save.level) save.level = levelNo + 1;
    persist();
    $('leTitle').textContent = stars ? 'Ниво ' + levelNo + ' премина!' : 'Почти!';
    $('leStars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < stars ? '' : 'off'}">⭐</span>`).join('');
    $('lePct').textContent = Math.round(pct * 100) + '%';
    $('leStat').textContent = `Размер ${Math.round(player.R * 10)} · ${THEME_NAMES[theme]}` + (stars ? '' : ' · Нужни са 40% за звезда');
    $('leCoins').textContent = '+' + coins + ' 🪙';
    $('btnNext').hidden = stars === 0;
    setTimeout(() => show('scrLevelEnd'), 600);
  } else {
    const rank = [...holes].sort((a, b) => b.R - a.R);
    const place = rank.indexOf(player) + 1;
    const coins = [80, 50, 35, 20, 10][place - 1] + Math.round(player.score / 40);
    save.coins += coins; persist();
    $('beTitle').textContent = place === 1 ? '🏆 Ти си най-голямата дупка!' : place + '. място';
    $('beRank').innerHTML = rank.map((h, i) => `<div class="${h === player ? 'me' : ''}"><span><i style="background:${h.color}"></i>${i + 1}. ${h.name}</span><span>${Math.round(h.R * 10)}</span></div>`).join('');
    $('beCoins').textContent = '+' + coins + ' 🪙';
    setTimeout(() => show('scrBattleEnd'), 600);
  }
}

function renderMenu() {
  $('coins').textContent = '🪙 ' + save.coins;
  const n = save.level;
  $('btnLevel').firstChild.textContent = 'Ниво ' + n;
  $('lvlSub').textContent = THEME_NAMES[THEMES[(n - 1) % THEMES.length]];
  $('shop').innerHTML = '';
  for (const u of UPGRADES) {
    const lvl = save.up[u.id], cost = upCost(lvl), maxed = lvl >= u.max;
    const b = document.createElement('button');
    b.className = 'up'; b.type = 'button';
    b.disabled = maxed || save.coins < cost;
    b.innerHTML = `<span class="ic">${u.ic}</span><span class="nm">${u.nm}</span><span class="lv">ниво ${lvl}/${u.max}</span><span class="pr">${maxed ? 'макс.' : cost + ' 🪙'}</span>`;
    b.addEventListener('click', () => {
      if (save.coins < cost || maxed) return;
      save.coins -= cost; save.up[u.id]++; persist(); sfx.grow(); renderMenu();
    });
    $('shop').appendChild(b);
  }
  syncSound();
}
function toMenu() {
  mode = 'menu'; state = 'menu';
  if (!world || theme === 'battle') { buildLevel(save.level); }
  renderMenu();
  show('scrMenu');
}
function syncSound() { const t = 'Звук: ' + (save.sound ? 'вкл.' : 'изкл.'); $('btnSound').textContent = t; $('btnSound2').textContent = t; }
function toggleSound() { save.sound = !save.sound; persist(); syncSound(); }

$('btnLevel').addEventListener('click', () => startLevel(save.level));
$('btnBattle').addEventListener('click', startBattle);
$('btnPause').addEventListener('click', pause);
$('btnResume').addEventListener('click', resume);
$('btnQuit').addEventListener('click', toMenu);
$('btnNext').addEventListener('click', () => startLevel(levelNo + 1));
$('btnRetry').addEventListener('click', () => startLevel(levelNo));
$('btnMenu1').addEventListener('click', toMenu);
$('btnMenu2').addEventListener('click', toMenu);
$('btnBattleAgain').addEventListener('click', startBattle);
$('btnSound').addEventListener('click', toggleSound);
$('btnSound2').addEventListener('click', toggleSound);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
window.addEventListener('popstate', () => { if (state === 'play') pause(); try { history.pushState(null, ''); } catch (e) { /* нищо */ } });
try { history.pushState(null, ''); } catch (e) { /* нищо */ }

// PWA
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('btnInstall').hidden = false; $('installHint').hidden = true; });
$('btnInstall').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  try { await deferredPrompt.userChoice; } catch (e) { /* отказ */ }
  deferredPrompt = null; $('btnInstall').hidden = true;
});
if (window.matchMedia && window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches) $('installHint').hidden = true;
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

if (/[?&]debug\b/.test(location.search)) {
  window.__dupka = () => ({
    mode, state, timeLeft, L: world.L, total: world.total,
    player: player && { x: player.x, z: player.z, R: player.R, eaten: player.eaten, alive: player.alive },
    holes: holes.map((h) => ({ name: h.name, x: h.x, z: h.z, R: h.R, alive: h.alive })),
    objs: objs.filter((o) => !o.dead && !o.fall).map((o) => ({ x: o.x, z: o.z, r: o.r, v: o.v })),
    calls: renderer.info.render.calls,
  });
  window.__dupkaStart = (m, n) => (m === 'battle' ? startBattle() : startLevel(n || 1));
}

// ================= цикъл =================
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'play') { update(dt); updateCamera(dt); updateHud(dt); }
  else if (state === 'menu' && player) {
    // бавна обиколка в менюто
    const a = now / 9000;
    camera.position.set(Math.sin(a) * world.L * 0.9, world.L * 0.75, Math.cos(a) * world.L * 0.9);
    camera.lookAt(0, 0, 0);
    scene.fog.near = world.L * 1.2; scene.fog.far = world.L * 3;
    sun.position.set(20, 50, 14); sun.target.position.set(0, 0, 0);
    for (const o of objs) if (o.mover && !o.dead) move(o, dt);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

resize();
toMenu();
$('loading').remove();
requestAnimationFrame(frame);
