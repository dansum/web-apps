// The 20 Serdika St walk as a painting: after Van Gogh or after Vladimir Dimitrov – the Master (see style.js).
// Based on ../main.js (the realistic walk); the data, the OSM code and three.js are shared with it.
import * as THREE from '../three.module.min.js';
import { makeTextures, paintify, depthMaterialFor } from './paint.js';
import { makeTexturesMaistora } from './maistora.js';
import { STYLE } from './style.js';
import { mountSwitcher, readState, clearState } from '../switcher.js';
import { geocode, fetchArea, parse, makeProjection, readCache, writeCache, clearCache, LOAD_RADIUS, WALK_RADIUS } from '../osm.js';
import { buildWorld, paintTrees } from './world.js';

async function readSnapshot() {
  try {
    const r = await fetch('../ul_serdika/data/osm.json', { cache: 'no-cache' });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.center && j.data ? j : null;
  } catch { return null; }
}

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------- language
const I18N = {
  bg: {
    kicker: STYLE.text.bg.kicker,
    title: 'ул. „Сердика“ 20',
    lede: STYLE.text.bg.lede,
    keys: [['W A S D / стрелки', 'ходене'], ['мишка', 'оглеждане (щракни в картината)'], ['Shift', 'по-бързо'], ['M', 'карта'], ['H', 'обратно пред №20'], ['Esc', 'пауза']],
    touch: 'На телефон: левият палец ходи, плъзгането вдясно оглежда.',
    start: 'Тръгни', resume: 'Продължи', loading: 'Зареждам…',
    st: { geo: 'Търся адреса в OpenStreetMap…', data: 'Тегля сградите и улиците наоколо…', build: 'Строя града…', fonts: 'Подготвям надписите…', snap: 'Чета запазените данни…', mirror: (h) => `Сървър: ${h}` },
    err: 'Не успях да изтегля данните от OpenStreetMap. Провери интернет връзката и опитай пак след малко.', retry: 'Опитай пак',
    from: (d) => `на ${d} м от №20`, here: 'пред №20',
    edge: 'Тук свършва зоната от 200 метра.',
    floors: (n, est) => (est ? `≈ ${n} ${n === 1 ? 'етаж' : 'етажа'} (приблизително)` : `${n} ${n === 1 ? 'етаж' : 'етажа'}`),
    built: 'Построена', arch: 'Архитект', heritage: 'Паметник на културата', target: 'Това е №20',
    kinds: { apartments: 'жилищна сграда', residential: 'жилищна сграда', house: 'къща', commercial: 'търговска сграда', retail: 'магазин', office: 'офис сграда', church: 'църква', mosque: 'джамия', synagogue: 'синагога', hotel: 'хотел', school: 'училище', university: 'университет', public: 'обществена сграда', government: 'държавна институция', civic: 'обществена сграда', hospital: 'болница', garage: 'гараж', garages: 'гаражи', kiosk: 'павилион', industrial: 'производствена сграда', warehouse: 'склад', yes: 'сграда', roof: 'навес', construction: 'строеж', cathedral: 'катедрала', train_station: 'гара', transportation: 'транспортна сграда', mall: 'търговски център', marketplace: 'пазар', kindergarten: 'детска градина', tower: 'кула', bank: 'банка', museum: 'музей' },
    hour: 'Час', season: 'Сезон', seasons: { summer: 'лято', autumn: 'есен', winter: 'зима' }, shadows: 'Сенки', refresh: 'Изтегли данните наново',
    mapTitle: 'Карта', home: 'Към №20', settings: 'Настройки', help: 'Помощ', fullscreen: 'Цял екран', close: 'Затвори',
    stats: (s) => `${s.buildings} сгради · ${s.trees} дървета · ${s.signs} табели на магазини · ${s.cafes} кафенета с тенти`,
    source: { address: 'Адресът е намерен в OpenStreetMap.', street: 'Номер 20 липсва в OpenStreetMap, затова тръгваш от средата на ул. „Сердика“.', fallback: 'Адресът не беше намерен; тръгваш от ул. „Сердика“.' },
    attribution: 'Данни © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">сътрудниците на OpenStreetMap</a>',
    lockHint: 'Щракни, за да оглеждаш с мишката',
    donate: 'Стани дарител', donateUrl: 'https://obr.education/stani-daritel/',
  },
  en: {
    kicker: STYLE.text.en.kicker,
    title: '20 Serdika Street',
    lede: STYLE.text.en.lede,
    keys: [['W A S D / arrows', 'walk'], ['mouse', 'look around (click the picture)'], ['Shift', 'faster'], ['M', 'map'], ['H', 'back to No. 20'], ['Esc', 'pause']],
    touch: 'On a phone: the left thumb walks, dragging on the right looks around.',
    start: 'Start walking', resume: 'Resume', loading: 'Loading…',
    st: { geo: 'Looking up the address in OpenStreetMap…', data: 'Downloading the buildings and streets around it…', build: 'Building the city…', fonts: 'Preparing the signs…', snap: 'Reading saved data…', mirror: (h) => `Server: ${h}` },
    err: 'Could not download the data from OpenStreetMap. Check the internet connection and try again in a moment.', retry: 'Try again',
    from: (d) => `${d} m from No. 20`, here: 'in front of No. 20',
    edge: 'This is the edge of the 200 m area.',
    floors: (n, est) => (est ? `≈ ${n} floor${n === 1 ? '' : 's'} (estimated)` : `${n} floor${n === 1 ? '' : 's'}`),
    built: 'Built', arch: 'Architect', heritage: 'Listed monument', target: 'This is No. 20',
    kinds: { apartments: 'apartment building', residential: 'residential building', house: 'house', commercial: 'commercial building', retail: 'shop', office: 'office building', church: 'church', mosque: 'mosque', synagogue: 'synagogue', hotel: 'hotel', school: 'school', university: 'university', public: 'public building', government: 'government building', civic: 'public building', hospital: 'hospital', garage: 'garage', garages: 'garages', kiosk: 'kiosk', industrial: 'industrial building', warehouse: 'warehouse', yes: 'building', roof: 'canopy', construction: 'construction site', cathedral: 'cathedral', train_station: 'station', transportation: 'transport building', mall: 'shopping centre', marketplace: 'market hall', kindergarten: 'kindergarten', tower: 'tower', bank: 'bank', museum: 'museum' },
    hour: 'Time', season: 'Season', seasons: { summer: 'summer', autumn: 'autumn', winter: 'winter' }, shadows: 'Shadows', refresh: 'Download the data again',
    mapTitle: 'Map', home: 'To No. 20', settings: 'Settings', help: 'Help', fullscreen: 'Full screen', close: 'Close',
    stats: (s) => `${s.buildings} buildings · ${s.trees} trees · ${s.signs} shop signs · ${s.cafes} cafés with awnings`,
    source: { address: 'The address was found in OpenStreetMap.', street: 'No. 20 is not in OpenStreetMap, so you start in the middle of Serdika Street.', fallback: 'The address was not found; you start on Serdika Street.' },
    attribution: 'Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    lockHint: 'Click to look around with the mouse',
    donate: 'Donate', donateUrl: 'https://obr.education/en/donate/',
  },
};
let lang = 'bg';
try { const saved = localStorage.getItem('serdika20-lang'); if (I18N[saved]) lang = saved; } catch { /* storage blocked */ }
const t = () => I18N[lang];

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  $('kicker').textContent = t().kicker;
  $('title').textContent = t().title;
  $('lede').textContent = t().lede;
  $('keys').innerHTML = t().keys.map(([k, v]) => `<dt><kbd>${k}</kbd></dt><dd>${v}</dd>`).join('');
  $('touch').textContent = t().touch;
  $('go').textContent = ready ? (started ? t().resume : t().start) : t().loading;
  $('retry').textContent = t().retry;
  $('attr').innerHTML = t().attribution;
  $('lbl-hour').textContent = t().hour;
  $('lbl-season').textContent = t().season;
  $('lbl-shadows').textContent = t().shadows;
  $('refresh').textContent = t().refresh;
  [...$('season').options].forEach((o) => { o.textContent = t().seasons[o.value]; });
  $('btn-home').title = $('btn-home').ariaLabel = t().home;
  $('btn-map').title = $('btn-map').ariaLabel = t().mapTitle;
  $('btn-settings').title = $('btn-settings').ariaLabel = t().settings;
  $('btn-help').title = $('btn-help').ariaLabel = t().help;
  $('btn-fs').title = $('btn-fs').ariaLabel = t().fullscreen;
  $('lock-hint').textContent = t().lockHint;
  $('donate').textContent = t().donate; $('donate').href = t().donateUrl;
  if (world) { $('stats').textContent = t().stats(world.stats); $('source').textContent = t().source[center.source] || ''; }
  mountSwitcher(STYLE.id, lang, saveState);
  document.title = STYLE.text[lang].title;
}

// ---------------------------------------------------------------- renderer & scene
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const isTouch = matchMedia('(pointer: coarse)').matches;
// the oil-paint filter is costly per pixel and needs no fine detail
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1 : 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.25, 7000);
camera.rotation.order = 'YXZ';
scene.fog = new THREE.Fog(0xcfd8e0, 140, 520);

const hemi = new THREE.HemisphereLight(0xdbe8f5, 0x8a8478, 1.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 2048 : 4096, isTouch ? 2048 : 4096);
const SH = 95;
Object.assign(sun.shadow.camera, { left: -SH, right: SH, top: SH, bottom: -SH, near: 10, far: 700 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// ---------------------------------------------------------------- swirling sky
// The sky is painted with strokes that follow the level lines of a "stream function":
// far from the vortices they run in wavy horizontal bands, around them they curl into rings,
// as in "The Starry Night" (1889). Everything is computed from the view direction, so it stays put.
const skyUniforms = {
  time: { value: 0 }, night: { value: 0 }, dusk: { value: 0 }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, moonDir: { value: new THREE.Vector3(0.5, 0.45, -0.7).normalize() },
  dayA: { value: [new THREE.Color('#3f78c8'), new THREE.Color('#5fa0d8'), new THREE.Color('#a8d0ec'), new THREE.Color('#f4f0d8'), new THREE.Color('#7fb8e0'), new THREE.Color('#4a8ad0')] },
  nightA: { value: [new THREE.Color('#1c2f7a'), new THREE.Color('#2c4c9e'), new THREE.Color('#3f6fb8'), new THREE.Color('#6a9ad0'), new THREE.Color('#d8d890'), new THREE.Color('#24408a')] },
  duskA: { value: [new THREE.Color('#f2b84a'), new THREE.Color('#e8863a'), new THREE.Color('#f6d870'), new THREE.Color('#d86a4a'), new THREE.Color('#8a90c8'), new THREE.Color('#f0c060')] },
  horizon: { value: new THREE.Color() },
};
const SKY_FRAG = `
uniform float time, night, dusk; uniform vec3 sunDir, moonDir, horizon;
uniform vec3 dayA[6]; uniform vec3 nightA[6]; uniform vec3 duskA[6];
varying vec3 vP;
float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
const float PI = 3.14159265;
float vort(vec3 d, float az, float el, float r, float k) {
  vec3 c = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));
  float a = acos(clamp(dot(d, c), -1.0, 1.0));
  return k * exp(-a * a / (r * r));
}
float psi(vec3 d) {
  float el = asin(clamp(d.y, -1.0, 1.0));
  float v = el * 3.4 + 0.45 * n3(d * 2.3 + vec3(time * 0.015, 0.0, 0.0)) + 0.18 * n3(d * 6.0);
  v += 0.25 * sin(atan(d.x, -d.z) * 3.0 + time * 0.03) * smoothstep(0.15, 0.8, el);
  v += vort(d, 0.3, 0.55, 0.32, 1.4);
  v += vort(d, 2.2, 0.75, 0.28, -1.2);
  v += vort(d, -1.6, 0.6, 0.36, 1.5);
  v += vort(d, 4.0, 0.95, 0.3, 1.1);
  v += vort(d, -0.8, 1.15, 0.25, -0.9);
  return v;
}
vec3 pal(vec3 a[6], float h) {
  return h < 0.17 ? a[0] : h < 0.34 ? a[1] : h < 0.5 ? a[2] : h < 0.67 ? a[3] : h < 0.84 ? a[4] : a[5];
}
// concentric painted rings around a bright point (sun, moon, stars)
vec3 rings(float a, float core, float halo, vec3 cCore, vec3 cRing, vec3 base, float seed) {
  if (a < core) return cCore * (0.9 + 0.2 * h1(floor(a * 300.0) + seed));
  if (a < halo) {
    float t = (a - core) / (halo - core);
    float f = fract(a / (halo - core) * 6.0 + seed);
    float s = smoothstep(0.0, 0.2, f) * smoothstep(1.0, 0.75, f);
    return mix(base, mix(cRing, cCore, 0.3 * (1.0 - t)), s * (1.0 - t * 0.85));
  }
  return base;
}
void main() {
  vec3 d = normalize(vP);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float v = psi(d);
  float band = v * 7.5, id = floor(band), f = fract(band);
  // direction along the stroke, from the gradient of the stream function
  vec3 ex = normalize(cross(d, vec3(0.0, 1.0, 0.0)) + 1e-5), ey = normalize(cross(ex, d));
  float e = 0.004;
  vec2 g = vec2(psi(normalize(d + ex * e)) - psi(normalize(d - ex * e)), psi(normalize(d + ey * e)) - psi(normalize(d - ey * e)));
  vec2 tdir = normalize(vec2(g.y, -g.x) + 1e-6);
  float along = dot(vec2(atan(d.x, -d.z) * 2.0, el * 2.0), tdir) * 7.0 + h1(id) * 9.0;
  float dash = floor(along), df = fract(along);
  float h = h3(vec3(id, dash, 3.0));
  float paint = smoothstep(0.0, 0.16, f) * smoothstep(1.0, 0.8, f) * smoothstep(0.0, 0.1, df) * smoothstep(1.0, 0.9, df);
  vec3 dayC = pal(dayA, h), nightC = pal(nightA, h), duskC = pal(duskA, h);
  // dusk colours gather near the horizon on the sun's side
  float sunSide = 0.5 + 0.5 * dot(normalize(d.xz + 1e-5), normalize(sunDir.xz + 1e-5));
  float duskMix = dusk * smoothstep(0.7, 0.0, el) * (0.4 + 0.6 * sunSide);
  vec3 sc = mix(mix(dayC, duskC, duskMix), nightC, night);
  vec3 gap = mix(mix(dayA[5] * 0.75, duskA[1] * 0.8, duskMix), nightA[0] * 0.6, night);
  vec3 c = mix(gap, sc, paint);
  // ridge highlight on each stroke
  c *= 0.92 + 0.16 * smoothstep(0.25, 0.4, f) * smoothstep(0.6, 0.45, f);
  // sun with rings ("The Sower") by day, moon and stars by night
  float aS = acos(clamp(dot(d, normalize(sunDir)), -1.0, 1.0));
  if (night < 0.9) c = mix(c, rings(aS, 0.06, 0.42, vec3(1.0, 0.93, 0.5), vec3(0.98, 0.72, 0.22), c, 0.0), 1.0 - night);
  if (night > 0.05) {
    float aM = acos(clamp(dot(d, moonDir), -1.0, 1.0));
    vec3 mc = rings(aM, 0.05, 0.3, vec3(1.0, 0.86, 0.3), vec3(0.95, 0.8, 0.35), c, 0.3);
    // crescent: cut the disc with an offset disc
    vec3 off = normalize(moonDir + vec3(0.03, 0.02, 0.0));
    if (aM < 0.05 && acos(clamp(dot(d, off), -1.0, 1.0)) < 0.042) mc = c;
    c = mix(c, mc, night);
    if (el > 0.1) {
      vec3 s = d * 9.0, cell = floor(s), fc = fract(s);
      float hs = h3(cell);
      if (hs > 0.72) {
        vec3 sp = vec3(h3(cell + 1.3), h3(cell + 2.1), h3(cell + 3.7)) * 0.5 + 0.25;
        float a = length(fc - sp) / 9.0;
        float big = 0.6 + 1.4 * h3(cell + 5.0);
        c = mix(c, rings(a, 0.006 * big, 0.03 * big, vec3(1.0, 0.98, 0.8), vec3(0.95, 0.9, 0.45), c, hs * 7.0), night);
      }
    }
  }
  // haze at the horizon, ground colour below it
  float hz = smoothstep(0.16, -0.02, el);
  c = mix(c, mix(horizon, c, 0.35), hz * 0.8);
  if (el < -0.01) c = horizon * 0.9;
  gl_FragColor = vec4(c, 1.0);
}`;
// The Master's sky: flat bands of turquoise and lime, round outlined clouds, a sun with petal rays,
// and at night eight-pointed folk stars with a yellow crescent.
const FOLK_FRAG = `
uniform float time, night, dusk; uniform vec3 sunDir, moonDir, horizon;
varying vec3 vP;
float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
const vec3 INK = vec3(0.02, 0.008, 0.006);
// local 2D coordinates around a direction c
vec2 local(vec3 d, vec3 c) { vec3 u = normalize(cross(c, vec3(0.0, 1.0, 0.0)) + 1e-5), v = cross(u, c); return vec2(dot(d, u), dot(d, v)) / max(dot(d, c), 1e-3); }
void main() {
  vec3 d = normalize(vP);
  float el = asin(clamp(d.y, -1.0, 1.0)), az = atan(d.x, -d.z);
  // flat bands
  float t = clamp(el / 1.3, 0.0, 1.0), q = floor(t * 7.0) / 7.0;
  vec3 dayC = mix(vec3(0.55, 0.78, 0.14), vec3(0.03, 0.45, 0.42), smoothstep(0.0, 0.45, q));
  dayC = mix(dayC, vec3(0.03, 0.13, 0.52), smoothstep(0.4, 1.0, q));
  vec3 duskC = mix(vec3(0.95, 0.35, 0.03), vec3(0.75, 0.1, 0.18), smoothstep(0.0, 0.6, q));
  vec3 nightC = mix(vec3(0.02, 0.05, 0.28), vec3(0.005, 0.01, 0.12), smoothstep(0.0, 0.8, q));
  vec3 c = mix(mix(dayC, duskC, dusk * (1.0 - q)), nightC, night);
  if (abs(fract(t * 7.0) - 0.5) > 0.47 && el > 0.02) c *= 0.93;   // thin seams between the bands
  // clouds: round puffs with a dark outline, in two rows, drifting slowly
  for (int row = 0; row < 2; row++) {
    float rEl = row == 0 ? 0.32 : 0.62, N = row == 0 ? 9.0 : 7.0;
    float cw = 6.2831853 / N, a = az + 3.14159 + time * 0.004 * (row == 0 ? 1.0 : -0.7);
    float cell = floor(a / cw), fx = (fract(a / cw) - 0.5) * cw * cos(rEl) * 5.0, fy = (el - rEl) * 5.0;
    float hc = h1(cell + float(row) * 17.0);
    if (hc < 0.62) {
      float dmin = 1e3;
      for (int k = 0; k < 4; k++) {
        float kx = (float(k) - 1.5) * 0.36, ky = k == 1 || k == 2 ? 0.14 : 0.0, rr = k == 1 || k == 2 ? 0.34 : 0.26;
        dmin = min(dmin, length(vec2(fx - kx, max(fy - ky, -0.12 + ky) - 0.0)) - rr);
      }
      dmin = max(dmin, -fy - 0.12);
      vec3 cloudC = mix(vec3(0.96, 0.88, 0.7), vec3(0.25, 0.3, 0.65), night);
      if (dmin < 0.0) c = cloudC;
      if (abs(dmin) < 0.035) c = INK;
    }
  }
  // sun with petal rays
  vec2 ls = local(d, normalize(sunDir));
  if (night < 0.95 && dot(d, sunDir) > 0.0) {
    float r = length(ls), ang = atan(ls.y, ls.x);
    float pet = abs(fract(ang * 12.0 / 6.2831853) * 2.0 - 1.0);
    float rayR = 0.11 + 0.08 * (1.0 - pet);
    vec3 sc = c;
    if (r < rayR) sc = mod(floor(ang * 12.0 / 6.2831853), 2.0) < 1.0 ? vec3(0.9, 0.25, 0.01) : vec3(0.68, 0.02, 0.03);
    if (abs(r - rayR) < 0.006) sc = INK;
    if (r < 0.09) sc = vec3(0.92, 0.55, 0.0);
    if (abs(r - 0.09) < 0.006) sc = INK;
    c = mix(c, sc, 1.0 - night);
  }
  if (night > 0.05) {
    // crescent moon
    vec2 lm = local(d, moonDir);
    if (dot(d, moonDir) > 0.0) {
      float rm = length(lm), rc = length(lm - vec2(0.03, 0.02));
      vec3 mc = c;
      if (rm < 0.07 && rc > 0.062) mc = vec3(0.95, 0.65, 0.03);
      if (abs(rm - 0.07) < 0.005 && rc > 0.062) mc = INK;
      c = mix(c, mc, night);
    }
    // eight-pointed stars
    if (el > 0.12) {
      vec3 s = d * 8.0, cell = floor(s);
      if (h3(cell) > 0.6) {
        vec3 sp = normalize(cell + vec3(h3(cell + 1.3), h3(cell + 2.1), h3(cell + 3.7)) * 0.5 + 0.25);
        vec2 l = local(d, sp);
        if (dot(d, sp) > 0.0) {
          float r = length(l), ang = atan(l.y, l.x), big = 0.012 + 0.016 * h3(cell + 5.0);
          float star = big * (0.45 + 0.55 * pow(abs(cos(ang * 4.0)), 3.0));
          vec3 st = c;
          if (r < star) st = vec3(1.0, 0.85, 0.3);
          if (abs(r - star) < 0.0025) st = INK;
          if (r < big * 0.25) st = vec3(0.68, 0.02, 0.03);
          c = mix(c, st, night);
        }
      }
    }
  }
  float hz = smoothstep(0.08, -0.02, el);
  c = mix(c, horizon, hz * 0.7);
  if (el < -0.01) c = horizon * 0.9;
  gl_FragColor = vec4(c, 1.0);
}`;
const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUniforms,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: STYLE.sky === 'folk' ? FOLK_FRAG : SKY_FRAG,
}));
sky.frustumCulled = false;
scene.add(sky);

// ---------------------------------------------------------------- the oil-paint filter
// 1) the scene is rendered into a texture; 2) a Kuwahara filter turns detail into flat dabs of paint;
// 3) depth and colour edges become dark ultramarine brush lines; 4) colours are pushed towards
// Van Gogh's palette (blue shadows, yellow light); 5) relief of the paint and the canvas weave are added.
const rtSize = new THREE.Vector2();
renderer.getDrawingBufferSize(rtSize);
const rt = new THREE.WebGLRenderTarget(rtSize.x, rtSize.y, { type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(rtSize.x, rtSize.y) });
const postUniforms = {
  tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: rtSize.clone() },
  cameraNear: { value: 0.25 }, cameraFar: { value: 7000 }, night: { value: 0 }, brush: { value: STYLE.post.brush },
  posterize: { value: STYLE.post.posterize }, edgeAmt: { value: STYLE.post.edge }, edgeLo: { value: STYLE.post.edgeLo }, edgeHi: { value: STYLE.post.edgeHi },
  broken: { value: STYLE.post.broken }, edgeColor: { value: new THREE.Color(STYLE.post.edgeColor) }, sat: { value: STYLE.post.sat },
  shadowTint: { value: new THREE.Vector3(...STYLE.post.shadow) }, shadowAmt: { value: STYLE.post.shadowAmt }, warmTint: { value: new THREE.Vector3(...STYLE.post.warm) },
  weave: { value: STYLE.post.weave }, relief: { value: STYLE.post.relief },
};
const post = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
  uniforms: postUniforms, depthTest: false, depthWrite: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    #include <packing>
    uniform sampler2D tColor, tDepth; uniform vec2 res; uniform float cameraNear, cameraFar, night, brush;
    uniform float posterize, edgeAmt, edgeLo, edgeHi, broken, sat, shadowAmt, weave, relief;
    uniform vec3 edgeColor, shadowTint, warmTint;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
    float depthAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, cameraNear, cameraFar); }
    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    void quad(vec2 uv, vec2 o, vec2 px, inout vec3 bestM, inout float bestV) {
      vec3 m = vec3(0.0), s = vec3(0.0);
      for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
        vec3 c = texture2D(tColor, uv + (o * vec2(float(i), float(j))) * px).rgb;
        m += c; s += c * c;
      }
      m /= 16.0; s = abs(s / 16.0 - m * m);
      float v = s.r + s.g + s.b;
      if (v < bestV) { bestV = v; bestM = m; }
    }
    void main() {
      vec2 px = brush / res;
      // brush size grows a little with distance noise so dabs are uneven
      px *= 0.85 + 0.3 * noise(gl_FragCoord.xy * 0.02);
      vec3 col = vec3(0.0); float best = 1e9;
      quad(vUv, vec2(-1.0, -1.0), px, col, best);
      quad(vUv, vec2( 1.0, -1.0), px, col, best);
      quad(vUv, vec2(-1.0,  1.0), px, col, best);
      quad(vUv, vec2( 1.0,  1.0), px, col, best);
      // edges: depth jumps and strong colour changes
      vec2 p1 = 1.4 / res;
      float d0 = depthAt(vUv);
      float dx = abs(depthAt(vUv + vec2(p1.x, 0.0)) - depthAt(vUv - vec2(p1.x, 0.0)));
      float dy = abs(depthAt(vUv + vec2(0.0, p1.y)) - depthAt(vUv - vec2(0.0, p1.y)));
      float de = (dx + dy) / max(d0, 1.0);
      float lL = lum(texture2D(tColor, vUv - vec2(p1.x * 1.5, 0.0)).rgb), lR = lum(texture2D(tColor, vUv + vec2(p1.x * 1.5, 0.0)).rgb);
      float lD = lum(texture2D(tColor, vUv - vec2(0.0, p1.y * 1.5)).rgb), lU = lum(texture2D(tColor, vUv + vec2(0.0, p1.y * 1.5)).rgb);
      float le = abs(lR - lL) + abs(lU - lD);
      float edge = smoothstep(edgeLo, edgeHi, de) + 0.55 * smoothstep(0.18, 0.45, le / (0.2 + lum(col)));
      edge *= mix(1.0, smoothstep(0.15, 0.55, noise(gl_FragCoord.xy * vec2(0.09, 0.13))), broken);    // broken, brushy lines
      edge *= 1.0 - smoothstep(160.0, 380.0, d0);                                   // fade with distance
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      vec3 c = gl_FragColor.rgb;
      float l = lum(c);
      c = mix(vec3(l), c, sat);                                        // stronger colour
      c = mix(c, c * shadowTint, (1.0 - l) * (shadowAmt + 0.25 * night)); // tinted shadows
      c = mix(c, c * warmTint, l * l * 0.35);                         // warm light
      if (posterize > 0.0) c = floor(c * posterize + 0.5) / posterize; // flat fields of colour
      c *= 1.0 + relief * clamp((lL - lR + lU - lD) * 0.9, -0.1, 0.1);  // paint relief, lit from the upper left
      c = mix(c, edgeColor, clamp(edge, 0.0, 1.0) * edgeAmt);           // contour
      vec2 fc = gl_FragCoord.xy;
      c += weave * (sin(fc.x * 1.9) * sin(fc.y * 2.1) * 0.022 + (noise(fc * 0.7) - 0.5) * 0.035);  // canvas or board
      vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.35;                // soft vignette
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
}));
post.frustumCulled = false;
const postScene = new THREE.Scene(); postScene.add(post);
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Vitosha to the south, Lyulin to the south-west, Stara Planina to the north, Lozen to the south-east.
// Bearings and heights above Sofia (≈550 m) are approximate.
function makeMountains() {
  const ranges = [
    { from: 150, to: 238, dist: 15000, peak: 1740, shape: (u) => Math.pow(Math.sin(Math.PI * u), 0.7) * (0.82 + 0.18 * Math.sin(u * 9.0)) },  // Vitosha
    { from: 236, to: 285, dist: 12000, peak: 700, shape: (u) => Math.pow(Math.sin(Math.PI * u), 1.2) },                                     // Lyulin
    { from: 110, to: 152, dist: 17000, peak: 650, shape: (u) => Math.pow(Math.sin(Math.PI * u), 1.0) },                                     // Lozen
    { from: 290, to: 420, dist: 30000, peak: 1400, shape: (u) => 0.55 + 0.45 * Math.pow(Math.sin(Math.PI * u), 0.5) * (0.85 + 0.15 * Math.sin(u * 23.0)) }, // Stara Planina
  ];
  const Rm = 4200, g = new THREE.Group();
  ranges.forEach((r, ri) => {
    const pos = [], colA = [], n = Math.round((r.to - r.from) * 2);
    const far = Math.min(1, r.dist / 30000);
    const base = new THREE.Color(['#6a78c0', '#7a70b0', '#7f90c8', '#8a98d0'][ri]), topC = new THREE.Color(['#4a5aa8', '#5a5098', '#5f70b0', '#7080c0'][ri]);
    for (let i = 0; i <= n; i++) {
      const u = i / n, b = (r.from + (r.to - r.from) * u) * Math.PI / 180;
      const noise = 1 + 0.06 * Math.sin(u * 61 + ri) + 0.04 * Math.sin(u * 137);
      const elev = Math.atan((r.peak * r.shape(u) * noise) / r.dist);
      const x = Math.sin(b) * Rm, z = -Math.cos(b) * Rm;
      pos.push(x, -60, z, x, Math.tan(elev) * Rm - 20, z);
      colA.push(base.r, base.g, base.b, topC.r, topC.g, topC.b);
    }
    const idx = [];
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
    geo.setIndex(idx);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, transparent: true, opacity: 0.92 - far * 0.2 }));
    m.renderOrder = -1;
    g.add(m);
  });
  return g;
}
const mountains = makeMountains();
scene.add(mountains);

// ---------------------------------------------------------------- sun position for Sofia
const LAT = 42.70, LON = 23.32;
function sofiaOffsetHours(date) {
  try {
    const s = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Sofia', timeZoneName: 'shortOffset' }).formatToParts(date).find((p) => p.type === 'timeZoneName').value;
    const m = s.match(/GMT([+-]\d+)/); return m ? parseInt(m[1], 10) : 2;
  } catch { return 2; }
}
function sunPosition(hourLocal) {
  const now = new Date();
  const off = sofiaOffsetHours(now);
  const ut = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0) + (hourLocal - off) * 3600e3;
  const rad = Math.PI / 180, d = (ut - Date.UTC(2000, 0, 1, 12)) / 86400e3;
  const g = (357.529 + 0.98560028 * d) * rad, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, e = (23.439 - 0.00000036 * d) * rad;
  const RA = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const GMST = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  const H = GMST * 15 * rad + LON * rad - RA, la = LAT * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  return { alt, az, dir: new THREE.Vector3(Math.sin(az) * Math.cos(alt), Math.sin(alt), -Math.cos(az) * Math.cos(alt)) };
}

let sunDir = new THREE.Vector3(0.3, 0.8, 0.3).normalize();
const moon = new THREE.DirectionalLight(0x8aa0ff, 0);
moon.position.copy(skyUniforms.moonDir.value).multiplyScalar(300);
scene.add(moon);
let halos = null, pools = null;
let hour = (() => {
  const off = sofiaOffsetHours(new Date());
  const h = (new Date().getUTCHours() + off + new Date().getUTCMinutes() / 60 + 24) % 24;
  return h >= 7 && h <= 23.5 ? Math.round(h * 4) / 4 : 21.5;
})();
function applyTime() {
  const s = sunPosition(hour);
  const alt = s.alt;
  sunDir = s.dir.clone();
  if (alt < 0.02) sunDir.y = Math.max(sunDir.y, 0.02);
  const day = THREE.MathUtils.clamp(alt / 0.35, 0, 1), dusk = THREE.MathUtils.clamp(1 - Math.abs(alt - 0.04) / 0.14, 0, 1);
  const night = THREE.MathUtils.clamp(-alt / 0.15, 0, 1);
  const horC = STYLE.sky === 'folk'
    ? new THREE.Color('#d8eba0').lerp(new THREE.Color('#f5b04a'), dusk * 0.75).lerp(new THREE.Color('#1f2f78'), night)
    : new THREE.Color('#c9dcec').lerp(new THREE.Color('#f2b870'), dusk * 0.75).lerp(new THREE.Color('#2a3a78'), night);
  skyUniforms.horizon.value.copy(horC);
  skyUniforms.sunDir.value.copy(sunDir);
  skyUniforms.night.value = night;
  skyUniforms.dusk.value = dusk;
  postUniforms.night.value = night;
  scene.fog.color.copy(horC);
  scene.fog.near = 120; scene.fog.far = 560 - night * 140;
  sun.color.set('#fff0c8').lerp(new THREE.Color('#ffa050'), dusk * 0.8);
  sun.intensity = (alt > 0 ? 0.8 + 2.4 * day : 0) * STYLE.light.sun;
  // Van Gogh's nights are blue, never black
  hemi.intensity = (0.45 + 0.7 * day + 0.75 * night) * STYLE.light.hemi;
  hemi.color.set('#d8e8ff').lerp(new THREE.Color('#ffd2a0'), dusk * 0.5).lerp(new THREE.Color('#5a78e0'), night);
  hemi.groundColor.set('#c8a878').lerp(new THREE.Color('#3a3a90'), night);
  // by night a blue moonlight casts the shadows
  moon.intensity = night * 1.3;
  renderer.toneMappingExposure = 1.1 + night * 0.35;
  if (world) {
    const lit = Math.max(night, THREE.MathUtils.clamp((0.06 - alt) / 0.1, 0, 1));
    world.lampGlass.emissive.set(lit > 0.15 ? 0xffc850 : 0x000000).multiplyScalar(1.4);
    world.nightMats.forEach((m) => m.emissive.setRGB(1.0, 0.82, 0.5).multiplyScalar(lit * 1.25));
    if (world.awningMat) world.awningMat.emissive.setScalar(lit * 0.7);
    if (halos) halos.children.forEach((h) => { h.material.opacity = lit * 0.9; h.visible = lit > 0.02; });
    if (pools) { pools.material.opacity = lit * 0.85; pools.visible = lit > 0.02; }
  }
  mountains.children.forEach((m) => m.material.color.setScalar(0.6 + 0.4 * day));
  const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);
  $('hour-val').textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- state
let world = null, center = null, ready = false, started = false, paused = true;
const player = { x: 0, z: 0, yaw: 0, pitch: -0.04, eye: 1.65, bob: 0 };
let home = { x: 0, z: 0, yaw: 0 };
let textures = null;

function setStatus(s, sub = '') { $('status').textContent = s; $('status-sub').textContent = sub; }

async function load(force = false) {
  ready = false;
  $('go').disabled = true; $('go').textContent = t().loading;
  $('error').hidden = true; $('progress').hidden = false;
  try {
    let data = null;
    if (force) clearCache();
    if (!force) {
      setStatus(t().st.snap);
      const snap = await readSnapshot();
      if (snap) { center = snap.center; data = snap.data; }
      else { const c = readCache(); if (c) { center = c.center; data = c.data; } }
    }
    if (!data) {
      setStatus(t().st.geo);
      center = await geocode((h) => setStatus(t().st.geo, t().st.mirror(h)));
      setStatus(t().st.data);
      data = await fetchArea(center.lat, center.lon, (h) => setStatus(t().st.data, t().st.mirror(h)));
      writeCache(center, data);
    }
    setStatus(t().st.fonts);
    try { await Promise.race([Promise.all([document.fonts.load(`${STYLE.fontWeight} 80px ${STYLE.font}`), document.fonts.load(`${STYLE.fontWeight} 40px ${STYLE.font}`)]), new Promise((r) => setTimeout(r, 2500))]); } catch { /* fonts are optional */ }
    setStatus(t().st.build);
    await new Promise((r) => setTimeout(r, 30));
    build(data);
    ready = true;
    $('progress').hidden = true;
    $('go').disabled = false;
    applyLang();
    if (pendingGo) { pendingGo = false; startWalk(); }
  } catch (e) {
    console.error(e);
    $('progress').hidden = true;
    $('error').hidden = false;
    $('error-msg').textContent = t().err;
  }
}

function build(data) {
  if (world) { scene.remove(world.group); world.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
  const proj = makeProjection(center.lat, center.lon);
  const F = parse(data, proj);
  if (!textures) textures = (STYLE.id === 'maistora' ? makeTexturesMaistora : makeTextures)(renderer.capabilities.getMaxAnisotropy());
  world = buildWorld(F, { textures, target: center, loadRadius: LOAD_RADIUS });
  scene.add(world.group);
  // the crooked world: every surface bends with the same function, shadows too
  world.group.traverse((o) => {
    if (!o.material || o.isSprite) return;
    paintify(o.material);
    if (o.castShadow && o.isMesh) o.customDepthMaterial = depthMaterialFor(o.material);
  });
  if (halos) scene.remove(halos);
  halos = new THREE.Group();
  const haloMat = new THREE.SpriteMaterial({ map: textures.halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
  for (const p of world.lampSpots) {
    const s = new THREE.Sprite(haloMat.clone());
    s.position.set(p[0], world.lampTop, p[1]); s.scale.setScalar(3.4);
    halos.add(s);
  }
  scene.add(halos);
  // warm pools of light on the street under lamps and café awnings
  if (pools) scene.remove(pools);
  const spots = world.lampSpots.map((p) => [p[0], p[1], 9]).concat(world.cafeSpots.map((p) => [p[0], p[1], 11]));
  const pg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  pools = new THREE.InstancedMesh(pg, new THREE.MeshBasicMaterial({ map: textures.pool, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false, polygonOffset: true, polygonOffsetFactor: -10, polygonOffsetUnits: -10 }), spots.length);
  spots.forEach((p, i) => pools.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(p[0], 0.06, p[1]), new THREE.Quaternion(), new THREE.Vector3(p[2], 1, p[2]))));
  pools.frustumCulled = false;
  scene.add(pools);
  paintTrees(world.crowns, $('season').value, textures);
  applyTime();
  // starting point: across the street from No. 20, looking at it
  home = { x: 0, z: 0, yaw: 0 };
  const fr = world.target.front;
  if (fr) {
    const n = fr.edge.n, F0 = [fr.s.x, fr.s.z];
    let D = fr.roadPt ? (fr.roadPt[0] - F0[0]) * n[0] + (fr.roadPt[1] - F0[1]) * n[1] : 5;
    if (!(D > 1 && D < 30)) D = 5;
    let placed = false;
    // prefer the opposite sidewalk, a little to the side if a car, tree or lamp is in the way
    const ea = fr.edge.a, eb = fr.edge.b, eL = Math.hypot(eb[0] - ea[0], eb[1] - ea[1]) || 1, ex = (eb[0] - ea[0]) / eL, ez = (eb[1] - ea[1]) / eL;
    const tries = [];
    for (const k of [2 * D - 2, 2 * D - 2.8, 2 * D - 1.3]) for (const s of [0, 1.5, -1.5, 3, -3, 4.5, -4.5, 6, -6]) tries.push([k, s]);
    for (const k of [D + 1.5, D, 3.5, 2.5]) for (const s of [0, 2, -2]) tries.push([k, s]);
    for (const [k, s] of tries) {
      if (k < 1.5) continue;
      const x = F0[0] + n[0] * k + ex * s, z = F0[1] + n[1] * k + ez * s;
      if (!world.insideBuilding(x, z, 0.6) && !blocked(x, z, 0.55)) {
        home = { x, z, yaw: Math.atan2(x - F0[0], z - F0[1]) }; placed = true; break;
      }
    }
    if (!placed) home = { x: F0[0] + n[0] * 3, z: F0[1] + n[1] * 3, yaw: Math.atan2(n[0], n[1]) };
  } else if (world.target.rec) {
    const r = world.target.rec.outer;
    let c = [0, 0]; r.forEach((p) => { c[0] += p[0] / r.length; c[1] += p[1] / r.length; });
    const lines = world.streetLines('Сердика');
    home = { x: c[0], z: c[1] + 10, yaw: 0 };
    if (lines.length) { let best = null; for (const l of lines) for (const p of l.pts) { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (!best || d < best.d) best = { d, p }; } home = { x: best.p[0], z: best.p[1], yaw: Math.atan2(best.p[0] - c[0], best.p[1] - c[1]) }; }
  } else {
    const lines = world.streetLines('Сердика');
    if (lines.length) { const p = lines[0].pts[Math.floor(lines[0].pts.length / 2)]; home = { x: p[0], z: p[1], yaw: 0 }; }
  }
  if (world.insideBuilding(home.x, home.z, 0.2)) { home.x = 0; home.z = 0; }
  goHome();
  applyState();
  drawStaticMap();
}

// ---------------------------------------------------------------- style switch: keep place, view, time and season
let pendingGo = false;
function saveState() {
  if (!world) return null;
  return { x: player.x.toFixed(2), z: player.z.toFixed(2), yaw: player.yaw.toFixed(3), pitch: player.pitch.toFixed(3), h: hour, s: $('season').value, go: started ? 1 : 0 };
}
function applyState() {
  const st = readState();
  if (!st) return;
  clearState();
  if (Math.hypot(st.x, st.z) <= WALK_RADIUS && !world.insideBuilding(st.x, st.z, 0.2)) {
    player.x = st.x; player.z = st.z;
    if (Number.isFinite(st.yaw)) player.yaw = st.yaw;
    if (Number.isFinite(st.pitch)) player.pitch = THREE.MathUtils.clamp(st.pitch, -1.35, 1.35);
  }
  if (Number.isFinite(st.h)) { hour = THREE.MathUtils.clamp(st.h, +$('hour').min, +$('hour').max); $('hour').value = hour; applyTime(); }
  if (st.s && [...$('season').options].some((o) => o.value === st.s)) { $('season').value = st.s; $('season').dispatchEvent(new Event('change')); }
  pendingGo = st.go;
}

function goHome() { player.x = home.x; player.z = home.z; player.yaw = home.yaw; player.pitch = 0.06; }

// ---------------------------------------------------------------- collisions
function segDist(px, pz, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L2 = dx * dx + dz * dz;
  let tt = L2 ? ((px - a[0]) * dx + (pz - a[1]) * dz) / L2 : 0; tt = Math.max(0, Math.min(1, tt));
  const x = a[0] + tt * dx, z = a[1] + tt * dz;
  return [Math.hypot(px - x, pz - z), x, z];
}
function blocked(x, z, r = 0.3) {
  for (const c of world.colliders.query(x, z, 3)) { const [d] = segDist(x, z, c[0], c[1]); if (d < r + (c[2] || 0)) return true; }
  return false;
}
function resolve(x, z) {
  const r = 0.32;
  for (let it = 0; it < 3; it++) {
    for (const c of world.colliders.query(x, z, 3)) {
      const R = r + (c[2] || 0);
      const [d, cx, cz] = segDist(x, z, c[0], c[1]);
      if (d < R && d > 1e-6) { const k = (R - d) / d; x += (x - cx) * k; z += (z - cz) * k; }
    }
  }
  return [x, z];
}

// ---------------------------------------------------------------- input
const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  keys.add(e.code);
  if (!started) return;
  if (e.code === 'KeyM') toggleMap();
  if (e.code === 'KeyH') goHome();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const canLock = 'pointerLockElement' in document && !isTouch;
canvas.addEventListener('click', () => { if (started && !paused && canLock && document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
document.addEventListener('pointerlockchange', () => {
  const locked = document.pointerLockElement === canvas;
  $('lock-hint').hidden = locked || !started || paused || isTouch;
});
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== canvas) return;
  if (Math.abs(e.movementX) > 250 || Math.abs(e.movementY) > 250) return; // browser glitch right after locking
  look(e.movementX, e.movementY, 0.0022);
});
function look(dx, dy, k) {
  player.yaw -= dx * k;
  player.pitch = THREE.MathUtils.clamp(player.pitch - dy * k, -1.35, 1.35);
}
// drag to look without pointer lock (and on touch, right side)
const touch = { move: null, look: null, jx: 0, jy: 0 };
canvas.addEventListener('pointerdown', (e) => {
  if (!started || paused) return;
  if (e.pointerType === 'mouse' && canLock) return;
  if (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.42 && !touch.move) {
    touch.move = { id: e.pointerId, x: e.clientX, y: e.clientY };
    const j = $('joy'); j.hidden = false; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px';
  } else if (!touch.look) touch.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (touch.move && e.pointerId === touch.move.id) {
    let dx = e.clientX - touch.move.x, dy = e.clientY - touch.move.y; const L = Math.hypot(dx, dy), M = 55;
    if (L > M) { dx *= M / L; dy *= M / L; }
    touch.jx = dx / M; touch.jy = dy / M;
    $('joy-knob').style.transform = `translate(${dx}px, ${dy}px)`;
  } else if (touch.look && e.pointerId === touch.look.id) {
    look(e.clientX - touch.look.x, e.clientY - touch.look.y, e.pointerType === 'mouse' ? 0.004 : 0.006);
    touch.look.x = e.clientX; touch.look.y = e.clientY;
  }
});
const endTouch = (e) => {
  if (touch.move && e.pointerId === touch.move.id) { touch.move = null; touch.jx = touch.jy = 0; $('joy').hidden = true; $('joy-knob').style.transform = ''; }
  if (touch.look && e.pointerId === touch.look.id) touch.look = null;
};
canvas.addEventListener('pointerup', endTouch);
canvas.addEventListener('pointercancel', endTouch);

// ---------------------------------------------------------------- UI
function startWalk() {
  if (!ready) return;
  started = true; paused = false;
  $('start').hidden = true; $('hud').hidden = false;
  if (canLock) { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch { /* needs a click */ } }
  $('lock-hint').hidden = isTouch || canLock === false;
}
function pause() {
  paused = true; $('start').hidden = false; $('go').textContent = t().resume; $('hud').hidden = true;
  if (document.pointerLockElement) document.exitPointerLock();
}
$('go').addEventListener('click', startWalk);
$('retry').addEventListener('click', () => load(true));
$('refresh').addEventListener('click', () => { $('panel').hidden = true; pause(); load(true); });
document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && started && !paused && canLock && !uiOpen()) pause(); });
addEventListener('keydown', (e) => { if (e.code === 'Escape' && started && !paused && !canLock) pause(); });
const uiOpen = () => !$('panel').hidden || !$('bigmap').hidden;

document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; try { localStorage.setItem('serdika20-lang', lang); } catch { /* ignore */ } applyLang(); }));
$('btn-home').addEventListener('click', goHome);
$('btn-map').addEventListener('click', toggleMap);
$('btn-settings').addEventListener('click', () => { $('panel').hidden = !$('panel').hidden; if (!$('panel').hidden && document.pointerLockElement) document.exitPointerLock(); });
$('btn-help').addEventListener('click', pause);
$('btn-fs').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); });
$('hour').addEventListener('input', (e) => { hour = parseFloat(e.target.value); applyTime(); });
$('season').addEventListener('change', (e) => { if (world) paintTrees(world.crowns, e.target.value, textures); });
$('shadows').addEventListener('change', (e) => { renderer.shadowMap.enabled = e.target.checked; scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); });
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { $(b.dataset.close).hidden = true; }));
$('minimap').addEventListener('click', toggleMap);
$('bigmap-canvas').addEventListener('click', (e) => {
  // teleport by clicking on the big map
  const c = e.currentTarget, r = c.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width - 0.5) * MAP_SPAN, z = ((e.clientY - r.top) / r.height - 0.5) * MAP_SPAN;
  if (Math.hypot(x, z) <= WALK_RADIUS && !world.insideBuilding(x, z, 0.3)) { player.x = x; player.z = z; toggleMap(); }
});
function toggleMap() { $('bigmap').hidden = !$('bigmap').hidden; if (!$('bigmap').hidden) { if (document.pointerLockElement) document.exitPointerLock(); drawBigMap(); } }

// season default by month
(() => { const m = new Date().getMonth(); $('season').value = m >= 3 && m <= 8 ? 'summer' : m >= 9 && m <= 10 ? 'autumn' : 'winter'; })();
$('hour').value = hour;

// ---------------------------------------------------------------- maps
const MAP_SPAN = 2 * (WALK_RADIUS + 50); // metres shown on the big map
const mapCanvas = document.createElement('canvas');
const MAP_PX = 1400;
function drawStaticMap() {
  mapCanvas.width = mapCanvas.height = MAP_PX;
  const g = mapCanvas.getContext('2d'), s = MAP_PX / (2 * LOAD_RADIUS), o = MAP_PX / 2;
  const P = (p) => [o + p[0] * s, o + p[1] * s];
  g.fillStyle = '#e9e6df'; g.fillRect(0, 0, MAP_PX, MAP_PX);
  const poly = (ring) => { g.beginPath(); ring.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); };
  g.fillStyle = '#b9d39a'; for (const r of world.mapData.green) { poly(r); g.fill(); }
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = '#ffffff';
  for (const r of world.mapData.roads) { g.lineWidth = r.w * s; g.beginPath(); r.pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  g.strokeStyle = '#d6cfc0'; g.lineWidth = 1.6 * s;
  for (const pts of world.mapData.paths) { g.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  g.strokeStyle = '#7a6b5b'; g.lineWidth = 0.5 * s; g.setLineDash([3 * s, 2 * s]);
  for (const pts of world.mapData.trams) { g.beginPath(); pts.forEach((p, i) => { const [x, y] = P(p); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  g.setLineDash([]);
  for (const b of world.mapData.buildings) { poly(b.ring); g.fillStyle = b.target ? '#e2b93b' : '#c9bfb1'; g.fill(); g.strokeStyle = b.target ? '#7a5a00' : '#a99d8c'; g.lineWidth = 1; g.stroke(); }
  // walk boundary
  g.strokeStyle = 'rgba(200,60,40,.7)'; g.lineWidth = 3; g.setLineDash([12, 8]);
  g.beginPath(); g.arc(o, o, WALK_RADIUS * s, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  // street names
  g.fillStyle = '#3b3b3b'; g.font = `600 ${Math.round(5.5 * s)}px "Sofia Sans", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const done = [];
  for (const st of world.streetsForHud) {
    let best = null;
    for (let i = 0; i < st.pts.length - 1; i++) { const a = st.pts[i], b = st.pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (!best || L > best.L) best = { a, b, L }; }
    if (!best || best.L < 40) continue;
    const m = [(best.a[0] + best.b[0]) / 2, (best.a[1] + best.b[1]) / 2];
    if (Math.hypot(...m) > LOAD_RADIUS - 20 || done.some((d) => d.n === st.name && Math.hypot(d.m[0] - m[0], d.m[1] - m[1]) < 120)) continue;
    done.push({ n: st.name, m });
    let an = Math.atan2(best.b[1] - best.a[1], best.b[0] - best.a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI;
    const [x, y] = P(m); g.save(); g.translate(x, y); g.rotate(an); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,.85)'; g.strokeText(st.name, 0, 0); g.fillText(st.name, 0, 0); g.restore();
  }
}
function drawPlayer(g, x, y, sz) {
  g.save(); g.translate(x, y); g.rotate(-player.yaw);
  g.fillStyle = '#d23b2a'; g.strokeStyle = '#fff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -sz); g.lineTo(sz * 0.7, sz * 0.8); g.lineTo(0, sz * 0.35); g.lineTo(-sz * 0.7, sz * 0.8); g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function drawMiniMap() {
  const c = $('minimap'), g = c.getContext('2d'), W = c.width, span = 140; // metres across
  const s = MAP_PX / (2 * LOAD_RADIUS);
  g.clearRect(0, 0, W, W);
  g.save(); g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2); g.clip();
  const src = span * s;
  g.drawImage(mapCanvas, MAP_PX / 2 + player.x * s - src / 2, MAP_PX / 2 + player.z * s - src / 2, src, src, 0, 0, W, W);
  g.restore();
  drawPlayer(g, W / 2, W / 2, 9);
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#1b1f27'; g.font = '700 13px "Sofia Sans", sans-serif'; g.textAlign = 'center'; g.fillText(lang === 'bg' ? 'С' : 'N', W / 2, 16);
}
function drawBigMap() {
  const c = $('bigmap-canvas'), g = c.getContext('2d');
  const W = c.width = c.height = Math.round(Math.min(innerWidth - 32, innerHeight - 110, 820) * Math.min(devicePixelRatio, 2));
  const s = MAP_PX / (2 * LOAD_RADIUS), src = MAP_SPAN * s;
  g.drawImage(mapCanvas, MAP_PX / 2 - src / 2, MAP_PX / 2 - src / 2, src, src, 0, 0, W, W);
  const k = W / MAP_SPAN;
  drawPlayer(g, W / 2 + player.x * k, W / 2 + player.z * k, 12 * W / 600);
}

// ---------------------------------------------------------------- HUD updates
const ray = new THREE.Raycaster(); ray.far = 140;
let lastInfo = -1, hudTimer = 0;
function updateHud() {
  // nearest street
  let best = null;
  for (const s of world.streetsForHud) for (let i = 0; i < s.pts.length - 1; i++) {
    const [d] = segDist(player.x, player.z, s.pts[i], s.pts[i + 1]);
    if (!best || d < best.d) best = { d, name: s.name };
  }
  $('place').textContent = best && best.d < 30 ? best.name : 'София';
  const dist = Math.round(Math.hypot(player.x - home.x, player.z - home.z));
  $('place-sub').textContent = dist < 6 ? t().here : t().from(dist);
  // what am I looking at
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hit = ray.intersectObjects(world.buildingMeshes, false)[0];
  let id = -1;
  if (hit && hit.faceIndex != null) id = hit.object.userData.owners[hit.faceIndex] ?? -1;
  if (id !== lastInfo) {
    lastInfo = id;
    const box = $('info');
    if (id < 0) { box.hidden = true; return; }
    const b = world.info[id];
    const kind = t().kinds[b.kind] || t().kinds.yes;
    const lines = [];
    if (b.isTarget) lines.push(`<b class="tgt">★ ${t().target}</b>`);
    lines.push(`<b>${esc(b.name || (b.addr ? b.addr : kind))}</b>`);
    if (b.name && b.addr) lines.push(esc(b.addr));
    lines.push(`${esc(kind)} · ${t().floors(b.levels, b.estimated)}`);
    if (b.start) lines.push(`${t().built}: ${esc(b.start)}`);
    if (b.architect) lines.push(`${t().arch}: ${esc(b.architect)}`);
    if (b.heritage) lines.push(t().heritage);
    box.innerHTML = lines.join('<br>');
    box.hidden = false;
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let toastT = 0;
function toast(msg) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); toastT = 2.5; }
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (world && started && !paused && !uiOpen()) {
    let f = 0, s = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
    if (keys.has('KeyD')) s += 1;
    if (keys.has('KeyA')) s -= 1;
    if (keys.has('ArrowLeft')) player.yaw += 1.8 * dt;
    if (keys.has('ArrowRight')) player.yaw -= 1.8 * dt;
    if (keys.has('KeyQ')) player.yaw += 1.8 * dt;
    if (keys.has('KeyE')) player.yaw -= 1.8 * dt;
    f -= touch.jy; s += touch.jx;
    const L = Math.hypot(f, s);
    if (L > 0.05) {
      if (L > 1) { f /= L; s /= L; }
      const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') || Math.hypot(touch.jx, touch.jy) > 0.95) ? 4.6 : 1.9;
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
      let nx = player.x + (fx * f + rx * s) * speed * dt, nz = player.z + (fz * f + rz * s) * speed * dt;
      [nx, nz] = resolve(nx, nz);
      if (!world.insideBuilding(nx, nz)) { player.x = nx; player.z = nz; }
      const r = Math.hypot(player.x, player.z);
      if (r > WALK_RADIUS) { player.x *= WALK_RADIUS / r; player.z *= WALK_RADIUS / r; if (toastT <= 0) toast(t().edge); }
      player.bob += dt * speed * 4.2;
    }
    hudTimer -= dt;
    if (hudTimer <= 0) { hudTimer = 0.25; updateHud(); }
    drawMiniMap();
    $('compass').style.transform = `rotate(${player.yaw}rad)`;
  }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('show'); }
  // camera
  camera.position.set(player.x, player.eye + Math.sin(player.bob) * 0.035, player.z);
  camera.rotation.set(player.pitch, player.yaw, 0);
  sky.position.copy(camera.position); mountains.position.set(camera.position.x, 0, camera.position.z);
  // shadow camera follows the player, snapped to texels to avoid shimmering
  const tx = Math.round(player.x / 2) * 2, tz = Math.round(player.z / 2) * 2;
  sun.target.position.set(tx, 0, tz);
  sun.position.set(tx + sunDir.x * 300, sunDir.y * 300, tz + sunDir.z * 300);
  skyUniforms.time.value += dt;
  renderer.setRenderTarget(rt);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
  requestAnimationFrame(frame);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.getDrawingBufferSize(rtSize);
  rt.setSize(rtSize.x, rtSize.y);
  postUniforms.res.value.copy(rtSize);
  if (!$('bigmap').hidden) drawBigMap();
});

applyLang();
applyTime();
requestAnimationFrame(frame);
load();

// for automated checks
window.__serdika = { get world() { return world; }, player, get ready() { return ready; }, goHome, setHour: (h) => { hour = h; applyTime(); } };
